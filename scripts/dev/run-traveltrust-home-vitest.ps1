# Step 7b: traveltrust-home modular vitest (UI handoff / Hero layout lock).
# Usage: powershell -File scripts/dev/run-traveltrust-home-vitest.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location (Join-Path $Root "frontend")

Write-Host "traveltrust-home-vitest: modules/traveltrust-home..."
npx vitest run modules/traveltrust-home/
if ($LASTEXITCODE -ne 0) {
    Write-Host "traveltrust-home-vitest: FAIL" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "traveltrust-home-vitest: exit 0"
exit 0
