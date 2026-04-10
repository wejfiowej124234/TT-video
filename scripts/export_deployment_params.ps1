# B-184 compat: forwards to scripts/ops/export_deployment_params.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/export_deployment_params.ps1'
& $p @args
exit $LASTEXITCODE
