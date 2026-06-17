# Post-start Chain B seed tourist+guide full transaction smoke (① local · Step 6o).
param(
    [int]$Port = 8080,
    [int]$FrontendPort = 3012,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6o seed transaction smoke"
    Write-Host "       Run manually: RESTART_API=0 API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-seed-tourist-guide-transaction-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$feBase = "http://127.0.0.1:$FrontendPort"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6o - Chain B seed transaction smoke API_BASE=$apiBase FE=$feBase (RESTART_API=0)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' PLAYWRIGHT_BASE_URL='$feBase' RESTART_API=0 && bash scripts/dev/smoke-seed-tourist-guide-transaction-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-seed-tourist-guide-transaction-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-seed-tourist-guide-transaction-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-seed-tourist-guide-transaction-local (TT_SEED_TRANSACTION_SMOKE)"
exit 0
