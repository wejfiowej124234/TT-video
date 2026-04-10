# 委托 **bash scripts/check-08-consistency.sh**（08-3/08-4 **W-PDP-SSOT-CONSISTENCY**；须 **Git Bash**）。
# 用法：.\scripts\check-08-consistency.ps1 [BASE_REF]   默认 **main**（与 **check-08-consistency.yml** 一致）。
# 锚：**scripts/check-08-consistency.sh**

param(
    [Parameter(Position = 0)]
    [string]$BaseRef = "main",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "check-08-consistency.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/check-08-consistency.sh", $BaseRef) + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
