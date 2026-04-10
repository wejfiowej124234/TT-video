# B-184 compat: forwards to scripts/dev/check-sqlx-migration-prefixes.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'dev/check-sqlx-migration-prefixes.ps1'
& $p @args
exit $LASTEXITCODE
