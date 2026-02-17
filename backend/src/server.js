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
            .query(`SELECT c.caster_id, c.caster_name, c.caster_code
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
            .input('positionNo', sql.Int, req.query.positionNo)
            .query(`SELECT s.segment_id, s.segment_no
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
