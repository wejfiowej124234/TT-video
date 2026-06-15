# ① align guide@test.com DB stake_amount to on-chain stakeOf
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$bashSh = Join-Path $Root "scripts/dev/align-guide-stake-db-to-chain-local.sh"

. (Join-Path $PSScriptRoot "lib/Resolve-GitBash.ps1")
$bashExe = Get-GitBashExe
if (-not $bashExe) { Write-Error "Git Bash not found" }

Push-Location $Root
try {
    & $bashExe $bashSh
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally { Pop-Location }
