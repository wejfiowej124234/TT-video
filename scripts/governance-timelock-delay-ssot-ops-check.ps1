# B-184 compat: forwards to scripts/ops/governance-timelock-delay-ssot-ops-check.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/governance-timelock-delay-ssot-ops-check.ps1'
& $p @args
exit $LASTEXITCODE
