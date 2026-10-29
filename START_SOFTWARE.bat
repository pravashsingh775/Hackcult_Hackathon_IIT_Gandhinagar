@echo off
setlocal
title Smart Bijuka Software Launcher

set "LAUNCHER=%~dp0software\Software.bat"
if not exist "%LAUNCHER%" (
    color 0C
    echo [ERROR] Software launcher not found:
    echo         "%LAUNCHER%"
    echo.
    pause
    exit /b 1
)

call "%LAUNCHER%"
exit /b %errorlevel%
