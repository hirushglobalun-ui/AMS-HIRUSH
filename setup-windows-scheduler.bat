@echo off
echo =========================================================
echo Setting up Daily Automatic Domain Checker Task at 1:00 AM
echo =========================================================

schtasks /create /tn "Hirush_AMS_Domain_Checker" /tr "node \"%~dp0scripts\auto-domain-checker.js\"" /sc daily /st 01:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo SUCCESS: Windows Task Scheduler has been configured!
    echo Every day at 1:00 AM, the domain check and email alerts will run automatically.
) else (
    echo.
    echo ERROR: Failed to create Task. Please right-click setup-windows-scheduler.bat and select 'Run as Administrator'.
)
pause
