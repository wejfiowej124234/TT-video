# Ensures lib/api/routes.ts defines Protocol Convergence P2 paths (steward · redemption · governance state-machines).
# apiClient/stewardApplications.ts consumes API_ROUTES from routes.ts (not legacy api.ts flat keys).
# Usage: powershell -File scripts/dev/check-frontend-api-routes-steward-protocol.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$routesTs = Join-Path $Root "frontend\lib\api\routes.ts"

if (-not (Test-Path -LiteralPath $routesTs)) {
    Write-Host "check-frontend-api-routes-steward-protocol: FAIL missing routes.ts" -ForegroundColor Red
    exit 1
}

$text = Get-Content -Raw -LiteralPath $routesTs

$requiredKeys = @(
    'meStewardApplication',
    'meStewardSeat',
    'stewardApplications',
    'stewardStakeQuote',
    'stewardStakeStatus',
    'stewardResignNotice',
    'stewardFinalizeResign',
    'redemptionQuote',
    'governanceStateMachines',
    'traveltrustPageBrief',
    'governanceProtocolReference'
)
foreach ($key in $requiredKeys) {
    if ($text -notmatch [regex]::Escape("${key}:")) {
        Write-Host "check-frontend-api-routes-steward-protocol: FAIL routes.ts missing key $key" -ForegroundColor Red
        exit 1
    }
}

$requiredPaths = @(
    '/api/v1/me/steward-application',
    '/api/v1/me/steward-seat',
    '/api/v1/steward/applications',
    '/api/v1/steward/stake-quote',
    '/api/v1/steward/stake-status',
    '/api/v1/steward/resign-notice',
    '/api/v1/steward/finalize-resign',
    '/api/v1/redemption/quote',
    '/api/v1/governance/state-machines',
    '/api/v1/governance/protocol-reference',
    '/api/v1/traveltrust/page-brief'
)
foreach ($path in $requiredPaths) {
    if ($text -notmatch [regex]::Escape($path)) {
        Write-Host "check-frontend-api-routes-steward-protocol: FAIL routes.ts missing path $path" -ForegroundColor Red
        exit 1
    }
}

$stewardClient = Join-Path $Root "frontend\lib\apiClient\stewardApplications.ts"
if (-not (Test-Path -LiteralPath $stewardClient)) {
    Write-Host "check-frontend-api-routes-steward-protocol: FAIL missing stewardApplications.ts" -ForegroundColor Red
    exit 1
}
$clientText = Get-Content -Raw -LiteralPath $stewardClient
foreach ($fn in @('getMeStewardSeat', 'postStewardResignNotice', 'postStewardFinalizeResign')) {
    if ($clientText -notmatch [regex]::Escape($fn)) {
        Write-Host "check-frontend-api-routes-steward-protocol: FAIL stewardApplications.ts missing $fn" -ForegroundColor Red
        exit 1
    }
}

Write-Host "check-frontend-api-routes-steward-protocol: OK routes.ts steward-seat/resign + stewardApplications client"
exit 0
