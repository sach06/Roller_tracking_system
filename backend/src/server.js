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
        const result = await pool.request().query('SELECT site_name FROM [roller_tracking].[site] ORDER BY site_name');
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
            .input('rollerType', sql.NVarChar, data.rollerType)
            .input('driveType', sql.NVarChar, data.driveType)
            .input('rollerId', sql.NVarChar, data.rollerId)
            .input('casterId', sql.NVarChar, data.casterId)
            .input('strandId', sql.NVarChar, data.strandId)
            .input('segmentPosition', sql.NVarChar, data.segmentPosition)
            .input('segmentId', sql.NVarChar, data.segmentId)
            .input('incomingDate', sql.Date, data.incomingDate)
            .input('configuration', sql.Int, data.configuration)
            .input('incomingRollerPosition', sql.Int, data.incomingRollerPosition)
            .input('hasBreakout', sql.Bit, data.hasBreakout === 'Yes' ? 1 : 0)
            .input('haveJournal', sql.Bit, data.haveJournal === 'Yes' ? 1 : 0)
            .input('journalDiameterA', sql.Decimal(10, 2), data.journalDiameterA)
            .input('journalDiameterB', sql.Decimal(10, 2), data.journalDiameterB)
            .input('segmentTonnage', sql.Decimal(10, 2), data.segmentTonnage)
            .input('incomingDiameterA', sql.Decimal(10, 2), data.incomingDiameterA)
            .input('incomingDiameterB', sql.Decimal(10, 2), data.incomingDiameterB)
            .input('axleId', sql.NVarChar, data.axleId)
            .input('userId', sql.NVarChar, data.userId)
            .query(`INSERT INTO [roller_tracking].[roller_lifecycle] 
                    (roller_sleeve_id, caster_id, strand_id, segment_position, segment_id, 
                     incoming_date, configuration, incoming_roller_position, has_breakout, 
                     have_journal, journal_diameter_a, journal_diameter_b, segment_tonnage, 
                     incoming_diameter_a, incoming_diameter_b, axle_id, created_by) 
                    VALUES (@rollerId, @casterId, @strandId, @segmentPosition, @segmentId, 
                            @incomingDate, @configuration, @incomingRollerPosition, @hasBreakout, 
                            @haveJournal, @journalDiameterA, @journalDiameterB, @segmentTonnage, 
                            @incomingDiameterA, @incomingDiameterB, @axleId, @userId)`);

        res.json({ success: true, message: 'Data inserted successfully' });
    } catch (err) {
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
            .input('rollerSleeveId', sql.NVarChar, req.params.rollerId)
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
                        rl.incoming_date,
                        rl.segment_tonnage,
                        rl.breakout,
                        rl.incoming_diameter_a,
                        rl.incoming_diameter_b,
                        rl.have_journal,
                        rl.journal_diameter_a,
                        rl.journal_diameter_b,
                        rl.configuration,
                        rl.axle_id,
                        rl.incoming_roller_position,
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
                .input('scrapReason', sql.NVarChar, data.scrap_reason)
                .input('claddingYn', sql.Bit, data.cladding_yn)
                .input('wiresUsed', sql.Int, data.wires_used)
                .input('driveRotaryJointChangeYn', sql.Bit, data.drive_rotary_joint_change_yn)
                .input('idleRotaryJointChangeOpYn', sql.Bit, data.idle_rotary_joint_change_op_yn)
                .input('idleRotaryJointChangeDriveYn', sql.Bit, data.idle_rotary_joint_change_drive_yn)
                .input('outDiameterA', sql.Decimal(10, 2), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 2), data.out_diameter_b)
                .input('haveJournalYn', sql.Bit, data.have_journal_yn)
                .input('outJournalDiameterA', sql.Decimal(10, 2), data.out_journal_diameter_a)
                .input('outJournalDiameterB', sql.Decimal(10, 2), data.out_journal_diameter_b)
                .input('outConfiguration', sql.TinyInt, data.out_configuration)
                .input('diameterAReduceMm', sql.Decimal(10, 2), data.diameter_a_reduce_mm)
                .input('diameterBReduceMm', sql.Decimal(10, 2), data.diameter_b_reduce_mm)
                .query(`UPDATE rl
                        SET 
                            rl.process_stage = 'PROCESSED',
                            rl.updated_at = SYSDATETIME(),
                            rl.updated_by_user_id = @updatedByUserId,
                            rl.is_skin_cut = @skinPassCutYn,
                            rl.sleeve_scrap_yn = @sleeveScrapYn,
                            rl.scrap_reason = @scrapReason,
                            rl.is_cladded = @claddingYn,
                            rl.wires_used = @wiresUsed,
                            rl.drive_rotary_joint_change_yn = @driveRotaryJointChangeYn,
                            rl.idle_rotary_joint_change_op_yn = @idleRotaryJointChangeOpYn,
                            rl.idle_rotary_joint_change_drive_yn = @idleRotaryJointChangeDriveYn,
                            rl.out_diameter_a = @outDiameterA,
                            rl.out_diameter_b = @outDiameterB,
                            rl.have_journal_yn = @haveJournalYn,
                            rl.out_journal_diameter_a = @outJournalDiameterA,
                            rl.out_journal_diameter_b = @outJournalDiameterB,
                            rl.out_configuration = @outConfiguration,
                            rl.diameter_a_reduce_mm = @diameterAReduceMm,
                            rl.diameter_b_reduce_mm = @diameterBReduceMm
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
                .input('wiresUsed', sql.Int, data.wires_used)
                .input('axleId', sql.Int, data.axle_id)
                .input('isNewAxleYn', sql.Bit, data.is_new_axle_yn)
                .input('axleStraighteningYn', sql.Bit, data.axle_straightening_yn)
                .input('outDiameterA', sql.Decimal(10, 2), data.out_diameter_a)
                .input('outDiameterB', sql.Decimal(10, 2), data.out_diameter_b)
                .input('outConfiguration', sql.TinyInt, data.out_configuration)
                .input('diameterAReduceMm', sql.Decimal(10, 2), data.diameter_a_reduce_mm)
                .input('diameterBReduceMm', sql.Decimal(10, 2), data.diameter_b_reduce_mm)
                .query(`UPDATE rl
                        SET
                            rl.process_stage = 'PROCESSED',
                            rl.updated_at = SYSDATETIME(),
                            rl.updated_by_user_id = @updatedByUserId,
                            rl.is_skin_cut = @skinPassCutYn,
                            rl.sleeve_scrap_yn = @sleeveScrapYn,
                            rl.scrap_reason = @scrapReason,
                            rl.is_cladded = @claddingYn,
                            rl.wires_used = @wiresUsed,
                            rl.axle_id = @axleId,
                            rl.is_new_axle_yn = @isNewAxleYn,
                            rl.axle_straightening_yn = @axleStraighteningYn,
                            rl.out_diameter_a = @outDiameterA,
                            rl.out_diameter_b = @outDiameterB,
                            rl.out_configuration = @outConfiguration,
                            rl.diameter_a_reduce_mm = @diameterAReduceMm,
                            rl.diameter_b_reduce_mm = @diameterBReduceMm
                        FROM [roller_tracking].[roller_lifecycle] rl
                        WHERE rl.lifecycle_id = @lifecycleId`);
        }

        res.json({ success: true, message: 'Processing data updated successfully' });
    } catch (err) {
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
