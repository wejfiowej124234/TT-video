# B-184 compat: forwards to scripts/gates/check-48-line-count.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-48-line-count.ps1'
& $p @args
exit $LASTEXITCODE
