# B-184 compat: forwards to scripts/ops/governance-timelock-governor-admin-ssot-ops-check.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/governance-timelock-governor-admin-ssot-ops-check.ps1'
& $p @args
exit $LASTEXITCODE
