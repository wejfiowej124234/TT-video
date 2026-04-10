# B-184 compat: forwards to scripts/gates/check-08-evidence-pointer.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-08-evidence-pointer.ps1'
& $p @args
exit $LASTEXITCODE
