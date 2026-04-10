# B-184 compat: forwards to scripts/gates/fix_27_archived_links.ps1
$ErrorActionPreference = 'Stop'
$p = Join-Path $PSScriptRoot 'gates/fix_27_archived_links.ps1'
& $p @args
exit $LASTEXITCODE
