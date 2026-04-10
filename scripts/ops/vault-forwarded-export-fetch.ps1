# Parity with **vault-forwarded-export-fetch.sh**：Windows 入口，委托 **Git Bash**。
# 环境变量与 **.sh** 相同（**`ADMIN_BEARER_TOKEN`** 必填等）。详见 **scripts/README.md**、**ops/RUNBOOK.md** §2.55。

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if ($RemainingArgs -contains "-h" -or $RemainingArgs -contains "--help") {
    Write-Host @"
Usage: vault-forwarded-export-fetch.ps1

  Set ADMIN_BEARER_TOKEN (and optional API_BASE_URL, VAULT_EXPORT_FORMAT, ...).
  Delegates to: bash scripts/vault-forwarded-export-fetch.sh

See scripts/vault-forwarded-export-fetch.sh and scripts/README.md.
"@ -ForegroundColor Yellow
    exit 0
}

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "vault-forwarded-export-fetch.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/vault-forwarded-export-fetch.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
