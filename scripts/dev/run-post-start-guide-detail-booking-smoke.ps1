# Post-start GD-L5 guide detail booking smoke (① local · tourist@test.com · /guides/[id] parity).
# Prerequisite: TRAVELTRUST_POST_START_GUIDE_DETAIL_BOOKING_SMOKE=1 should run Step 4b DB clear before API start.
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6l GD-L5 guide detail booking smoke"
    Write-Host "       Run manually: RESTART_API=0 SKIP_PLAYWRIGHT=1 API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-guide-detail-booking-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6l - GD-L5 guide detail booking smoke API_BASE=$apiBase (RESTART_API=0 SKIP_PLAYWRIGHT=1)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' RESTART_API=0 SKIP_PLAYWRIGHT=1 && bash scripts/dev/smoke-guide-detail-booking-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-guide-detail-booking-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-guide-detail-booking-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-guide-detail-booking-local (TT_GD_L5_BOOKING_SMOKE)"
exit 0
