# B-184 compat: forwards to scripts/ops/indexer-reconcile-probe.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/indexer-reconcile-probe.ps1'
& $p @args
exit $LASTEXITCODE
