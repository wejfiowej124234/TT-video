# B-184 compat: forwards to scripts/gates/check-55-s13.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-55-s13.ps1'
& $p @args
exit $LASTEXITCODE
