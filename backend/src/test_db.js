const sql = require('mssql/msnodesqlv8');

const server = 'SPHILSQL15\\SQLTST153';
const port = '55003';
const database = 'RollerTrackingDB';

// Try with ODBC Driver 18
const connString18 = `Driver={ODBC Driver 18 for SQL Server};Server=${server},${port};Database=${database};Trusted_Connection=Yes;TrustServerCertificate=Yes;Encrypt=no;Login Timeout=30;`;

async function testConnection() {
    console.log('Testing connection with:');
    console.log(connString18);

    try {
        await sql.connect(connString18);
        console.log('✅ Success! Connected using ODBC Driver 18.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Failed with ODBC Driver 18:', err.message);

        // Fallback test: maybe try generic "SQL Server" driver?
        const connStringGeneric = `Driver={SQL Server};Server=${server},${port};Database=${database};Trusted_Connection=Yes;`;
        console.log('\nRetrying with generic SQL Server driver...');
        console.log(connStringGeneric);

        try {
            await sql.connect(connStringGeneric);
            console.log('✅ Success! Connected using generic SQL Server driver.');
            console.log('⚠️ NOTE: You should update server.js to use "Driver={SQL Server}"');
        } catch (err2) {
            console.error('❌ Failed with generic driver too:', err2.message);
        }
    }
}

testConnection();
