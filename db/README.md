# Database Setup Instructions

## 🎯 Critical First Step: Create the Database

The error you're seeing indicates that the `RollerTrackingDB` database doesn't exist yet. Follow these steps:

### Option 1: Using SQL Server Management Studio (SSMS) - RECOMMENDED

1. **Open SQL Server Management Studio (SSMS)**
2. **Connect to your server**: `SPHILSQL15\SQLTST153,55003`
3. **Open the setup script**: 
   - File → Open → File
   - Navigate to: `db/setup_complete.sql`
4. **Execute the script**: Press F5 or click "Execute"
5. **Verify**: You should see messages confirming:
   - Database created
   - Schema created
   - Tables created
   - Users inserted

### Option 2: Using sqlcmd (Command Line)

```bash
sqlcmd -S SPHILSQL15\SQLTST153,55003 -E -i "db/setup_complete.sql"
```

### Option 3: If you don't have permissions to create databases

If you cannot create a new database, you can use an existing database:

1. Ask your DBA which database you can use
2. Update `backend/.env` to point to that database:
   ```
   DB_DATABASE=YourExistingDatabase
   ```
3. Run only the schema portion (lines 18-95) from `db/setup_complete.sql`

## ✅ After Database Setup

Once the database is created:

1. **Verify the .env file** (`backend/.env`) has:
   ```
   DB_DATABASE=RollerTrackingDB
   ```
2. **Restart the application** using `start_app.bat`
3. The backend should now connect successfully!

## 🔍 Troubleshooting

**If you still get "Login failed for user 'SMS-GROUP\SACH06'":**
- Your Windows account needs permissions on the SQL Server
- Ask your DBA to grant you access, or
- Use SQL Authentication by setting DB_USER and DB_PASSWORD in .env

**To test connection without the full app:**
```bash
cd backend
node src/test_db.js
```
