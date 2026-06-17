# Post-start Web3 itinerary full-chain API smoke (landing 6e + escrow bind 6d · Phase 1 local only).
# Usage: powershell -File scripts/dev/run-post-start-web3-itinerary-full-chain-smoke.ps1 -Port 8080
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6f web3 itinerary full-chain smoke"
    Write-Host "       Run manually: bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6f - web3 itinerary full-chain smoke API_BASE=$apiBase"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-web3-itinerary-full-chain-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-web3-itinerary-full-chain-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-web3-itinerary-full-chain-local (TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE)"
exit 0
