# ① Anvil · FundStack（GuideIdentityStakingPool + Registry + MockERC20 USDC）
param(
    [switch]$Apply
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$bashSh = Join-Path $Root "scripts/dev/deploy-fundstack-anvil-local.sh"

if (-not (Test-Path -LiteralPath $bashSh)) {
    Write-Error "missing $bashSh"
}

. (Join-Path $PSScriptRoot "lib/Resolve-GitBash.ps1")
$bashExe = Get-GitBashExe
if (-not $bashExe) {
    Write-Error "Git Bash bash.exe not found — install Git for Windows, set GIT_BASH, or set SKIP_FUNDSTACK_ANVIL=1"
}

Write-Host "deploy-fundstack-anvil-local.ps1: using Git Bash $bashExe"

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

Write-Host "deploy-fundstack-anvil-local.ps1: OK"
