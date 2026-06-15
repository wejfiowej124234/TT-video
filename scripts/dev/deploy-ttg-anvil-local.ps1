# ② Anvil · deploy MockERC20 (local TTG) + RegionStewardStakePool + optional merge root .env
# Called from start-api-with-seed.bat Step 3c (TRAVELTRUST_TTG_ANVIL=1)
param(
    [switch]$Apply
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$bashSh = Join-Path $Root "scripts/dev/deploy-ttg-anvil-local.sh"

if (-not (Test-Path -LiteralPath $bashSh)) {
    Write-Error "missing $bashSh"
}

. (Join-Path $PSScriptRoot "lib/Resolve-GitBash.ps1")
$bashExe = Get-GitBashExe
if (-not $bashExe) {
    Write-Error "Git Bash bash.exe not found — install Git for Windows, set GIT_BASH to bash.exe, or set SKIP_TTG_ANVIL=1 (avoid WSL bash on PATH)"
}

Write-Host "deploy-ttg-anvil-local.ps1: using Git Bash $bashExe"

$env:SKIP_ANVIL_STOP = "1"
$args = @($bashSh)
if ($Apply) { $args += "--apply" }

Push-Location $Root
try {
    & $bashExe @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

Write-Host "deploy-ttg-anvil-local.ps1: OK"
