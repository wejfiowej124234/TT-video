# Parity with **indexer-reconcile-probe.sh**：Windows 入口，委托 **Git Bash**（须 **jq**、**INTERNAL_API_SECRET**、内网 **/internal/***）。
# 委托行锚：**bash** **`scripts/indexer-reconcile-probe.sh`**
#
# 用法（项目根）：
#   .\scripts\indexer-reconcile-probe.ps1
#
# 退出码与 **.sh** 一致。详见 **scripts/indexer-reconcile-probe.sh**、**ops/RUNBOOK.md** §2.55。

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if ($RemainingArgs -contains "-h" -or $RemainingArgs -contains "--help" -or $RemainingArgs -contains "help") {
    Write-Host @"
Usage: indexer-reconcile-probe.ps1 [--ops-artifact]

  Delegates to: bash scripts/indexer-reconcile-probe.sh (requires Git Bash, jq).
  --ops-artifact: stdout = traveltrust.ops_artifact.v1 probe (Epic D-09).

See scripts/indexer-reconcile-probe.sh and ops/RUNBOOK.md §2.55.
"@ -ForegroundColor Yellow
    exit 0
}

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "indexer-reconcile-probe.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/indexer-reconcile-probe.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
