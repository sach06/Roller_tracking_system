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
- Docker (Optional)

## Installation & Running

### Option 1: Local Setup (Recommended for Windows Auth)
1. **Database Setup**:
   - Open SSMS and execute `db/schema.sql`.
   - Ensure you can connect to your SQL Server instance (e.g. `SPHILSQL15\SQLTST153`).

2. **Run Diagnostic Check**:
   - Double-click `diagnose.bat` to verify if Node.js and npm are installed correctly. If not, please install Node.js from [nodejs.org](https://nodejs.org/).

3. **Start Application**:
   - Double-click `start_app.bat`. This will:
     - Install backend dependencies and start the server.
     - Install frontend dependencies and start the dev server.
   - Access the app at `http://localhost:3000`.

### Option 2: Docker Setup
1. **Run with Docker Compose**:
   ```bash
   docker-compose up --build
   ```
   **Note**: For SQL Server Windows Authentication to work inside a Linux container, you might need additional configuration or use SQL Authentication instead by setting `DB_USER` and `DB_PASSWORD` in `docker-compose.yml`.

## Troubleshooting
- **Frontend not starting?**
  - Make sure port 3000 is free.
  - Check the terminal output for errors (e.g., `npm install` failing).
  - Try running `npm install` manually inside the `frontend` folder.
- **Backend connection failed?**
  - Verify SQL Server is running and accessible.
  - Check `.env` settings in `backend/`.

## User Roles (Default Data)
- **Admin**: `admin` / `admin123` (Refurbishment Admin)
- **Refurbishment Operator**: `ref_user` / `pass123`
- **Workshop Operator**: `ws_user` / `pass123`
