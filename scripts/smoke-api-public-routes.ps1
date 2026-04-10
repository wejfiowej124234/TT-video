# B-184 compat: forwards to scripts/gates/smoke-api-public-routes.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/smoke-api-public-routes.ps1'
& $p @args
exit $LASTEXITCODE
