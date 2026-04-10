# 委托 **bash scripts/check-did-rank-no-escrow-prefetch.sh**（须 **Git Bash**）。
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "check-did-rank-no-escrow-prefetch.ps1 requires Git Bash (bash on PATH)."
    exit 1
}

Push-Location $rootDir
try {
    $bashArgs = @("scripts/check-did-rank-no-escrow-prefetch.sh") + $RemainingArgs
    & bash @bashArgs
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
