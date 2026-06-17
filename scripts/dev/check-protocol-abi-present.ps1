# Fast gate: canonical protocol + governance ABIs under contracts/abi (① local).
# Usage: powershell -File scripts/dev/check-protocol-abi-present.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$abiDir = Join-Path $Root "contracts\abi"
# Subset of sync-abi-from-forge.sh — protocol convergence + governance stack
$required = @(
    "Escrow", "EscrowFactory", "GuideIdentityStakingPool", "ProviderIdentityStakingPool", "Registry",
    "FeeRouter", "RegionVault", "GovernanceTimelock", "GovernanceTreasury", "GovernanceVotesToken",
    "TravelTrustGovernor", "RegionStewardStakePool", "CountryPoolSubVaultsV0", "CountryPoolRedemptionEpochV0",
    "CountryPoolNetProfitLedger", "StewardPathVault", "UnallocatedStewardPathVault"
)
$missing = @()
foreach ($f in $required) {
    $name = if ($f.EndsWith(".json")) { $f } else { "$f.json" }
    if (-not (Test-Path -LiteralPath (Join-Path $abiDir $name))) { $missing += $name }
}
if ($missing.Count -gt 0) {
    Write-Host "check-protocol-abi-present: FAIL missing contracts/abi/$($missing -join ', ')" -ForegroundColor Red
    Write-Host "  Fix: set TRAVELTRUST_ABI_SYNC_FROM_FORGE=1 and re-run start-api-with-seed, or:" -ForegroundColor Yellow
    Write-Host "       cd contracts && forge build && powershell -File scripts/dev/sync-abi-from-forge.ps1" -ForegroundColor Yellow
    exit 1
}
Write-Host "check-protocol-abi-present: OK protocol + governance ABIs ($($required.Count) contracts)"
exit 0
