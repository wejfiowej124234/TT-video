# Ensures lib/api.ts and lib/api/routes.ts define Phase ①.5 identity paths (wallets + role-applications).
# Usage: powershell -File scripts/dev/check-frontend-api-routes-phase15-identity.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$keys = @(
    "meWallets",
    "meRoleApplications"
)

$paths = @(
    (Join-Path $Root "frontend\lib\api.ts"),
    (Join-Path $Root "frontend\lib\api\routes.ts")
)

foreach ($file in $paths) {
    if (-not (Test-Path $file)) {
        Write-Host "check-frontend-api-routes-phase15-identity: FAIL missing $file" -ForegroundColor Red
        exit 1
    }
    $text = Get-Content -Raw -LiteralPath $file
    foreach ($k in $keys) {
        if ($text -notmatch [regex]::Escape("${k}:")) {
            Write-Host "check-frontend-api-routes-phase15-identity: FAIL $file missing routes.$k" -ForegroundColor Red
            exit 1
        }
    }
}

$apiTs = Get-Content -Raw -LiteralPath $paths[0]
$routesTs = Get-Content -Raw -LiteralPath $paths[1]
$expected = @{
    meWallets = '/api/v1/me/wallets'
    meRoleApplications = '/api/v1/me/role-applications'
}
foreach ($lit in $expected.Values) {
    if ($apiTs -notmatch [regex]::Escape($lit)) {
        Write-Host "check-frontend-api-routes-phase15-identity: FAIL api.ts missing path $lit" -ForegroundColor Red
        exit 1
    }
    if ($routesTs -notmatch [regex]::Escape($lit)) {
        Write-Host "check-frontend-api-routes-phase15-identity: FAIL routes.ts missing path $lit" -ForegroundColor Red
        exit 1
    }
}
Write-Host "check-frontend-api-routes-phase15-identity: OK api.ts + api/routes.ts me/wallets + me/role-applications aligned"
exit 0
