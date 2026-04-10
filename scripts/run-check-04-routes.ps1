# B-184 compat: forwards to scripts/gates/run-check-04-routes.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/run-check-04-routes.ps1'
& $p @args
exit $LASTEXITCODE
