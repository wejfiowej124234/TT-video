# 委托 **bash scripts/check-wave-phase-files.sh**（**90～550** 阶段 **`docs/spec/NNN-*.md`** 存在性；须 **Git Bash**）。
# 锚：**scripts/check-wave-phase-files.sh**

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "check-wave-phase-files.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/check-wave-phase-files.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
