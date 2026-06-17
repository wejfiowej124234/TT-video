# Ensures lib/api.ts and lib/api/routes.ts define Web3 itinerary / Escrow draft order paths.
# Prevents apiUrl(undefined) on PATCH guide, confirm-final-plan, itinerary save, discover.
# Usage: powershell -File scripts/dev/check-frontend-api-routes-web3-itinerary.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$keys = @(
    "itineraries",
    "discoverOrders",
    "orderById",
    "orderPatchItinerary",
    "orderPatchGuide",
    "orderConfirmFinalPlan",
    "guideAvailability"
)

$paths = @(
    (Join-Path $Root "frontend\lib\api.ts"),
    (Join-Path $Root "frontend\lib\api\routes.ts")
)

foreach ($file in $paths) {
    if (-not (Test-Path $file)) {
        Write-Host "check-frontend-api-routes-web3-itinerary: FAIL missing $file" -ForegroundColor Red
        exit 1
    }
    $text = Get-Content -Raw -LiteralPath $file
    foreach ($k in $keys) {
        if ($text -notmatch [regex]::Escape("${k}:")) {
            Write-Host "check-frontend-api-routes-web3-itinerary: FAIL $file missing routes.$k" -ForegroundColor Red
            exit 1
        }
    }
}

$apiTs = Get-Content -Raw -LiteralPath $paths[0]
$routesTs = Get-Content -Raw -LiteralPath $paths[1]
$expected = @{
    itineraries = '/api/v1/itineraries'
    discoverOrders = '/api/v1/discover/orders'
    orderPatchItinerary = '/api/v1/orders/${id}/itinerary'
    orderPatchGuide = '/api/v1/orders/${id}/guide'
    orderConfirmFinalPlan = '/api/v1/orders/${id}/confirm-final-plan'
    guideAvailability = '/api/v1/guides/${encodeURIComponent(id)}/availability'
}
foreach ($pair in $expected.GetEnumerator()) {
    $fragment = $pair.Value
    if ($apiTs -notmatch [regex]::Escape($fragment)) {
        Write-Host "check-frontend-api-routes-web3-itinerary: FAIL api.ts missing path fragment $fragment ($($pair.Key))" -ForegroundColor Red
        exit 1
    }
    if ($routesTs -notmatch [regex]::Escape($fragment)) {
        Write-Host "check-frontend-api-routes-web3-itinerary: FAIL routes.ts missing path fragment $fragment ($($pair.Key))" -ForegroundColor Red
        exit 1
    }
}

Write-Host "check-frontend-api-routes-web3-itinerary: OK api.ts + api/routes.ts web3 itinerary routes aligned"
exit 0
