# Admin console + home queue API paths: lib/api.ts vs routesAdmin* SSOT (04 / 70).
# Usage: powershell -File scripts/dev/check-frontend-api-routes-admin.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$routeKeys = @(
    "capabilities",
    "rbacRouteMatrix",
    "metricsHomeOverview",
    "orders",
    "disputes",
    "approvals",
    "communityReports",
    "entitlements"
)

$pathLiterals = @(
    "/api/v1/admin/capabilities",
    "/api/v1/admin/rbac/route-matrix",
    "/api/v1/admin/metrics/home-overview",
    "/api/v1/admin/provider-applications",
    "/api/v1/admin/steward-applications",
    "/api/v1/admin/orders",
    "/api/v1/admin/disputes",
    "/api/v1/admin/approvals",
    "/api/v1/admin/community/reports",
    "/api/v1/admin/security/totp/status"
)

$onboardingPathLiterals = @(
    "/api/v1/admin/onboarding/entitlements"
)

$growthPathLiterals = @(
    "/api/v1/admin/growth/referral-codes",
    "/api/v1/admin/growth/reward-ledger",
    "/api/v1/admin/growth/analytics/overview",
    "/api/v1/admin/growth/early-bird/stages",
    "/api/v1/admin/growth/airdrop-campaigns",
    "/api/v1/admin/growth/anti-fraud/rules",
    "/api/v1/admin/growth/anti-fraud/scan-runs"
)

$cmsOfficialPathLiterals = @(
    "/api/v1/admin/content/countries",
    "/api/v1/admin/content/publish-queue",
    "/api/v1/admin/content/revisions",
    "/api/v1/admin/content/catalog/geo-validation",
    "/api/v1/admin/official/accounts",
    "/api/v1/admin/official/guides",
    "/api/v1/admin/official/itinerary-templates",
    "/api/v1/admin/official/cold-start/campaigns",
    "/api/v1/admin/country-market/launches"
)

$files = @(
    (Join-Path $Root "frontend\lib\api.ts"),
    (Join-Path $Root "frontend\lib\api\routes.ts"),
    (Join-Path $Root "frontend\lib\api\routesAdminCore.ts"),
    (Join-Path $Root "frontend\lib\api\routesAdminOnboarding.ts"),
    (Join-Path $Root "frontend\lib\api\routesAdminCommunityPolicies.ts"),
    (Join-Path $Root "frontend\app\api\v1\admin\capabilities\route.ts"),
    (Join-Path $Root "frontend\app\layout.tsx"),
    (Join-Path $Root "frontend\public\tt-session-cookie-bootstrap.js"),
    (Join-Path $Root "frontend\public\tt-dev-chunk-recovery.js")
)

foreach ($f in $files) {
    if (-not (Test-Path -LiteralPath $f)) {
        Write-Host "check-frontend-api-routes-admin: FAIL missing $f" -ForegroundColor Red
        exit 1
    }
}

$apiTs = Get-Content -Raw -LiteralPath $files[0]
$routesTs = Get-Content -Raw -LiteralPath $files[1]
$coreTs = Get-Content -Raw -LiteralPath $files[2]
$onbTs = Get-Content -Raw -LiteralPath $files[3]
$commTs = Get-Content -Raw -LiteralPath $files[4]
$capRoute = Get-Content -Raw -LiteralPath $files[5]
$rootLayout = Get-Content -Raw -LiteralPath $files[6]

foreach ($k in $routeKeys) {
    $inCore = $coreTs -match [regex]::Escape("${k}:")
    $inOnb = $onbTs -match [regex]::Escape("${k}:")
    $inComm = $commTs -match [regex]::Escape("${k}:")
    if (-not $inCore -and -not $inOnb -and -not $inComm) {
        Write-Host "check-frontend-api-routes-admin: FAIL routesAdmin* missing $k" -ForegroundColor Red
        exit 1
    }
}

foreach ($p in $pathLiterals) {
    if ($apiTs -notmatch [regex]::Escape($p)) {
        Write-Host "check-frontend-api-routes-admin: FAIL api.ts missing path $p" -ForegroundColor Red
        exit 1
    }
}

foreach ($p in $onboardingPathLiterals) {
    if ($onbTs -notmatch [regex]::Escape($p)) {
        Write-Host "check-frontend-api-routes-admin: FAIL routesAdminOnboarding missing path $p" -ForegroundColor Red
        exit 1
    }
}

foreach ($p in $growthPathLiterals) {
    if ($apiTs -notmatch [regex]::Escape($p)) {
        Write-Host "check-frontend-api-routes-admin: FAIL api.ts missing growth path $p" -ForegroundColor Red
        exit 1
    }
}

foreach ($p in $cmsOfficialPathLiterals) {
    if ($routesTs -notmatch [regex]::Escape($p)) {
        Write-Host "check-frontend-api-routes-admin: FAIL routes.ts missing CMS/Official path $p" -ForegroundColor Red
        exit 1
    }
}

if ($capRoute -notmatch 'proxyTraveltrustApi' -or $capRoute -notmatch '/api/v1/admin/capabilities') {
    Write-Host "check-frontend-api-routes-admin: FAIL Next capabilities route.ts proxy mismatch" -ForegroundColor Red
    exit 1
}

$shellTs = Get-Content -Raw -LiteralPath (Join-Path $Root "frontend\components\admin\AdminCapabilitiesShell.tsx")
if ($shellTs -notmatch 'AdminHomeQueuesProvider') {
    Write-Host "check-frontend-api-routes-admin: FAIL AdminCapabilitiesShell missing AdminHomeQueuesProvider" -ForegroundColor Red
    exit 1
}
if ($shellTs -notmatch 'AdminSessionCookieSync') {
    Write-Host "check-frontend-api-routes-admin: FAIL AdminCapabilitiesShell missing AdminSessionCookieSync" -ForegroundColor Red
    exit 1
}
if ($rootLayout -notmatch 'tt-session-cookie-bootstrap\.js' -or $rootLayout -notmatch 'tt-dev-chunk-recovery\.js') {
    Write-Host "check-frontend-api-routes-admin: FAIL root layout missing session/chunk bootstrap scripts" -ForegroundColor Red
    exit 1
}

Write-Host "check-frontend-api-routes-admin: OK api.ts + routes.ts CMS/Growth/Official + routesAdmin* + onboarding + capabilities Next route + Admin shell providers"
exit 0
