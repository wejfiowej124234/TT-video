# B-184 compat: forwards to scripts/ops/vault-forwarded-export-fetch.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'ops/vault-forwarded-export-fetch.ps1'
& $p @args
exit $LASTEXITCODE
