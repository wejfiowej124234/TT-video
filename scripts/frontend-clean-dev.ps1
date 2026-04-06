# 委托 **bash scripts/frontend-clean-dev.sh**（`frontend` 下 **npm run clean && npm run dev**；须 **Git Bash**）。
# Windows 日常亦可 **`scripts\frontend-clean-dev.bat`**。
# 锚：**scripts/frontend-clean-dev.sh**

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "frontend-clean-dev.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/frontend-clean-dev.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
