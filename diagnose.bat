@echo off
echo ===================================================
echo Roller Tracking System - Environment Diagnosis
echo ===================================================
echo.
echo 1. Checking for Node.js...
where node
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is NOT found in your PATH.
    echo Please install Node.js from https://nodejs.org/
) else (
    echo [OK] Node.js found.
    node -v
)
echo.

echo 2. Checking for NPM...
where npm
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] NPM is NOT found in your PATH.
) else (
    echo [OK] NPM found.
    npm -v
)
echo.

echo 3. Checking for Docker...
where docker
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Docker is NOT found. You cannot run the containerized version.
) else (
    echo [OK] Docker found.
    docker -v
)
echo.

echo 4. Checking Ports...
netstat -an | find "3000" >nul
if %ERRORLEVEL% == 0 echo [WARN] Port 3000 (Frontend) might be in use.
netstat -an | find "3001" >nul
if %ERRORLEVEL% == 0 echo [WARN] Port 3001 (Backend) might be in use.

echo.
echo ===================================================
echo Diagnosis Complete.
echo If Node.js is missing, please install it to run locally.
echo Alternatively, use 'docker-compose up' if Docker is installed.
echo ===================================================
pause
