# B-184 compat: forwards to scripts/ops/indexer-reorg-recovery.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/indexer-reorg-recovery.ps1'
& $p @args
exit $LASTEXITCODE
