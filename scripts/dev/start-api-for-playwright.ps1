# Playwright: start traveltrust-api from repo root (default :8080). See start-api-for-playwright.sh.
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root
if (-not $env:SEED_TEST_ACCOUNTS) { $env:SEED_TEST_ACCOUNTS = "1" }
# Do not default P3_CHAIN_OFF=1 here — it would override root `.env` before `dotenv` (Sepolia / chain-on E2E needs 0).
if (-not $env:API_RATE_LIMIT_PER_MINUTE) { $env:API_RATE_LIMIT_PER_MINUTE = "0" }
if (-not $env:CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE) { $env:CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE = "0" }
if ($env:API_PORT) {
    $env:PORT = $env:API_PORT
} elseif (-not $env:PORT -or $env:PORT -eq "3012" -or $env:PORT -eq "3000") {
    $env:PORT = if ($env:PLAYWRIGHT_API_PORT) { $env:PLAYWRIGHT_API_PORT } else { "8080" }
}
# 勿直接跑旧 exe，否则 API 代码改动后 E2E 仍用陈旧二进制；统一 cargo run 增量编译。
& cargo run -p traveltrust-api
