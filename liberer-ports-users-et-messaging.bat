@echo off
setlocal enabledelayedexpansion
REM ============================================================
REM Liberer les ports 8087 (Users) et 8092 (Messaging)
REM Clic droit > Executer en tant qu'administrateur
REM ============================================================

echo.
echo Liberation des ports 8087 et 8092 pour Users et Messaging...
echo.

set FOUND=0

REM Port 8087 (UsersApplication)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8087 ^| findstr LISTENING') do (
  set "PID=%%a"
  echo [8087] Arret du processus PID !PID! (Users)...
  taskkill /PID !PID! /F 2>nul
  if !errorlevel! equ 0 (echo        Port 8087 libere.) else (echo        Echec - lancez en administrateur.)
  set FOUND=1
  goto :done8087
)
:done8087

REM Port 8092 (MessagingApplication)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8092 ^| findstr LISTENING') do (
  set "PID=%%a"
  echo [8092] Arret du processus PID !PID! (Messaging)...
  taskkill /PID !PID! /F 2>nul
  if !errorlevel! equ 0 (echo        Port 8092 libere.) else (echo        Echec - lancez en administrateur.)
  set FOUND=1
  goto :done8092
)
:done8092

echo.
echo Termine. Vous pouvez relancer UsersApplication et MessagingApplication dans IntelliJ.
echo.
pause
