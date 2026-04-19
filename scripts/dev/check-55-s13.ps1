# 55-S13: same automated checks as scripts/gates/check-55-s13.sh (no Git Bash required).
# Run from repo root: powershell -File scripts/dev/check-55-s13.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

function Fail([string]$Msg) {
    Write-Host "55-S13 CHECK FAIL: $Msg" -ForegroundColor Red
    exit 1
}
function Ok([string]$Msg) { Write-Host "55-S13 OK: $Msg" }

$apiRouter = Join-Path $Root "crates\api\src\router.rs"
$routesMod = Join-Path $Root "crates\api\src\routes"
if (-not (Test-Path -LiteralPath $apiRouter)) { Fail "missing crates/api/src/router.rs" }
if (-not (Test-Path -LiteralPath $routesMod)) { Fail "missing crates/api/src/routes" }
$routerTxt = Get-Content -LiteralPath $apiRouter -Raw -Encoding UTF8
if ($routerTxt -notmatch "api_router|api/v1") { Fail "api_router must mount /api/v1 routes" }
Ok "API router and routes dir present"

$abi = Join-Path $Root "contracts\abi"
$fab = Join-Path $Root "frontend\dapp\abis"
if (-not (Test-Path -LiteralPath $abi)) { Fail "missing contracts/abi" }
if (-not (Test-Path -LiteralPath $fab)) { Fail "missing frontend/dapp/abis" }
$escC = Join-Path $abi "Escrow.json"
$escF = Join-Path $fab "Escrow.json"
foreach ($p in @($escC, $escF)) { if (-not (Test-Path -LiteralPath $p)) { Fail "missing $p" } }
$e0 = Get-Content -LiteralPath $escC -Raw -Encoding UTF8
if ($e0 -notmatch "openDispute") { Fail "contracts/abi/Escrow.json missing openDispute" }
if ($e0 -notmatch "DisputeOpened") { Fail "contracts/abi/Escrow.json missing DisputeOpened" }
$e1 = Get-Content -LiteralPath $escF -Raw -Encoding UTF8
if ($e1 -notmatch "openDispute") { Fail "frontend/dapp/abis/Escrow.json missing openDispute" }
Ok "ABI dirs present; Escrow canonical + frontend minimal include openDispute"

$pair = @(
    "GuideIdentityStakingPool.json",
    "ProviderIdentityStakingPool.json",
    "Registry.json",
    "EscrowFactory.json",
    "FeeRouter.json",
    "RegionVault.json"
)
foreach ($f in $pair) {
    $a = Join-Path $abi $f
    $b = Join-Path $fab $f
    if (-not (Test-Path -LiteralPath $a)) { Fail "missing contracts/abi/$f" }
    if (-not (Test-Path -LiteralPath $b)) { Fail "missing frontend/dapp/abis/$f" }
    $ha = (Get-FileHash -Algorithm SHA256 -LiteralPath $a).Hash
    $hb = (Get-FileHash -Algorithm SHA256 -LiteralPath $b).Hash
    if ($ha -ne $hb) { Fail "ABI drift: $f differs (copy contracts/abi -> frontend/dapp/abis)" }
}
Ok "GuideIdentityStakingPool/ProviderIdentityStakingPool/Registry/EscrowFactory/FeeRouter/RegionVault JSON byte-identical"

$envEx = Join-Path $Root ".env.example"
if (-not (Test-Path -LiteralPath $envEx)) { Fail "missing .env.example" }
Ok "env.example present (manual: PORT and NEXT_PUBLIC_API_BASE_URL)"

$pat = "discover/orders|/orders|community/feedback|did-rank"
$hits = Get-ChildItem -Path $routesMod -Filter "*.rs" -Recurse -File -ErrorAction SilentlyContinue |
    Select-String -Pattern $pat -List
if (-not $hits) { Fail "expected 55 routes not found in routes/" }
Ok "55 key routes registered"

Write-Host ""
Write-Host "55-S13 automatic checks passed."
exit 0
