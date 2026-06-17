# Post-start Identity Center P2 settings API smoke (① local · four profile routes).
# Usage: powershell -File scripts/dev/run-post-start-identity-p2-settings-smoke.ps1 -Port 8080
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6n Identity P2 settings smoke"
    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-identity-p2-settings-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6n - Identity P2 settings smoke API_BASE=$apiBase (guide + acquisition profile GET/PATCH)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && bash scripts/dev/smoke-identity-p2-settings-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-identity-p2-settings-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-identity-p2-settings-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-identity-p2-settings-local"
exit 0
