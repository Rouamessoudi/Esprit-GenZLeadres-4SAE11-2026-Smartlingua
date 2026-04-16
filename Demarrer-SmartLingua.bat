@echo off
title Demarrage SmartLingua
cd /d "%~dp0"

echo ============================================
echo   SmartLingua - Demarrage en 2 etapes
echo ============================================
echo.

echo [1/2] Ouverture du BACKEND (port 8092)...
start "Backend - Messaging" cmd /k "cd /d "%~dp0backend\backEnd\microservices\messaging" && mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev""

echo [2/2] Attente du demarrage du backend (~30 secondes)...
timeout /t 30 /nobreak >nul

echo Ouverture du FRONTEND (port 4200)...
start "Frontend - SmartLingua" cmd /k "cd /d "%~dp0frontend" && npm start"

echo.
echo Attente du demarrage du frontend (~15 secondes)...
timeout /t 15 /nobreak >nul

echo Ouverture du navigateur...
start http://localhost:4200

echo.
echo ============================================
echo   C est parti !
echo   - Backend : fenetre "Backend - Messaging"
echo   - Frontend : fenetre "Frontend - SmartLingua"
echo   - Ne ferme pas ces 2 fenetres.
echo   - Pour arreter : ferme chaque fenetre.
echo ============================================
pause
