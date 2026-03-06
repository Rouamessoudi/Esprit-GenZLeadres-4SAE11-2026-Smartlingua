# Pousse la branche feature/messaging vers GitHub
# Usage: .\push-feature-messaging.ps1
#    ou: .\push-feature-messaging.ps1 "https://github.com/TON_USER/TON_REPO.git"

param([string]$RepoUrl = "")

if (-not $RepoUrl) {
    $RepoUrl = Get-Content "c:\pi\GITHUB-URL.txt" -ErrorAction SilentlyContinue
}
if (-not $RepoUrl -or $RepoUrl -match "TON_USER|example") {
    Write-Host "ERREUR: Indique l'URL de ton depot GitHub." -ForegroundColor Red
    Write-Host ""
    Write-Host "Option 1 - Edite le fichier c:\pi\GITHUB-URL.txt et mets une seule ligne :" -ForegroundColor Yellow
    Write-Host "  https://github.com/TON_USERNAME/TON_REPO.git" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 2 - Lance le script avec l'URL :" -ForegroundColor Yellow
    Write-Host "  .\push-feature-messaging.ps1 ""https://github.com/TON_USERNAME/TON_REPO.git""" -ForegroundColor Cyan
    exit 1
}

Set-Location c:\pi
$existing = git remote get-url origin 2>$null
if ($existing) {
    git remote set-url origin $RepoUrl
} else {
    git remote add origin $RepoUrl
}
Write-Host "Push de feature/messaging vers origin..." -ForegroundColor Green
git push -u origin feature/messaging
if ($LASTEXITCODE -eq 0) {
    Write-Host "OK - La branche feature/messaging est sur GitHub." -ForegroundColor Green
} else {
    Write-Host "Si le depot est vide sur GitHub, ca a pu reussir. Sinon, essaie: git push -u origin feature/messaging --force" -ForegroundColor Yellow
}
