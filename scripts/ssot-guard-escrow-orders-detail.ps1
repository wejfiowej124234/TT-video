# B-184 compat: forwards to scripts/gates/ssot-guard-escrow-orders-detail.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/ssot-guard-escrow-orders-detail.ps1'
& $p @args
exit $LASTEXITCODE
