# Verify SEED_TEST_ACCOUNTS · Step 6b5 (Immutable IDs C1 C2 C3 C4 E2).
# E1 (TrustGate catalog guide) is Step 6b4 — POST /auth/seed-trust-gate-e2e — NOT in 6b5.
# Registry: registry/test-accounts-business-immutable.v1.yaml

# When TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1 (start-api-with-seed default), also probes

# GET /guides?city=杭州 for C3 guide@test.com walkthrough row (normal market UI hand test).

# Usage: powershell -File scripts/dev/verify-seed-test-accounts-login.ps1 [-Port 8080] [-WarnOnly]

param(

    [int]$Port = 8080,

    [switch]$WarnOnly

)



$ErrorActionPreference = "Stop"

$base = "http://127.0.0.1:$Port"

. (Join-Path $PSScriptRoot 'seed-guide-public-market-probe.ps1')

$password = "Test123!"

function Invoke-SeedMatrixJsonPost {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][hashtable]$Payload,
        [int]$TimeoutSec = 30
    )
    $jsonBody = ($Payload | ConvertTo-Json -Compress)
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($jsonBody)
    $resp = Invoke-WebRequest -Uri $Uri -Method Post -ContentType "application/json; charset=utf-8" `
        -Body $bodyBytes -TimeoutSec $TimeoutSec -UseBasicParsing
    if ($resp.StatusCode -lt 200 -or $resp.StatusCode -ge 300) {
        throw "HTTP $($resp.StatusCode) $($resp.Content)"
    }
    return ($resp.Content | ConvertFrom-Json)
}

function Invoke-SeedMatrixJsonGet {
    param(
        [Parameter(Mandatory = $true)][string]$Uri,
        [Parameter(Mandatory = $true)][hashtable]$Headers,
        [int]$TimeoutSec = 30
    )
    $resp = Invoke-WebRequest -Uri $Uri -Method Get -Headers $Headers -TimeoutSec $TimeoutSec -UseBasicParsing
    if ($resp.StatusCode -lt 200 -or $resp.StatusCode -ge 300) {
        throw "HTTP $($resp.StatusCode) $($resp.Content)"
    }
    return ($resp.Content | ConvertFrom-Json)
}

$accounts = @(

    @{ matrix = "C2"; role = "tourist"; email = "tourist@test.com" },

    @{ matrix = "C3"; role = "guide"; email = "guide@test.com" },

    @{ matrix = "C4"; role = "merchant"; email = "merchant@test.com" },

    @{ matrix = "E2"; role = "provider-did-rank"; email = "provider-did-rank-demo@test.com" },

    @{ matrix = "C1"; role = "multi-demo"; email = "multi-demo@test.com" }

)



function Test-SeedLogin {

    param([string]$MatrixId, [string]$Email, [string]$RoleLabel)

    try {

        # Invoke-WebRequest + UTF-8 bytes: reliable on Windows PS 5.1 (Invoke-RestMethod string body → false 400)
        $r = Invoke-SeedMatrixJsonPost -Uri "$base/auth/login" -Payload @{ email = $Email; password = $password } -TimeoutSec 30

        if (-not $r.token) { throw "missing token" }

        $gotRole = [string]$r.role

        $headers = @{ Authorization = "Bearer $($r.token)" }

        $me = Invoke-SeedMatrixJsonGet -Uri "$base/api/v1/me" -Headers $headers -TimeoutSec 30

        $verifiedAt = $me.user.email_verified_at

        if (-not $verifiedAt) {

            throw "GET /api/v1/me missing user.email_verified_at (rebuild API + restart start-api-with-seed)"

        }

        Write-Host "verify-seed-accounts: OK Step 6b5 $MatrixId $RoleLabel $Email login role=$gotRole email_verified_at=$verifiedAt"

        return $true

    } catch {

        $msg = $_.Exception.Message

        if ($WarnOnly) {

            Write-Warning "verify-seed-accounts: WARN Step 6b5 $MatrixId $RoleLabel $Email login failed — $msg"

            return $false

        }

        Write-Host "verify-seed-accounts: FAIL Step 6b5 $MatrixId $RoleLabel $Email login — $msg" -ForegroundColor Red

        return $false

    }

}



function Test-SeedGuidePublicMarket {

    if (-not (Test-SeedGuidePublicMarketEnabled)) {

        Write-Host "verify-seed-accounts: SKIP market list probe (TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET not 1)"

        return $true

    }

    try {

        $seedUid = Get-SeedGuideUserId -Base $base -TimeoutSec 30

        if (-not (Test-SeedGuideInHangzhouGuidesList -Base $base -SeedGuideUserId $seedUid -TimeoutSec 30)) {

            throw "C3 guide@test.com user_id=$seedUid not in GET /guides?city=Hangzhou (TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1; restart API via start-api-with-seed)"

        }

        Write-Host "verify-seed-accounts: OK Step 6b5 C3 guide@test.com visible in Hangzhou guides list (Chain B /market UI)"

        return $true

    } catch {

        $msg = $_.Exception.Message

        if ($WarnOnly) {

            Write-Warning "verify-seed-accounts: WARN Step 6b5 C3 market list probe — $msg"

            return $false

        }

        Write-Host "verify-seed-accounts: FAIL Step 6b5 C3 market list probe — $msg" -ForegroundColor Red

        return $false

    }

}



Write-Host "verify-seed-accounts: Step 6b5 matrix C2+C3+C4+E2+C1 probing $base/auth/login (SEED_TEST_ACCOUNTS=1)"

$ok = $true

foreach ($a in $accounts) {

    if (-not (Test-SeedLogin -MatrixId $a.matrix -Email $a.email -RoleLabel $a.role)) { $ok = $false }

}

if ($ok) {

    if (-not (Test-SeedGuidePublicMarket)) { $ok = $false }

}

if (-not $ok) {

    if ($WarnOnly) { exit 0 }

    Write-Host "verify-seed-accounts: FAIL Step 6b5 matrix C2 C3 C4 E2 C1 — retry POST /auth/seed-test-accounts or RESET_DOCKER_DB=1" -ForegroundColor Red

    exit 1

}

Write-Host "verify-seed-accounts: OK Step 6b5 matrix C2+C3+C4+E2+C1 (+ C3 market list when enabled)"

exit 0

