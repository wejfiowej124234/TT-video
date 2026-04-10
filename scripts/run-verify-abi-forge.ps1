# B-184 compat: forwards to scripts/dev/run-verify-abi-forge.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/run-verify-abi-forge.ps1'
& $p @args
exit $LASTEXITCODE
