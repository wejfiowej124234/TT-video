# B-184 compat: forwards to scripts/gates/check-did-rank-no-escrow-prefetch.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-did-rank-no-escrow-prefetch.ps1'
& $p @args
exit $LASTEXITCODE
