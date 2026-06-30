# Seed guide@test.com public market walkthrough helpers (ASCII-only; safe for Windows PowerShell 5.1).
# Dot-source from post-start-api-abi-smoke.ps1 / verify-seed-test-accounts-login.ps1

$Script:SeedGuideEmail = 'guide@test.com'
$Script:SeedGuidePassword = 'Test123!'
$Script:HangzhouGuidesPath = '/api/v1/guides?city=%E6%9D%AD%E5%B7%9E&limit=50'

function Test-SeedGuidePublicMarketEnabled {
    if ($env:TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET -eq '1') { return $true }
    if ($env:TRAVELTRUST_MANUAL_ACCEPTANCE -eq '1') { return $true }
    return $false
}

function Get-SeedGuideUserId {
    param(
        [Parameter(Mandatory = $true)][string]$Base,
        [int]$TimeoutSec = 30
    )
    $loginBody = (@{ email = $Script:SeedGuideEmail; password = $Script:SeedGuidePassword } | ConvertTo-Json -Compress)
    $loginBytes = [System.Text.Encoding]::UTF8.GetBytes($loginBody)
    $loginResp = Invoke-WebRequest -Uri "$Base/auth/login" -Method Post -ContentType 'application/json; charset=utf-8' `
        -Body $loginBytes -TimeoutSec $TimeoutSec -UseBasicParsing
    $login = ($loginResp.Content | ConvertFrom-Json)
    $uid = [string]$login.user_id
    if ([string]::IsNullOrWhiteSpace($uid)) {
        $token = [string]$login.token
        if ([string]::IsNullOrWhiteSpace($token)) {
            throw 'POST /auth/login guide@test.com missing user_id and token'
        }
        $meResp = Invoke-WebRequest -Uri "$Base/api/v1/me" -Method Get -Headers @{ Authorization = "Bearer $token" } `
            -TimeoutSec $TimeoutSec -UseBasicParsing
        $me = ($meResp.Content | ConvertFrom-Json)
        if ($me.user) {
            $uid = [string]$me.user.id
        }
    }
    if ([string]::IsNullOrWhiteSpace($uid)) {
        throw 'POST /auth/login guide@test.com missing user_id (expected auth_login JSON user_id)'
    }
    return $uid
}

function Test-SeedGuideInHangzhouGuidesList {
    param(
        [Parameter(Mandatory = $true)][string]$Base,
        [Parameter(Mandatory = $true)][string]$SeedGuideUserId,
        [int]$TimeoutSec = 30
    )
    foreach ($path in @(
        '/api/v1/guides?city=%E6%9D%AD%E5%B7%9E&limit=50',
        '/api/v1/guides?city=Hangzhou&limit=50'
    )) {
        $raw = Invoke-RestMethod -Uri "$Base$path" -Method Get -TimeoutSec $TimeoutSec
        if ([string]$raw.status -ne 'ok') {
            throw "GET $path status=$($raw.status)"
        }
        foreach ($g in @($raw.items)) {
            if ([string]$g.user_id -eq $SeedGuideUserId) {
                return $true
            }
        }
    }
    return $false
}

function Test-GuideRowIsSeedWalkthrough {
    param(
        $GuideRow,
        [string]$SeedGuideUserId
    )
    if (-not (Test-SeedGuidePublicMarketEnabled)) { return $false }
    if ([string]::IsNullOrWhiteSpace($SeedGuideUserId)) { return $false }
    return ([string]$GuideRow.user_id -eq $SeedGuideUserId)
}

function Test-GuideRowShouldFailPublicCatalogSmoke {
    param(
        $GuideRow,
        [string]$SeedGuideUserId
    )
    if (Test-GuideRowIsSeedWalkthrough -GuideRow $GuideRow -SeedGuideUserId $SeedGuideUserId) {
        return $false
    }
    $city = [string]$GuideRow.city
    if ($city -eq 'Global') { return $true }
    $bio = [string]$GuideRow.bio
    if ($bio -match '(?i)smoke|demo|did rank|traveltrust\.test') { return $true }
    return $false
}
