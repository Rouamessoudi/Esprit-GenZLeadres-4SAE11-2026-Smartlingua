# ============================================================
# Lancer UsersApplication et MessagingApplication
# Clic droit > Executer avec PowerShell (en tant qu'administrateur)
# ============================================================

$ErrorActionPreference = "Stop"
$backend = "c:\pi\backend\backend\backEnd\microservices"

Write-Host ""
Write-Host "=== Liberation des ports 8087 et 8092 ===" -ForegroundColor Cyan

function Stop-ProcessOnPort {
    param([int]$Port)
    $pids = @{}
    $lines = netstat -ano | Select-String "LISTENING" | Select-String ":$Port\s"
    foreach ($line in $lines) {
        if ($line -match "\s+(\d+)\s*$") {
            $pids[[int]$matches[1]] = $true
        }
    }
    foreach ($pid in $pids.Keys) {
        if ($pid -gt 0) {
            Write-Host "  Arret du processus PID $pid (port $Port)..." -ForegroundColor Yellow
            try {
                Stop-Process -Id $pid -Force -ErrorAction Stop
                Write-Host "  Port $Port libere." -ForegroundColor Green
            } catch {
                Write-Host "  Echec. Lancez ce script en tant qu'administrateur." -ForegroundColor Red
                exit 1
            }
        }
    }
}

Stop-ProcessOnPort -Port 8087
Stop-ProcessOnPort -Port 8092
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=== Demarrage de UsersApplication (port 8087) ===" -ForegroundColor Cyan
$usersPath = Join-Path $backend "users"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$usersPath'; .\mvnw.cmd spring-boot:run" -WindowStyle Normal

Start-Sleep -Seconds 5

Write-Host "=== Demarrage de MessagingApplication (port 8092) ===" -ForegroundColor Cyan
$messagingPath = Join-Path $backend "messaging"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$messagingPath'; .\mvnw.cmd spring-boot:run" -WindowStyle Normal

Write-Host ""
Write-Host "Termine. Deux fenetres PowerShell ont ete ouvertes (Users et Messaging)." -ForegroundColor Green
Write-Host "Attendez 'Started ...Application' dans chaque fenetre avant d'utiliser l'app." -ForegroundColor Green
Write-Host ""
