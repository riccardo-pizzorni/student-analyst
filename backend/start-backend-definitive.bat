@echo off
echo ========================================
echo   STUDENT ANALYST - Backend Startup
echo   Definitive Solution
echo ========================================
echo.

echo [1/5] Checking environment...
echo Current directory: %CD%
echo Node.js version:
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo [2/5] Checking if dist/index.js exists...
if not exist "dist\index.js" (
    echo WARNING: dist/index.js not found. Building project...
    goto :build
) else (
    echo ✓ dist/index.js found
)

echo.
echo [3/5] Checking if build is needed...
for /f "tokens=*" %%i in ('dir /t:w dist\index.js') do set BUILD_TIME=%%i
echo Last build time: %BUILD_TIME%
echo Current time: %date% %time%
echo.

:build
echo [4/5] Building TypeScript project...
npm run build
if errorlevel 1 (
    echo ERROR: Build failed. Check TypeScript errors above.
    pause
    exit /b 1
)
echo ✓ Project built successfully

echo.
echo [5/5] Starting backend server...
echo.
echo ========================================
echo   SERVER INFORMATION
echo ========================================
echo URL: http://localhost:10000
echo Health: http://localhost:10000/health
echo API Health: http://localhost:10000/api/health
echo Timeframes: http://localhost:10000/api/timeframes
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

node ./dist/index.js 