# Verify SEED_TEST_ACCOUNTS tourist + guide can POST /auth/login (manual acceptance preflight).
# When TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1 (start-api-with-seed default), also probes
# GET /guides?city=杭州 for guide@test.com walkthrough row (normal market UI hand test).
# Usage: powershell -File scripts/dev/verify-seed-test-accounts-login.ps1 [-Port 8080] [-WarnOnly]
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:$Port"
. (Join-Path $PSScriptRoot 'seed-guide-public-market-probe.ps1')
$password = "Test123!"
$accounts = @(
    @{ role = "tourist"; email = "tourist@test.com" },
    @{ role = "guide"; email = "guide@test.com" },
    @{ role = "merchant"; email = "merchant@test.com" },
    @{ role = "provider-did-rank"; email = "provider-did-rank-demo@test.com" },
    @{ role = "multi-demo"; email = "multi-demo@test.com" }
)

function Test-SeedLogin {
    param([string]$Email, [string]$RoleLabel)
    try {
        $body = @{ email = $Email; password = $password } | ConvertTo-Json
        $r = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" `
            -Body $body -TimeoutSec 30
        if (-not $r.token) { throw "missing token" }
        $gotRole = [string]$r.role
        $headers = @{ Authorization = "Bearer $($r.token)" }
        $me = Invoke-RestMethod -Uri "$base/api/v1/me" -Method Get -Headers $headers -TimeoutSec 30
        $verifiedAt = $me.user.email_verified_at
        if (-not $verifiedAt) {
            throw "GET /api/v1/me missing user.email_verified_at (rebuild API + restart start-api-with-seed)"
        }
        Write-Host "verify-seed-accounts: OK $RoleLabel $Email login role=$gotRole email_verified_at=$verifiedAt"
        return $true
    } catch {
        $msg = $_.Exception.Message
        if ($WarnOnly) {
            Write-Warning "verify-seed-accounts: WARN $RoleLabel $Email login failed — $msg"
            return $false
        }
        Write-Host "verify-seed-accounts: FAIL $RoleLabel $Email login — $msg" -ForegroundColor Red
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
            throw "guide@test.com user_id=$seedUid not in GET /guides?city=Hangzhou (TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1; restart API via start-api-with-seed)"
        }
        Write-Host "verify-seed-accounts: OK guide@test.com visible in Hangzhou guides list (normal /market UI)"
        return $true
    } catch {
        $msg = $_.Exception.Message
        if ($WarnOnly) {
            Write-Warning "verify-seed-accounts: WARN market list probe — $msg"
            return $false
        }
        Write-Host "verify-seed-accounts: FAIL market list probe — $msg" -ForegroundColor Red
        return $false
    }
}

Write-Host "verify-seed-accounts: probing $base/auth/login (SEED_TEST_ACCOUNTS=1)"
$ok = $true
foreach ($a in $accounts) {
    if (-not (Test-SeedLogin -Email $a.email -RoleLabel $a.role)) { $ok = $false }
}
if ($ok) {
    if (-not (Test-SeedGuidePublicMarket)) { $ok = $false }
}
if (-not $ok) {
    if ($WarnOnly) { exit 0 }
    Write-Host "verify-seed-accounts: FAIL — retry POST /auth/seed-test-accounts or RESET_DOCKER_DB=1" -ForegroundColor Red
    exit 1
}
Write-Host "verify-seed-accounts: OK tourist + guide + merchant + provider-did-rank-demo + multi-demo (+ market list when enabled)"
exit 0
