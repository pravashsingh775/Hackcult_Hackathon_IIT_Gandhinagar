@echo off
setlocal
title Smart Bijuka Launcher
cd /d "%~dp0"
color 0B

:menu
cls
echo ============================================================
echo    SMART BIJUKA - AI & IoT Crop Protection [Launcher v2.0]
echo ============================================================
echo.
echo   [1] Run AI Desktop Dashboard      (Python + YOLOv8 + Tkinter)
echo   [2] Run Modern Web Portal         (Astro + React + Tailwind)
echo   [3] Install Python Dependencies   (pip install)
echo   [4] Install Web Dependencies      (npm install)
echo   [5] Open Detections Folder
echo   [6] Open Research Docs            (Paper, Report, Presentation)
echo   [7] Open Demo Videos
echo   [8] Open Firmware                 (ESP8266 Arduino Source)
echo   [9] Open GitHub Repository
echo   [0] Exit
echo.
set "choice="
set /p choice="  Select option: "

if "%choice%"=="1" goto run_app
if "%choice%"=="2" goto run_web
if "%choice%"=="3" goto install_py
if "%choice%"=="4" goto install_web
if "%choice%"=="5" goto detections
if "%choice%"=="6" goto docs
if "%choice%"=="7" goto demo
if "%choice%"=="8" goto firmware
if "%choice%"=="9" goto github
if "%choice%"=="0" exit /b
goto menu

:run_app
echo.
echo [*] Starting Smart Bijuka AI Monitoring Dashboard...
where python >nul 2>nul || (echo [!] Python not found in PATH. & pause & goto menu)
python "software\src\app.py"
if errorlevel 1 (
    echo.
    echo [!] The app exited with an error.
    echo     Try option [3] to install dependencies first.
)
echo.
pause
goto menu

:run_web
echo.
echo [*] Starting Smart Bijuka Modern Web Dashboard...
cd /d "%~dp0software\Smart_Bijuka_Website"
where npm >nul 2>nul || (echo [!] Node.js / npm not found in PATH. & pause & cd /d "%~dp0" & goto menu)
if not exist "node_modules" (
    echo [*] Installing web dependencies first...
    call npm install
)
echo [*] Launching Astro Dev Server at http://localhost:4321
start "" "http://localhost:4321"
call npm run dev
cd /d "%~dp0"
goto menu

:install_py
echo.
echo [*] Installing Python dependencies...
python -m pip install --upgrade pip
pip install -r "requirements.txt"
echo.
echo [OK] Done.
pause
goto menu

:install_web
echo.
echo [*] Installing Node.js dependencies for Web Portal...
cd /d "%~dp0software\Smart_Bijuka_Website"
call npm install
cd /d "%~dp0"
echo.
echo [OK] Done.
pause
goto menu

:detections
if not exist "software\detections" mkdir "software\detections"
start "" explorer "software\detections"
goto menu

:docs
start "" explorer "docs"
goto menu

:demo
start "" explorer "assets\demo"
goto menu

:firmware
start "" explorer "firmware"
goto menu

:github
start "" "https://github.com/pravashsingh775/Smart-Bijuka-AI-IoT-Crop-Protection"
goto menu
