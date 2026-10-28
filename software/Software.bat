@echo off
setlocal
title Smart Bijuka - Software Launcher
cd /d "%~dp0"
color 0A

:menu
cls
echo ============================================================
echo    SMART BIJUKA - SOFTWARE SECTION   [Launcher v2.0]
echo ============================================================
echo.
echo   [1] Run AI Desktop App           (Python app.py)
echo   [2] Run Web Management Portal    (Astro dev server)
echo   [3] Install Python Dependencies  (pip install)
echo   [4] Install Web Dependencies     (npm install)
echo   [5] Verify Python Modules        (cv2, ultralytics, etc.)
echo   [6] Open Detections Folder
echo   [7] Open Source Code in VS Code
echo   [8] Pre-download YOLOv8 Weights  (yolov8n.pt)
echo   [0] Exit
echo.
set "choice="
set /p choice="  Select option: "

if "%choice%"=="1" goto run_app
if "%choice%"=="2" goto run_web
if "%choice%"=="3" goto install_py
if "%choice%"=="4" goto install_web
if "%choice%"=="5" goto verify
if "%choice%"=="6" goto detections
if "%choice%"=="7" goto vscode
if "%choice%"=="8" goto model
if "%choice%"=="0" exit /b
goto menu

:run_app
echo.
echo [*] Starting Smart Bijuka AI Monitoring Dashboard...
where python >nul 2>nul || (echo [!] Python not found in PATH. & pause & goto menu)
python "src\app.py"
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
echo [*] Starting Smart Bijuka Web Portal...
cd /d "%~dp0Smart_Bijuka_Website"
where npm >nul 2>nul || (echo [!] Node.js / npm not found in PATH. & pause & cd /d "%~dp0" & goto menu)
if not exist "node_modules" (
    echo [*] Installing web dependencies first...
    call npm install
)
echo [*] Opening browser at http://localhost:4321
start "" "http://localhost:4321"
call npm run dev
cd /d "%~dp0"
goto menu

:install_py
echo.
echo [*] Installing Python dependencies...
where python >nul 2>nul || (echo [!] Python not found in PATH. & pause & goto menu)
python -m pip install --upgrade pip
pip install -r "src\requirements.txt"
echo.
echo [OK] All Python dependencies installed.
pause
goto menu

:install_web
echo.
echo [*] Installing Web dependencies...
cd /d "%~dp0Smart_Bijuka_Website"
call npm install
cd /d "%~dp0"
echo.
echo [OK] All Web dependencies installed.
pause
goto menu

:verify
echo.
echo [*] Checking required Python modules...
python -c "import cv2, pygame, PIL, numpy; print('[OK] cv2, pygame, PIL, numpy are installed.')" 2>nul
if errorlevel 1 echo [!] Missing modules - run option [3] first.
python -c "import ultralytics; print('[OK] ultralytics (YOLOv8) is installed.')" 2>nul
if errorlevel 1 echo [!] ultralytics missing - run option [3] first.
echo.
pause
goto menu

:detections
if not exist "detections" mkdir "detections"
start "" explorer "detections"
goto menu

:vscode
where code >nul 2>nul && (code "%~dp0" & goto menu) || (echo [!] VS Code not found in PATH.)
pause
goto menu

:model
echo.
echo [*] Pre-downloading YOLOv8n weights (one-time, ~6 MB)...
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt'); print('[OK] Model ready.')"
echo.
pause
goto menu
