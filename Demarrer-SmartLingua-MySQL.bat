@echo off
title SmartLingua - Demarrage avec MySQL (tout en base)
cd /d "%~dp0"

echo ============================================
echo   SmartLingua - MySQL (donnees en base)
echo ============================================
echo.
echo Assure-toi que MySQL est demarre (XAMPP/WAMP ou service).
echo Si c est la premiere fois, lance d abord dans le dossier messaging :
echo   create-mysql-database.bat
echo.

echo [1/2] Demarrage du BACKEND (MySQL, port 8092)...
start "Backend - Messaging (MySQL)" cmd /k "cd /d "%~dp0backend\backEnd\microservices\messaging" && mvnw.cmd spring-boot:run"

echo Attente du demarrage du backend (~40 secondes)...
timeout /t 40 /nobreak >nul

echo [2/2] Demarrage du FRONTEND (port 4200)...
start "Frontend - SmartLingua" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo Attente du frontend (~20 secondes)...
timeout /t 20 /nobreak >nul

echo Ouverture du navigateur...
start http://localhost:4200

echo.
echo ============================================
echo   C est parti !
echo   - Utilisateurs, conversations, messages,
echo     invitations : tout est enregistre dans
echo     la base MySQL smartlingua_messaging.
echo   - Pour voir les donnees : ouvre phpMyAdmin
echo     ou execute VOIR-DONNEES-BASE.sql
echo ============================================
pause
