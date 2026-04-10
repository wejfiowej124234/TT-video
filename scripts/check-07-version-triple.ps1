# B-184 compat: forwards to scripts/gates/check-07-version-triple.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-07-version-triple.ps1'
& $p @args
exit $LASTEXITCODE
