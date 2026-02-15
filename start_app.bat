@echo off
echo Starting Roller Tracking System (Node.js + React)...

cd backend
start "Roller Tracking Backend" cmd /k "npm install && npm start"
cd ..

cd frontend
start "Roller Tracking Frontend" cmd /k "npm install && npm run dev"
cd ..

echo Applications are starting...
echo backend: http://localhost:3001
echo frontend: http://localhost:3000
pause
