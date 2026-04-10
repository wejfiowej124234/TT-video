# B-184 compat: forwards to scripts/ops/orders-deadline-ssot-ops-check.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/orders-deadline-ssot-ops-check.ps1'
& $p @args
exit $LASTEXITCODE
