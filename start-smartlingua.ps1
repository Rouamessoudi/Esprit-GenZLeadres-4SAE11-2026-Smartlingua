# Demarre le stack SmartLingua : Messaging (8094) + AI (8095) + Angular (4200), ouvre le navigateur.
# MySQL (XAMPP port 3306) doit etre demarre — configuration JDBC uniquement MySQL (plus de H2).

$ErrorActionPreference = "Continue"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $RepoRoot) { $RepoRoot = "c:\pi" }

$Messaging = Join-Path $RepoRoot "backend\backend\backEnd\microservices\messaging"
$AiAssistant = Join-Path $RepoRoot "backend\backend\backEnd\microservices\ai-assistant-service"
$Angular = Join-Path $RepoRoot "smartLingua\smartLingua"
$Mvnw = Join-Path $Messaging "mvnw.cmd"
$MvnwAi = Join-Path $AiAssistant "mvnw.cmd"

function Test-PortListening([int]$Port) {
    $txt = (netstat -ano 2>$null | Out-String)
    # Ex. "TCP    0.0.0.0:8094 ... LISTENING"
    return $txt -match ":$Port\s+[^\r\n]*LISTENING"
}

function Wait-Url([string]$Url, [int]$Seconds = 120) {
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $Seconds) {
        try {
            $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
            if ($r.StatusCode -eq 200) { return $true }
        } catch { }
        Start-Sleep -Milliseconds 400
    }
    return $false
}

Write-Host "=== SmartLingua : demarrage ===" -ForegroundColor Cyan

# 1) Messaging
if (-not (Test-PortListening 8094)) {
    if (-not (Test-Path $Mvnw)) {
        Write-Host "ERREUR: mvnw introuvable : $Mvnw" -ForegroundColor Red
        exit 1
    }
    Write-Host "Demarrage Messaging (port 8094) dans une nouvelle fenetre..." -ForegroundColor Yellow
    Start-Process powershell -WorkingDirectory $Messaging -ArgumentList @(
        "-NoExit", "-Command",
        "Write-Host 'Messaging Spring Boot (8094)...' -ForegroundColor Green; .\mvnw.cmd -q -DskipTests spring-boot:run"
    )
    Write-Host "Attente API /api/auth/health ..."
    if (-not (Wait-Url "http://localhost:8094/api/auth/health" 150)) {
        Write-Host "ATTENTION: Messaging ne repond pas encore. Verifie la fenetre Maven." -ForegroundColor Yellow
    } else {
        Write-Host "Messaging OK." -ForegroundColor Green
    }
} else {
    Write-Host "Port 8094 deja utilise -> Messaging considere comme demarre." -ForegroundColor Green
}

# 1b) AI Assistant (Gemini) — port 8095
if (-not (Test-PortListening 8095)) {
    if (-not (Test-Path $MvnwAi)) {
        Write-Host "ATTENTION: ai-assistant-service introuvable : $MvnwAi" -ForegroundColor Yellow
    } else {
        Write-Host "Demarrage AI Assistant (port 8095) dans une nouvelle fenetre..." -ForegroundColor Yellow
        Start-Process powershell -WorkingDirectory $AiAssistant -ArgumentList @(
            "-NoExit", "-Command",
            "Write-Host 'AI Assistant Spring Boot (8095)...' -ForegroundColor Green; .\mvnw.cmd -q -DskipTests spring-boot:run"
        )
        Write-Host "Attente actuator /actuator/health ..."
        if (-not (Wait-Url "http://localhost:8095/actuator/health" 150)) {
            Write-Host "ATTENTION: AI Assistant ne repond pas encore. Configure GEMINI_API_KEY ou application-secrets.properties." -ForegroundColor Yellow
        } else {
            Write-Host "AI Assistant OK." -ForegroundColor Green
        }
    }
} else {
    Write-Host "Port 8095 deja utilise -> AI Assistant considere comme demarre." -ForegroundColor Green
}

# 2) Angular
if (-not (Test-PortListening 4200)) {
    if (-not (Test-Path (Join-Path $Angular "package.json"))) {
        Write-Host "ERREUR: Angular introuvable : $Angular" -ForegroundColor Red
        exit 1
    }
    if (-not (Test-Path (Join-Path $Angular "node_modules"))) {
        Write-Host "npm install (premiere fois)..." -ForegroundColor Yellow
        Push-Location $Angular
        npm install
        Pop-Location
    }
    Write-Host "Demarrage Angular (port 4200) dans une nouvelle fenetre..." -ForegroundColor Yellow
    Start-Process powershell -WorkingDirectory $Angular -ArgumentList @(
        "-NoExit", "-Command",
        "Write-Host 'Angular ng serve (4200)...' -ForegroundColor Green; npm run start -- --host 127.0.0.1 --port 4200"
    )
    Write-Host "Attente http://127.0.0.1:4200/ ..."
    if (-not (Wait-Url "http://127.0.0.1:4200/" 180)) {
        Write-Host "ATTENTION: Angular ne repond pas encore. Verifie la fenetre npm." -ForegroundColor Yellow
    } else {
        Write-Host "Angular OK." -ForegroundColor Green
    }
} else {
    Write-Host "Port 4200 deja utilise -> Angular considere comme demarre." -ForegroundColor Green
}

# 3) Navigateur
$login = "http://127.0.0.1:4200/login"
Write-Host "Ouverture du navigateur : $login" -ForegroundColor Cyan
Start-Process $login

Write-Host "`nTermine. Pages utiles :" -ForegroundColor Cyan
Write-Host "  Login     $login"
Write-Host "  Inscription http://127.0.0.1:4200/register"
Write-Host "  API sante http://localhost:8094/api/auth/health"
Write-Host "  AI (actuator) http://localhost:8095/actuator/health"
