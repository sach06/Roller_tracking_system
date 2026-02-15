-- Roller Tracking System SQL Schema
-- Created on 2026-02-13

-- Create Schema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'roller_tracking')
BEGIN
    EXEC('CREATE SCHEMA roller_tracking')
END
GO

-- 1. Users Table
IF OBJECT_ID('[roller_tracking].[Users]', 'U') IS NOT NULL DROP TABLE [roller_tracking].[Users];
CREATE TABLE [roller_tracking].[Users] (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL, -- For simplicity, if using SQL Auth fallback
    FullName NVARCHAR(100),
    Email NVARCHAR(100),
    Role NVARCHAR(20) CHECK (Role IN ('REF_OP', 'REF_ADMIN', 'WS_OP', 'WS_ADMIN')),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 2. Assets Table (Current State)
IF OBJECT_ID('[roller_tracking].[Assets]', 'U') IS NOT NULL DROP TABLE [roller_tracking].[Assets];
CREATE TABLE [roller_tracking].[Assets] (
    AssetID NVARCHAR(50) PRIMARY KEY, -- e.g. R-001, S-001
    AssetType NVARCHAR(20) CHECK (AssetType IN ('Roller', 'Sleeve', 'Axle')),
    SerialNumber NVARCHAR(100) NOT NULL,
    CurrentStatus NVARCHAR(50) DEFAULT 'Incoming',
    CurrentLocation NVARCHAR(100),
    Manufacturer NVARCHAR(100),
    ManufacturingDate DATE,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    UpdatedBy NVARCHAR(50)
);
GO

-- 3. Tracking Events (Detailed History)
IF OBJECT_ID('[roller_tracking].[Events]', 'U') IS NOT NULL DROP TABLE [roller_tracking].[Events];
CREATE TABLE [roller_tracking].[Events] (
    EventID INT IDENTITY(1,1) PRIMARY KEY,
    AssetID NVARCHAR(50) REFERENCES [roller_tracking].[Assets](AssetID),
    PageID NVARCHAR(10), -- e.g. PG0003
    EventType NVARCHAR(50), -- e.g. Disassembly, Processing, Workshop
    EventData NVARCHAR(MAX), -- JSON string containing all dynamic fields
    EventTimestamp DATETIME DEFAULT GETDATE(),
    UserID NVARCHAR(50)
);
GO

-- Seed some initial data
INSERT INTO [roller_tracking].[Users] (Username, PasswordHash, FullName, Role)
VALUES 
('admin', 'admin123', 'System Administrator', 'REF_ADMIN'),
('ref_user', 'pass123', 'Refurbishment Operator', 'REF_OP'),
('ws_user', 'pass123', 'Workshop Operator', 'WS_OP');
GO
