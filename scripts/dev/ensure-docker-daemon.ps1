# Ensure Docker engine is reachable (Windows: optionally start Docker Desktop and wait).
# Usage: powershell -File scripts/dev/ensure-docker-daemon.ps1 [-WaitSec 120] [-NoAutostart]
# Env: TRAVELTRUST_SKIP_DOCKER_AUTOSTART=1 disables auto-launch of Docker Desktop.

param(
    [int]$WaitSec = 120,
    [switch]$NoAutostart
)

$ErrorActionPreference = "Continue"

function Test-DockerReady {
    docker info 2>$null | Out-Null
    return ($LASTEXITCODE -eq 0)
}

function Start-DockerDesktopIfInstalled {
    if ($NoAutostart -or $env:TRAVELTRUST_SKIP_DOCKER_AUTOSTART -eq "1") { return $false }
    $candidates = @(
        (Join-Path ${env:ProgramFiles} "Docker\Docker\Docker Desktop.exe"),
        (Join-Path ${env:ProgramFiles(x86)} "Docker\Docker\Docker Desktop.exe")
    )
    foreach ($exe in $candidates) {
        if (Test-Path -LiteralPath $exe) {
            Write-Host "ensure-docker-daemon: starting Docker Desktop ($exe) ..."
            Start-Process -FilePath $exe | Out-Null
            return $true
        }
    }
    return $false
}

if (Test-DockerReady) {
    Write-Host "ensure-docker-daemon: OK"
    exit 0
}

$launched = Start-DockerDesktopIfInstalled
if ($launched) {
    Write-Host "ensure-docker-daemon: waiting up to ${WaitSec}s for Docker engine ..."
} else {
    Write-Host "ensure-docker-daemon: Docker engine not ready (autostart skipped or Docker Desktop not found)"
}

$deadline = (Get-Date).AddSeconds([Math]::Max(5, $WaitSec))
while ((Get-Date) -lt $deadline) {
    if (Test-DockerReady) {
        Write-Host "ensure-docker-daemon: OK (engine ready)"
        exit 0
    }
    Start-Sleep -Seconds 2
}

Write-Host "ensure-docker-daemon: FAIL Docker engine not available" -ForegroundColor Red
Write-Host "  Fix: open Docker Desktop manually, wait until 'docker info' succeeds, then re-run start-api-with-seed"
Write-Host "  Skip autostart: set TRAVELTRUST_SKIP_DOCKER_AUTOSTART=1"
exit 1
