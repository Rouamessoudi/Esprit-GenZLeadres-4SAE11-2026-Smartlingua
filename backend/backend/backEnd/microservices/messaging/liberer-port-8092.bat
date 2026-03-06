@echo off
setlocal enabledelayedexpansion
REM Executer en tant qu'administrateur (clic droit > Executer en tant qu'administrateur)
REM Libere le port 8092 pour permettre a MessagingApplication de demarrer.

echo Recherche du processus utilisant le port 8092...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8092 ^| findstr LISTENING') do (
  set "PID=%%a"
  echo Processus trouve : PID !PID!
  taskkill /PID !PID! /F
  if !errorlevel! equ 0 (
    echo Port 8092 libere. Vous pouvez relancer MessagingApplication dans IntelliJ.
  ) else (
    echo Echec. Lancez ce script en clic droit ^> Executer en tant qu'administrateur.
  )
  pause
  exit /b 0
)
echo Aucun processus trouve sur le port 8092.
pause
