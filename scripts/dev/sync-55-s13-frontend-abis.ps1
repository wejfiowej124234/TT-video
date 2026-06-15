# Copy 55-S13 byte-identical subset: contracts/abi -> frontend/dapp/abis
# Usage (repo root): powershell -File scripts/dev/sync-55-s13-frontend-abis.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$abiDir = Join-Path $Root "contracts\abi"
$feDir = Join-Path $Root "frontend\dapp\abis"
$files = @(
    "GuideIdentityStakingPool.json",
    "ProviderIdentityStakingPool.json",
    "Registry.json",
    "EscrowFactory.json",
    "FeeRouter.json",
    "RegionVault.json",
    "Escrow.json",
    "InvestorDistributionClaim.json"
)
if (-not (Test-Path -LiteralPath $abiDir)) { throw "sync-55-s13-frontend-abis: missing contracts/abi" }
if (-not (Test-Path -LiteralPath $feDir)) { throw "sync-55-s13-frontend-abis: missing frontend/dapp/abis" }
foreach ($f in $files) {
    $src = Join-Path $abiDir $f
    $dst = Join-Path $feDir $f
    if (-not (Test-Path -LiteralPath $src)) { throw "sync-55-s13-frontend-abis: missing contracts/abi/$f" }
    Copy-Item -LiteralPath $src -Destination $dst -Force
}
Write-Host "sync-55-s13-frontend-abis: copied $($files.Count) files to frontend/dapp/abis"
exit 0
