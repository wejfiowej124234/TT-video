# 委托 **bash scripts/stop_dev.sh**（停 **start_dev** 所起进程；须 **Git Bash**）。
# Windows 亦可 **`scripts\stop-all.bat`**（不关 Docker）。
# 锚：**scripts/stop_dev.sh**

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "stop_dev.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/stop_dev.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
