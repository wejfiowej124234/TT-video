<#
.SYNOPSIS
  手测前环境整理：停 API/前端、清 Next/Turbopack/Playwright 产物、可选清库与 cargo clean，最后跑 preflight。

.DESCRIPTION
  在仓库根执行效果最佳。默认**不**删 Docker 卷、**不** cargo clean（避免全量重编译）。
  清库会丢失全部本地数据，仅在你确认要「全新库 + 自注册」时使用 -ResetDockerDb。

.PARAMETER ResetDockerDb
  docker compose down -v 后 up -d（清空 Postgres 数据卷）。

.PARAMETER CargoCleanApi
  cargo clean -p traveltrust-api（下次启动需完整重编译 API）。

.PARAMETER NoStopProcesses
  不调用 stop-api-thorough（若已手动停服务）。

.PARAMETER NoFrontendClean
  不执行 npm run clean、不删 .turbo / Playwright 报告目录。

.PARAMETER SkipPreflight
  末尾不跑 preflight-local-stack.ps1。

.PARAMETER NpmInstall
  在 frontend 目录强制执行 npm install（锁依赖、修缺包）。
#>
[CmdletBinding()]
param(
    [switch]$ResetDockerDb,
    [switch]$CargoCleanApi,
    [switch]$NoStopProcesses,
    [switch]$NoFrontendClean,
    [switch]$SkipPreflight,
    [switch]$NpmInstall
)

$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location -LiteralPath $repoRoot

Write-Host "======== TravelTrust: prepare local manual test ========"
Write-Host "Repo: $repoRoot"

if (-not $NoStopProcesses) {
    $stop = Join-Path $repoRoot "scripts\dev\stop-api-thorough.ps1"
    Write-Host "Stopping API :8080 and frontend :3012 ..."
    & powershell -NoProfile -ExecutionPolicy Bypass -File $stop -ApiPort 8080 -AlsoFrontend -FrontendPort 3012
}

if (-not $NoFrontendClean) {
    $fe = Join-Path $repoRoot "frontend"
    if (Test-Path (Join-Path $fe "package.json")) {
        Push-Location $fe
        Write-Host "frontend: npm run clean (.next) ..."
        npm run clean
        if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm run clean failed" }
        $nm = Join-Path $fe "node_modules"
        if ($NpmInstall -or -not (Test-Path -LiteralPath $nm)) {
            Write-Host "frontend: npm install ..."
            npm install
            if ($LASTEXITCODE -ne 0) { Pop-Location; throw "npm install failed" }
        }
        Pop-Location
    }
    foreach ($rel in @("frontend\.turbo", "frontend\test-results", "frontend\playwright-report")) {
        $p = Join-Path $repoRoot $rel
        if (Test-Path -LiteralPath $p) {
            Write-Host "Removing $rel ..."
            Remove-Item -LiteralPath $p -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
}

if ($ResetDockerDb) {
    Write-Host "RESET: docker compose down -v && up -d ..."
    docker compose down -v
    if ($LASTEXITCODE -ne 0) { throw "docker compose down -v failed" }
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { throw "docker compose up -d failed" }
}

if ($CargoCleanApi) {
    Write-Host "cargo clean -p traveltrust-api ..."
    cargo clean -p traveltrust-api
    if ($LASTEXITCODE -ne 0) { throw "cargo clean failed" }
}

if (-not $SkipPreflight) {
    $pf = Join-Path $repoRoot "scripts\dev\preflight-local-stack.ps1"
    & powershell -NoProfile -ExecutionPolicy Bypass -File $pf
    if ($LASTEXITCODE -ne 0) { throw "preflight failed" }
}

Write-Host ""
Write-Host "======== prepare done ========"
Write-Host "Next: run from repo root: scripts\start-api-with-seed.bat"
Write-Host "Then: http://localhost:3012/auth/register  OR seed tourist@test.com / Test123!"
Write-Host "Doc:  docs/测试账号与本地联调.md"
exit 0
