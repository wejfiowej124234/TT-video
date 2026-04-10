# B-184 compat: forwards to scripts/ops/indexer-public-snapshot.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/indexer-public-snapshot.ps1'
& $p @args
exit $LASTEXITCODE
