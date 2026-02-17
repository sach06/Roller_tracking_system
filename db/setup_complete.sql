-- Roller Tracking System - Complete Database Setup
-- Run this script in SQL Server Management Studio (SSMS)
-- Connect to your SQL Server instance: SPHILSQL15\SQLTST153,55003

-- Step 1: Create the database if it doesn't exist
USE master;
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'RollerTrackingDB')
BEGIN
    CREATE DATABASE RollerTrackingDB;
    PRINT 'Database RollerTrackingDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database RollerTrackingDB already exists.';
END
GO

-- Step 2: Switch to the new database
USE RollerTrackingDB;
GO

-- Step 3: Create Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'roller_tracking')
BEGIN
    EXEC('CREATE SCHEMA roller_tracking');
    PRINT 'Schema roller_tracking created successfully.';
END
GO

-- Step 4: Create Users Table
IF OBJECT_ID('[roller_tracking].[Users]', 'U') IS NOT NULL 
    DROP TABLE [roller_tracking].[Users];
GO

CREATE TABLE [roller_tracking].[Users] (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100),
    Email NVARCHAR(100),
    Role NVARCHAR(20) CHECK (Role IN ('REF_OP', 'REF_ADMIN', 'WS_OP', 'WS_ADMIN')),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
PRINT 'Users table created successfully.';
GO

-- Step 5: Create Assets Table
IF OBJECT_ID('[roller_tracking].[Assets]', 'U') IS NOT NULL 
    DROP TABLE [roller_tracking].[Assets];
GO

CREATE TABLE [roller_tracking].[Assets] (
    AssetID NVARCHAR(50) PRIMARY KEY,
    AssetType NVARCHAR(20) CHECK (AssetType IN ('Roller', 'Sleeve', 'Axle')),
    SerialNumber NVARCHAR(100) NOT NULL,
    CurrentStatus NVARCHAR(50) DEFAULT 'Incoming',
    CurrentLocation NVARCHAR(100),
    Manufacturer NVARCHAR(100),
    ManufacturingDate DATE,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    UpdatedBy NVARCHAR(50)
);
PRINT 'Assets table created successfully.';
GO

-- Step 6: Create Events Table
IF OBJECT_ID('[roller_tracking].[Events]', 'U') IS NOT NULL 
    DROP TABLE [roller_tracking].[Events];
GO

CREATE TABLE [roller_tracking].[Events] (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    AssetID NVARCHAR(50) REFERENCES [roller_tracking].[Assets](AssetID),
    PageID NVARCHAR(10),
    EventType NVARCHAR(50),
    EventData NVARCHAR(MAX),
    EventTimestamp DATETIME DEFAULT GETDATE(),
    UserID NVARCHAR(50)
);
PRINT 'Events table created successfully.';
GO

-- Step 7: Seed initial user data
INSERT INTO [roller_tracking].[Users] (Username, PasswordHash, FullName, Role)
VALUES 
('admin', 'admin123', 'System Administrator', 'REF_ADMIN'),
('ref_user', 'pass123', 'Refurbishment Operator', 'REF_OP'),
('ws_user', 'pass123', 'Workshop Operator', 'WS_OP');
PRINT 'Initial users created successfully.';
GO

-- Step 8: Verify setup
SELECT 'Database Setup Complete!' AS Status;
SELECT COUNT(*) AS UserCount FROM [roller_tracking].[Users];
GO
