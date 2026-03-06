@echo off
title Creer la base MySQL - SmartLingua Messaging
cd /d "%~dp0"
echo Creation de la base smartlingua_messaging dans MySQL...
echo.

REM Essai avec mysql en ligne de commande (XAMPP, WAMP, ou MySQL installe)
set MYSQL_CMD=
where mysql.exe >nul 2>&1 && set MYSQL_CMD=mysql.exe
if "%MYSQL_CMD%"=="" if exist "C:\xampp\mysql\bin\mysql.exe" set MYSQL_CMD=C:\xampp\mysql\bin\mysql.exe
if "%MYSQL_CMD%"=="" if exist "C:\wamp64\bin\mysql\mysql8.2.0\bin\mysql.exe" set MYSQL_CMD=C:\wamp64\bin\mysql\mysql8.2.0\bin\mysql.exe
if "%MYSQL_CMD%"=="" if exist "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" set MYSQL_CMD=C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe

if "%MYSQL_CMD%"=="" (
  echo MySQL en ligne de commande introuvable.
  echo.
  echo Fais la creation a la main :
  echo 1. Ouvre phpMyAdmin ou MySQL Workbench.
  echo 2. Execute le fichier create-database.sql
  echo    ou copie-colle :
  echo    CREATE DATABASE IF NOT EXISTS smartlingua_messaging
  echo      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  echo.
  type create-database.sql
  pause
  exit /b 0
)

"%MYSQL_CMD%" -u root -e "CREATE DATABASE IF NOT EXISTS smartlingua_messaging CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if %ERRORLEVEL% neq 0 (
  echo.
  echo Si mot de passe root requis, lance :
  echo "%MYSQL_CMD%" -u root -p ^< create-database.sql
  echo.
  pause
  exit /b 1
)

echo Base smartlingua_messaging creee avec succès.
echo Tu peux lancer le backend avec start-messaging-mysql.bat
pause
exit /b 0
