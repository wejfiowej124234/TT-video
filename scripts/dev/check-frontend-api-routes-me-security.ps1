# Ensures lib/api.ts and lib/api/routes.ts define me/sessions + security-notifications paths
# (account security center; /me/security · batches 17–20).
# Usage: powershell -File scripts/dev/check-frontend-api-routes-me-security.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$keys = @(
    "meSessions",
    "meSecurityNotifications",
    "meSessionCurrent",
    "meSessionBySuffix"
)

$paths = @(
    (Join-Path $Root "frontend\lib\api.ts"),
    (Join-Path $Root "frontend\lib\api\routes.ts")
)

foreach ($file in $paths) {
    if (-not (Test-Path $file)) {
        Write-Host "check-frontend-api-routes-me-security: FAIL missing $file" -ForegroundColor Red
        exit 1
    }
    $text = Get-Content -Raw -LiteralPath $file
    foreach ($k in $keys) {
        if ($text -notmatch [regex]::Escape("${k}:")) {
            Write-Host "check-frontend-api-routes-me-security: FAIL $file missing routes.$k" -ForegroundColor Red
            exit 1
        }
    }
}

$apiTs = Get-Content -Raw -LiteralPath $paths[0]
$routesTs = Get-Content -Raw -LiteralPath $paths[1]
$expected = @{
    meSessions = '/api/v1/me/sessions'
    meSessionCurrent = '/api/v1/me/sessions/current'
    meSecurityNotificationsBase = '/api/v1/me/security-notifications'
}
foreach ($lit in @($expected.meSessions, $expected.meSessionCurrent, $expected.meSecurityNotificationsBase)) {
    if ($apiTs -notmatch [regex]::Escape($lit)) {
        Write-Host "check-frontend-api-routes-me-security: FAIL api.ts missing path $lit" -ForegroundColor Red
        exit 1
    }
    if ($routesTs -notmatch [regex]::Escape($lit)) {
        Write-Host "check-frontend-api-routes-me-security: FAIL routes.ts missing path $lit" -ForegroundColor Red
        exit 1
    }
}
Write-Host "check-frontend-api-routes-me-security: OK api.ts + api/routes.ts me sessions + security-notifications aligned"
exit 0
