@echo off
title Keycloak - MySQL
cd /d "%~dp0"

echo ============================================
echo   Keycloak with MySQL
echo ============================================
echo.

REM MySQL connection (adjust if your MySQL runs on different host/port)
set KC_DB_URL=jdbc:mysql://localhost:3306/keycloak?useSSL=false^&allowPublicKeyRetrieval=true^&serverTimezone=UTC
set KC_DB_USERNAME=keycloak_user
set KC_DB_PASSWORD=keycloak_pass

echo Starting Keycloak with MySQL...
echo DB: keycloak @ localhost:3306
echo.

kc.bat start-dev ^
  --db=mysql ^
  --db-url="%KC_DB_URL%" ^
  --db-username="%KC_DB_USERNAME%" ^
  --db-password="%KC_DB_PASSWORD%"

pause
