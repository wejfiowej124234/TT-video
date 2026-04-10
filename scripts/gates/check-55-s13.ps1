# 55-S13 发版前 API/ABI/端口核对（Windows PowerShell 版）
# 与 check-55-s13.sh 等价；验收：04 §3.4 与 crates/api、frontend routes 一致；ABI 与部署合约版本一致；PORT 与 NEXT_PUBLIC_API_BASE_URL 一致。
# 用法：在项目根执行 .\scripts\check-55-s13.ps1；人工核对项见 55 文档 §九附续.4、15 附录〇。

$ErrorActionPreference = "Stop"
function fail { param($msg) Write-Error "55-S13 CHECK FAIL: $msg"; exit 1 }
function ok { param($msg) Write-Host "55-S13 OK: $msg" }

# 脚本位于 scripts/check-55-s13.ps1，项目根为 scripts 的父目录
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }
Set-Location $rootDir

# --- 1) API 路由
$apiRouter = "crates/api/src/router.rs"
$routesMod = "crates/api/src/routes"
if (-not (Test-Path $apiRouter)) { fail "missing $apiRouter" }
if (-not (Test-Path $routesMod -PathType Container)) { fail "missing $routesMod" }
$routerContent = Get-Content $apiRouter -Raw
if ($routerContent -notmatch "api_router|api/v1") { fail "api_router must mount /api/v1 routes" }
ok "API router and routes dir present"

# --- 2) ABI：目录 + Escrow 关键项 + Staking/Registry 字节一致
if (-not (Test-Path "contracts/abi" -PathType Container)) { fail "missing contracts/abi" }
if (-not (Test-Path "frontend/dapp/abis" -PathType Container)) { fail "missing frontend/dapp/abis" }
$ce = "contracts/abi/Escrow.json"
$fe = "frontend/dapp/abis/Escrow.json"
if (-not (Test-Path $ce)) { fail "missing $ce" }
if (-not (Test-Path $fe)) { fail "missing $fe" }
$ceRaw = Get-Content $ce -Raw
$feRaw = Get-Content $fe -Raw
if ($ceRaw -notmatch "openDispute") { fail "contracts/abi/Escrow.json missing openDispute" }
if ($ceRaw -notmatch "DisputeOpened") { fail "contracts/abi/Escrow.json missing DisputeOpened event" }
if ($feRaw -notmatch "openDispute") { fail "frontend/dapp/abis/Escrow.json missing openDispute" }
ok "ABI dirs present; Escrow canonical + frontend minimal include openDispute"

foreach ($f in @("Staking.json", "Registry.json", "EscrowFactory.json", "FeeRouter.json", "RegionVault.json")) {
    $p1 = "contracts/abi/$f"
    $p2 = "frontend/dapp/abis/$f"
    if (-not (Test-Path $p1)) { fail "missing $p1" }
    if (-not (Test-Path $p2)) { fail "missing $p2" }
    $h1 = (Get-FileHash $p1 -Algorithm SHA256).Hash
    $h2 = (Get-FileHash $p2 -Algorithm SHA256).Hash
    if ($h1 -ne $h2) { fail "ABI drift: $f differs between contracts/abi and frontend/dapp/abis" }
}
ok "Staking/Registry/EscrowFactory/FeeRouter byte-identical (contracts/abi <-> frontend/dapp/abis)"

# --- 3) .env.example
if (-not (Test-Path ".env.example")) { fail "missing .env.example" }
ok "env.example present (manual: PORT and NEXT_PUBLIC_API_BASE_URL consistent across envs)"

# --- 4) 55 关键路由存在（抽样）
$found = $false
Get-ChildItem -Path $routesMod -Filter "*.rs" -Recurse | ForEach-Object {
    $c = Get-Content $_.FullName -Raw
    if ($c -match "discover/orders|/orders|community/feedback|did-rank") { $found = $true }
}
if (-not $found) { fail "expected 55 routes not found in routes/" }
ok "55 key routes registered"

Write-Host ""
Write-Host "55-S13 自动检查通过。发版前请人工执行："
Write-Host "  - 04 §3.4 表与 crates/api 注册路径逐项对照；"
Write-Host "  - frontend 调用的 path 与 04 一致；"
Write-Host "  - ABI 与部署合约版本一致；"
Write-Host "  - 15 附录〇 发版前检查总表勾选。"
