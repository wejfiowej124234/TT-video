# B-184 compat: forwards to scripts/dev/frontend-clean-dev.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/frontend-clean-dev.ps1'
& $p @args
exit $LASTEXITCODE
