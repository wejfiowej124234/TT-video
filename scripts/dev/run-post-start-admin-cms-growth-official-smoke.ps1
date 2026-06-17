# Post-start Admin CMS / Growth / Official OPS smoke (manual QA alignment).
# Usage: powershell -File scripts/dev/run-post-start-admin-cms-growth-official-smoke.ps1 -Port 8080 -FrontendPort 3012
param(
    [int]$Port = 8080,
    [int]$FrontendPort = 3012,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6k admin CMS/Growth/Official smoke"
    Write-Host "       Run manually: bash scripts/dev/smoke-admin-cms-growth-official-p0-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$feBase = "http://127.0.0.1:$FrontendPort"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6k - admin CMS/Growth/Official smoke API=$apiBase FE=$feBase"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export TRAVELTRUST_API_BASE='$apiBase' TRAVELTRUST_FE_BASE='$feBase' && bash scripts/dev/smoke-admin-cms-growth-official-p0-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-admin-cms-growth-official-p0-local failed exit $($proc.ExitCode) - stack still up"
        exit 0
    }
    Write-Host "FAIL: smoke-admin-cms-growth-official-p0-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-admin-cms-growth-official-p0-local"
exit 0
