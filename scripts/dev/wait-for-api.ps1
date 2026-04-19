# Poll http://127.0.0.1:<port>/health until HTTP 200 or timeout.
# Usage: powershell -File scripts/dev/wait-for-api.ps1 [-Port 8080] [-MaxAttempts 60] [-IntervalSec 2]
param(
    [int]$Port = 8080,
    [int]$MaxAttempts = 90,
    [int]$IntervalSec = 2,
    [string]$HealthPath = "/health"
)
if ($env:WAIT_API_MAX_ATTEMPTS -match '^\d+$') { $MaxAttempts = [int]$env:WAIT_API_MAX_ATTEMPTS }
if ($env:WAIT_API_INTERVAL_SEC -match '^\d+$') { $IntervalSec = [int]$env:WAIT_API_INTERVAL_SEC }
$ErrorActionPreference = "Continue"
$uri = "http://127.0.0.1:$Port$HealthPath"
for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "wait-for-api: OK $uri ($i attempts)"
            exit 0
        }
    }
    catch {
        # retry
    }
    Write-Host "wait-for-api: waiting ($i/$MaxAttempts)..."
    Start-Sleep -Seconds $IntervalSec
}
Write-Host "wait-for-api: TIMEOUT after $($MaxAttempts * $IntervalSec)s — $uri" -ForegroundColor Red
exit 1
