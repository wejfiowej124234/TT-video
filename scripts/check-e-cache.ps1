# B-184 compat: forwards to scripts/dev/check-e-cache.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/check-e-cache.ps1'
& $p @args
exit $LASTEXITCODE
