# Parity with **indexer-public-snapshot.sh**：Windows 入口，委托 **Git Bash** 执行 **curl**/**jq** 逻辑（须 **bash**；Bash 环境须能调用 **jq**）。
# 环境变量与 .sh 一致：**API_BASE_URL**、**ADMIN_BEARER_TOKEN**、**INTERNAL_API_SECRET**、**SNAPSHOT_INTERNAL_RECONCILE_RPC**、**SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP**、**SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE**、**SNAPSHOT_INTERNAL_STATUS_LIVE_RECONCILE**、**SNAPSHOT_INTERNAL_INDEXER_TICK**、**SNAPSHOT_INTERNAL_SKIP_RECONCILE**（**`1`** 且已设密钥时**不** **POST …/internal/indexer-reconcile**；**snapshot_options** 内 reconcile 侧 RPC/chain_tip/event_log_coverage 键输出 **`null`**）等。
# 委托行锚：**bash** **`scripts/indexer-public-snapshot.sh`**
#
# 用法（项目根）：
#   .\scripts\indexer-public-snapshot.ps1
#
# 详见 **scripts/indexer-public-snapshot.sh**、**ops/RUNBOOK.md** §2.55。

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if ($RemainingArgs -contains "-h" -or $RemainingArgs -contains "--help" -or $RemainingArgs -contains "help") {
    Write-Host @"
Usage: indexer-public-snapshot.ps1

  Delegates to: bash scripts/indexer-public-snapshot.sh (requires Git Bash, jq).

See scripts/indexer-public-snapshot.sh and ops/RUNBOOK.md §2.55.
"@ -ForegroundColor Yellow
    exit 0
}

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "indexer-public-snapshot.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/indexer-public-snapshot.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
