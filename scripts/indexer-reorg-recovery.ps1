# Parity with **indexer-reorg-recovery.sh**：Windows 入口，委托 **Git Bash**（**curl** + **jq**；**INTERNAL_API_SECRET** 与 API 一致）。
# 委托行锚：**bash** **`scripts/indexer-reorg-recovery.sh`**
#
# 用法（项目根）：
#   .\scripts\indexer-reorg-recovery.ps1 status
#   .\scripts\indexer-reorg-recovery.ps1 hint|replay|reconcile|all
#
# 详见 **scripts/indexer-reorg-recovery.sh**、**110** §3.4、**ops/RUNBOOK.md** §2.55。

param(
    [Parameter(Position = 0)]
    [string]$Command = "",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

function Usage {
    Write-Host @"
Usage: indexer-reorg-recovery.ps1 status|hint|replay|reconcile|all

  Delegates to: bash scripts/indexer-reorg-recovery.sh (requires Git Bash).

See scripts/indexer-reorg-recovery.sh and ops/RUNBOOK.md §2.55.
"@ -ForegroundColor Yellow
}

if ($Command -in @("-h", "--help", "help")) {
    Usage
    exit 0
}

if (-not $Command) {
    Usage
    exit 1
}

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "indexer-reorg-recovery.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/indexer-reorg-recovery.sh", $Command) + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
