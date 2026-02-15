# Roller Tracking System (Node.js + React + SQL Server)

## Overview
The Roller Tracking System is a web application designed to support roller, sleeve, and axle tracking across disassembly, processing, workshop, and outgoing stages. It replaces manual and Excel-based tracking systems.

## Tech Stack
- **Frontend**: React (Vite)
- **Backend**: Node.js (Express)
- **Database**: SQL Server
- **Auth**: Windows Authentication (Native Driver) or SQL Auth (Fallback)

## Prerequisites
- Node.js (v16+)
- SQL Server (Developer/Express edition)
- Git

## Installation

### 1. Database Setup
1. Open SQL Server Management Studio (SSMS).
2. Connect to your SQL Server instance (e.g., `SPHILSQL15\SQLTST153`).
3. Open `db/schema.sql` and execute the script to create the `RollerTrackingDB` (or within your existing DB) and necessary tables.

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```ini
   DB_SERVER=SPHILSQL15\SQLTST153
   DB_DATABASE=RollerTrackingDB
   ```
4. Start the server:
   ```bash
   npm start
   ```
   Server runs on `http://localhost:3001`

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   App runs on `http://localhost:3000`

## User Roles (Default Data)
- **Admin**: `admin` / `admin123` (Refurbishment Admin)
- **Refurbishment Operator**: `ref_user` / `pass123`
- **Workshop Operator**: `ws_user` / `pass123`

## Project Structure
- `backend/`: Express API handling SQL Server connection logic.
- `frontend/`: React application using Vite.
- `db/`: SQL scripts for database schema.
