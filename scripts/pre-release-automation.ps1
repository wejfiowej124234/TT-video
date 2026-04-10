# B-184 compat: forwards to scripts/gates/pre-release-automation.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/pre-release-automation.ps1'
& $p @args
exit $LASTEXITCODE
