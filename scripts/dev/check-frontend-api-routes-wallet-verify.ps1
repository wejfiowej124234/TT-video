# Ensures lib/api.ts and lib/api/routes.ts both define wallet-verify paths (steward/guide/provider onboarding).
# Prevents apiUrl(undefined) -> "signature challenge failed" on /steward/register step 2.
# Usage: powershell -File scripts/dev/check-frontend-api-routes-wallet-verify.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$keys = @(
    "meWalletVerifyChallenge",
    "meWalletVerifyConfirm",
    "meWalletVerificationStatus"
)

$paths = @(
    (Join-Path $Root "frontend\lib\api.ts"),
    (Join-Path $Root "frontend\lib\api\routes.ts")
)

foreach ($file in $paths) {
    if (-not (Test-Path $file)) {
        Write-Host "check-frontend-api-routes-wallet-verify: FAIL missing $file" -ForegroundColor Red
        exit 1
    }
    $text = Get-Content -Raw -LiteralPath $file
    foreach ($k in $keys) {
        if ($text -notmatch [regex]::Escape("${k}:")) {
            Write-Host "check-frontend-api-routes-wallet-verify: FAIL $file missing routes.$k" -ForegroundColor Red
            exit 1
        }
    }
}

# Path literals must match between SSOT tables
$apiTs = Get-Content -Raw -LiteralPath $paths[0]
$routesTs = Get-Content -Raw -LiteralPath $paths[1]
$expected = @{
    meWalletVerifyChallenge = '/api/v1/me/wallet/verify/challenge'
    meWalletVerifyConfirm = '/api/v1/me/wallet/verify/confirm'
    meWalletVerificationStatus = '/api/v1/me/wallet/verification-status'
}
foreach ($k in $keys) {
    $exp = $expected[$k]
    if ($apiTs -notmatch [regex]::Escape($exp)) {
        Write-Host "check-frontend-api-routes-wallet-verify: FAIL api.ts missing path $exp for $k" -ForegroundColor Red
        exit 1
    }
    if ($routesTs -notmatch [regex]::Escape($exp)) {
        Write-Host "check-frontend-api-routes-wallet-verify: FAIL routes.ts missing path $exp for $k" -ForegroundColor Red
        exit 1
    }
}

Write-Host "check-frontend-api-routes-wallet-verify: OK api.ts + api/routes.ts wallet-verify routes aligned"
exit 0
