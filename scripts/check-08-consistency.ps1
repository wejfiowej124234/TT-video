# B-184 compat: forwards to scripts/gates/check-08-consistency.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-08-consistency.ps1'
& $p @args
exit $LASTEXITCODE
