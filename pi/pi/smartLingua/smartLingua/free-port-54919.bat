@echo off
echo Liberation du port 54919...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :54919 ^| findstr LISTENING') do (
    echo Processus trouve: %%a
    taskkill /F /PID %%a
    echo Port libere.
    goto :done
)
echo Aucun processus n'utilise le port 54919.
:done
pause
