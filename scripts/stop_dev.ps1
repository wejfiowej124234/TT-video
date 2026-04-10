# B-184 compat: forwards to scripts/dev/stop_dev.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/stop_dev.ps1'
& $p @args
exit $LASTEXITCODE
