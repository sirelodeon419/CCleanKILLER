@echo off
title CCleanKILLER - Bloatware Removal Tool
color 0C

echo.
echo   ██████╗ ██████╗██╗     ███████╗ █████╗ ███╗   ██╗
echo  ██╔════╝██╔════╝██║     ██╔════╝██╔══██╗████╗  ██║
echo  ██║     ██║     ██║     █████╗  ███████║██╔██╗ ██║
echo  ██║     ██║     ██║     ██╔══╝  ██╔══██║██║╚██╗██║
echo  ╚██████╗╚██████╗███████╗███████╗██║  ██║██║ ╚████║
echo   ╚═════╝ ╚═════╝╚══════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝
echo   ██╗  ██╗██╗██╗     ██╗     ███████╗██████╗
echo   ██║ ██╔╝██║██║     ██║     ██╔════╝██╔══██╗
echo   █████╔╝ ██║██║     ██║     █████╗  ██████╔╝
echo   ██╔═██╗ ██║██║     ██║     ██╔══╝  ██╔══██╗
echo   ██║  ██╗██║███████╗███████╗███████╗██║  ██║
echo   ╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚══════╝╚═╝  ╚═╝
echo.
echo   Nuke the bloatware.
echo.
echo ═══════════════════════════════════════════════════════
echo.

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo   [!] This tool requires Administrator privileges.
    echo   [*] Relaunching as Administrator...
    echo.
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo   [✓] Running as Administrator
echo.

:: Start the local HTTP bridge server
echo   [*] Starting local bridge server on port 8765...
start /b powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" >nul 2>&1

:: Wait for server to start
timeout /t 2 /nobreak >nul

:: Open the UI
echo   [*] Launching CCleanKILLER UI...
echo.
start "" "%~dp0index.html"

echo   [✓] CCleanKILLER is running.
echo   [*] Close this window to stop the background server.
echo.
echo ═══════════════════════════════════════════════════════
echo   Press any key to stop the server and exit...
pause >nul

:: Kill the server
taskkill /f /im powershell.exe /fi "WINDOWTITLE eq CCleanKILLER-Server" >nul 2>&1
