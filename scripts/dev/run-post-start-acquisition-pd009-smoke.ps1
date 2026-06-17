# Post-start acquisition PD-009 API smoke (① local · publish bond → listing → mock-pay → /me trust).
# Usage: powershell -File scripts/dev/run-post-start-acquisition-pd009-smoke.ps1 -Port 8080
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6h acquisition PD-009 smoke"
    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-acquisition-pd009-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6h - acquisition PD-009 smoke API_BASE=$apiBase (requires P3_CHAIN_OFF=1 + DATABASE_URL + PG)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && bash scripts/dev/smoke-acquisition-pd009-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-acquisition-pd009-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-acquisition-pd009-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-acquisition-pd009-local"
exit 0
