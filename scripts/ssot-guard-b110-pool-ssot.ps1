# B-184 compat: forwards to scripts/gates/ssot-guard-b110-pool-ssot.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/ssot-guard-b110-pool-ssot.ps1'
& $p @args
exit $LASTEXITCODE
