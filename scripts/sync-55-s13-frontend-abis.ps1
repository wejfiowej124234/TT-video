# B-184 compat: forwards to scripts/dev/sync-55-s13-frontend-abis.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/sync-55-s13-frontend-abis.ps1'
& $p @args
exit $LASTEXITCODE
