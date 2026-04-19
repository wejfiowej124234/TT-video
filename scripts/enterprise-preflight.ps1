# Enterprise stack preflight (Windows): SQLx prefixes + 55-S13 + optional forge ABI multiset.
# Usage (repo root): powershell -File scripts/enterprise-preflight.ps1
# Optional: $env:TRAVELTRUST_ABI_FORGE_VERIFY = '1'
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root
Write-Host "=== enterprise-preflight (repo: $Root) ==="

Write-Host "`n[1] SQLx migration prefixes"
& (Join-Path $Root "scripts\check-sqlx-migration-prefixes.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[2] 55-S13 (ABI parity)"
& (Join-Path $Root "scripts\dev\check-55-s13.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if ($env:TRAVELTRUST_ABI_FORGE_VERIFY -eq "1") {
    Write-Host "`n[3] forge ABI multiset (TRAVELTRUST_ABI_FORGE_VERIFY=1)"
    & (Join-Path $Root "scripts\dev\run-verify-abi-forge.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host "`n=== enterprise-preflight OK ==="
exit 0
