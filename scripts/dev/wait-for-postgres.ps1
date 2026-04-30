# Wait until Docker Postgres (traveltrust-postgres) accepts connections (pg_isready).
# Usage: powershell -File scripts/dev/wait-for-postgres.ps1 [-MaxAttempts 30] [-IntervalSec 2]
param(
    [string]$ContainerName = "traveltrust-postgres",
    [string]$PgUser = "traveltrust",
    [string]$PgDb = "traveltrust",
    [int]$MaxAttempts = 30,
    [int]$IntervalSec = 2
)
if ($env:WAIT_PG_MAX_ATTEMPTS -match '^\d+$') { $MaxAttempts = [int]$env:WAIT_PG_MAX_ATTEMPTS }
if ($env:WAIT_PG_INTERVAL_SEC -match '^\d+$') { $IntervalSec = [int]$env:WAIT_PG_INTERVAL_SEC }
$ErrorActionPreference = "Continue"
for ($i = 1; $i -le $MaxAttempts; $i++) {
    & docker exec $ContainerName pg_isready -U $PgUser -d $PgDb 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "wait-for-postgres: OK container=$ContainerName ($i attempts)"
        exit 0
    }
    Write-Host "wait-for-postgres: waiting ($i/$MaxAttempts)..."
    Start-Sleep -Seconds $IntervalSec
}
Write-Host "wait-for-postgres: TIMEOUT after $($MaxAttempts * $IntervalSec)s — docker exec $ContainerName pg_isready" -ForegroundColor Red
exit 1
