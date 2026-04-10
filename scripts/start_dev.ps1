# B-184 compat: forwards to scripts/dev/start_dev.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/start_dev.ps1'
& $p @args
exit $LASTEXITCODE
