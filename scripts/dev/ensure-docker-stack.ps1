# Ensure local Docker Postgres (+ MinIO) for start-api-with-seed.
# Reuses running containers when compose "up" hits name conflict.
param(
    [switch]$ResetVolumes
)

$ErrorActionPreference = "Continue"
$root = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
Set-Location $root

if ($ResetVolumes) {
    Write-Host "ensure-docker-stack: RESET volumes (docker compose down -v) ..."
    docker compose down -v 2>$null | Out-Null
    docker compose up -d
    exit $LASTEXITCODE
}

function Test-ContainerRunning([string]$Name) {
    $id = docker ps -q -f "name=^${Name}$" 2>$null
    return [bool]$id
}

if (Test-ContainerRunning "traveltrust-postgres") {
    foreach ($minioName in @("traveltrust-community-minio-evidence", "traveltrust-minio")) {
        if (-not (Test-ContainerRunning $minioName)) {
            docker start $minioName 2>$null | Out-Null
        }
    }
    Write-Host "ensure-docker-stack: OK reuse traveltrust-postgres (already running)"
    exit 0
}

Write-Host "ensure-docker-stack: docker compose up -d ..."
docker compose up -d
if ($LASTEXITCODE -eq 0) {
    exit 0
}

Write-Host "ensure-docker-stack: compose up failed, try docker start on existing containers ..."
docker start traveltrust-postgres 2>$null | Out-Null
docker start traveltrust-community-minio-evidence 2>$null | Out-Null
docker start traveltrust-minio 2>$null | Out-Null
if (Test-ContainerRunning "traveltrust-postgres") {
    Write-Host "ensure-docker-stack: OK started existing traveltrust-postgres"
    exit 0
}

Write-Host "ensure-docker-stack: FAIL no traveltrust-postgres" -ForegroundColor Red
Write-Host "  Fix: docker rm -f traveltrust-postgres traveltrust-minio"
Write-Host "  Then: docker compose up -d"
exit 1
