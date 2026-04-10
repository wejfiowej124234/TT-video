# B-184 compat: forwards to scripts/dev/clean-local-temp.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/clean-local-temp.ps1'
& $p @args
exit $LASTEXITCODE
