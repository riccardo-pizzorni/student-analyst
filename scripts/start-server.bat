@echo off

:: Navigate to the script's directory, then go up one level to the project root
cd /d "%~dp0..\"

echo.
echo ========================================
echo   STUDENT ANALYST - CORS PROXY SERVER
echo ========================================
echo.

echo [1/4] Checking if server directory exists...
if not exist "server" (
    echo ERROR: Server directory not found!
    echo Current directory is: %cd%
    echo Please make sure you're running this from the project root.
    pause
    exit /b 1
)

echo [2/4] Navigating to server directory...
cd server

echo [3/4] Installing dependencies...
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies!
        pause
        exit /b 1
    )
) else (
    echo Dependencies already installed.
)

echo [4/4] Starting CORS Proxy Server...
echo.
echo Server will start on: http://localhost:10000
echo Health check: http://localhost:10000/health
echo.
echo Press Ctrl+C to stop the server
echo.

call npm start

pause 