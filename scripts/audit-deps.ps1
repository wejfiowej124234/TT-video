# B-184 compat: forwards to scripts/gates/audit-deps.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/audit-deps.ps1'
& $p @args
exit $LASTEXITCODE
