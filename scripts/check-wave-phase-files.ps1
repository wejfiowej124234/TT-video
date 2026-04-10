# B-184 compat: forwards to scripts/gates/check-wave-phase-files.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-wave-phase-files.ps1'
& $p @args
exit $LASTEXITCODE
