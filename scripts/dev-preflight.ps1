# B-184 compat: forwards to scripts/dev/dev-preflight.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/dev-preflight.ps1'
& $p @args
exit $LASTEXITCODE
