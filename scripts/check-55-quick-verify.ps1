# B-184 compat: forwards to scripts/dev/check-55-quick-verify.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/check-55-quick-verify.ps1'
& $p @args
exit $LASTEXITCODE
