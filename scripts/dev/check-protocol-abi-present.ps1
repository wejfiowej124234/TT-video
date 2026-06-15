# Fast gate: protocol convergence canonical ABIs exist under contracts/abi (① local).
# Usage: powershell -File scripts/dev/check-protocol-abi-present.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$abiDir = Join-Path $Root "contracts\abi"
$required = @(
    "RegionStewardStakePool.json",
    "CountryPoolSubVaultsV0.json",
    "CountryPoolRedemptionEpochV0.json"
)
$missing = @()
foreach ($f in $required) {
    if (-not (Test-Path -LiteralPath (Join-Path $abiDir $f))) { $missing += $f }
}
if ($missing.Count -gt 0) {
    Write-Host "check-protocol-abi-present: FAIL missing contracts/abi/$($missing -join ', ')" -ForegroundColor Red
    Write-Host "  Fix: set TRAVELTRUST_ABI_SYNC_FROM_FORGE=1 and re-run start-api-with-seed, or:" -ForegroundColor Yellow
    Write-Host "       cd contracts && forge build && powershell -File scripts/dev/sync-abi-from-forge.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "check-protocol-abi-present: OK RegionStewardStakePool + CountryPoolSubVaultsV0 + CountryPoolRedemptionEpochV0"
exit 0
