# Post-start /market hub public read smoke (TT-9627 vertical-slice-03 · useMarketPage SSOT).
# Usage: powershell -File scripts/dev/run-post-start-market-hub-smoke.ps1 -Port 8080
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6g market hub smoke"
    Write-Host "       Run manually: BASE=http://127.0.0.1:$Port bash scripts/gates/vertical-slice-03-market-hub-public-smoke.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$base = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6g - market hub public smoke BASE=$base (discover/orders + guides)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export BASE='$base' && bash scripts/gates/vertical-slice-03-market-hub-public-smoke.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: vertical-slice-03-market-hub-public-smoke failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: vertical-slice-03-market-hub-public-smoke exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: vertical-slice-03-market-hub-public-smoke"
exit 0
