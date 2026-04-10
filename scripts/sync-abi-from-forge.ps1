# B-184 compat: forwards to scripts/dev/sync-abi-from-forge.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/sync-abi-from-forge.ps1'
& $p @args
exit $LASTEXITCODE
