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

    const CONNECTION_STRING = `Driver={ODBC Driver 17 for SQL Server};Server=${server},${port};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;Login Timeout=30;`;
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
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('username', sql.NVarChar, username)
            .input('password', sql.NVarChar, password)
            .query('SELECT UserID, Username, FullName, Role FROM [roller_tracking].[Users] WHERE Username = @username AND PasswordHash = @password AND IsActive = 1');

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
