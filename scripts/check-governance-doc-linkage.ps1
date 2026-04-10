# B-184 compat: forwards to scripts/gates/check-governance-doc-linkage.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/check-governance-doc-linkage.ps1'
& $p @args
exit $LASTEXITCODE
