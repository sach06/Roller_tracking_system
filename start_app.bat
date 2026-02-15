@echo off
echo Starting Roller Tracking System (Node.js + React)...

echo Checking environment...
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm is not found. Please install Node.js to run this application.
    echo Download at: https://nodejs.org/
    pause
    exit /b
)

echo Starting Backend...
cd backend
start "Roller Tracking Backend" cmd /c "npm install && npm start || pause"
cd ..

echo Starting Frontend...
cd frontend
start "Roller Tracking Frontend" cmd /c "npm install && npm run dev || pause"
cd ..

echo Applications are launching...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
pause
