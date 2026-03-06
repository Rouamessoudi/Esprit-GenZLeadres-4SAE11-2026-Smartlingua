@echo off
title Messaging - SmartLingua (port 8092)
cd /d "%~dp0"
echo Demarrage du microservice Messaging sur le port 8092...
echo Base de donnees : MySQL (smartlingua_messaging). Demarre XAMPP MySQL avant.
echo.
call mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=dev"
pause
