# Wait until local Docker MinIO (compose default) answers /minio/health/live on API port 9000.
param(
    [string]$BaseUrl = "http://127.0.0.1:9000/minio/health/live",
    [int]$MaxAttempts = 30,
    [int]$IntervalSec = 2
)
if ($env:WAIT_MINIO_MAX_ATTEMPTS -match '^\d+$') { $MaxAttempts = [int]$env:WAIT_MINIO_MAX_ATTEMPTS }
if ($env:WAIT_MINIO_INTERVAL_SEC -match '^\d+$') { $IntervalSec = [int]$env:WAIT_MINIO_INTERVAL_SEC }
$ErrorActionPreference = "Continue"
for ($i = 1; $i -le $MaxAttempts; $i++) {
    try {
        $r = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($r.StatusCode -eq 200) {
            Write-Host "wait-for-minio: OK $BaseUrl ($i attempts)"
            exit 0
        }
    }
    catch {
        # retry
    }
    Write-Host "wait-for-minio: waiting ($i/$MaxAttempts)..."
    Start-Sleep -Seconds $IntervalSec
}
Write-Host "wait-for-minio: TIMEOUT after $($MaxAttempts * $IntervalSec)s — $BaseUrl" -ForegroundColor Red
exit 1
