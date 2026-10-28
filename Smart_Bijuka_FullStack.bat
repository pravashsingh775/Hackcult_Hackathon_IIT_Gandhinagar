@echo off
setlocal enabledelayedexpansion
title Smart Bijuka - Full Stack AI Deterrence System
cd /d "%~dp0"
color 0B

echo ============================================================
echo      SMART BIJUKA - FULL STACK AI CROP PROTECTION
echo ============================================================
echo.
echo   [1] Launch Complete System (FastAPI Backend + React Web Dashboard)
echo   [2] Start FastAPI AI Backend Only (Port 8000)
echo   [3] Start React/Astro Web Dashboard Only (Port 4321)
echo   [4] Run Comprehensive Acceptance Tests (7 Test Suites)
echo   [5] Install/Verify All Dependencies (Python + Node.js)
echo   [0] Exit
echo.
set "choice="
set /p choice="  Select option: "

if "%choice%"=="1" goto launch_all
if "%choice%"=="2" goto launch_backend
if "%choice%"=="3" goto launch_frontend
if "%choice%"=="4" goto run_tests
if "%choice%"=="5" goto install_deps
if "%choice%"=="0" exit /b
goto launch_all

:launch_all
echo.
echo [*] Starting FastAPI AI Backend on http://127.0.0.1:8000...
start "Smart Bijuka AI Backend" cmd /k "cd /d "%~dp0software\backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [*] Waiting 3 seconds for AI model initialization...
timeout /t 3 /nobreak >nul

echo [*] Starting Smart Bijuka Web Dashboard...
start "Smart Bijuka Web Dashboard" cmd /k "cd /d "%~dp0software\Smart_Bijuka_Website" && call npm run dev"

echo [*] Opening browser at http://localhost:4321...
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:4321"

echo.
echo [OK] Both services are running in background windows.
echo      - Backend API Docs: http://127.0.0.1:8000/docs
echo      - Web Dashboard:    http://localhost:4321
pause
exit /b

:launch_backend
echo.
echo [*] Starting FastAPI backend...
cd /d "%~dp0software\backend"
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
pause
exit /b

:launch_frontend
echo.
echo [*] Starting React Web Dashboard...
cd /d "%~dp0software\Smart_Bijuka_Website"
start "" cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:4321"
call npm run dev
pause
exit /b

:run_tests
echo.
echo [*] Running Smart Bijuka Automated Acceptance Tests...
python tests/test_acceptance.py
echo.
pause
exit /b

:install_deps
echo.
echo [*] Checking Python dependencies...
python -m pip install -r "software\backend\requirements.txt"
echo [*] Checking Web dependencies...
cd /d "%~dp0software\Smart_Bijuka_Website"
call npm install
echo.
echo [OK] All dependencies verified.
pause
exit /b

