# Post-start L3 multi-identity closure smoke (① local · Step 6p).
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6p L3 multi-identity smoke"
    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-multi-identity-closure-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6p - Matrix C1 multi-demo@test.com L3 multi-identity closure smoke API_BASE=$apiBase"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && bash scripts/dev/smoke-multi-identity-closure-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-multi-identity-closure-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: Step 6p matrix C1 multi-demo - smoke-multi-identity-closure-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: Step 6p matrix C1 multi-demo four-track (TT_L3_MULTI_IDENTITY_SMOKE)"
exit 0
