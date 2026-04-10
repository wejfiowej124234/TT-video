# B-184 compat: forwards to scripts/ops/internal-indexer-ops.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/internal-indexer-ops.ps1'
& $p @args
exit $LASTEXITCODE
