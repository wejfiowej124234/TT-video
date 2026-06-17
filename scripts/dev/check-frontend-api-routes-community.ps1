# Community + profile-avatar API paths: lib/api.ts vs lib/api/routes.ts / routesCommunity.ts (04 SSOT).
# Usage: powershell -File scripts/dev/check-frontend-api-routes-community.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$routeKeys = @(
    "mediaCapabilities",
    "postsUploadMedia",
    "mediaAssetsSessions",
    "conversationsEnsure"
)

$pathLiterals = @(
    "/api/v1/community/media/capabilities",
    "/api/v1/community/posts/upload-media",
    "/api/v1/community/media-assets/sessions",
    "/api/v1/community/conversations/ensure",
    "/api/v1/community/feed",
    "/api/v1/me/profile-avatar",
    "/api/v1/me/profile-avatar/presign",
    "/api/v1/me/profile-avatar/commit"
)

$files = @(
    (Join-Path $Root "frontend\lib\api.ts"),
    (Join-Path $Root "frontend\lib\api\routes.ts"),
    (Join-Path $Root "frontend\lib\api\routesCommunity.ts")
)

foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath $f)) {
        Write-Host "check-frontend-api-routes-community: FAIL missing $f" -ForegroundColor Red
        exit 1
    }
}

$apiTs = Get-Content -Raw -LiteralPath $files[0]
$routesTs = Get-Content -Raw -LiteralPath $files[1]
$commTs = Get-Content -Raw -LiteralPath $files[2]

foreach ($k in $routeKeys) {
    if ($commTs -notmatch [regex]::Escape("${k}:")) {
        Write-Host "check-frontend-api-routes-community: FAIL routesCommunity.ts missing $k" -ForegroundColor Red
        exit 1
    }
}

foreach ($p in $pathLiterals) {
    if ($apiTs -notmatch [regex]::Escape($p)) {
        Write-Host "check-frontend-api-routes-community: FAIL api.ts missing path $p" -ForegroundColor Red
        exit 1
    }
    if ($routesTs -notmatch [regex]::Escape($p) -and $commTs -notmatch [regex]::Escape($p)) {
        Write-Host "check-frontend-api-routes-community: FAIL routes.ts/routesCommunity.ts missing path $p" -ForegroundColor Red
        exit 1
    }
}

Write-Host "check-frontend-api-routes-community: OK api.ts + routesCommunity.ts community/profile-avatar paths aligned"
exit 0
