# Ensures Identity Center P2 profile paths: routes.ts SSOT + apiClient consumers.
# Usage: powershell -File scripts/dev/check-frontend-api-routes-identity-p2.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$routesTs = Join-Path $Root "frontend\lib\api\routes.ts"
if (-not (Test-Path $routesTs)) {
    Write-Host "check-frontend-api-routes-identity-p2: FAIL missing $routesTs" -ForegroundColor Red
    exit 1
}

$keys = @(
    "meGuideProfile",
    "meMerchantProfile",
    "meRegionStewardProfile",
    "meAcquisitionProfile",
    "meGuideExitStatus",
    "meGuideExitRequest"
)

$expected = @{
    meGuideProfile = "/api/v1/me/guide-profile"
    meMerchantProfile = "/api/v1/me/merchant-profile"
    meRegionStewardProfile = "/api/v1/me/region-steward-profile"
    meAcquisitionProfile = "/api/v1/me/acquisition-profile"
    meGuideExitStatus = "/api/v1/me/guide-exit-status"
    meGuideExitRequest = "/api/v1/me/guide-exit-request"
}

$routesText = Get-Content -Raw -LiteralPath $routesTs
foreach ($k in $keys) {
    if ($routesText -notmatch [regex]::Escape("${k}:")) {
        Write-Host "check-frontend-api-routes-identity-p2: FAIL routes.ts missing routes.$k" -ForegroundColor Red
        exit 1
    }
}
foreach ($lit in $expected.Values) {
    if ($routesText -notmatch [regex]::Escape($lit)) {
        Write-Host "check-frontend-api-routes-identity-p2: FAIL routes.ts missing path $lit" -ForegroundColor Red
        exit 1
    }
}

$clientFiles = @(
    @{ file = "frontend\lib\apiClient\meGuideProfile.ts"; routeKey = "meGuideProfile" },
    @{ file = "frontend\lib\apiClient\meMerchantProfile.ts"; routeKey = "meMerchantProfile" },
    @{ file = "frontend\lib\apiClient\meStewardProfile.ts"; routeKey = "meRegionStewardProfile" },
    @{ file = "frontend\lib\apiClient\meAcquisitionProfile.ts"; routeKey = "meAcquisitionProfile" },
    @{ file = "frontend\lib\apiClient\meGuideExit.ts"; routeKey = "meGuideExitStatus" },
    @{ file = "frontend\lib\apiClient\meGuideExit.ts"; routeKey = "meGuideExitRequest" }
)

foreach ($c in $clientFiles) {
    $path = Join-Path $Root $c.file
    if (-not (Test-Path $path)) {
        Write-Host "check-frontend-api-routes-identity-p2: FAIL missing $($c.file)" -ForegroundColor Red
        exit 1
    }
    $text = Get-Content -Raw -LiteralPath $path
    if ($text -notmatch [regex]::Escape("routes.$($c.routeKey)")) {
        Write-Host "check-frontend-api-routes-identity-p2: FAIL $($c.file) missing routes.$($c.routeKey)" -ForegroundColor Red
        exit 1
    }
}

Write-Host "check-frontend-api-routes-identity-p2: OK routes.ts + apiClient Identity P2 profiles + guide-exit paths aligned"
exit 0
