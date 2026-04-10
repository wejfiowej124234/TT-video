# Parity with **governance-timelock-delay-ssot-ops-check.sh**：Windows 入口，委托 **Git Bash**（须 **jq**、**`ADMIN_BEARER_TOKEN`**）。
#
# 用法（项目根）：
#   $env:ADMIN_BEARER_TOKEN = '<session>'
#   .\scripts\governance-timelock-delay-ssot-ops-check.ps1
#
# 退出码与 **.sh** 一致。详见 **scripts/governance-timelock-delay-ssot-ops-check.sh**、**ops/RUNBOOK.md** §2.55。

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"

$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path }

$sh = Join-Path $scriptDir "governance-timelock-delay-ssot-ops-check.sh"
if (-not (Test-Path -LiteralPath $sh)) {
    Write-Error "governance-timelock-delay-ssot-ops-check.ps1: missing $sh"
}

$bash = Get-Command bash -ErrorAction SilentlyContinue
if (-not $bash) {
    Write-Error "governance-timelock-delay-ssot-ops-check.ps1: Git Bash 'bash' not on PATH"
}

& bash $sh @RemainingArgs
exit $LASTEXITCODE
