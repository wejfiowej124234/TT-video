# 委托 **bash scripts/check-governance-doc-linkage.sh**（82/83/84 **governance-token** 与 00/07/08-4 联动；须 **Git Bash**）。
# 锚：**scripts/check-governance-doc-linkage.sh**

param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "check-governance-doc-linkage.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/check-governance-doc-linkage.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
