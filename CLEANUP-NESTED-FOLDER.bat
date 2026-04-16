@echo off
title Nettoyage du dossier imbrique pi\pi
echo.
echo IMPORTANT : Ferme d'abord tous les processus qui pourraient utiliser le projet :
echo   - Fenetres CMD/PowerShell avec npm ou mvn
echo   - IntelliJ, VS Code, ou tout IDE ouvert sur le dossier pi\pi
echo   - Serveur Angular (ng serve) ou backend Spring Boot
echo.
echo Appuie sur une touche pour continuer ou Ctrl+C pour annuler...
pause >nul

echo.
echo Suppression du dossier c:\Users\pi\pi ...
rd /s /q "c:\Users\pi\pi" 2>nul
if exist "c:\Users\pi\pi" (
    echo Echec - certains fichiers sont peut-etre encore verrouilles.
    echo Essaie de redemarrer le PC puis relance ce script.
) else (
    echo Succes ! Le dossier imbrique a ete supprime.
)
echo.
pause
