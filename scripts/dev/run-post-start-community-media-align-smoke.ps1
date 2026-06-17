# Post-start community media API + DB read-path alignment (primary_media_asset_id · capabilities · MinIO optional).
# Usage: powershell -File scripts/dev/run-post-start-community-media-align-smoke.ps1 -Port 8080 [-WarnOnly]
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:$Port"

function Fail-Step([string]$Msg) {
    if ($WarnOnly) {
        Write-Host "WARN: $Msg" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "FAIL: $Msg" -ForegroundColor Red
    exit 1
}

Write-Host "Step 6i - community media align smoke BASE=$base"

try {
    $cap = Invoke-RestMethod -Uri "$base/api/v1/community/media/capabilities" -TimeoutSec 15
} catch {
    Fail-Step "GET /community/media/capabilities failed: $_"
}
if ($cap.status -notin @("ok", "degraded")) {
    Fail-Step "media/capabilities status=$($cap.status)"
}

foreach ($path in @("/api/v1/community/feed?limit=5", "/api/v1/community/feed?mode=recommend&limit=5")) {
    try {
        $feed = Invoke-RestMethod -Uri "$base$path" -TimeoutSec 15
    } catch {
        Fail-Step "GET $path failed: $_"
    }
    if ($feed.status -ne "ok") { Fail-Step "$path status=$($feed.status)" }
    if ($null -eq $feed.posts) { Fail-Step "$path missing .posts" }
    foreach ($row in @($feed.posts)) {
        if (-not ($row.PSObject.Properties.Name -contains "primary_media_asset_id")) {
            Fail-Step "$path post $($row.id) missing primary_media_asset_id key (04 A1 read path)"
        }
    }
    Write-Host "  OK $path posts=$(@($feed.posts).Count) primary_media_asset_id key present"
}

$pgRunning = docker ps -q -f "name=^traveltrust-postgres$" 2>$null
if ($pgRunning) {
    $col = (docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -t -A -c `
        "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='primary_media_asset_id' LIMIT 1;" 2>$null).Trim()
    if ($col -ne "1") {
        Fail-Step "PG schema missing community_posts.primary_media_asset_id (run Step 3d migrate)"
    }
    $tbl = (docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -t -A -c `
        "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='community_media_assets' LIMIT 1;" 2>$null).Trim()
    if ($tbl -ne "1") {
        Fail-Step "PG schema missing community_media_assets table"
    }
    Write-Host "  OK PG schema community_posts.primary_media_asset_id + community_media_assets"
}

try {
    $live = Invoke-WebRequest -Uri "http://127.0.0.1:19000/minio/health/live" -UseBasicParsing -TimeoutSec 3
    if ([int]$live.StatusCode -eq 200) {
        Write-Host "  OK MinIO :19000 (multipart video staging path)"
    }
} catch {
    Write-Host "  WARN MinIO :19000 not up — video multipart may be degraded (see Step 3e)" -ForegroundColor Yellow
}

Write-Host "OK: community media align smoke (API read path + PG SSOT)"
exit 0
