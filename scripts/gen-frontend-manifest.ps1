# B-184 compat: forwards to scripts/dev/gen-frontend-manifest.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/gen-frontend-manifest.ps1'
& $p @args
exit $LASTEXITCODE
