# B-184 compat: forwards to scripts/dev/setup-e-cache.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/setup-e-cache.ps1'
& $p @args
exit $LASTEXITCODE
