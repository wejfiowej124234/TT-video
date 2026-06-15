# ① mint FundStack USDC to local test wallets
param(
    [string]$Wallet = "",
    [string]$AmountRaw = ""
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$bashSh = Join-Path $Root "scripts/dev/mint-fundstack-anvil-usdc.sh"

. (Join-Path $PSScriptRoot "lib/Resolve-GitBash.ps1")
$bashExe = Get-GitBashExe
if (-not $bashExe) { Write-Error "Git Bash not found" }

$env:ANVIL_ALREADY_RUNNING = "1"
$args = @($bashSh)
if ($Wallet) { $args += $Wallet }
if ($AmountRaw) { $args += $AmountRaw }

Push-Location $Root
try {
    & $bashExe @args
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }
