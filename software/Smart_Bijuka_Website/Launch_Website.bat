@echo off
setlocal enabledelayedexpansion
title Smart Bijuka Web Portal
cd /d "%~dp0"
color 0B

echo ============================================================
echo      SMART BIJUKA - AI & IoT Web Portal [1-Click Launch]
echo ============================================================
echo.

:: 1. Verify Node.js and npm
where npm >nul 2>nul
if errorlevel 1 (
    color 0C
    echo [ERROR] Node.js and npm were not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: 2. Auto-install dependencies if node_modules is missing
if not exist "node_modules\" (
    echo [*] First-time setup: installing dependencies (npm install)...
    echo     Please wait a moment...
    echo.
    call npm install
    if errorlevel 1 (
        color 0C
        echo.
        echo [ERROR] npm install encountered an error.
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully!
    echo.
)

:: 3. Open browser after short delay in background
echo [*] Launching browser at http://localhost:4321...
start "" cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:4321"

:: 4. Start Astro local dev server
echo [*] Starting Astro Web Server...
echo     Press Ctrl+C anytime to stop the server.
echo ============================================================
echo.
call npm run dev

pause

