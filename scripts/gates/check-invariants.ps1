# 与 check-invariants.sh 等价：发版前不变量（工具链锁、前端锁文件、安全头中间件）。
# 用法：在项目根执行 .\scripts\check-invariants.ps1

$ErrorActionPreference = "Stop"
function fail { param($msg) Write-Error "ERROR: $msg"; exit 1 }

# PSScriptRoot = .../scripts/gates → repo root is two levels up
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }
Set-Location $rootDir

if (-not (Test-Path "rust-toolchain.toml" -PathType Leaf)) {
    fail "missing rust-toolchain.toml (toolchain must be pinned)"
}
if (-not (Test-Path "frontend" -PathType Container)) { fail "missing frontend/ (Next.js app root)" }
if (-not (Test-Path "frontend/package.json" -PathType Leaf)) { fail "missing frontend/package.json" }
if (-not (Test-Path "frontend/package-lock.json" -PathType Leaf)) {
    fail "missing frontend/package-lock.json (lock file required)"
}

# B-158: package.json direct deps vs lockfile packages{} (npm v7+); no network.
$verifyLock = Join-Path $PSScriptRoot "verify-frontend-package-lock-sync.mjs"
& node $verifyLock
if ($LASTEXITCODE -ne 0) {
    fail "frontend package-lock drift (B-158); run npm install in frontend/ and commit"
}

$apiMain = "crates/api/src/main.rs"
$apiRouter = "crates/api/src/router.rs"
$apiMwHeaders = "crates/api/src/middleware/auth_pause_metrics/mod.rs"
foreach ($p in @($apiMain, $apiRouter, $apiMwHeaders)) {
    if (-not (Test-Path $p -PathType Leaf)) { fail "missing $p" }
}

$routerContent = Get-Content $apiRouter -Raw
if ($routerContent -notmatch "security_headers_layer") {
    fail "API router missing security_headers_layer middleware"
}
$mwContent = Get-Content $apiMwHeaders -Raw
if ($mwContent -notmatch "x-content-type-options") {
    fail "API security headers missing x-content-type-options"
}

$ssotV2 = Join-Path $PSScriptRoot "ssot-guard-ci-v2.py"
& python $ssotV2
if ($LASTEXITCODE -ne 0) {
    fail "ssot-guard-ci-v2.py failed (see target/ssot-guard-ci-v2-report.json)"
}

Write-Host "OK: invariants passed"
