const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString: 'Driver={ODBC Driver 18 for SQL Server};Server=SPHILSQL15\\SQLTST153,55003;Database=RollerTrackingDB;Trusted_Connection=Yes;TrustServerCertificate=Yes;Login Timeout=30;'
};

async function test() {
    try {
        await sql.connect(dbConfig);
        console.log('Connected');

        const res = await sql.query(`
            SELECT TOP 5 rs.roller_sleeve_id, rs.roller_type, rs.roller_function, rl.process_stage, rl.lifecycle_id
            FROM [roller_tracking].[roller_sleeve] rs
            LEFT JOIN [roller_tracking].[roller_lifecycle] rl ON rs.roller_sleeve_id = rl.roller_sleeve_id
            ORDER BY rl.lifecycle_id DESC
        `);
        console.log('Latest Lifecycles:', JSON.stringify(res.recordset, null, 2));

        const received = await sql.query(`
            SELECT TOP 5 rs.roller_sleeve_id, rs.roller_type, rs.roller_function, rl.process_stage, rl.lifecycle_id
            FROM [roller_tracking].[roller_sleeve] rs
            JOIN [roller_tracking].[roller_lifecycle] rl ON rs.roller_sleeve_id = rl.roller_sleeve_id
            WHERE rl.process_stage = 'RECEIVED'
        `);
        console.log('RECEIVED status assets:', JSON.stringify(received.recordset, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await sql.close();
    }
}

test();
