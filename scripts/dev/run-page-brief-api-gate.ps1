# Pre-start: page-brief API JSON contract (ia_version v6) matches 85 / FE fallback.
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

Write-Host "page-brief-api-gate: cargo test page_brief_doc_version..."
cargo test -p traveltrust-api page_brief_doc_version -- --nocapture
if ($LASTEXITCODE -ne 0) {
    Write-Host "page-brief-api-gate: FAIL" -ForegroundColor Red
    exit $LASTEXITCODE
}
Write-Host "page-brief-api-gate: exit 0"
exit 0
