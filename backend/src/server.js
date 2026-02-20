const express = require('express');
const cors = require('cors');
require('dotenv').config();

const useNativeDriver = !process.env.DB_USER && process.platform === 'win32';
const sql = useNativeDriver ? require('mssql/msnodesqlv8') : require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

let dbConfig;
if (useNativeDriver) {
    const server = process.env.DB_SERVER || 'SPHILSQL15\\SQLTST153';
    const port = process.env.DB_PORT || '55003';
    const database = process.env.DB_DATABASE || 'RollerTrackingDB';

    const CONNECTION_STRING = `Driver={ODBC Driver 18 for SQL Server};Server=${server},${port};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;Login Timeout=30;`;
    dbConfig = { connectionString: CONNECTION_STRING };
    console.log('🔌 Using Windows Auth for:', server);
} else {
    dbConfig = {
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        server: process.env.DB_SERVER,
        port: parseInt(process.env.DB_PORT),
        database: process.env.DB_DATABASE,
        options: {
            encrypt: false,
            trustServerCertificate: true
        }
    };
    console.log('🔌 Using SQL Auth for:', dbConfig.server);
}

let poolPromise;
async function getPool() {
    if (!poolPromise) {
        poolPromise = sql.connect(dbConfig);
        poolPromise.then(() => {
            console.log('✅ Connected to SQL Server');
        }).catch(err => {
            console.error('❌ DB Connection failed:', err);
            poolPromise = null;
        });
    }
    return poolPromise;
}

// Routes
app.get('/api/sites', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT site_id, site_name FROM [roller_tracking].[site] ORDER BY site_name');
        res.json({ success: true, sites: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get existing rollers
app.get('/api/rollers/existing', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT roller_sleeve_id FROM [roller_tracking].[roller_sleeve] WHERE is_scrapped = 0 ORDER BY roller_type');
        res.json({ success: true, rollers: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get roller counts
app.get('/api/rollers/:id/counts', async (req, res) => {
    try {
        const pool = await getPool();
        const skinPassResult = await pool.request()
            .input('rollerId', sql.NVarChar, req.params.id)
            .query(`SELECT SUM(CASE WHEN is_skin_cut = 1 THEN 1 ELSE 0 END) AS skin_cut_count 
                    FROM [roller_tracking].[roller_lifecycle] 
                    WHERE roller_sleeve_id = @rollerId`);

        const claddingResult = await pool.request()
            .input('rollerId', sql.NVarChar, req.params.id)
            .query(`SELECT SUM(CASE WHEN is_cladded = 1 THEN 1 ELSE 0 END) AS cladded_count 
                    FROM [roller_tracking].[roller_lifecycle] 
                    WHERE roller_sleeve_id = @rollerId`);

        res.json({
            success: true,
            skinPassCount: skinPassResult.recordset[0]?.skin_cut_count || 0,
            claddingCount: claddingResult.recordset[0]?.cladded_count || 0
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get casters for a site
app.get('/api/casters', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('siteName', sql.NVarChar, req.query.site)
            .query(`SELECT c.caster_id, c.caster_name, c.caster_code, c.caster_cluster_id
                    FROM [roller_tracking].[caster] c
                    JOIN [roller_tracking].[site] s ON c.site_id = s.site_id
                    WHERE s.site_name = @siteName AND c.is_active = 1 
                    ORDER BY c.caster_name`);
        res.json({ success: true, casters: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get strands for a caster
app.get('/api/strands', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('casterId', sql.NVarChar, req.query.casterId)
            .query(`SELECT strand_id, strand_no 
                    FROM [roller_tracking].[strand] 
                    WHERE caster_id = @casterId 
                    ORDER BY strand_no`);
        res.json({ success: true, strands: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get segment positions for a strand
app.get('/api/segment-positions', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('strandId', sql.NVarChar, req.query.strandId)
            .query(`SELECT position_id, position_no 
                    FROM [roller_tracking].[position] 
                    WHERE strand_id = @strandId 
                    ORDER BY position_no`);
        res.json({ success: true, positions: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get segment IDs for a position
app.get('/api/segment-ids', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('strandId', sql.Int, req.query.strandId)
            .input('positionNo', sql.NVarChar, req.query.positionNo)
            .query(`SELECT s.segment_no
                    FROM [roller_tracking].[position] p
                    JOIN [roller_tracking].[segment_position_rule] spr
                        ON spr.position_id = p.position_id
                    JOIN [roller_tracking].[segment] s
                        ON s.segment_id = spr.segment_id
                    WHERE p.strand_id = @strandId
                      AND p.position_no = @positionNo
                    ORDER BY s.segment_no`);
        res.json({ success: true, segments: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Submit insert disassembly data
app.post('/api/insert-disassembly', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;

        await pool.request()
            .input('rollerSleeveId', sql.Int, data.rollerId)
            .input('fromSiteId', sql.Int, data.siteId)
            .input('fromCasterId', sql.Int, data.casterId)
            .input('fromStrandId', sql.Int, data.strandId)
            .input('fromPositionId', sql.Int, data.segmentPosition)
            .input('fromSegmentId', sql.Int, data.segmentId)
            .input('receivedAt', sql.DateTime2, data.incomingDate)
            .input('receivedConfig', sql.Int, data.configuration || null)
            .input('fromRollerPosition', sql.Int, data.incomingRollerPosition || null)
            .input('breakoutFlag', sql.Bit, data.hasBreakout === 'Yes' ? 1 : 0)
            .input('receivedJournalFlag', sql.Bit, data.haveJournal === 'Yes' ? 1 : 0)
            .input('receivedJournalA', sql.Decimal(10, 3), data.journalDiameterA || null)
            .input('receivedJournalB', sql.Decimal(10, 3), data.journalDiameterB || null)
            .input('tonnage', sql.Int, data.segmentTonnage || null)
            .input('receivedDiameterA', sql.Decimal(10, 3), data.incomingDiameterA)
            .input('receivedDiameterB', sql.Decimal(10, 3), data.incomingDiameterB)
            .input('receivedAxleId', sql.Int, data.axleId || null)
            .input('createdByUserId', sql.Int, data.userId)
            .input('updatedByUserId', sql.Int, data.userId)
            .input('processStage', sql.NVarChar, 'RECEIVED')
            .query(`INSERT INTO [roller_tracking].[roller_lifecycle] 
                    (roller_sleeve_id, from_site_id, from_caster_id, from_strand_id, 
                     from_position_id, from_segment_id, received_at, received_config, 
                     from_roller_position, breakout_flag, received_journal_flag, received_journal_a, 
                     received_journal_b, tonnage, received_diameter_a, received_diameter_b, 
                     received_axle_id, created_by_user_id, updated_by_user_id, process_stage) 
                    VALUES (@rollerSleeveId, @fromSiteId, @fromCasterId, @fromStrandId, 
                            @fromPositionId, @fromSegmentId, @receivedAt, @receivedConfig, 
                            @fromRollerPosition, @breakoutFlag, @receivedJournalFlag, @receivedJournalA, 
                            @receivedJournalB, @tonnage, @receivedDiameterA, @receivedDiameterB, 
                            @receivedAxleId, @createdByUserId, @updatedByUserId, @processStage)`);

        res.json({ success: true, message: 'Data inserted successfully' });
    } catch (err) {
        console.error('Insert disassembly error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===== PROCESSING ENDPOINTS =====

// Get rollers ready for processing
app.get('/api/processing/rollers', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('rollerType', sql.NVarChar, req.query.rollerType)
            .input('rollerFunction', sql.NVarChar, req.query.rollerFunction)
            .query(`SELECT 
                        rs.roller_sleeve_id,
                        rs.roller_type,
                        rs.roller_function,
                        rl_current.from_site_id,
                        rl_current.from_caster_id,
                        rl_current.from_strand_id,
                        rl_current.received_at,
                        rl_current.lifecycle_id,
                        SUM(CAST(rl_all.is_skin_cut AS INT)) AS skin_cut_count,
                        SUM(CAST(rl_all.is_cladded AS INT)) AS cladded_count
                    FROM [roller_tracking].[roller_sleeve] rs
                    JOIN [roller_tracking].[roller_lifecycle] rl_current
                        ON rs.roller_sleeve_id = rl_current.roller_sleeve_id
                    JOIN [roller_tracking].[roller_lifecycle] rl_all
                        ON rs.roller_sleeve_id = rl_all.roller_sleeve_id
                    WHERE 
                        rs.is_scrapped = 0
                        AND rs.roller_type = @rollerType
                        AND rs.roller_function = @rollerFunction
                        AND rl_current.created_at = (
                            SELECT MAX(rl2.created_at)
                            FROM [roller_tracking].[roller_lifecycle] rl2
                            WHERE rl2.roller_sleeve_id = rs.roller_sleeve_id
                        )
                        AND rl_current.process_stage = 'RECEIVED'
                    GROUP BY
                        rs.roller_sleeve_id,
                        rs.roller_type,
                        rs.roller_function,
                        rl_current.from_site_id,
                        rl_current.from_caster_id,
                        rl_current.from_strand_id,
                        rl_current.received_at,
                        rl_current.lifecycle_id
                    ORDER BY rs.roller_sleeve_id`);
        res.json({ success: true, rollers: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get lifecycle details for processing
app.get('/api/processing/lifecycle/:rollerId/:lifecycleId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('rollerSleeveId', sql.Int, req.params.rollerId)
            .input('lifecycleId', sql.BigInt, req.params.lifecycleId)
            .query(`SELECT TOP 1
                        rl.lifecycle_id,
                        rs.roller_type,
                        rs.roller_function,
                        rl.from_site_id,
                        s.site_name,
                        rl.from_caster_id,
                        c.caster_name,
                        rl.from_strand_id,
                        st.strand_no,
                        rl.from_position_id,
                        p.position_no,
                        rl.from_segment_id,
                        seg.segment_no,
                        rl.received_at,
                        rl.tonnage,
                        rl.breakout_flag,
                        rl.received_diameter_a,
                        rl.received_diameter_b,
                        rl.received_journal_flag,
                        rl.received_journal_a,
                        rl.received_journal_b,
                        rl.received_config,
                        rl.received_axle_id,
                        rl.from_roller_position,
                        (SELECT SUM(CAST(is_skin_cut AS INT)) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rl.roller_sleeve_id) AS skin_cut_count,
                        (SELECT SUM(CAST(is_cladded AS INT)) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rl.roller_sleeve_id) AS cladded_count
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl.from_site_id
                    LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl.from_caster_id
                    LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl.from_strand_id
                    LEFT JOIN [roller_tracking].[position] p ON p.position_id = rl.from_position_id
                    LEFT JOIN [roller_tracking].[segment] seg ON seg.segment_id = rl.from_segment_id
                    WHERE rl.roller_sleeve_id = @rollerSleeveId 
                      AND rl.lifecycle_id = @lifecycleId
                    ORDER BY rl.created_at DESC`);

        if (result.recordset.length > 0) {
            res.json({ success: true, lifecycle: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, error: 'Lifecycle not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get existing axles
app.get('/api/axles/existing', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT DISTINCT axle_id 
                    FROM [roller_tracking].[roller_lifecycle] 
                    WHERE axle_id IS NOT NULL 
                    ORDER BY axle_id`);
        res.json({ success: true, axles: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update processing data
app.post('/api/processing/update', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;

        // Determine if it's a roller or sleeve based on the presence of roller-specific fields
        const isRoller = data.hasOwnProperty('drive_rotary_joint_change_yn');

        if (isRoller) {
            // Roller update
            await pool.request()
                .input('lifecycleId', sql.BigInt, data.lifecycle_id)
                .input('updatedByUserId', sql.Int, data.updated_by_user_id)
                .input('skinPassCutYn', sql.Bit, data.skin_pass_cut_yn)
                .input('sleeveScrapYn', sql.Bit, data.sleeve_scrap_yn)
                .input('scrapReason', sql.NVarChar(sql.MAX), data.scrap_reason)
                .input('claddingYn', sql.Bit, data.cladding_yn)
                .input('claddingWireId', sql.Int, data.cladding_wire_id || null)
                .input('driveRotaryJointChangeYn', sql.Bit, data.drive_rotary_joint_change_yn)
                .input('idleRotaryJointChangeOpYn', sql.Bit, data.idle_rotary_joint_change_op_yn)
                .input('idleRotaryJointChangeDriveYn', sql.Bit, data.idle_rotary_joint_change_drive_yn)
                .input('outDiameterA', sql.Decimal(10, 3), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 3), data.out_diameter_b)
                .input('haveJournalYn', sql.Bit, data.have_journal_yn)
                .input('outJournalDiameterA', sql.Decimal(10, 3), data.out_journal_diameter_a)
                .input('outJournalDiameterB', sql.Decimal(10, 3), data.out_journal_diameter_b)
                .input('outConfiguration', sql.Int, data.out_configuration)
                .input('diameterAReduceMm', sql.Decimal(10, 3), data.diameter_a_reduce_mm)
                .input('diameterBReduceMm', sql.Decimal(10, 3), data.diameter_b_reduce_mm)
                .query(`UPDATE rl
                        SET 
                            rl.process_stage = 'PROCESSED',
                            rl.updated_at = SYSDATETIME(),
                            rl.updated_by_user_id = @updatedByUserId,
                            rl.is_skin_cut = @skinPassCutYn,
                            rl.roller_scrap_flag = @sleeveScrapYn,
                            rl.roller_scrap_reason = @scrapReason,
                            rl.is_cladded = @claddingYn,
                            rl.cladding_wire_id = @claddingWireId,
                            rl.drive_rotary_joint_change_flag = @driveRotaryJointChangeYn,
                            rl.idle_rotary_joint_change_o_flag = @idleRotaryJointChangeOpYn,
                            rl.idle_rotary_joint_change_d_flag = @idleRotaryJointChangeDriveYn,
                            rl.dispatched_diameter_a = @outDiameterA,
                            rl.dispatched_diameter_b = @outDiameterB,
                            rl.dispatched_journal_flag = @haveJournalYn,
                            rl.dispatched_journal_a = @outJournalDiameterA,
                            rl.dispatched_journal_b = @outJournalDiameterB,
                            rl.dispatched_config = @outConfiguration,
                            rl.diff_diameter_a = @diameterAReduceMm,
                            rl.diff_diameter_b = @diameterBReduceMm
                        FROM [roller_tracking].[roller_lifecycle] rl
                        WHERE rl.lifecycle_id = @lifecycleId`);
        } else {
            // Sleeve update
            await pool.request()
                .input('lifecycleId', sql.BigInt, data.lifecycle_id)
                .input('updatedByUserId', sql.Int, data.updated_by_user_id)
                .input('skinPassCutYn', sql.Bit, data.skin_pass_cut_yn)
                .input('sleeveScrapYn', sql.Bit, data.sleeve_scrap_yn)
                .input('scrapReason', sql.NVarChar, data.scrap_reason)
                .input('claddingYn', sql.Bit, data.cladding_yn)
                .input('claddingWireId', sql.Int, data.cladding_wire_id || null)
                .input('dispatchedAxleId', sql.Int, data.axle_id)
                .input('axleStraightFlag', sql.Bit, data.axle_straight_flag)
                .input('outDiameterA', sql.Decimal(10, 3), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 3), data.out_diameter_b)
                .input('outConfiguration', sql.Int, data.out_configuration)
                .input('diameterAReduceMm', sql.Decimal(10, 3), data.diameter_a_reduce_mm)
                .input('diameterBReduceMm', sql.Decimal(10, 3), data.diameter_b_reduce_mm)
                .query(`UPDATE rl
                        SET
                            rl.process_stage = 'PROCESSED',
                            rl.updated_at = SYSDATETIME(),
                            rl.updated_by_user_id = @updatedByUserId,
                            rl.is_skin_cut = @skinPassCutYn,
                            rl.roller_scrap_flag = @sleeveScrapYn,
                            rl.roller_scrap_reason = @scrapReason,
                            rl.is_cladded = @claddingYn,
                            rl.cladding_wire_id = @claddingWireId,
                            rl.dispatched_axle_id = @dispatchedAxleId,
                            rl.dispatched_axle_straight_flag = @axleStraightFlag,
                            rl.dispatched_diameter_a = @outDiameterA,
                            rl.dispatched_diameter_b = @outDiameterB,
                            rl.dispatched_config = @outConfiguration,
                            rl.diff_diameter_a = @diameterAReduceMm,
                            rl.diff_diameter_b = @diameterBReduceMm
                        FROM [roller_tracking].[roller_lifecycle] rl
                        WHERE rl.lifecycle_id = @lifecycleId`);
        }

        res.json({ success: true, message: 'Processing data updated successfully' });
    } catch (err) {
        console.error('Processing Update Error:', err);
        res.status(500).json({ success: false, error: err.message, stack: err.stack });
    }
});

// Add new roller and processing data (Insert after Processing)
app.post('/api/processing/add-new', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Check/Insert Roller Sleeve
            let rollerSleeveId = data.rollerId;
            const rollerCheck = await transaction.request()
                .input('rollerId', sql.NVarChar, rollerSleeveId)
                .query('SELECT roller_sleeve_id FROM [roller_tracking].[roller_sleeve] WHERE roller_sleeve_id = @rollerId');

            if (rollerCheck.recordset.length === 0) {
                // Insert new roller
                await transaction.request()
                    .input('rollerId', sql.NVarChar, rollerSleeveId)
                    .input('rollerType', sql.NVarChar, data.rollerType)
                    .input('rollerFunction', sql.NVarChar, data.driveType || 'Idle')
                    .query(`INSERT INTO [roller_tracking].[roller_sleeve] (roller_sleeve_id, roller_type, roller_function, is_scrapped) 
                            VALUES (@rollerId, @rollerType, @rollerFunction, 0)`);
            }

            // 2. Insert Full Lifecycle Record
            // Common inputs
            const request = transaction.request()
                .input('rollerSleeveId', sql.NVarChar, rollerSleeveId)
                .input('fromSiteId', sql.Int, data.siteId)
                .input('fromCasterId', sql.Int, data.casterId)
                .input('fromStrandId', sql.Int, data.strandId)
                .input('fromPositionId', sql.Int, data.segmentPosition)
                .input('fromSegmentId', sql.Int, data.segmentId)
                .input('receivedAt', sql.DateTime2, data.incomingDate)
                .input('receivedConfig', sql.Int, data.configuration || null)
                .input('fromRollerPosition', sql.Int, data.incomingRollerPosition || null)
                .input('breakoutFlag', sql.Bit, data.hasBreakout === 'Yes' ? 1 : 0)
                .input('tonnage', sql.Int, data.segmentTonnage || null)
                .input('receivedDiameterA', sql.Decimal(10, 3), data.incomingDiameterA)
                .input('receivedDiameterB', sql.Decimal(10, 3), data.incomingDiameterB)
                .input('createdByUserId', sql.Int, data.userId)
                .input('updatedByUserId', sql.Int, data.userId)

                // Processing Details
                .input('skinPassCutYn', sql.Bit, data.skin_pass_cut_yn)
                .input('sleeveScrapYn', sql.Bit, data.sleeve_scrap_yn)
                .input('scrapReason', sql.NVarChar, data.scrap_reason)
                .input('claddingYn', sql.Bit, data.cladding_yn)
                .input('claddingWireId', sql.Int, data.cladding_wire_id || null)

                // Outgoing Details
                .input('outDiameterA', sql.Decimal(10, 3), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 3), data.out_diameter_b)
                .input('outConfiguration', sql.Int, data.out_configuration)
                .input('diameterAReduceMm', sql.Decimal(10, 3), data.diameter_a_reduce_mm)
                .input('diameterBReduceMm', sql.Decimal(10, 3), data.diameter_b_reduce_mm)

                .input('processStage', sql.NVarChar, 'PROCESSED');

            // Conditional inputs
            if (data.rollerType === 'Roller') {
                request.input('receivedJournalFlag', sql.Bit, data.haveJournal === 'Yes' ? 1 : 0)
                    .input('receivedJournalA', sql.Decimal(10, 3), data.journalDiameterA || null)
                    .input('receivedJournalB', sql.Decimal(10, 3), data.journalDiameterB || null)
                    .input('driveRotaryJointChangeYn', sql.Bit, data.drive_rotary_joint_change_yn)
                    .input('idleRotaryJointChangeOpYn', sql.Bit, data.idle_rotary_joint_change_op_yn)
                    .input('idleRotaryJointChangeDriveYn', sql.Bit, data.idle_rotary_joint_change_drive_yn)
                    .input('haveJournalYn', sql.Bit, data.have_journal_yn)
                    .input('outJournalDiameterA', sql.Decimal(10, 3), data.out_journal_diameter_a)
                    .input('outJournalDiameterB', sql.Decimal(10, 3), data.out_journal_diameter_b);
            } else {
                request.input('receivedAxleId', sql.Int, data.axleId || null)
                    .input('dispatchedAxleId', sql.Int, data.axle_id || null)
                    .input('axleStraightFlag', sql.Bit, data.axle_straight_flag);
            }

            // Build the query
            let columns = `
                roller_sleeve_id, from_site_id, from_caster_id, from_strand_id, 
                from_position_id, from_segment_id, received_at, received_config, 
                from_roller_position, breakout_flag, tonnage, received_diameter_a, received_diameter_b, 
                created_by_user_id, updated_by_user_id, process_stage,
                is_skin_cut, roller_scrap_flag, roller_scrap_reason, is_cladded, cladding_wire_id,
                dispatched_diameter_a, dispatched_diameter_b, dispatched_config, diff_diameter_a, diff_diameter_b
            `;
            let values = `
                @rollerSleeveId, @fromSiteId, @fromCasterId, @fromStrandId,
                @fromPositionId, @fromSegmentId, @receivedAt, @receivedConfig,
                @fromRollerPosition, @breakoutFlag, @tonnage, @receivedDiameterA, @receivedDiameterB,
                @createdByUserId, @updatedByUserId, @processStage,
                @skinPassCutYn, @sleeveScrapYn, @scrapReason, @claddingYn, @claddingWireId,
                @outDiameterA, @outDiameterB, @outConfiguration, @diameterAReduceMm, @diameterBReduceMm
            `;

            if (data.rollerType === 'Roller') {
                columns += `, received_journal_flag, received_journal_a, received_journal_b,
                              drive_rotary_joint_change_flag, idle_rotary_joint_change_o_flag, idle_rotary_joint_change_d_flag,
                              dispatched_journal_flag, dispatched_journal_a, dispatched_journal_b`;
                values += `, @receivedJournalFlag, @receivedJournalA, @receivedJournalB,
                             @driveRotaryJointChangeYn, @idleRotaryJointChangeOpYn, @idleRotaryJointChangeDriveYn,
                             @haveJournalYn, @outJournalDiameterA, @outJournalDiameterB`;
            } else {
                columns += `, received_axle_id, dispatched_axle_id, dispatched_axle_straight_flag`;
                values += `, @receivedAxleId, @dispatchedAxleId, @axleStraightFlag`;
            }

            await request.query(`INSERT INTO [roller_tracking].[roller_lifecycle] (${columns}) VALUES (${values})`);

            await transaction.commit();
            res.json({ success: true, message: 'New roller and processing data inserted successfully' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }

    } catch (err) {
        console.error('Insert after processing error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all cladding wire options
app.get('/api/cladding-wires', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT cladding_wire_id, wire_name, wire_desc 
                    FROM [roller_tracking].[cladding_wire] 
                    ORDER BY wire_name`);
        res.json({ success: true, wires: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Register new roller/sleeve (Initial stock/new entity)
app.post('/api/rollers/register', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Insert into roller_sleeve
            await transaction.request()
                .input('rollerId', sql.NVarChar, data.rollerId)
                .input('rollerType', sql.NVarChar, data.rollerType)
                .input('rollerFunction', sql.NVarChar, data.rollerFunction)
                .query(`INSERT INTO [roller_tracking].[roller_sleeve] 
                        (roller_sleeve_id, roller_type, roller_function, is_scrapped) 
                        VALUES (@rollerId, @rollerType, @rollerFunction, 0)`);

            // 1b. If new axle, insert into axle table
            if (data.rollerType === 'Sleeve' && data.isNewAxle) {
                await transaction.request()
                    .input('axleId', sql.NVarChar, data.axle_id)
                    .query(`INSERT INTO [roller_tracking].[axle] (axle_id, is_scrapped) 
                            VALUES (@axleId, 0)`);
            }

            // 2. Insert into roller_lifecycle (Initial record with outgoing details)
            const request = transaction.request()
                .input('rollerSleeveId', sql.NVarChar, data.rollerId)
                .input('createdByUserId', sql.Int, data.userId)
                .input('processStage', sql.NVarChar, 'PROCESSED')
                .input('outDiameterA', sql.Decimal(10, 3), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 3), data.out_diameter_b)
                .input('outConfig', sql.Int, data.out_configuration)
                .input('siteId', sql.Int, data.siteId);

            let columns = `roller_sleeve_id, created_by_user_id, updated_by_user_id, process_stage, 
                           dispatched_diameter_a, dispatched_diameter_b, dispatched_config, from_site_id`;
            let values = `@rollerSleeveId, @createdByUserId, @createdByUserId, @processStage, 
                          @outDiameterA, @outDiameterB, @outConfig, @siteId`;

            if (data.rollerType === 'Roller') {
                request.input('outJournalFlag', sql.Bit, data.have_journal_yn)
                    .input('outJournalA', sql.Decimal(10, 3), data.out_journal_diameter_a)
                    .input('outJournalB', sql.Decimal(10, 3), data.out_journal_diameter_b);

                columns += `, dispatched_journal_flag, dispatched_journal_a, dispatched_journal_b`;
                values += `, @outJournalFlag, @outJournalA, @outJournalB`;
            } else {
                request.input('dispatchedAxleId', sql.NVarChar, data.axle_id)
                    .input('axleStraightFlag', sql.Bit, data.isNewAxle ? 0 : data.axle_straight_flag); // New axle = no straightening

                columns += `, dispatched_axle_id, dispatched_axle_straight_flag`;
                values += `, @dispatchedAxleId, @axleStraightFlag`;
            }

            await request.query(`INSERT INTO [roller_tracking].[roller_lifecycle] (${columns}) 
                                VALUES (${values})`);

            await transaction.commit();
            res.json({ success: true, message: 'New entity registered successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Register roller error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query('SELECT user_id, username FROM [roller_tracking].[app_user] WHERE username = @username AND password_hash = @password AND is_active = 1');

        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/assets', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT * FROM [roller_tracking].[Assets]');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.get('/api/assets/:id', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', sql.NVarChar, req.params.id)
            .query('SELECT * FROM [roller_tracking].[Assets] WHERE AssetID = @id');
        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/assets', async (req, res) => {
    const { assetId, type, serialNumber, status, location, manufacturer, mfgDate, userId } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.NVarChar, assetId)
            .input('type', sql.NVarChar, type)
            .input('sn', sql.NVarChar, serialNumber)
            .input('status', sql.NVarChar, status)
            .input('loc', sql.NVarChar, location)
            .input('mn', sql.NVarChar, manufacturer)
            .input('md', sql.Date, mfgDate)
            .input('user', sql.NVarChar, userId)
            .query(`IF EXISTS (SELECT 1 FROM [roller_tracking].[Assets] WHERE AssetID = @id)
                    UPDATE [roller_tracking].[Assets] SET AssetType=@type, SerialNumber=@sn, CurrentStatus=@status, CurrentLocation=@loc, Manufacturer=@mn, ManufacturingDate=@md, UpdatedAt=GETDATE(), UpdatedBy=@user WHERE AssetID=@id
                    ELSE
                    INSERT INTO [roller_tracking].[Assets] (AssetID, AssetType, SerialNumber, CurrentStatus, CurrentLocation, Manufacturer, ManufacturingDate, UpdatedBy) VALUES (@id, @type, @sn, @status, @loc, @mn, @md, @user)`);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.post('/api/events', async (req, res) => {
    const { assetId, pageId, eventType, eventData, userId } = req.body;
    try {
        const pool = await getPool();
        await pool.request()
            .input('aid', sql.NVarChar, assetId)
            .input('pid', sql.NVarChar, pageId)
            .input('etype', sql.NVarChar, eventType)
            .input('edata', sql.NVarChar, JSON.stringify(eventData))
            .input('uid', sql.NVarChar, userId)
            .query('INSERT INTO [roller_tracking].[Events] (AssetID, PageID, EventType, EventData, UserID) VALUES (@aid, @pid, @etype, @edata, @uid)');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Roller Tracking Backend running on http://localhost:${PORT}`));
