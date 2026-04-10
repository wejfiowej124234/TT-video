# B-184 compat: forwards to scripts/gates/check-invariants.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-invariants.ps1'
& $p @args
exit $LASTEXITCODE
