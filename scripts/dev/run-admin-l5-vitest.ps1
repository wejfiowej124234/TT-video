# Step 7f: Admin ① L5 vitest union (non-Playwright; Phase 1 local).
# Usage: powershell -File scripts/dev/run-admin-l5-vitest.ps1
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

Write-Host "admin-l5-vitest: run-admin-l5-green.mjs..."
node (Join-Path $Root "scripts\dev\run-admin-l5-green.mjs")
if ($LASTEXITCODE -ne 0) {
    Write-Host "admin-l5-vitest: FAIL" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "admin-l5-vitest: exit 0"
exit 0
