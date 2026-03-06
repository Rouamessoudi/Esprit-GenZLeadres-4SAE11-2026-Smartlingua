@echo off
REM Demande les droits administrateur puis libere les ports et lance Users + Messaging
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' neq '0' (
    echo Demande des droits administrateur...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    cd /d "c:\pi"
    powershell -ExecutionPolicy Bypass -File ".\RUN-Users-Et-Messaging.ps1"
    pause
