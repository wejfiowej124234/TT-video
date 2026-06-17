# Post-start Phase ①.5 identity demo smoke (provider + steward + guide path; ① local only).
# Usage: powershell -File scripts/dev/run-post-start-phase15-identity-smoke.ps1 -Port 8080
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6j phase15 identity smoke"
    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-phase15-identity-demo-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6j - phase15 identity demo smoke API_BASE=$apiBase (heavy: provider + steward chains)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && bash scripts/dev/smoke-phase15-identity-demo-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-phase15-identity-demo-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-phase15-identity-demo-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-phase15-identity-demo-local"
exit 0
