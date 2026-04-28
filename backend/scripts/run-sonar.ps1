param(
    [string]$SonarHostUrl = $env:SONAR_HOST_URL,
    [string]$SonarToken = $env:SONAR_TOKEN
)

if ([string]::IsNullOrWhiteSpace($SonarHostUrl) -or [string]::IsNullOrWhiteSpace($SonarToken)) {
    Write-Error "SONAR_HOST_URL et SONAR_TOKEN doivent etre definis."
    exit 1
}

$services = @(
    "apiGateway",
    "config-server",
    "eureka",
    "microservices/users",
    "microservices/quiz",
    "microservices/privetcours",
    "microservices/messaging",
    "microservices/forum",
    "microservices/exams",
    "microservices/courses",
    "microservices/ai-assistant-service",
    "microservices/adaptive-learning"
)

foreach ($service in $services) {
    Write-Host "Running SonarQube for $service"
    Push-Location (Join-Path $PSScriptRoot ".." $service)
    mvn clean verify sonar:sonar "-Dsonar.host.url=$SonarHostUrl" "-Dsonar.token=$SonarToken"
    if ($LASTEXITCODE -ne 0) {
        Pop-Location
        exit $LASTEXITCODE
    }
    Pop-Location
}

Write-Host "SonarQube analysis completed for all backend services."
