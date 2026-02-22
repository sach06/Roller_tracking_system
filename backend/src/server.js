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
// Get existing rollers with filters
app.get('/api/rollers/existing', async (req, res) => {
    try {
        const pool = await getPool();
        const { rollerType, rollerFunction } = req.query;
        let query = 'SELECT roller_sleeve_id, roller_type, roller_function FROM [roller_tracking].[roller_sleeve] WHERE is_scrapped = 0';
        const request = pool.request();

        if (rollerType) {
            query += ' AND roller_type = @rollerType';
            request.input('rollerType', sql.NVarChar, rollerType);
        }
        if (rollerFunction) {
            query += ' AND roller_function = @rollerFunction';
            request.input('rollerFunction', sql.NVarChar, rollerFunction);
        }

        query += ' ORDER BY roller_type, roller_function, roller_sleeve_id';
        const result = await request.query(query);
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
            .input('rollerId', sql.Int, parseInt(req.params.id))
            .query(`SELECT SUM(CASE WHEN is_skin_cut = 1 THEN 1 ELSE 0 END) AS skin_cut_count 
                    FROM [roller_tracking].[roller_lifecycle] 
                    WHERE roller_sleeve_id = @rollerId`);

        const claddingResult = await pool.request()
            .input('rollerId', sql.Int, parseInt(req.params.id))
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
        const { site, siteId, userId } = req.query;
        let query = `SELECT DISTINCT c.caster_id, c.caster_name, c.caster_code, c.caster_cluster_id, s.site_id
                     FROM [roller_tracking].[caster] c
                     JOIN [roller_tracking].[site] s ON c.site_id = s.site_id`;

        const request = pool.request();
        let whereClauses = ['c.is_active = 1'];

        if (siteId) {
            whereClauses.push('s.site_id = @siteId');
            request.input('siteId', sql.Int, parseInt(siteId));
        } else if (site) {
            whereClauses.push('s.site_name = @siteName');
            request.input('siteName', sql.NVarChar, site);
        } else if (userId) {
            query += ` JOIN [roller_tracking].[user_site] us ON us.site_id = s.site_id`;
            whereClauses.push('us.user_id = @userId');
            request.input('userId', sql.Int, parseInt(userId));
        }

        query += ` WHERE ` + whereClauses.join(' AND ');
        query += ` ORDER BY c.caster_name`;

        const result = await request.query(query);
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
        let result;
        if (req.query.positionId) {
            // Lookup by position_id directly (used by ScrapRoller)
            result = await pool.request()
                .input('positionId', sql.Int, parseInt(req.query.positionId))
                .query(`SELECT s.segment_id, s.segment_no
                        FROM [roller_tracking].[segment_position_rule] spr
                        JOIN [roller_tracking].[segment] s
                            ON s.segment_id = spr.segment_id
                        WHERE spr.position_id = @positionId
                        ORDER BY s.segment_no`);
        } else {
            // Legacy: lookup by strandId + positionNo (used by InsertDisassembly)
            result = await pool.request()
                .input('strandId', sql.Int, req.query.strandId)
                .input('positionNo', sql.NVarChar, req.query.positionNo)
                .query(`SELECT s.segment_id, s.segment_no
                        FROM [roller_tracking].[position] p
                        JOIN [roller_tracking].[segment_position_rule] spr
                            ON spr.position_id = p.position_id
                        JOIN [roller_tracking].[segment] s
                            ON s.segment_id = spr.segment_id
                        WHERE p.strand_id = @strandId
                          AND p.position_no = @positionNo
                        ORDER BY s.segment_no`);
        }
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

        const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };
        const toDecimal = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };

        await pool.request()
            .input('rollerSleeveId', sql.Int, parseInt(data.rollerId))
            .input('fromSiteId', sql.Int, toInt(data.siteId))
            .input('fromCasterId', sql.Int, toInt(data.casterId))
            .input('fromStrandId', sql.Int, toInt(data.strandId))
            .input('fromPositionId', sql.Int, toInt(data.segmentPosition))
            .input('fromSegmentId', sql.Int, toInt(data.segmentId))
            .input('receivedAt', sql.DateTime2, data.incomingDate ? new Date(data.incomingDate) : null)
            .input('receivedConfig', sql.Int, toInt(data.configuration))
            .input('fromRollerPosition', sql.Int, toInt(data.incomingRollerPosition))
            .input('breakoutFlag', sql.Bit, data.hasBreakout === 'Yes' ? 1 : 0)
            .input('receivedJournalFlag', sql.Bit, data.haveJournal === 'Yes' ? 1 : 0)
            .input('receivedJournalA', sql.Decimal(10, 3), toDecimal(data.journalDiameterA))
            .input('receivedJournalB', sql.Decimal(10, 3), toDecimal(data.journalDiameterB))
            .input('tonnage', sql.Int, toInt(data.segmentTonnage))
            .input('receivedDiameterA', sql.Decimal(10, 3), toDecimal(data.incomingDiameterA))
            .input('receivedDiameterB', sql.Decimal(10, 3), toDecimal(data.incomingDiameterB))
            .input('receivedAxleId', sql.NVarChar, data.axleId || null)
            .input('createdByUserId', sql.Int, toInt(data.userId))
            .input('updatedByUserId', sql.Int, toInt(data.userId))
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
        const { rollerType, rollerFunction } = req.query;
        console.log('Fetching rollers for processing:', { rollerType, rollerFunction });

        const result = await pool.request()
            .input('rollerType', sql.NVarChar, rollerType)
            .input('rollerFunction', sql.NVarChar, rollerFunction)
            .query(`SELECT 
                        rs.roller_sleeve_id,
                        rs.roller_type,
                        rs.roller_function,
                        rl_current.lifecycle_id,
                        rl_current.from_site_id,
                        s.site_name,
                        rl_current.from_caster_id,
                        c.caster_name,
                        rl_current.from_strand_id,
                        st.strand_no,
                        rl_current.received_at,
                        (SELECT SUM(CASE WHEN is_skin_cut = 1 THEN 1 ELSE 0 END) 
                         FROM [roller_tracking].[roller_lifecycle] 
                         WHERE roller_sleeve_id = rs.roller_sleeve_id) AS skin_cut_count,
                    (SELECT SUM(CASE WHEN is_cladded = 1 THEN 1 ELSE 0 END) 
                     FROM [roller_tracking].[roller_lifecycle] 
                     WHERE roller_sleeve_id = rs.roller_sleeve_id) AS cladded_count
                FROM [roller_tracking].[roller_sleeve] rs
                JOIN [roller_tracking].[roller_lifecycle] rl_current
                    ON rs.roller_sleeve_id = rl_current.roller_sleeve_id
                LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl_current.from_site_id
                LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl_current.from_caster_id
                LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl_current.from_strand_id
                WHERE rs.is_scrapped = 0
                        AND rs.roller_type = @rollerType
                        AND (
                            rs.roller_function = @rollerFunction 
                            OR rs.roller_function LIKE @rollerFunction + '%' 
                            OR @rollerFunction LIKE rs.roller_function + '%'
                            OR rs.roller_function LIKE '%' + @rollerFunction + '%'
                        )
                        AND rl_current.lifecycle_id = (
                            SELECT MAX(lifecycle_id)
                            FROM [roller_tracking].[roller_lifecycle]
                            WHERE roller_sleeve_id = rs.roller_sleeve_id
                        )
                        AND rl_current.process_stage = 'RECEIVED'
                    ORDER BY rs.roller_sleeve_id`);

        console.log(`Found ${result.recordset.length} rollers matching criteria.`);

        if (result.recordset.length === 0) {
            const debugCheck = await pool.request().query(`SELECT COUNT(*) as total FROM [roller_tracking].[roller_lifecycle] WHERE process_stage = 'RECEIVED'`);
            console.log('DEBUG: Total assets in RECEIVED stage (any type):', debugCheck.recordset[0].total);
        }

        res.json({ success: true, rollers: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper to match existing detail fetch structure
app.get('/api/processing/lifecycle/dummy/:lifecycleId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('lifecycleId', sql.BigInt, req.params.lifecycleId)
            .query(`SELECT rl.*, rs.roller_type, rs.roller_function,
                           c.caster_name, st.strand_no, s.site_name,
                           pos.position_no, seg.segment_no
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl.from_caster_id
                    LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl.from_strand_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl.from_site_id
                    LEFT JOIN [roller_tracking].[position] pos ON pos.position_id = rl.from_position_id
                    LEFT JOIN [roller_tracking].[segment] seg ON seg.segment_id = rl.from_segment_id
                    WHERE rl.lifecycle_id = @lifecycleId`);

        if (result.recordset.length > 0) {
            res.json({ success: true, lifecycle: result.recordset[0] });
        } else {
            res.status(404).json({ success: false, message: 'Lifecycle not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get lifecycle details for processing
app.get('/api/processing/lifecycle/:rollerId/:lifecycleId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('rollerSleeveId', sql.Int, parseInt(req.params.rollerId))
            .input('lifecycleId', sql.BigInt, req.params.lifecycleId)
            .query(`SELECT TOP 1
                        rl.*,
                        rs.roller_type,
                        rs.roller_function,
                        s.site_name,
                        c.caster_name,
                        st.strand_no,
                        p.position_no,
                        seg.segment_no,
                        cw.wire_name AS cladding_wire_name,
                        s_to.site_name AS to_site_name,
                        c_to.caster_name AS to_caster_name,
                        st_to.strand_no AS to_strand_no,
                        p_to.position_no AS to_position_no,
                        seg_to.segment_no AS to_segment_no,
                        (SELECT ISNULL(SUM(CAST(is_skin_cut AS INT)), 0) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rl.roller_sleeve_id) AS total_skin_cut_count,
                        (SELECT ISNULL(SUM(CAST(is_skin_cut AS INT)), 0) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rl.roller_sleeve_id) AS skin_cut_count,
                        (SELECT ISNULL(SUM(CAST(is_cladded AS INT)), 0) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rl.roller_sleeve_id) AS total_cladded_count,
                        (SELECT ISNULL(SUM(CAST(is_cladded AS INT)), 0) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rl.roller_sleeve_id) AS cladded_count
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl.from_site_id
                    LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl.from_caster_id
                    LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl.from_strand_id
                    LEFT JOIN [roller_tracking].[position] p ON p.position_id = rl.from_position_id
                    LEFT JOIN [roller_tracking].[segment] seg ON seg.segment_id = rl.from_segment_id
                    LEFT JOIN [roller_tracking].[cladding_wire] cw ON cw.cladding_wire_id = rl.cladding_wire_id
                    LEFT JOIN [roller_tracking].[site] s_to ON s_to.site_id = rl.to_site_id
                    LEFT JOIN [roller_tracking].[caster] c_to ON c_to.caster_id = rl.to_caster_id
                    LEFT JOIN [roller_tracking].[strand] st_to ON st_to.strand_id = rl.to_strand_id
                    LEFT JOIN [roller_tracking].[position] p_to ON p_to.position_id = rl.to_position_id
                    LEFT JOIN [roller_tracking].[segment] seg_to ON seg_to.segment_id = rl.to_segment_id
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
            .query(`SELECT axle_id 
                    FROM [roller_tracking].[axle] 
                    WHERE is_scrapped = 0
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
            // Roller update - process_stage depends on scrap flag
            const processStage = data.sleeve_scrap_yn ? 'SCRAPPED' : 'PROCESSED';
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
                .input('processStage', sql.NVarChar, processStage)
                .query(`UPDATE rl
                        SET 
                            rl.process_stage = @processStage,
                            rl.processed_at = SYSDATETIME(),
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
            // Sleeve update - process_stage depends on scrap flag
            const processStage = data.sleeve_scrap_yn ? 'SCRAPPED' : 'PROCESSED';
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
                .input('processStage', sql.NVarChar, processStage)
                .query(`UPDATE rl
                        SET
                            rl.process_stage = @processStage,
                            rl.processed_at = SYSDATETIME(),
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
            let rollerSleeveId = parseInt(data.rollerId);
            const rollerCheck = await transaction.request()
                .input('rollerId', sql.Int, rollerSleeveId)
                .query('SELECT roller_sleeve_id FROM [roller_tracking].[roller_sleeve] WHERE roller_sleeve_id = @rollerId');

            if (rollerCheck.recordset.length === 0) {
                // Insert new roller
                await transaction.request()
                    .input('rollerId', sql.Int, rollerSleeveId)
                    .input('rollerType', sql.NVarChar, data.rollerType)
                    .input('rollerFunction', sql.NVarChar, data.driveType || 'Idle')
                    .query(`INSERT INTO [roller_tracking].[roller_sleeve] (roller_sleeve_id, roller_type, roller_function, is_scrapped) 
                            VALUES (@rollerId, @rollerType, @rollerFunction, 0)`);
            }

            // Common inputs for add-new
            const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };
            const toDecimal = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
            const processStage = data.sleeve_scrap_yn ? 'SCRAPPED' : 'PROCESSED';
            const request = transaction.request()
                .input('rollerSleeveId', sql.Int, rollerSleeveId)
                .input('fromSiteId', sql.Int, toInt(data.siteId))
                .input('fromCasterId', sql.Int, toInt(data.casterId))
                .input('fromStrandId', sql.Int, toInt(data.strandId))
                .input('fromPositionId', sql.Int, toInt(data.segmentPosition))
                .input('fromSegmentId', sql.Int, toInt(data.segmentId))
                .input('receivedAt', sql.DateTime2, data.incomingDate ? new Date(data.incomingDate) : null)
                .input('receivedConfig', sql.Int, toInt(data.configuration))
                .input('fromRollerPosition', sql.Int, toInt(data.incomingRollerPosition))
                .input('breakoutFlag', sql.Bit, data.hasBreakout === 'Yes' ? 1 : 0)
                .input('tonnage', sql.Int, toInt(data.segmentTonnage))
                .input('receivedDiameterA', sql.Decimal(10, 3), toDecimal(data.incomingDiameterA))
                .input('receivedDiameterB', sql.Decimal(10, 3), toDecimal(data.incomingDiameterB))
                .input('createdByUserId', sql.Int, toInt(data.userId))
                .input('updatedByUserId', sql.Int, toInt(data.userId))

                // Processing Details
                .input('skinPassCutYn', sql.Bit, data.skin_pass_cut_yn)
                .input('sleeveScrapYn', sql.Bit, data.sleeve_scrap_yn)
                .input('scrapReason', sql.NVarChar, data.scrap_reason)
                .input('claddingYn', sql.Bit, data.cladding_yn)
                .input('claddingWireId', sql.Int, toInt(data.cladding_wire_id))

                // Outgoing Details
                .input('outDiameterA', sql.Decimal(10, 3), toDecimal(data.out_diameter_a))
                .input('outDiameterB', sql.Decimal(10, 3), toDecimal(data.out_diameter_b))
                .input('outConfiguration', sql.Int, toInt(data.out_configuration))
                .input('diameterBReduceMm', sql.Decimal(10, 3), toDecimal(data.diameter_b_reduce_mm))

                .input('processStage', sql.NVarChar, processStage)
                .input('processedAt', sql.DateTime2, new Date());

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
                created_by_user_id, updated_by_user_id, process_stage, processed_at,
                is_skin_cut, roller_scrap_flag, roller_scrap_reason, is_cladded, cladding_wire_id,
                dispatched_diameter_a, dispatched_diameter_b, dispatched_config, diff_diameter_a, diff_diameter_b
            `;
            let values = `
                @rollerSleeveId, @fromSiteId, @fromCasterId, @fromStrandId,
                @fromPositionId, @fromSegmentId, @receivedAt, @receivedConfig,
                @fromRollerPosition, @breakoutFlag, @tonnage, @receivedDiameterA, @receivedDiameterB,
                @createdByUserId, @updatedByUserId, @processStage, @processedAt,
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
            // Check if rollerId already exists
            const existing = await transaction.request()
                .input('rollerId', sql.Int, parseInt(data.rollerId))
                .query('SELECT roller_sleeve_id FROM [roller_tracking].[roller_sleeve] WHERE roller_sleeve_id = @rollerId');

            if (existing.recordset.length > 0) {
                await transaction.rollback();
                return res.status(400).json({ success: false, error: 'The ID already exist. Please use new ID.' });
            }

            // 1. Insert into roller_sleeve
            await transaction.request()
                .input('rollerId', sql.Int, parseInt(data.rollerId))
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
                .input('rollerSleeveId', sql.Int, parseInt(data.rollerId))
                .input('createdByUserId', sql.Int, data.userId)
                .input('processStage', sql.NVarChar, 'PROCESSED')
                .input('outDiameterA', sql.Decimal(10, 3), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 3), data.out_diameter_b)
                .input('outConfig', sql.Int, data.out_configuration)
                .input('siteId', sql.Int, data.siteId)
                .input('processedAt', sql.DateTime2, new Date());

            let columns = `roller_sleeve_id, created_by_user_id, updated_by_user_id, process_stage, processed_at, 
                           dispatched_diameter_a, dispatched_diameter_b, dispatched_config, from_site_id`;
            let values = `@rollerSleeveId, @createdByUserId, @createdByUserId, @processStage, @processedAt, 
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

// Scrap roller/sleeve
app.post('/api/scrap/roller-sleeve', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;

        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // 1. Update roller_sleeve table (mark as scrapped, record reason)
            await transaction.request()
                .input('rollerId', sql.Int, parseInt(data.rollerId))
                .input('scrapReason', sql.NVarChar, data.scrapReason)
                .query(`UPDATE [roller_tracking].[roller_sleeve] 
                        SET is_scrapped = 1, 
                            scrapped_at = SYSDATETIME(),
                            scrapped_reason = @scrapReason
                        WHERE roller_sleeve_id = @rollerId`);

            // 2. Insert into roller_lifecycle (incoming scrap event)
            const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };
            const toDecimal = (v) => { const n = parseFloat(v); return isNaN(n) ? null : n; };
            const request = transaction.request()
                .input('rollerSleeveId', sql.Int, parseInt(data.rollerId))
                .input('fromSiteId', sql.Int, toInt(data.siteId))
                .input('fromCasterId', sql.Int, toInt(data.casterId))
                .input('fromStrandId', sql.Int, toInt(data.strandId))
                .input('fromPositionId', sql.Int, toInt(data.segmentPosition))
                .input('fromSegmentId', sql.Int, toInt(data.segmentId))
                .input('receivedAt', sql.DateTime2, data.scrapDate ? new Date(data.scrapDate) : null)
                .input('receivedConfig', sql.Int, toInt(data.configuration))
                .input('fromRollerPosition', sql.Int, toInt(data.incomingRollerPosition))
                .input('breakoutFlag', sql.Bit, data.hasBreakout === 'Yes' ? 1 : 0)
                .input('tonnage', sql.Int, toInt(data.segmentTonnage))
                .input('receivedDiameterA', sql.Decimal(10, 3), toDecimal(data.incomingDiameterA))
                .input('receivedDiameterB', sql.Decimal(10, 3), toDecimal(data.incomingDiameterB))
                .input('createdByUserId', sql.Int, toInt(data.userId))
                .input('updatedByUserId', sql.Int, toInt(data.userId))
                .input('scrapReason', sql.NVarChar, data.scrapReason)
                .input('processStage', sql.NVarChar, 'SCRAPPED');

            let columns = `roller_sleeve_id, from_site_id, from_caster_id, from_strand_id, 
                           from_position_id, from_segment_id, received_at, received_config, 
                           from_roller_position, breakout_flag, tonnage, received_diameter_a, received_diameter_b, 
                           created_by_user_id, updated_by_user_id, process_stage, roller_scrap_flag, roller_scrap_reason`;
            let values = `@rollerSleeveId, @fromSiteId, @fromCasterId, @fromStrandId,
                          @fromPositionId, @fromSegmentId, @receivedAt, @receivedConfig,
                          @fromRollerPosition, @breakoutFlag, @tonnage, @receivedDiameterA, @receivedDiameterB,
                          @createdByUserId, @updatedByUserId, @processStage, 1, @scrapReason`;

            if (data.rollerType === 'Roller') {
                request.input('receivedJournalFlag', sql.Bit, data.haveJournal === 'Yes' ? 1 : 0)
                    .input('receivedJournalA', sql.Decimal(10, 3), data.journalDiameterA || null)
                    .input('receivedJournalB', sql.Decimal(10, 3), data.journalDiameterB || null);

                columns += `, received_journal_flag, received_journal_a, received_journal_b`;
                values += `, @receivedJournalFlag, @receivedJournalA, @receivedJournalB`;
            } else {
                request.input('receivedAxleId', sql.NVarChar, data.axleId || null);
                columns += `, received_axle_id`;
                values += `, @receivedAxleId`;
            }

            await request.query(`INSERT INTO [roller_tracking].[roller_lifecycle] (${columns}) VALUES (${values})`);

            await transaction.commit();
            res.json({ success: true, message: 'Entity scrapped successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Scrap roller error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Scrap Axle
app.post('/api/scrap/axle', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;

        await pool.request()
            .input('axleId', sql.NVarChar, data.axleId)
            .query(`UPDATE [roller_tracking].[axle] 
                    SET is_scrapped = 1, scrapped_at = SYSDATETIME() 
                    WHERE axle_id = @axleId`);

        res.json({ success: true, message: 'Axle scrapped successfully' });
    } catch (err) {
        console.error('Scrap axle error:', err);
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
            .query(`SELECT u.user_id, u.username, r.role_code, s.site_id, s.site_name AS site
                    FROM [roller_tracking].[app_user] u
                    JOIN [roller_tracking].[user_role] ur ON ur.user_id = u.user_id
                    JOIN [roller_tracking].[role] r ON r.role_id = ur.role_id
                    LEFT JOIN [roller_tracking].[user_site] us ON us.user_id = u.user_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = us.site_id
                    WHERE u.username = @username AND u.password_hash = @password AND u.is_active = 1`);

        if (result.recordset.length > 0) {
            res.json({ success: true, user: result.recordset[0] });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ===== WORKSHOP (WS) ENDPOINTS =====

// Get PROCESSED rollers for workshop dispatch
app.get('/api/ws/rollers', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('rollerFunction', sql.NVarChar, req.query.rollerFunction || null)
            .query(`SELECT rl.lifecycle_id, rl.roller_sleeve_id, 
                           rl.from_caster_id, c.caster_name,
                           rl.from_strand_id, st.strand_no,
                           rl.from_site_id, s.site_name,
                           rl.received_at, rl.processed_at
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl.from_caster_id
                    LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl.from_strand_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl.from_site_id
                    WHERE rl.process_stage = 'PROCESSED'
                      AND rs.roller_type = 'Roller'
                      AND rs.is_scrapped = 0
                      AND (@rollerFunction IS NULL OR rs.roller_function = @rollerFunction)
                    ORDER BY rl.processed_at DESC`);
        res.json({ success: true, rollers: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get PROCESSED sleeves for workshop dispatch
app.get('/api/ws/sleeves', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT rl.dispatched_axle_id AS received_axle_id,
                           MAX(rl.lifecycle_id) as lifecycle_id,
                           MAX(rl.from_caster_id) as from_caster_id, MAX(c.caster_name) as caster_name,
                           MAX(rl.from_strand_id) as from_strand_id, MAX(st.strand_no) as strand_no,
                           MAX(rl.from_site_id) as from_site_id, MAX(s.site_name) as site_name,
                           MAX(rl.received_at) as received_at, MAX(rl.processed_at) as processed_at
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl.from_caster_id
                    LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl.from_strand_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl.from_site_id
                    WHERE rl.process_stage = 'PROCESSED'
                      AND rs.roller_type = 'Sleeve'
                      AND rs.is_scrapped = 0
                      AND rl.dispatched_axle_id IS NOT NULL
                    GROUP BY rl.dispatched_axle_id
                    ORDER BY MAX(rl.processed_at) DESC`);
        res.json({ success: true, sleeves: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get axle details for dispatch
app.get('/api/ws/axle-details/:axleId', async (req, res) => {
    try {
        const pool = await getPool();
        const axleId = req.params.axleId;

        const result = await pool.request()
            .input('axleId', sql.Int, axleId)
            .query(`SELECT 
                        MAX(rl.dispatched_diameter_a) AS dispatched_diameter_a,
                        MAX(rl.dispatched_diameter_b) AS dispatched_diameter_b,
                        MAX(rl.dispatched_config) AS dispatched_config
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    WHERE rl.process_stage = 'PROCESSED'
                      AND rs.roller_type = 'Sleeve'
                      AND rl.dispatched_axle_id = @axleId`);

        const sleevesResult = await pool.request()
            .input('axleId', sql.Int, axleId)
            .query(`SELECT rl.roller_sleeve_id
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    WHERE rl.process_stage = 'PROCESSED'
                      AND rs.roller_type = 'Sleeve'
                      AND rl.dispatched_axle_id = @axleId`);

        if (result.recordset.length > 0) {
            const data = result.recordset[0];
            data.sleeve_ids = sleevesResult.recordset.map(r => r.roller_sleeve_id);
            res.json({ success: true, details: data });
        } else {
            res.status(404).json({ success: false, error: 'Axle details not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Dispatch roller or sleeve from workshop
app.post('/api/ws/dispatch', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;
        const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };

        let query = '';
        let request = pool.request()
            .input('toCasterId', sql.Int, toInt(data.toCasterId))
            .input('toStrandId', sql.Int, toInt(data.toStrandId))
            .input('toPositionId', sql.Int, toInt(data.toPositionId))
            .input('toSegmentId', sql.Int, toInt(data.toSegmentId))
            .input('toRollerPosition', sql.Int, toInt(data.toRollerPosition))
            .input('toConfiguration', sql.Int, toInt(data.toConfiguration))
            .input('toSiteId', sql.Int, toInt(data.toSiteId))
            .input('updatedByUserId', sql.Int, toInt(data.userId));

        if (data.axleId && data.axleId !== 'undefined' && data.axleId !== null) {
            request.input('axleId', sql.Int, toInt(data.axleId));
            query = `UPDATE [roller_tracking].[roller_lifecycle]
                     SET process_stage = 'DISPATCHED',
                         dispatched_at = SYSDATETIME(),
                         updated_at = SYSDATETIME(),
                         updated_by_user_id = @updatedByUserId,
                         to_caster_id = @toCasterId,
                         to_strand_id = @toStrandId,
                         to_position_id = @toPositionId,
                         to_segment_id = @toSegmentId,
                         to_roller_position = @toRollerPosition,
                         to_site_id = @toSiteId,
                         dispatched_config = @toConfiguration
                     WHERE dispatched_axle_id = @axleId 
                       AND process_stage = 'PROCESSED'`;
        } else {
            request.input('lifecycleId', sql.BigInt, data.lifecycleId);
            query = `UPDATE [roller_tracking].[roller_lifecycle]
                     SET process_stage = 'DISPATCHED',
                         dispatched_at = SYSDATETIME(),
                         updated_at = SYSDATETIME(),
                         updated_by_user_id = @updatedByUserId,
                         to_caster_id = @toCasterId,
                         to_strand_id = @toStrandId,
                         to_position_id = @toPositionId,
                         to_segment_id = @toSegmentId,
                         to_roller_position = @toRollerPosition,
                         to_site_id = @toSiteId,
                         dispatched_config = @toConfiguration
                     WHERE lifecycle_id = @lifecycleId`;
        }

        await request.query(query);

        res.json({ success: true, message: 'Dispatched successfully' });
    } catch (err) {
        console.error('Dispatch error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// View all assets with latest lifecycle
app.get('/api/view/assets', async (req, res) => {
    try {
        const pool = await getPool();
        const { rollerType, rollerFunction, assetId, date } = req.query;

        let query = `
            SELECT 
                rs.roller_sleeve_id,
                rs.roller_type,
                rs.roller_function,
                rl_current.from_site_id,
                s.site_name,
                rl_current.from_caster_id,
                c.caster_name,
                rl_current.from_strand_id,
                st.strand_no,
                rl_current.received_at,
                rl_current.lifecycle_id,
                rl_current.process_stage,
                (SELECT SUM(CAST(is_skin_cut AS INT)) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rs.roller_sleeve_id) AS skin_cut_count,
                (SELECT SUM(CAST(is_cladded AS INT)) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rs.roller_sleeve_id) AS cladded_count
            FROM [roller_tracking].[roller_sleeve] rs
            JOIN [roller_tracking].[roller_lifecycle] rl_current
                ON rs.roller_sleeve_id = rl_current.roller_sleeve_id
            LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl_current.from_site_id
            LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl_current.from_caster_id
            LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl_current.from_strand_id
            WHERE rs.is_scrapped = 0
        `;

        const request = pool.request();
        if (rollerType) {
            query += " AND rs.roller_type = @rollerType";
            request.input('rollerType', sql.NVarChar, rollerType);
        }
        if (rollerFunction) {
            query += " AND (rs.roller_function = @rollerFunction OR rs.roller_function LIKE @rollerFunction + '%' OR @rollerFunction LIKE rs.roller_function + '%')";
            request.input('rollerFunction', sql.NVarChar, rollerFunction);
        }
        if (assetId) {
            query += " AND rs.roller_sleeve_id = @assetId";
            request.input('assetId', sql.Int, assetId);
        }
        if (date) {
            query += " AND CAST(rl_current.received_at AS DATE) = @date";
            request.input('date', sql.Date, date);
        }

        query += " ORDER BY rl_current.received_at DESC, rs.roller_sleeve_id";

        const result = await request.query(query);
        res.json({ success: true, assets: result.recordset });
    } catch (err) {
        console.error('Error in /api/view/assets:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get DISPATCHED rollers for workshop update
app.get('/api/update/dispatched-rollers', async (req, res) => {
    try {
        const pool = await getPool();
        const { rollerFunction } = req.query;

        let query = `
            SELECT 
                rs.roller_sleeve_id,
                rs.roller_type,
                rs.roller_function,
                rl_current.from_site_id,
                s.site_name,
                rl_current.from_caster_id,
                c.caster_name,
                rl_current.from_strand_id,
                st.strand_no,
                rl_current.received_at,
                rl_current.dispatched_at,
                rl_current.lifecycle_id,
                rl_current.process_stage,
                (SELECT SUM(CAST(is_skin_cut AS INT)) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rs.roller_sleeve_id) AS skin_cut_count,
                (SELECT SUM(CAST(is_cladded AS INT)) FROM [roller_tracking].[roller_lifecycle] WHERE roller_sleeve_id = rs.roller_sleeve_id) AS cladded_count
            FROM [roller_tracking].[roller_sleeve] rs
            JOIN [roller_tracking].[roller_lifecycle] rl_current
                ON rs.roller_sleeve_id = rl_current.roller_sleeve_id
            LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl_current.from_site_id
            LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl_current.from_caster_id
            LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl_current.from_strand_id
            WHERE rs.is_scrapped = 0
              AND rs.roller_type = 'Roller'
              AND rl_current.process_stage = 'DISPATCHED'
        `;

        const request = pool.request();
        if (rollerFunction) {
            query += " AND (rs.roller_function = @rollerFunction OR rs.roller_function LIKE @rollerFunction + '%' OR @rollerFunction LIKE rs.roller_function + '%')";
            request.input('rollerFunction', sql.NVarChar, rollerFunction);
        }

        query += " ORDER BY rl_current.dispatched_at DESC, rs.roller_sleeve_id";

        const result = await request.query(query);
        res.json({ success: true, assets: result.recordset });
    } catch (err) {
        console.error('Error in /api/update/dispatched-rollers:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get DISPATCHED axles for workshop update
app.get('/api/update/dispatched-axles', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query(`SELECT rl.dispatched_axle_id AS received_axle_id,
                           MAX(rl.lifecycle_id) as lifecycle_id,
                           MAX(rl.to_caster_id) as caster_id, MAX(c.caster_name) as caster_name,
                           MAX(rl.to_strand_id) as strand_id, MAX(st.strand_no) as strand_no,
                           MAX(rl.to_site_id) as site_id, MAX(s.site_name) as site_name,
                           MAX(rl.dispatched_at) as dispatched_at
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    LEFT JOIN [roller_tracking].[caster] c ON c.caster_id = rl.to_caster_id
                    LEFT JOIN [roller_tracking].[strand] st ON st.strand_id = rl.to_strand_id
                    LEFT JOIN [roller_tracking].[site] s ON s.site_id = rl.to_site_id
                    WHERE rl.process_stage = 'DISPATCHED'
                      AND rs.roller_type = 'Sleeve'
                      AND rs.is_scrapped = 0
                      AND rl.dispatched_axle_id IS NOT NULL
                    GROUP BY rl.dispatched_axle_id
                    ORDER BY MAX(rl.dispatched_at) DESC`);
        res.json({ success: true, axles: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get axle details for update
app.get('/api/update/axle-details/:axleId', async (req, res) => {
    try {
        const pool = await getPool();
        const axleId = req.params.axleId;

        const result = await pool.request()
            .input('axleId', sql.Int, axleId)
            .query(`SELECT 
                        MAX(rl.lifecycle_id) as lifecycle_id,
                        MAX(rl.dispatched_diameter_a) AS dispatched_diameter_a,
                        MAX(rl.dispatched_diameter_b) AS dispatched_diameter_b,
                        MAX(rl.dispatched_config) AS dispatched_config,
                        MAX(rl.to_caster_id) AS to_caster_id,
                        MAX(rl.to_strand_id) AS to_strand_id,
                        MAX(rl.to_position_id) AS to_position_id,
                        MAX(rl.to_segment_id) AS to_segment_id,
                        MAX(rl.to_roller_position) AS to_roller_position,
                        MAX(rl.to_site_id) AS to_site_id,
                        MAX(rs.roller_function) AS roller_function
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    WHERE rl.process_stage = 'DISPATCHED'
                      AND rs.roller_type = 'Sleeve'
                      AND rl.dispatched_axle_id = @axleId`);

        const sleevesResult = await pool.request()
            .input('axleId', sql.Int, axleId)
            .query(`SELECT rl.roller_sleeve_id
                    FROM [roller_tracking].[roller_lifecycle] rl
                    JOIN [roller_tracking].[roller_sleeve] rs ON rs.roller_sleeve_id = rl.roller_sleeve_id
                    WHERE rl.process_stage = 'DISPATCHED'
                      AND rs.roller_type = 'Sleeve'
                      AND rl.dispatched_axle_id = @axleId`);

        if (result.recordset.length > 0 && result.recordset[0].lifecycle_id) {
            const data = result.recordset[0];
            data.sleeve_ids = sleevesResult.recordset.map(r => r.roller_sleeve_id);
            res.json({ success: true, details: data });
        } else {
            res.status(404).json({ success: false, error: 'Axle details not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Update dispatched axle from workshop
app.post('/api/update/axle-dispatch', async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;
        const toInt = (v) => { const n = parseInt(v); return isNaN(n) ? null : n; };

        await pool.request()
            .input('axleId', sql.Int, toInt(data.axleId))
            .input('toCasterId', sql.Int, toInt(data.toCasterId))
            .input('toStrandId', sql.Int, toInt(data.toStrandId))
            .input('toPositionId', sql.Int, toInt(data.toPositionId))
            .input('toSegmentId', sql.Int, toInt(data.toSegmentId))
            .input('toRollerPosition', sql.Int, toInt(data.toRollerPosition))
            .input('toConfiguration', sql.Int, toInt(data.toConfiguration))
            .input('toSiteId', sql.Int, toInt(data.toSiteId))
            .input('updatedByUserId', sql.Int, toInt(data.userId))
            .query(`UPDATE [roller_tracking].[roller_lifecycle]
                     SET updated_at = SYSDATETIME(),
                         updated_by_user_id = @updatedByUserId,
                         to_caster_id = @toCasterId,
                         to_strand_id = @toStrandId,
                         to_position_id = @toPositionId,
                         to_segment_id = @toSegmentId,
                         to_roller_position = @toRollerPosition,
                         to_site_id = @toSiteId,
                         dispatched_config = @toConfiguration
                     WHERE dispatched_axle_id = @axleId 
                       AND process_stage = 'DISPATCHED'`);

        res.json({ success: true, message: 'Updated successfully' });
    } catch (err) {
        console.error('Update axle dispatch error:', err);
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

// Update lifecycle record (for REF and WS roles)
app.post('/api/admin/update-lifecycle', async (req, res) => {
    try {
        const {
            lifecycleId,
            incomingDetails,
            processDetails,
            dispatchDetails,
            userId
        } = req.body;

        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            request.input('lifecycleId', sql.BigInt, lifecycleId);

            let updateFields = [];

            // 1. Incoming Details
            // Helper to process field updates safely
            const processFields = (data, fieldMap) => {
                for (let [dbCol, [prop, type]] of Object.entries(fieldMap)) {
                    if (data.hasOwnProperty(prop)) {
                        let val = data[prop];

                        // Identify the type category
                        // Parameterized types like Decimal(10,3) often store their name in type.type.name 
                        // or provide it via toString().
                        const typeName = type.name || (type.type && type.type.name) || (typeof type.toString === 'function' ? type.toString() : '');
                        const typeStr = typeName.toLowerCase();

                        const isNumeric = typeStr.includes('decimal') ||
                            typeStr.includes('int') ||
                            typeStr.includes('numeric') ||
                            typeStr.includes('float') ||
                            typeStr.includes('real');
                        const isDateTime = typeStr.includes('datetime');

                        // If it's a numeric or date field and the value is empty/null/invalid, use NULL
                        if ((isNumeric || isDateTime) && (val === '' || val === undefined || val === null)) {
                            val = null;
                        } else if (isNumeric && val !== null && val !== '') {
                            // For numeric fields, try to convert to a real number
                            const num = parseFloat(val);
                            val = isNaN(num) ? null : num;
                        }

                        request.input(prop, type, val);
                        updateFields.push(`${dbCol} = @${prop}`);
                    }
                }
            };

            if (incomingDetails) {
                processFields(incomingDetails, {
                    from_site_id: ['fromSiteId', sql.Int],
                    from_caster_id: ['fromCasterId', sql.Int],
                    from_strand_id: ['fromStrandId', sql.Int],
                    from_position_id: ['fromPositionId', sql.Int],
                    from_segment_id: ['fromSegmentId', sql.Int],
                    received_at: ['receivedAt', sql.DateTime],
                    received_config: ['receivedConfig', sql.Int],
                    from_roller_position: ['fromRollerPosition', sql.Int],
                    received_diameter_a: ['receivedDiameterA', sql.Decimal(10, 3)],
                    received_diameter_b: ['receivedDiameterB', sql.Decimal(10, 3)],
                    received_journal_flag: ['receivedJournalFlag', sql.Bit],
                    received_journal_a: ['receivedJournalA', sql.Decimal(10, 3)],
                    received_journal_b: ['receivedJournalB', sql.Decimal(10, 3)],
                    breakout_flag: ['breakoutFlag', sql.Bit],
                    tonnage: ['tonnage', sql.Int],
                    received_axle_id: ['receivedAxleId', sql.Int]
                });
            }

            if (processDetails) {
                processFields(processDetails, {
                    is_skin_cut: ['isSkinCut', sql.Bit],
                    is_cladded: ['isCladded', sql.Bit],
                    cladding_wire_id: ['claddingWireId', sql.Int],
                    roller_scrap_flag: ['rollerScrapFlag', sql.Bit],
                    roller_scrap_reason: ['rollerScrapReason', sql.NVarChar],
                    drive_rotary_joint_change_flag: ['driveRotaryJointChangeFlag', sql.Bit],
                    idle_rotary_joint_change_o_flag: ['idleRotaryJointChangeOFlag', sql.Bit],
                    idle_rotary_joint_change_d_flag: ['idleRotaryJointChangeDFlag', sql.Bit]
                });

                // Satisfy ck_rl_scrap_consistency: if scrap flag is true, stage must be 'SCRAPPED'
                if (processDetails.rollerScrapFlag === true || processDetails.rollerScrapFlag === 1) {
                    request.input('scrapStage', sql.NVarChar, 'SCRAPPED');
                    updateFields.push(`process_stage = @scrapStage`);
                    // Also record scrap date if not already set
                    updateFields.push(`scrapped_at = GETDATE()`);
                }
            }

            if (dispatchDetails) {
                processFields(dispatchDetails, {
                    to_site_id: ['toSiteId', sql.Int],
                    to_caster_id: ['toCasterId', sql.Int],
                    to_strand_id: ['toStrandId', sql.Int],
                    to_position_id: ['toPositionId', sql.Int],
                    to_segment_id: ['toSegmentId', sql.Int],
                    to_roller_position: ['toRollerPosition', sql.Int],
                    dispatched_config: ['dispatchedConfig', sql.Int],
                    dispatched_axle_id: ['dispatchedAxleId', sql.Int],
                    dispatched_axle_straight_flag: ['dispatchedAxleStraightFlag', sql.Bit],
                    dispatched_journal_flag: ['dispatchedJournalFlag', sql.Bit],
                    dispatched_journal_a: ['dispatchedJournalA', sql.Decimal(10, 3)],
                    dispatched_journal_b: ['dispatchedJournalB', sql.Decimal(10, 3)]
                });
            }

            if (req.body.outgoingDetails) {
                processFields(req.body.outgoingDetails, {
                    dispatched_diameter_a: ['outDiaA', sql.Decimal(10, 3)],
                    dispatched_diameter_b: ['outDiaB', sql.Decimal(10, 3)],
                    diff_diameter_a: ['diffDiaA', sql.Decimal(10, 3)],
                    diff_diameter_b: ['diffDiaB', sql.Decimal(10, 3)],
                    processed_at: ['processedAt', sql.DateTime]
                });
            }

            if (updateFields.length > 0) {
                request.input('userId', sql.Int, userId);
                updateFields.push(`updated_at = GETDATE()`);
                updateFields.push(`updated_by_user_id = @userId`);

                const query = `UPDATE [roller_tracking].[roller_lifecycle] SET ${updateFields.join(', ')} WHERE lifecycle_id = @lifecycleId`;
                await request.query(query);
            }

            await transaction.commit();
            res.json({ success: true, message: 'Lifecycle updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Update error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Roller Tracking Backend running on http://localhost:${PORT}`));
