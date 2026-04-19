# Thin entry: delegates to scripts/dev/check-55-s13.ps1
$ErrorActionPreference = "Stop"
$dev = Join-Path $PSScriptRoot "dev\check-55-s13.ps1"
& $dev
exit $LASTEXITCODE
