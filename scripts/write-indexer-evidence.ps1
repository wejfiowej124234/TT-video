# B-184 compat: forwards to scripts/ops/write-indexer-evidence.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/write-indexer-evidence.ps1'
& $p @args
exit $LASTEXITCODE
