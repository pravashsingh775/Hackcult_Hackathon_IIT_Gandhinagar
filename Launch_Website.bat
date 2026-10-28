@echo off
setlocal
title Smart Bijuka Web Portal
cd /d "%~dp0"
color 0B

echo ============================================================
echo      SMART BIJUKA - AI ^& IoT Web Portal [1-Click Launch]
echo ============================================================
echo.

:: 1. Verify Node.js and npm
where npm >nul 2>nul
if errorlevel 1 goto missing_node

:: 2. Install website dependencies if needed
cd /d "%~dp0software\Smart_Bijuka_Website"
if exist "node_modules" goto dependencies_ready
echo [*] First-time setup: installing website dependencies...
call npm install
if errorlevel 1 goto install_failed

:: 3. Auto-start FastAPI AI Backend if not running (Minimized window)
:dependencies_ready
curl -s http://127.0.0.1:8000/ >nul 2>nul
if not errorlevel 1 goto backend_running
echo [*] Starting FastAPI AI Backend in background (Port 8000)...
start "Smart Bijuka AI Backend" /min /D "%~dp0software\backend" python -m uvicorn main:app --host 127.0.0.1 --port 8000
goto start_website

:backend_running
echo [OK] FastAPI Backend is already running.

:: 4. Start Web Dev Server and open the browser once it is ready
:start_website
echo [*] Starting Astro Web Server...
echo     Press Ctrl+C anytime to stop the server.
echo ============================================================
echo.
call npm run dev -- --open

pause
exit /b

:missing_node
color 0C
echo [ERROR] Node.js and npm were not found in your system PATH.
echo Please install Node.js from https://nodejs.org/ and try again.
echo.
pause
exit /b 1

:install_failed
color 0C
echo.
echo [ERROR] npm install encountered an error.
pause
exit /b 1
