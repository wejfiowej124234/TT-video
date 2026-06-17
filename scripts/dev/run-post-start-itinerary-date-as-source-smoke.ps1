# Post-start itinerary-date-as-source busy-guide API smoke (Phase 1 local only).
# Usage: powershell -File scripts/dev/run-post-start-itinerary-date-as-source-smoke.ps1 -Port 8080
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6m itinerary-date-as-source smoke"
    Write-Host "       Run manually: bash scripts/dev/smoke-itinerary-date-as-source-busy-guide-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6m - itinerary-date-as-source busy-guide smoke API_BASE=$apiBase"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && bash scripts/dev/smoke-itinerary-date-as-source-busy-guide-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-itinerary-date-as-source-busy-guide-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-itinerary-date-as-source-busy-guide-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-itinerary-date-as-source-busy-guide-local"
exit 0
