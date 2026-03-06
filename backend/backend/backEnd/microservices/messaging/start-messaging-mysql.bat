@echo off
title Messaging - SmartLingua (MySQL, port 8092)
cd /d "%~dp0"
echo Demarrage du microservice Messaging avec MySQL...
echo Assure-toi que MySQL est demarré et que la base smartlingua_messaging existe.
echo (Sinon lance create-mysql-database.bat une fois.)
echo.
call mvnw.cmd spring-boot:run
pause
