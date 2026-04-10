# B-184 compat: forwards to scripts/ops/governance-governor-token-timelock-ssot-ops-check.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/governance-governor-token-timelock-ssot-ops-check.ps1'
& $p @args
exit $LASTEXITCODE
