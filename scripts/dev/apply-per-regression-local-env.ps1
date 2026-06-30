# Production Entry Review Regression — ① local env alignment (NOT Configuration Sprint).
# Usage: powershell -File scripts/dev/apply-per-regression-local-env.ps1
# Then: powershell -File scripts/dev/sync-frontend-env-local-from-root.ps1
# Verify: bash scripts/dev/verify-cfg-drift-closure.sh

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$EnvFile = Join-Path $Root ".env"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Host "apply-per-regression-local-env: no root .env" -ForegroundColor Yellow
    exit 1
}

function Upsert-Line([string[]]$lines, [string]$key, [string]$value) {
    $prefix = "$key="
    $out = New-Object System.Collections.Generic.List[string]
    $found = $false
    foreach ($line in $lines) {
        if ($line.StartsWith($prefix)) {
            $out.Add("$key=$value")
            $found = $true
        } else {
            $out.Add($line)
        }
    }
    if (-not $found) { $out.Add("$key=$value") }
    return ,$out.ToArray()
}

$lines = Get-Content -LiteralPath $EnvFile -Encoding UTF8
$out = New-Object System.Collections.Generic.List[string]
$inB407 = $false
foreach ($line in $lines) {
    if ($line -match '^# --- WEB3-P2-003 \+ B-407') { $inB407 = $true; $out.Add($line); continue }
    if ($line -match '^B407_') {
        if ($line -notmatch '^\s*#') { $out.Add("# PER: archived B407 — use .env.govfreeze-v2-evidence.example — $line") }
        else { $out.Add($line) }
        continue
    }
    if ($inB407 -and $line -match '^[A-Z_]+=' -and $line -notmatch '^B407_') { $inB407 = $false }
    $out.Add($line)
}
$lines = $out.ToArray()

$lines = Upsert-Line $lines "CORS_ORIGINS" "http://localhost:3012,http://127.0.0.1:3012"
$lines = Upsert-Line $lines "TRAVELTRUST_DEPLOYMENT_PROFILE" "local"

# Frontend UI / feature flags — root .env SSOT → sync → NEXT_PUBLIC_*
$uiDefaults = @{
    "NEXT_PUBLIC_ENABLE_LEGACY_BEARER_STORAGE" = "1"
    "NEXT_PUBLIC_SKIP_ME_FETCH" = "0"
    "NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD" = "1"
    "NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE" = "tier1-playback"
    "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP" = "/media/traveltrust/hero-loop.mp4"
    "NEXT_PUBLIC_TRAVELTRUST_HERO_LOOP_POSTER" = "/media/traveltrust/hero-poster.svg"
    "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER" = "/media/traveltrust/roles/traveler.mp4"
    "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE" = "/media/traveltrust/roles/guide.mp4"
    "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT" = "/media/traveltrust/roles/merchant.mp4"
    "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION" = "/media/traveltrust/roles/acquisition.mp4"
    "NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD" = "/media/traveltrust/roles/region_steward.mp4"
    "NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE" = "0"
}
foreach ($e in $uiDefaults.GetEnumerator()) {
    $lines = Upsert-Line $lines $e.Key $e.Value
}

$header = @(
    "# --- PER local regression header (apply-per-regression-local-env.ps1) ---",
    "# CHAIN_RPC_URL is API SSOT (not RPC_URL). GovFreeze: scripts/dev/.env.govfreeze-v2-evidence.example",
    ""
)
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($EnvFile, ($header + $lines), $utf8)
Write-Host "PER: wrote $EnvFile (CORS 3012-only, B407 archived, UI flags in root .env)" -ForegroundColor Green

& (Join-Path $PSScriptRoot "sync-frontend-env-local-from-root.ps1")
