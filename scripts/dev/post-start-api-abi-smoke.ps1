# Post-start API / ABI alignment smoke (55-S13 companion · PH-1 page-brief v6 · meta 728 lite).

# Aligns with META_ROOT_TOP_KEYS in crates/api health_meta/meta_contract_keys.rs (37 keys incl. governance/807).

# Usage: powershell -File scripts/dev/post-start-api-abi-smoke.ps1 -Port 8080

param(

    [int]$Port = 8080,

    [int]$MetaTimeoutSec = 120,

    [int]$BriefTimeoutSec = 30,

    [switch]$DeepVerify

)



$ErrorActionPreference = "Stop"

# Plan A · multi-demo steward seed wallet (Anvil deployer · aligns auth.rs MULTI_DEMO_WALLET)
$MultiDemoStewardWallet = "0x104FCb93B5e097F92c93Ee4621C487C6C953D212"

if ($env:REQUEST_TIMEOUT_SECS -match '^\d+$') {

    $MetaTimeoutSec = [Math]::Max($MetaTimeoutSec, [int]$env:REQUEST_TIMEOUT_SECS)

}

if ($env:TRAVELTRUST_POST_START_DEEP_VERIFY -eq '1') {

    $DeepVerify = $true

}



$base = "http://127.0.0.1:$Port"
. (Join-Path $PSScriptRoot 'seed-guide-public-market-probe.ps1')

function Read-RootDotEnvValue {
    param([string]$Key)
    $root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
    $envPath = Join-Path $root ".env"
    if (-not (Test-Path -LiteralPath $envPath)) { return $null }
    foreach ($line in Get-Content -LiteralPath $envPath -Encoding UTF8) {
        $t = $line.Trim()
        if ($t -match '^\s*#' -or $t -eq '') { continue }
        if ($t -match "^\s*$([regex]::Escape($Key))\s*=\s*(.*)$") {
            $v = $Matches[1].Trim()
            if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Substring(1, $v.Length - 2) }
            return $v
        }
    }
    return $null
}

function Get-InternalApiSecretHeaders {
    $secret = $env:INTERNAL_API_SECRET
    if ([string]::IsNullOrWhiteSpace($secret)) {
        $secret = Read-RootDotEnvValue "INTERNAL_API_SECRET"
    }
    if ([string]::IsNullOrWhiteSpace($secret)) { return @{} }
    return @{ "X-Internal-Api-Secret" = $secret.Trim() }
}

$script:MetaTopKeys728 = @(

    "service", "api_version", "build", "chain", "rate_limits", "database_connected", "database", "dual_write", "strict_mode",

    "ssot_version", "ssot", "admin_exports", "chargeback_policy", "finality_n", "indexer", "authority", "pause",

    "evidence", "order_messages", "reviews", "dispute_open", "dispute_resolve", "itineraries", "orders", "discover",

    "product_countries", "did_rank", "product_roles", "auth", "seed_test_accounts", "guides", "governance",

    "idempotency_cache", "defaults", "outbox", "meta_top_keys", "meta_top_keys_contract_728"

)

$script:GovernanceTopKeys807 = @(

    "strict_db_write", "rule", "governor_view_params_observability",

    "governor_token_timelock_observability", "timelock_delay_observability",

    "governor_proposal_threshold_observability", "timelock_governor_admin_observability",

    "governor_proposal_count_observability", "governance_top_keys", "governance_top_keys_contract_807"

)

$script:PageBriefSectionsV6 = @("pulse", "hero", "roles", "liquidity", "trust", "settlement", "faq", "start")

$script:PageBriefAnalyticsV6 = @(

    "traveltrust_plan_trip_click",

    "traveltrust_role_enter_click",

    "traveltrust_role_tab_click",

    "traveltrust_role_video_play",

    "traveltrust_scroll_to_roles",

    "traveltrust_secondary_cta_click",

    "traveltrust_globe_pin_click"

)



function Fail-Smoke {

    param([string]$Msg)

    Write-Host "post-start-api-abi-smoke: FAIL $Msg" -ForegroundColor Red

    exit 1

}



function Ok-Smoke {

    param([string]$Msg)

    Write-Host "post-start-api-abi-smoke: OK $Msg"

}



function Test-MetaJsonNumber([object]$v) {

    return ($v -is [int]) -or ($v -is [long]) -or ($v -is [double]) -or ($v -is [decimal])

}



function Invoke-GetOk {

    param(

        [string]$Path,

        [int]$TimeoutSec,

        [string]$Label,

        [hashtable]$ExtraHeaders = @{}

    )

    $uri = "$base$Path"
    $params = @{
        Uri = $uri
        UseBasicParsing = $true
        TimeoutSec = $TimeoutSec
    }
    if ($ExtraHeaders.Count -gt 0) { $params.Headers = $ExtraHeaders }

    try {

        $r = Invoke-WebRequest @params

        if ($r.StatusCode -ne 200) {

            Fail-Smoke "$Label HTTP $($r.StatusCode) $uri"

        }

        Ok-Smoke "$Label HTTP 200"

        return $r.Content

    }

    catch {

        Fail-Smoke "$Label $uri — $($_.Exception.Message)"

    }

}



function Assert-MetaAbiLite {

    param($Meta)

    if ([string]$Meta.service -ne "traveltrust-api") {

        Fail-Smoke "/meta .service expected traveltrust-api, got '$($Meta.service)'"

    }

    Ok-Smoke "/meta .service=traveltrust-api"



    if ($null -eq $Meta.dual_write) { Fail-Smoke "/meta .dual_write missing" }

    $fp = [string]$Meta.dual_write.failure_policy

    if ($fp -notin @("log_only", "strict_503", "alert_only")) {

        Fail-Smoke "/meta .dual_write.failure_policy invalid: $fp"

    }

    if ($Meta.dual_write.strict_db_write_any -isnot [bool]) {

        Fail-Smoke "/meta .dual_write.strict_db_write_any must be boolean"

    }

    Ok-Smoke "/meta .dual_write (failure_policy, strict_db_write_any)"



    if ($null -eq $Meta.indexer) { Fail-Smoke "/meta .indexer missing" }

    $icp = $Meta.indexer.checkpoint

    if ($null -eq $icp) { Fail-Smoke "/meta .indexer.checkpoint missing" }

    if ([string]$icp.source -notin @("runtime", "startup_snapshot")) {

        Fail-Smoke "/meta .indexer.checkpoint.source invalid: $($icp.source)"

    }

    if (-not (Test-MetaJsonNumber $icp.block_number)) {

        Fail-Smoke "/meta .indexer.checkpoint.block_number must be numeric"

    }

    if (-not (Test-MetaJsonNumber $icp.log_index)) {

        Fail-Smoke "/meta .indexer.checkpoint.log_index must be numeric"

    }

    Ok-Smoke "/meta .indexer.checkpoint (source, block_number, log_index)"



    $m728 = $Meta.meta_top_keys

    if ($null -eq $m728 -or @($m728).Count -ne 37) {

        Fail-Smoke "/meta .meta_top_keys must be length 37 (728/807 governance), got $(if ($m728) { @($m728).Count } else { 'null' })"

    }

    for ($i = 0; $i -lt 37; $i++) {

        if ([string]$m728[$i] -ne $script:MetaTopKeys728[$i]) {

            Fail-Smoke "/meta .meta_top_keys[$i] expected $($script:MetaTopKeys728[$i]) (728), got $($m728[$i])"

        }

    }

    $sb728 = [string]$Meta.meta_top_keys_contract_728

    if ($sb728 -notlike '*728*' -or $sb728 -notlike '*service*' -or $sb728 -notlike '*indexer*' -or $sb728 -notlike '*database*') {

        Fail-Smoke "/meta .meta_top_keys_contract_728 must mention 728 and embed service/indexer/database"

    }

    Ok-Smoke "/meta meta_top_keys (728/37) + meta_top_keys_contract_728"



    if ($null -eq $Meta.database) { Fail-Smoke "/meta .database missing (760)" }

    $db760 = $Meta.database.database_top_keys

    $db760Exp = @("connected", "rule", "database_top_keys", "database_top_keys_contract_760")

    if ($null -eq $db760 -or @($db760).Count -ne 4) {

        Fail-Smoke "/meta .database.database_top_keys must be length 4 (760)"

    }

    for ($i = 0; $i -lt 4; $i++) {

        if ([string]$db760[$i] -ne $db760Exp[$i]) {

            Fail-Smoke "/meta .database.database_top_keys[$i] expected $($db760Exp[$i]) (760), got $($db760[$i])"

        }

    }

    Ok-Smoke "/meta .database.database_top_keys (760)"



    if ($null -eq $Meta.governance) { Fail-Smoke "/meta .governance missing (807)" }

    $g807 = $Meta.governance.governance_top_keys

    if ($null -eq $g807 -or @($g807).Count -ne 10) {

        Fail-Smoke "/meta .governance.governance_top_keys must be length 10 (807), got $(if ($g807) { @($g807).Count } else { 'null' })"

    }

    for ($i = 0; $i -lt 10; $i++) {

        if ([string]$g807[$i] -ne $script:GovernanceTopKeys807[$i]) {

            Fail-Smoke "/meta .governance.governance_top_keys[$i] expected $($script:GovernanceTopKeys807[$i]) (807), got $($g807[$i])"

        }

    }

    $sb807 = [string]$Meta.governance.governance_top_keys_contract_807

    if ($sb807 -notlike '*807*' -or $sb807 -notlike '*governance_top_keys*') {

        Fail-Smoke "/meta .governance.governance_top_keys_contract_807 must mention 807 and governance_top_keys"

    }

    Ok-Smoke "/meta governance_top_keys (807/10) + governance_top_keys_contract_807"

}



function Assert-PageBriefAbi {

    param($Brief)

    if ([string]$Brief.status -ne "ok") {

        Fail-Smoke "page-brief .status expected ok, got '$($Brief.status)'"

    }

    $ia = [string]$Brief.page.ia_version

    if ($ia -ne "v6") {

        Fail-Smoke "page-brief ia_version='$ia' expected v6 (FE TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK must match crates/api)"

    }

    if ([string]$Brief.page.canonical_path -ne "/traveltrust") {

        Fail-Smoke "page-brief canonical_path expected /traveltrust, got '$($Brief.page.canonical_path)'"

    }

    $sections = @($Brief.page.sections)

    if ($sections.Count -ne 8) {

        Fail-Smoke "page-brief sections expected 8 v6 anchors, got $($sections.Count)"

    }

    for ($i = 0; $i -lt 8; $i++) {

        if ([string]$sections[$i] -ne $script:PageBriefSectionsV6[$i]) {

            Fail-Smoke "page-brief sections[$i] expected $($script:PageBriefSectionsV6[$i]), got $($sections[$i])"

        }

    }

    if ([string]$Brief.allocation_ssot.protocol_reference_path -ne "/api/v1/governance/protocol-reference") {

        Fail-Smoke "page-brief allocation_ssot.protocol_reference_path mismatch"

    }

    $anchors = @($Brief.cta_contract.in_page_anchors)

    if ($anchors.Count -lt 7) {

        Fail-Smoke "page-brief cta_contract.in_page_anchors expected >=7, got $($anchors.Count)"

    }

    $events = @($Brief.cta_contract.analytics_events)

    if ($events.Count -ne 7) {

        Fail-Smoke "page-brief analytics_events expected 7 v6 events, got $($events.Count)"

    }

    for ($i = 0; $i -lt 7; $i++) {

        if ([string]$events[$i] -ne $script:PageBriefAnalyticsV6[$i]) {

            Fail-Smoke "page-brief analytics_events[$i] expected $($script:PageBriefAnalyticsV6[$i]), got $($events[$i])"

        }

    }

    $lc = $Brief.liquidity_contract

    if ($null -eq $lc) { Fail-Smoke "page-brief liquidity_contract missing (v6 ABI)" }

    if ([int]$lc.schema_version -ne 1) {

        Fail-Smoke "page-brief liquidity_contract.schema_version expected 1, got $($lc.schema_version)"

    }

    if ([string]$lc.receive_symbol -ne "TTG") {

        Fail-Smoke "page-brief liquidity_contract.receive_symbol expected TTG, got '$($lc.receive_symbol)'"

    }

    Ok-Smoke "page-brief v6 (sections, anchors, analytics_events, liquidity_contract)"

}



function Invoke-GetFlexible {

    param(

        [string]$Path,

        [int[]]$AllowedStatus,

        [int]$TimeoutSec,

        [string]$Label

    )

    $uri = "$base$Path"

    $request = [System.Net.HttpWebRequest]::Create($uri)

    $request.Method = "GET"

    $request.Timeout = $TimeoutSec * 1000

    $request.UserAgent = "post-start-api-abi-smoke"

    try {

        $response = $request.GetResponse()

        try {

            $code = [int]$response.StatusCode

            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())

            $body = $reader.ReadToEnd()

            $reader.Close()

        }

        finally {

            $response.Close()

        }

        if ($AllowedStatus -notcontains $code) {

            Fail-Smoke "$Label $uri expected HTTP $($AllowedStatus -join '|') got $code"

        }

        return @{ Code = $code; Body = $body }

    }

    catch [System.Net.WebException] {

        $resp = $_.Exception.Response

        if ($null -eq $resp) {

            Fail-Smoke "$Label $uri — $($_.Exception.Message)"

        }

        $code = [int]$resp.StatusCode

        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())

        $body = $reader.ReadToEnd()

        $reader.Close()

        $resp.Close()

        if ($AllowedStatus -notcontains $code) {

            Fail-Smoke "$Label $uri expected HTTP $($AllowedStatus -join '|') got $code"

        }

        return @{ Code = $code; Body = $body }

    }

}



function Invoke-PostJsonCurlFallback {
    param(
        [string]$Uri,
        [string]$BodyJson,
        [hashtable]$ExtraHeaders = @{},
        [string]$Label
    )
    $curlExe = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curlExe) {
        Fail-Smoke "$Label $Uri — no HTTP response and curl.exe not on PATH"
    }
    $args = @(
        '-sS', '-w', '|%{http_code}', '-X', 'POST', $Uri,
        '-H', 'Content-Type: application/json'
    )
    foreach ($hk in $ExtraHeaders.Keys) {
        $args += @('-H', "$($hk): $($ExtraHeaders[$hk])")
    }
    $args += @('--data', $BodyJson)
    $raw = (& curl.exe @args 2>&1 | Out-String).TrimEnd()
    if ($raw -notmatch '\|(\d{3})$') {
        Fail-Smoke "$Label curl fallback unexpected output: $raw"
    }
    $code = [int]$Matches[1]
    $body = $raw.Substring(0, $raw.Length - $Matches[0].Length)
    return @{ Code = $code; Body = $body }
}

function Invoke-PostJson {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$BodyJson,
        [hashtable]$ExtraHeaders = @{},
        [int]$TimeoutSec = 30,
        [Parameter(Mandatory = $true)][string]$Label
    )
    if ([string]::IsNullOrWhiteSpace($Path) -or -not $Path.StartsWith("/")) {
        Fail-Smoke "$Label invalid Path '$Path' (must start with /)"
    }
    $uri = "$base$Path"
    $webHeaders = @{}
    foreach ($hk in $ExtraHeaders.Keys) { $webHeaders[$hk] = [string]$ExtraHeaders[$hk] }

    if ($PSVersionTable.PSVersion.Major -ge 7) {
        try {
            $r = Invoke-WebRequest -Uri $uri -Method Post -Body $BodyJson -ContentType 'application/json' `
                -Headers $webHeaders -TimeoutSec $TimeoutSec -UseBasicParsing -SkipHttpErrorCheck
            return @{ Code = [int]$r.StatusCode; Body = $r.Content }
        } catch {
            return Invoke-PostJsonCurlFallback -Uri $uri -BodyJson $BodyJson -ExtraHeaders $ExtraHeaders -Label $Label
        }
    }

    try {
        $r = Invoke-WebRequest -Uri $uri -Method Post -Body $BodyJson -ContentType 'application/json' `
            -Headers $webHeaders -TimeoutSec $TimeoutSec -UseBasicParsing
        return @{ Code = [int]$r.StatusCode; Body = $r.Content }
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($null -ne $resp) {
            $code = [int]$resp.StatusCode
            $sr = New-Object System.IO.StreamReader($resp.GetResponseStream())
            $body = $sr.ReadToEnd()
            $sr.Close()
            $resp.Close()
            return @{ Code = $code; Body = $body }
        }
        return Invoke-PostJsonCurlFallback -Uri $uri -BodyJson $BodyJson -ExtraHeaders $ExtraHeaders -Label $Label
    } catch {
        return Invoke-PostJsonCurlFallback -Uri $uri -BodyJson $BodyJson -ExtraHeaders $ExtraHeaders -Label $Label
    }
}

function Assert-WalletVerifyChainOff {
    $login = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"tourist@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login"
    if ($login.Code -ne 200) {
        Fail-Smoke "POST /auth/login expected 200 for seed tourist@test.com, got $($login.Code) (SEED_TEST_ACCOUNTS=1?)"
    }
    try {
        $loginObj = $login.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login JSON parse failed: $_"
    }
    $token = [string]$loginObj.token
    if ([string]::IsNullOrWhiteSpace($token)) {
        Fail-Smoke "POST /auth/login missing token (STRICT_SESSION_GATE needs Bearer for wallet verify)"
    }
    Ok-Smoke "POST /auth/login seed tourist (Bearer for wallet verify)"

    $wallet = "0x4a62316623ad457F02cDC5D997deD67a383EC569"
    $chalBody = (@{ wallet_address = $wallet } | ConvertTo-Json -Compress)
    $chal = Invoke-PostJson -Path "/api/v1/me/wallet/verify/challenge" -BodyJson $chalBody -ExtraHeaders @{ Authorization = "Bearer $token" } -TimeoutSec 30 -Label "POST /me/wallet/verify/challenge"
    if ($chal.Code -ne 200) {
        Fail-Smoke "POST /me/wallet/verify/challenge expected 200, got $($chal.Code) (chain_off mounted?)"
    }
    try {
        $chalObj = $chal.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "wallet verify challenge JSON parse failed: $_"
    }
    if ([string]$chalObj.status -ne "ok") {
        Fail-Smoke "wallet verify challenge .status expected ok, got '$($chalObj.status)'"
    }
    if ([string]::IsNullOrWhiteSpace([string]$chalObj.challenge_id)) {
        Fail-Smoke "wallet verify challenge missing challenge_id"
    }
    if ([string]::IsNullOrWhiteSpace([string]$chalObj.message)) {
        Fail-Smoke "wallet verify challenge missing message (FE signMessageAsync)"
    }
    Ok-Smoke "POST /me/wallet/verify/challenge (steward/guide register step 2 SSOT)"
}

function Invoke-HttpFlexible {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [int[]]$AllowedStatus,
        [int]$TimeoutSec,
        [string]$Label,
        [hashtable]$ExtraHeaders = @{}
    )
    $uri = "$base$Path"
    $request = [System.Net.HttpWebRequest]::Create($uri)
    $request.Method = $Method
    $request.Timeout = $TimeoutSec * 1000
    $request.UserAgent = "post-start-api-abi-smoke"
    foreach ($hk in $ExtraHeaders.Keys) {
        $request.Headers[$hk] = [string]$ExtraHeaders[$hk]
    }
    try {
        $response = $request.GetResponse()
        try {
            $code = [int]$response.StatusCode
            $reader = New-Object System.IO.StreamReader($response.GetResponseStream())
            $body = $reader.ReadToEnd()
            $reader.Close()
        } finally {
            $response.Close()
        }
        if ($AllowedStatus -notcontains $code) {
            Fail-Smoke "$Label $uri expected HTTP $($AllowedStatus -join '|') got $code"
        }
        return @{ Code = $code; Body = $body }
    } catch [System.Net.WebException] {
        $resp = $_.Exception.Response
        if ($null -eq $resp) {
            Fail-Smoke "$Label $uri — $($_.Exception.Message)"
        }
        $code = [int]$resp.StatusCode
        $reader = New-Object System.IO.StreamReader($resp.GetResponseStream())
        $body = $reader.ReadToEnd()
        $reader.Close()
        $resp.Close()
        if ($AllowedStatus -notcontains $code) {
            Fail-Smoke "$Label $uri expected HTTP $($AllowedStatus -join '|') got $code"
        }
        return @{ Code = $code; Body = $body }
    }
}

function Assert-MeSecuritySessionsAndNotifications {
    $unauthWallets = Invoke-HttpFlexible -Path "/api/v1/me/wallets" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /me/wallets unauth"
    if ($unauthWallets.Code -ne 401) {
        Fail-Smoke "GET /me/wallets without Bearer expected 401, got $($unauthWallets.Code)"
    }
    Ok-Smoke "GET /me/wallets mounted (401 without session)"

    $unauthRoleApps = Invoke-HttpFlexible -Path "/api/v1/me/role-applications" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /me/role-applications unauth"
    if ($unauthRoleApps.Code -ne 401) {
        Fail-Smoke "GET /me/role-applications without Bearer expected 401, got $($unauthRoleApps.Code)"
    }
    Ok-Smoke "GET /me/role-applications mounted (401 without session)"

    foreach ($idPath in @(
        "/api/v1/me/guide-profile",
        "/api/v1/me/merchant-profile",
        "/api/v1/me/region-steward-profile",
        "/api/v1/me/acquisition-profile"
    )) {
        $unauthProfile = Invoke-HttpFlexible -Path $idPath -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET $idPath unauth"
        if ($unauthProfile.Code -ne 401) {
            Fail-Smoke "GET $idPath without Bearer expected 401, got $($unauthProfile.Code)"
        }
    }
    Ok-Smoke "GET /me/*-profile x4 mounted (401 without session)"

    $unauthSessions = Invoke-HttpFlexible -Path "/api/v1/me/sessions" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /me/sessions unauth"
    if ($unauthSessions.Code -ne 401) {
        Fail-Smoke "GET /me/sessions without Bearer expected 401, got $($unauthSessions.Code)"
    }
    Ok-Smoke "GET /me/sessions mounted (401 without session)"

    $unauthNotif = Invoke-HttpFlexible -Path "/api/v1/me/security-notifications?limit=5" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /me/security-notifications unauth"
    if ($unauthNotif.Code -ne 401) {
        Fail-Smoke "GET /me/security-notifications without Bearer expected 401, got $($unauthNotif.Code)"
    }
    Ok-Smoke "GET /me/security-notifications mounted (401 without session)"

    $delCurrent = Invoke-HttpFlexible -Path "/api/v1/me/sessions/current" -Method "DELETE" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "DELETE /me/sessions/current unauth"
    if ($delCurrent.Code -ne 401) {
        Fail-Smoke "DELETE /me/sessions/current without Bearer expected 401, got $($delCurrent.Code)"
    }
    Ok-Smoke "DELETE /me/sessions/current mounted (401 without session)"

    $login = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"tourist@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login (me security)"
    if ($login.Code -ne 200) {
        Fail-Smoke "POST /auth/login expected 200 for seed tourist@test.com, got $($login.Code)"
    }
    try {
        $loginObj = $login.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login JSON parse failed: $_"
    }
    $token = [string]$loginObj.token
    if ([string]::IsNullOrWhiteSpace($token)) {
        Fail-Smoke "POST /auth/login missing token for me/sessions smoke"
    }

    $authHdr = @{ Authorization = "Bearer $token" }
    $sessRaw = Invoke-HttpFlexible -Path "/api/v1/me/sessions" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/sessions auth" -ExtraHeaders $authHdr
    try {
        $sessObj = $sessRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/sessions JSON parse failed: $_"
    }
    if ($null -eq $sessObj.items) {
        Fail-Smoke "GET /me/sessions missing .items array"
    }
    if (@($sessObj.items).Count -lt 1) {
        Fail-Smoke "GET /me/sessions expected at least 1 session after login"
    }
    Ok-Smoke "GET /me/sessions auth (count=$(@($sessObj.items).Count))"

    $notifRaw = Invoke-HttpFlexible -Path "/api/v1/me/security-notifications?limit=10" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/security-notifications auth" -ExtraHeaders $authHdr
    try {
        $notifObj = $notifRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/security-notifications JSON parse failed: $_"
    }
    if ($null -eq $notifObj.items) {
        Fail-Smoke "GET /me/security-notifications missing .items array"
    }
    Ok-Smoke "GET /me/security-notifications auth (count=$(@($notifObj.items).Count))"

    $walletsRaw = Invoke-HttpFlexible -Path "/api/v1/me/wallets" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/wallets auth" -ExtraHeaders $authHdr
    try {
        $walletsObj = $walletsRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/wallets JSON parse failed: $_"
    }
    if ($null -eq $walletsObj.wallets) {
        Fail-Smoke "GET /me/wallets missing .wallets array"
    }
    Ok-Smoke "GET /me/wallets auth (count=$(@($walletsObj.wallets).Count))"

    $roleAppsRaw = Invoke-HttpFlexible -Path "/api/v1/me/role-applications" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/role-applications auth" -ExtraHeaders $authHdr
    try {
        $roleAppsObj = $roleAppsRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/role-applications JSON parse failed: $_"
    }
    if ($null -eq $roleAppsObj.applications) {
        Fail-Smoke "GET /me/role-applications missing .applications array"
    }
    Ok-Smoke "GET /me/role-applications auth (count=$(@($roleAppsObj.applications).Count))"

    $acqRaw = Invoke-HttpFlexible -Path "/api/v1/me/acquisition-profile" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/acquisition-profile auth" -ExtraHeaders $authHdr
    try {
        $acqObj = $acqRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/acquisition-profile JSON parse failed: $_"
    }
    if ([string]$acqObj.status -ne "ok") {
        Fail-Smoke "GET /me/acquisition-profile .status expected ok, got '$($acqObj.status)'"
    }
    Ok-Smoke "GET /me/acquisition-profile auth"

    $merchantRaw = Invoke-HttpFlexible -Path "/api/v1/me/merchant-profile" -AllowedStatus @(200, 404) -TimeoutSec $BriefTimeoutSec -Label "GET /me/merchant-profile auth" -ExtraHeaders $authHdr
    Ok-Smoke "GET /me/merchant-profile auth (HTTP $($merchantRaw.Code))"

    $stewardRaw = Invoke-HttpFlexible -Path "/api/v1/me/region-steward-profile" -AllowedStatus @(200, 404) -TimeoutSec $BriefTimeoutSec -Label "GET /me/region-steward-profile auth" -ExtraHeaders $authHdr
    Ok-Smoke "GET /me/region-steward-profile auth (HTTP $($stewardRaw.Code))"

    $guideLogin = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"guide@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login (guide profile)"
    if ($guideLogin.Code -ne 200) {
        Fail-Smoke "POST /auth/login guide@test.com expected 200, got $($guideLogin.Code)"
    }
    try {
        $guideLoginObj = $guideLogin.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login guide JSON parse failed: $_"
    }
    $guideToken = [string]$guideLoginObj.token
    if ([string]::IsNullOrWhiteSpace($guideToken)) {
        Fail-Smoke "POST /auth/login guide@test.com missing token"
    }
    $guideHdr = @{ Authorization = "Bearer $guideToken" }
    $guideProfRaw = Invoke-HttpFlexible -Path "/api/v1/me/guide-profile" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/guide-profile auth" -ExtraHeaders $guideHdr
    try {
        $guideProfObj = $guideProfRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/guide-profile JSON parse failed: $_"
    }
    if ([string]$guideProfObj.status -ne "ok") {
        Fail-Smoke "GET /me/guide-profile .status expected ok, got '$($guideProfObj.status)'"
    }
    Ok-Smoke "GET /me/guide-profile auth (guide@test.com)"

    $exitRaw = Invoke-HttpFlexible -Path "/api/v1/me/guide-exit-status" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/guide-exit-status guide@test" -ExtraHeaders $guideHdr
    if ($exitRaw.Code -eq 404) {
        Fail-Smoke "GET /me/guide-exit-status guide@test returned 404 — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    try {
        $exitObj = $exitRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/guide-exit-status JSON parse failed: $_"
    }
    if ([string]$exitObj.status -ne "ok") {
        Fail-Smoke "GET /me/guide-exit-status .status expected ok, got '$($exitObj.status)'"
    }
    if ($null -eq $exitObj.exit) {
        Fail-Smoke "GET /me/guide-exit-status missing .exit (guide_exit_v1)"
    }
    Ok-Smoke "GET /me/guide-exit-status guide@test.com (guide_exit_v1)"

    $merchantLogin = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"merchant@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login (merchant workbench)"
    if ($merchantLogin.Code -ne 200) {
        Fail-Smoke "POST /auth/login merchant@test.com expected 200 (SEED_TEST_ACCOUNTS=1), got $($merchantLogin.Code)"
    }
    try {
        $merchantLoginObj = $merchantLogin.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login merchant JSON parse failed: $_"
    }
    $merchantToken = [string]$merchantLoginObj.token
    if ([string]::IsNullOrWhiteSpace($merchantToken)) {
        Fail-Smoke "POST /auth/login merchant@test.com missing token"
    }
    $merchantHdr = @{ Authorization = "Bearer $merchantToken" }
    $merchantProfRaw = Invoke-HttpFlexible -Path "/api/v1/me/merchant-profile" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/merchant-profile merchant@test" -ExtraHeaders $merchantHdr
    if ($merchantProfRaw.Code -eq 404) {
        Fail-Smoke "GET /me/merchant-profile merchant@test returned 404 — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    Ok-Smoke "GET /me/merchant-profile merchant@test.com"

    $mlSumRaw = Invoke-HttpFlexible -Path "/api/v1/me/merchant-listings-summary" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/merchant-listings-summary merchant@test" -ExtraHeaders $merchantHdr
    if ($mlSumRaw.Code -eq 404) {
        Fail-Smoke "GET /me/merchant-listings-summary merchant@test returned 404 — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    Ok-Smoke "GET /me/merchant-listings-summary merchant@test.com"

    $mlRaw = Invoke-HttpFlexible -Path "/api/v1/me/merchant-listings" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/merchant-listings merchant@test" -ExtraHeaders $merchantHdr
    if ($mlRaw.Code -eq 404) {
        Fail-Smoke "GET /me/merchant-listings merchant@test returned 404 — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    try {
        $mlObj = $mlRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/merchant-listings JSON parse failed: $_"
    }
    if ($null -eq $mlObj.published -or $null -eq $mlObj.drafts) {
        Fail-Smoke "GET /me/merchant-listings missing published[] or drafts[] (me_merchant_listings_v1)"
    }
    Ok-Smoke "GET /me/merchant-listings merchant@test.com (me_merchant_listings_v1)"
}

function Assert-MultiDemoIdentityProbe {
    $login = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"multi-demo@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login (multi-demo L3)"
    if ($login.Code -ne 200) {
        Fail-Smoke "POST /auth/login multi-demo@test.com expected 200 (SEED_TEST_ACCOUNTS=1), got $($login.Code)"
    }
    try {
        $loginObj = $login.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login multi-demo JSON parse failed: $_"
    }
    $token = [string]$loginObj.token
    if ([string]::IsNullOrWhiteSpace($token)) {
        Fail-Smoke "POST /auth/login multi-demo missing token"
    }
    $hdr = @{ Authorization = "Bearer $token" }
    $meRaw = Invoke-HttpFlexible -Path "/api/v1/me" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me multi-demo" -ExtraHeaders $hdr
    try {
        $me = $meRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me multi-demo JSON parse failed: $_"
    }
    if ($null -eq $me.identity_slots) {
        Fail-Smoke "GET /me multi-demo missing identity_slots[]"
    }
    foreach ($slotId in @("guide", "merchant", "region_steward")) {
        $slot = @($me.identity_slots) | Where-Object { [string]$_.id -eq $slotId } | Select-Object -First 1
        if (-not $slot) {
            Fail-Smoke "GET /me multi-demo missing identity_slots id=$slotId"
        }
        if ([string]$slot.state -ne "active") {
            Fail-Smoke "GET /me multi-demo identity_slots.$slotId expected active, got '$($slot.state)'"
        }
    }
    Ok-Smoke "GET /me multi-demo identity_slots guide+merchant+region_steward active"

    foreach ($profPath in @(
        "/api/v1/me/guide-profile",
        "/api/v1/me/merchant-profile",
        "/api/v1/me/region-steward-profile",
        "/api/v1/me/acquisition-profile"
    )) {
        $prof = Invoke-HttpFlexible -Path $profPath -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET $profPath multi-demo" -ExtraHeaders $hdr
        if ($prof.Code -ne 200) {
            Fail-Smoke "GET $profPath multi-demo expected 200, got $($prof.Code)"
        }
    }
    Ok-Smoke "GET /me/*-profile x4 multi-demo auth (slot RBAC L3)"

    $stAppRaw = Invoke-HttpFlexible -Path "/api/v1/me/steward-application" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/steward-application multi-demo" -ExtraHeaders $hdr
    try {
        $stAppObj = $stAppRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/steward-application multi-demo JSON parse failed: $_"
    }
    if ([string]$stAppObj.status -ne "ok") {
        Fail-Smoke "GET /me/steward-application multi-demo .status expected ok, got '$($stAppObj.status)'"
    }
    if ($null -eq $stAppObj.application) {
        Fail-Smoke "GET /me/steward-application multi-demo missing .application (seed approved steward)"
    }
    $appWallet = [string]$stAppObj.application.wallet_address
    if ($appWallet.ToLower() -ne $MultiDemoStewardWallet.ToLower()) {
        Fail-Smoke "GET /me/steward-application multi-demo wallet_address expected $MultiDemoStewardWallet, got '$appWallet' (re-seed: POST /auth/seed-test-accounts or RESET_DOCKER_DB=1)"
    }
    Ok-Smoke "GET /me/steward-application multi-demo (approved seed · wallet $MultiDemoStewardWallet)"

    $seatRaw = Invoke-HttpFlexible -Path "/api/v1/me/steward-seat" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/steward-seat multi-demo" -ExtraHeaders $hdr
    if ($seatRaw.Code -eq 404) {
        Fail-Smoke "GET /me/steward-seat multi-demo returned 404 — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    try {
        $seatObj = $seatRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/steward-seat multi-demo JSON parse failed: $_"
    }
    if ([string]$seatObj.status -ne "ok") {
        Fail-Smoke "GET /me/steward-seat multi-demo .status expected ok, got '$($seatObj.status)'"
    }
    if ($null -eq $seatObj.seat) {
        Fail-Smoke "GET /me/steward-seat multi-demo missing .seat (multi-demo has approved steward application)"
    }
    if ([string]$seatObj.seat.machine_code -ne "steward_seat") {
        Fail-Smoke "GET /me/steward-seat multi-demo .seat.machine_code expected steward_seat, got '$($seatObj.seat.machine_code)'"
    }
    Ok-Smoke "GET /me/steward-seat multi-demo (steward_seat_v1)"

    $pubRaw = Invoke-HttpFlexible -Path "/api/v1/me/publish-summary" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /me/publish-summary multi-demo" -ExtraHeaders $hdr
    if ($pubRaw.Code -eq 404) {
        Fail-Smoke "GET /me/publish-summary multi-demo returned 404 — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    try {
        $pubObj = $pubRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /me/publish-summary multi-demo JSON parse failed: $_"
    }
    if ([string]$pubObj.status -ne "ok") {
        Fail-Smoke "GET /me/publish-summary multi-demo .status expected ok, got '$($pubObj.status)'"
    }
    if ($null -eq $pubObj.counts) {
        Fail-Smoke "GET /me/publish-summary multi-demo missing .counts"
    }
    $impl = [string]$pubObj.meta.implementation_status
    if ($impl -ne "me_publish_summary_api_v1") {
        Fail-Smoke "GET /me/publish-summary multi-demo meta.implementation_status expected me_publish_summary_api_v1, got '$impl'"
    }
    Ok-Smoke "GET /me/publish-summary multi-demo (me_publish_summary_api_v1 · W1-A3)"
}

function Assert-CommunityAndProfileAvatarRoutes {
    $capRaw = Invoke-GetOk -Path "/api/v1/community/media/capabilities" -TimeoutSec $BriefTimeoutSec -Label "GET /community/media/capabilities"
    try {
        $cap = $capRaw | ConvertFrom-Json
    } catch {
        Fail-Smoke "community/media/capabilities JSON parse failed: $_"
    }
    if ([string]$cap.status -notin @("ok", "degraded")) {
        Fail-Smoke "media/capabilities .status expected ok|degraded, got '$($cap.status)'"
    }
    if ($cap.multipart_enabled -isnot [bool]) {
        Fail-Smoke "media/capabilities multipart_enabled must be boolean"
    }
    Ok-Smoke "GET /community/media/capabilities (status=$($cap.status) multipart=$($cap.multipart_enabled))"

    $feedRaw = Invoke-GetOk -Path "/api/v1/community/feed?limit=5" -TimeoutSec $BriefTimeoutSec -Label "GET /community/feed"
    try {
        $feed = $feedRaw | ConvertFrom-Json
    } catch {
        Fail-Smoke "community/feed JSON parse failed: $_"
    }
    if ([string]$feed.status -ne "ok") {
        Fail-Smoke "community/feed .status expected ok, got '$($feed.status)'"
    }
    if ($null -eq $feed.posts) {
        Fail-Smoke "community/feed missing .posts array"
    }
    foreach ($row in @($feed.posts)) {
        if (-not ($row.PSObject.Properties.Name -contains "primary_media_asset_id")) {
            Fail-Smoke "community/feed post $($row.id) missing primary_media_asset_id key (04 A1 read path)"
        }
    }
    Ok-Smoke "GET /community/feed (posts array; count=$(@($feed.posts).Count); primary_media_asset_id key on rows)"

    $recRaw = Invoke-GetOk -Path "/api/v1/community/feed?mode=recommend&limit=5" -TimeoutSec $BriefTimeoutSec -Label "GET /community/feed recommend"
    try {
        $rec = $recRaw | ConvertFrom-Json
    } catch {
        Fail-Smoke "community/feed recommend JSON parse failed: $_"
    }
    if ([string]$rec.status -ne "ok") {
        Fail-Smoke "community/feed recommend .status expected ok, got '$($rec.status)'"
    }
    foreach ($row in @($rec.posts)) {
        if (-not ($row.PSObject.Properties.Name -contains "primary_media_asset_id")) {
            Fail-Smoke "community/feed recommend post $($row.id) missing primary_media_asset_id key"
        }
    }
    Ok-Smoke "GET /community/feed?mode=recommend (Explore SSOT; count=$(@($rec.posts).Count))"

    $ensureUnauth = Invoke-PostJson -Path "/api/v1/community/conversations/ensure" -BodyJson '{"peer_user_id":"00000000-0000-0000-0000-000000000001"}' -TimeoutSec 15 -Label "POST /community/conversations/ensure unauthenticated"
    if ($ensureUnauth.Code -ne 401) {
        Fail-Smoke "POST /community/conversations/ensure without Bearer expected 401, got $($ensureUnauth.Code)"
    }
    Ok-Smoke "POST /community/conversations/ensure mounted (401 without session)"

    $presignUnauth = Invoke-PostJson -Path "/api/v1/me/profile-avatar/presign" -BodyJson '{"content_type":"image/jpeg"}' -TimeoutSec 15 -Label "POST /me/profile-avatar/presign unauthenticated"
    if ($presignUnauth.Code -ne 401) {
        Fail-Smoke "POST /me/profile-avatar/presign without Bearer expected 401, got $($presignUnauth.Code)"
    }
    $commitUnauth = Invoke-PostJson -Path "/api/v1/me/profile-avatar/commit" -BodyJson '{"avatar_url":"/api/v1/uploads/profile-avatars/smoke.jpg"}' -TimeoutSec 15 -Label "POST /me/profile-avatar/commit unauthenticated"
    if ($commitUnauth.Code -ne 401) {
        Fail-Smoke "POST /me/profile-avatar/commit without Bearer expected 401, got $($commitUnauth.Code)"
    }
    Ok-Smoke "POST /me/profile-avatar/presign + /commit mounted (401 without session)"
}

function Assert-MarketHubPublicRead {
    $discRaw = Invoke-GetOk -Path "/api/v1/discover/orders?limit=10" -TimeoutSec $BriefTimeoutSec -Label "GET /api/v1/discover/orders"
    try {
        $disc = $discRaw | ConvertFrom-Json
    } catch {
        Fail-Smoke "discover/orders JSON parse failed: $_"
    }
    if ([string]$disc.status -ne "ok") {
        Fail-Smoke "discover/orders .status expected ok, got '$($disc.status)'"
    }
    if ($null -eq $disc.items) {
        Fail-Smoke "discover/orders missing .items array (useMarketPage / getDiscoverOrders)"
    }

    $guidesRaw = Invoke-GetOk -Path "/api/v1/guides" -TimeoutSec $BriefTimeoutSec -Label "GET /api/v1/guides"
    try {
        $guides = $guidesRaw | ConvertFrom-Json
    } catch {
        Fail-Smoke "guides JSON parse failed: $_"
    }
    if ([string]$guides.status -ne "ok") {
        Fail-Smoke "guides .status expected ok, got '$($guides.status)'"
    }
    if ($null -eq $guides.items) {
        Fail-Smoke "guides missing .items array (useMarketPage / getGuides)"
    }
    $nOrders = @($disc.items).Count
    $nGuides = @($guides.items).Count

    $seedGuideUserId = $null
    if (Test-SeedGuidePublicMarketEnabled) {
        try {
            $seedGuideUserId = Get-SeedGuideUserId -Base $base -TimeoutSec $BriefTimeoutSec
        } catch {
            Fail-Smoke "seed guide login for public catalog probe failed: $_"
        }
    }

    foreach ($g in @($guides.items)) {
        if (Test-GuideRowShouldFailPublicCatalogSmoke -GuideRow $g -SeedGuideUserId $seedGuideUserId) {
            $bio = [string]$g.bio
            Fail-Smoke "guides public catalog must hide dev/smoke rows (user_id=$($g.user_id) city=$($g.city) bio='$bio')"
        }
    }

    if (Test-SeedGuidePublicMarketEnabled) {
        if (-not (Test-SeedGuideInHangzhouGuidesList -Base $base -SeedGuideUserId $seedGuideUserId -TimeoutSec $BriefTimeoutSec)) {
            Fail-Smoke "GET /guides?city=Hangzhou must include guide@test.com when TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=1 (API needs SEED_TEST_ACCOUNTS=1 + catalog filter, or rebuild after market_public_surface fix; explicit off: TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0)"
        }
        Ok-Smoke "GET /guides?city=Hangzhou includes guide@test.com seed walkthrough (normal /market UI)"
    }
    $userIds = @{}
    foreach ($g in @($guides.items)) {
        $uid = [string]$g.user_id
        if ([string]::IsNullOrWhiteSpace($uid)) { continue }
        if ($userIds.ContainsKey($uid)) {
            Fail-Smoke "guides public catalog duplicate user_id=$uid (dedupe_latest_per_user ABI)"
        }
        $userIds[$uid] = $true
    }

    $statsRaw = Invoke-GetOk -Path "/api/v1/internal/public-catalog-surface/stats" -TimeoutSec $BriefTimeoutSec -Label "GET /internal/public-catalog-surface/stats" -ExtraHeaders (Get-InternalApiSecretHeaders)
    try {
        $stats = $statsRaw | ConvertFrom-Json
    } catch {
        Fail-Smoke "public-catalog-surface/stats JSON parse failed: $_"
    }
    if ([string]$stats.status -ne "ok") {
        Fail-Smoke "public-catalog-surface/stats .status expected ok, got '$($stats.status)'"
    }
    if ($stats.filter_enabled -isnot [bool]) {
        Fail-Smoke "public-catalog-surface/stats filter_enabled must be boolean"
    }
    if ($env:TRAVELTRUST_PUBLIC_CATALOG_SURFACE -ne '0' -and -not $stats.filter_enabled) {
        Fail-Smoke "public catalog filter must be enabled for local seed stack (restart API; main sets TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 when SEED_TEST_ACCOUNTS=1)"
    }
    if ($null -eq $stats.data_origin_counts) {
        Fail-Smoke "public-catalog-surface/stats missing data_origin_counts"
    }

    $hangzhouId = "f0e0b101-0001-4001-8001-000000000001"
    $hangzhouInList = $false
    foreach ($g in @($guides.items)) {
        if ([string]$g.id -eq $hangzhouId) {
            $hangzhouInList = $true
            break
        }
    }
    if (-not $hangzhouInList) {
        Fail-Smoke "GET /api/v1/guides public list missing hangzhou $hangzhouId (run Step 6b4 POST /auth/seed-trust-gate-e2e)"
    }

    $login = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"tourist@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login (GD/P06 guide detail)"
    if ($login.Code -ne 200) {
        Fail-Smoke "POST /auth/login expected 200 for GD/P06 guide detail probe, got $($login.Code)"
    }
    try {
        $loginObj = $login.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login JSON parse failed: $_"
    }
    $touristToken = [string]$loginObj.token
    if ([string]::IsNullOrWhiteSpace($touristToken)) {
        Fail-Smoke "POST /auth/login missing token for guides/:id (STRICT_SESSION_GATE=1)"
    }
    $touristHdr = @{ Authorization = "Bearer $touristToken" }

    $detailRaw = Invoke-HttpFlexible -Path "/api/v1/guides/$hangzhouId" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /api/v1/guides/$hangzhouId auth" -ExtraHeaders $touristHdr
    if ($detailRaw.Code -ne 200) {
        Fail-Smoke "GET /api/v1/guides/$hangzhouId with Bearer expected 200, got $($detailRaw.Code)"
    }
    try {
        $detail = $detailRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "guides/$hangzhouId JSON parse failed: $_"
    }
    if ([string]$detail.status -ne "ok") {
        Fail-Smoke "guides/$hangzhouId .status expected ok, got '$($detail.status)'"
    }
    $gid = [string]$detail.guide.id
    if ($gid -ne $hangzhouId) {
        Fail-Smoke "guides/$hangzhouId .guide.id expected $hangzhouId, got '$gid'"
    }

    $availAuth = Invoke-HttpFlexible -Path "/api/v1/guides/$hangzhouId/availability" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /guides/$hangzhouId/availability auth" -ExtraHeaders $touristHdr
    if ($availAuth.Code -ne 200) {
        Fail-Smoke "GET /guides/$hangzhouId/availability with Bearer expected 200, got $($availAuth.Code)"
    }

    $availUnauth = Invoke-HttpFlexible -Path "/api/v1/guides/$hangzhouId/availability" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /guides/$hangzhouId/availability unauth"
    if ($availUnauth.Code -ne 401) {
        Fail-Smoke "GET /guides/$hangzhouId/availability without Bearer expected 401 (STRICT_SESSION_GATE), got $($availUnauth.Code)"
    }

    Ok-Smoke "GET /api/v1/discover/orders + /api/v1/guides (market hub; items=$nOrders/$nGuides; hangzhou=$hangzhouId list+detail+availability Bearer; stats filter=$($stats.filter_enabled))"
}



function Assert-ProtocolConvergencePublicRoutes {

    $smRaw = Invoke-GetOk -Path "/api/v1/governance/state-machines" -TimeoutSec $BriefTimeoutSec -Label "GET /api/v1/governance/state-machines"

    try {

        $sm = $smRaw | ConvertFrom-Json

    }

    catch {

        Fail-Smoke "state-machines JSON parse failed: $_"

    }

    if ([string]$sm.status -ne "ok") {

        Fail-Smoke "state-machines .status expected ok, got '$($sm.status)'"

    }

    $machines = @($sm.machines)

    $hasStewardApp = $false
    $hasStewardSeat = $false

    foreach ($m in $machines) {

        if ([string]$m.machine_code -eq "steward_application") { $hasStewardApp = $true }
        if ([string]$m.machine_code -eq "steward_seat") { $hasStewardSeat = $true }

    }

    if (-not $hasStewardApp) {

        Fail-Smoke "state-machines missing machine_code steward_application"

    }

    if (-not $hasStewardSeat) {

        Fail-Smoke "state-machines missing machine_code steward_seat"

    }

    Ok-Smoke "GET /governance/state-machines (steward_application + steward_seat)"



    $quoteRaw = Invoke-GetOk -Path "/api/v1/steward/stake-quote?jurisdictions=CN" -TimeoutSec $BriefTimeoutSec -Label "GET /steward/stake-quote"

    try {

        $quote = $quoteRaw | ConvertFrom-Json

    }

    catch {

        Fail-Smoke "stake-quote JSON parse failed: $_"

    }

    if ([string]$quote.status -ne "ok") {

        Fail-Smoke "stake-quote .status expected ok, got '$($quote.status)'"

    }

    if ([string]$quote.ttg_symbol -ne "TTG") {

        Fail-Smoke "stake-quote ttg_symbol expected TTG, got '$($quote.ttg_symbol)'"

    }

    if ($null -eq $quote.jurisdictions -or @($quote.jurisdictions).Count -lt 1) {

        Fail-Smoke "stake-quote jurisdictions expected non-empty array"

    }

    Ok-Smoke "GET /steward/stake-quote (CN doc SSOT)"



    $probeWallet = "0x4a62316623ad457F02cDC5D997deD67a383EC569"

    $st = Invoke-GetFlexible -Path "/api/v1/steward/stake-status?jurisdiction=CN&wallet=$probeWallet" -AllowedStatus @(200, 502, 503) -TimeoutSec $BriefTimeoutSec -Label "GET /steward/stake-status"

    try {

        $stObj = $st.Body | ConvertFrom-Json

    }

    catch {

        Fail-Smoke "stake-status JSON parse failed: $_"

    }

    if ($st.Code -eq 200) {

        if ($stObj.has_jurisdiction_stake -isnot [bool]) {

            Fail-Smoke "stake-status 200 has_jurisdiction_stake must be boolean"

        }

        Ok-Smoke "GET /steward/stake-status eth_call parity (200)"

    }

    elseif ($st.Code -eq 503) {

        $err = [string]$stObj.error

        if ($err -notin @("chain_not_configured", "stake_pool_not_configured", "chain_rpc_unavailable", "stake_pool_unavailable")) {

            Fail-Smoke "stake-status 503 error expected chain_not_configured|stake_pool_not_configured|chain_rpc_unavailable|stake_pool_unavailable, got '$err'"

        }

        Ok-Smoke "GET /steward/stake-status chain-off graceful 503 ($err)"

    }

    else {

        $err = [string]$stObj.error

        if ($err -ne "eth_call_failed") {

            Fail-Smoke "stake-status 502 error expected eth_call_failed (RPC/pool eth_call parity), got '$err'"

        }

        Ok-Smoke "GET /steward/stake-status eth_call degraded 502 ($err)"

    }



    $redRaw = Invoke-GetOk -Path "/api/v1/redemption/quote?jurisdiction=CN" -TimeoutSec $BriefTimeoutSec -Label "GET /redemption/quote"

    try {

        $red = $redRaw | ConvertFrom-Json

    }

    catch {

        Fail-Smoke "redemption/quote JSON parse failed: $_"

    }

    if ([string]$red.status -ne "ok") {

        Fail-Smoke "redemption/quote .status expected ok, got '$($red.status)'"

    }

    if ($null -eq $red.redemption_max_nav_pct_bps) {

        Fail-Smoke "redemption/quote missing redemption_max_nav_pct_bps (protocol-ssot lock tiers)"

    }

    Ok-Smoke "GET /redemption/quote (CN NAV lock tiers)"



    $appUnauth = Invoke-PostJson -Path "/api/v1/steward/applications" -BodyJson '{"jurisdictions":["CN"],"legal_name":"x","contact_email":"x@test.com","wallet_address":"0x4a62316623ad457F02cDC5D997deD67a383EC569","motivation":"smoke"}' -TimeoutSec 15 -Label "POST /steward/applications unauthenticated"

    if ($appUnauth.Code -ne 401) {

        Fail-Smoke "POST /steward/applications without Bearer expected 401, got $($appUnauth.Code)"

    }

    Ok-Smoke "POST /steward/applications mounted (401 without session)"



    $seatUnauth = Invoke-HttpFlexible -Path "/api/v1/me/steward-seat" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /me/steward-seat unauthenticated"

    if ($seatUnauth.Code -ne 401) {

        Fail-Smoke "GET /me/steward-seat without Bearer expected 401, got $($seatUnauth.Code)"

    }

    Ok-Smoke "GET /me/steward-seat mounted (401 without session)"

    $exitUnauth = Invoke-HttpFlexible -Path "/api/v1/me/guide-exit-status" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /me/guide-exit-status unauthenticated"
    if ($exitUnauth.Code -eq 404) {
        Fail-Smoke "GET /me/guide-exit-status without Bearer returned 404 (route not mounted) — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    if ($exitUnauth.Code -ne 401) {
        Fail-Smoke "GET /me/guide-exit-status without Bearer expected 401, got $($exitUnauth.Code)"
    }
    Ok-Smoke "GET /me/guide-exit-status mounted (401 without session)"

    $exitReqUnauth = Invoke-PostJson -Path "/api/v1/me/guide-exit-request" -BodyJson '{}' -TimeoutSec 15 -Label "POST /me/guide-exit-request unauthenticated"
    if ($exitReqUnauth.Code -eq 404) {
        Fail-Smoke "POST /me/guide-exit-request returned 404 (route not mounted) — rebuild API (cargo build -p traveltrust-api) and restart 8080"
    }
    if ($exitReqUnauth.Code -ne 401) {
        Fail-Smoke "POST /me/guide-exit-request without Bearer expected 401, got $($exitReqUnauth.Code)"
    }
    Ok-Smoke "POST /me/guide-exit-request mounted (401 without session)"

    $resignUnauth = Invoke-PostJson -Path "/api/v1/steward/resign-notice" -BodyJson '{}' -TimeoutSec 15 -Label "POST /steward/resign-notice unauthenticated"

    if ($resignUnauth.Code -ne 401) {

        Fail-Smoke "POST /steward/resign-notice without Bearer expected 401, got $($resignUnauth.Code)"

    }

    Ok-Smoke "POST /steward/resign-notice mounted (401 without session)"



    $finalizeUnauth = Invoke-PostJson -Path "/api/v1/steward/finalize-resign" -BodyJson '{}' -TimeoutSec 15 -Label "POST /steward/finalize-resign unauthenticated"

    if ($finalizeUnauth.Code -ne 401) {

        Fail-Smoke "POST /steward/finalize-resign without Bearer expected 401, got $($finalizeUnauth.Code)"

    }

    Ok-Smoke "POST /steward/finalize-resign mounted (401 without session)"

}



[void](Invoke-GetOk -Path "/health" -TimeoutSec 15 -Label "GET /health")

[void](Invoke-GetOk -Path "/meta/build" -TimeoutSec 15 -Label "GET /meta/build")



$metaRaw = Invoke-GetOk -Path "/meta" -TimeoutSec $MetaTimeoutSec -Label "GET /meta"

try {

    $meta = $metaRaw | ConvertFrom-Json

}

catch {

    Fail-Smoke "/meta JSON parse failed: $_"

}

Assert-MetaAbiLite -Meta $meta



$briefRaw = Invoke-GetOk -Path "/api/v1/traveltrust/page-brief" -TimeoutSec $BriefTimeoutSec -Label "GET /api/v1/traveltrust/page-brief"

try {

    $brief = $briefRaw | ConvertFrom-Json

}

catch {

    Fail-Smoke "page-brief JSON parse failed: $_"

}

Assert-PageBriefAbi -Brief $brief



$prefRaw = Invoke-GetOk -Path "/api/v1/governance/protocol-reference" -TimeoutSec $BriefTimeoutSec -Label "GET /api/v1/governance/protocol-reference"

try {

    $pref = $prefRaw | ConvertFrom-Json

}

catch {

    Fail-Smoke "protocol-reference JSON parse failed: $_"

}

$briefDocVer = [string]$brief.allocation_ssot.protocol_reference_doc_version

$prefDocVer = [string]$pref.doc_version

if ([string]::IsNullOrWhiteSpace($briefDocVer) -or [string]::IsNullOrWhiteSpace($prefDocVer)) {

    Fail-Smoke "protocol_reference_doc_version empty (brief='$briefDocVer' pref='$prefDocVer')"

}

if ($briefDocVer -ne $prefDocVer) {

    Fail-Smoke "page-brief protocol_reference_doc_version '$briefDocVer' != protocol-reference doc_version '$prefDocVer'"

}

Ok-Smoke "page-brief allocation_ssot.protocol_reference_doc_version=$briefDocVer matches protocol-reference"



Assert-ProtocolConvergencePublicRoutes

Assert-MarketHubPublicRead

Assert-WalletVerifyChainOff

Assert-MeSecuritySessionsAndNotifications

Assert-MultiDemoIdentityProbe

function Assert-AdminCapabilitiesRbac {
    $unauth = Invoke-HttpFlexible -Path "/api/v1/admin/capabilities" -AllowedStatus @(401) -TimeoutSec $BriefTimeoutSec -Label "GET /admin/capabilities unauth"
    if ($unauth.Code -eq 404) {
        Fail-Smoke "GET /admin/capabilities returned 404 — duplicate route panic or old API binary; rebuild traveltrust-api"
    }
    if ($unauth.Code -eq 503) {
        Fail-Smoke "GET /admin/capabilities returned 503 — restart API after admin_rbac merge (no overlapping GET /api/v1/admin/capabilities)"
    }
    Ok-Smoke "GET /admin/capabilities mounted (401 without session, HTTP $($unauth.Code))"

    $totpUnauth = Invoke-HttpFlexible -Path "/api/v1/admin/security/totp/status" -AllowedStatus @(401, 403) -TimeoutSec $BriefTimeoutSec -Label "GET /admin/security/totp/status unauth"
    if ($totpUnauth.Code -eq 404) {
        Fail-Smoke "GET /admin/security/totp/status returned 404 — rebuild traveltrust-api after admin security TOTP merge"
    }
    Ok-Smoke "GET /admin/security/totp/status mounted (HTTP $($totpUnauth.Code) without session)"

    $promote = Invoke-PostJson -Path "/auth/seed-test-accounts" -BodyJson '{"promote_admin_email":"tourist@test.com"}' -TimeoutSec 30 -Label "POST /auth/seed-test-accounts promote_admin"
    if ($promote.Code -in @(200, 201)) {
        Ok-Smoke "POST /auth/seed-test-accounts promote_admin_email tourist@test.com -> admin"
    } elseif ($promote.Code -eq 400) {
        Ok-Smoke "POST /auth/seed-test-accounts promote_admin skipped (already admin/super_admin; Step 6b/bootstrap)"
    } else {
        Fail-Smoke "POST /auth/seed-test-accounts promote_admin_email expected 200 or idempotent 400, got $($promote.Code) (SEED_TEST_ACCOUNTS=1?)"
    }

    $login = Invoke-PostJson -Path "/auth/login" -BodyJson '{"email":"tourist@test.com","password":"Test123!"}' -TimeoutSec 30 -Label "POST /auth/login (admin)"
    if ($login.Code -ne 200) {
        Fail-Smoke "POST /auth/login expected 200 for promoted admin, got $($login.Code)"
    }
    try {
        $loginObj = $login.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "POST /auth/login JSON parse failed: $_"
    }
    $token = [string]$loginObj.token
    $role = [string]$loginObj.role
    if ([string]::IsNullOrWhiteSpace($token)) {
        Fail-Smoke "POST /auth/login missing token for admin capabilities"
    }
    if ($role -notin @("admin", "super_admin")) {
        Fail-Smoke "POST /auth/login role expected admin|super_admin after promote, got '$role'"
    }
    Ok-Smoke "POST /auth/login admin session (role=$role)"

    $authHdr = @{ Authorization = "Bearer $token" }
    $capsRaw = Invoke-HttpFlexible -Path "/api/v1/admin/capabilities" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /admin/capabilities auth" -ExtraHeaders $authHdr
    try {
        $caps = $capsRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /admin/capabilities JSON parse failed: $_"
    }
    if ([string]$caps.status -ne "ok") {
        Fail-Smoke "GET /admin/capabilities .status expected ok, got '$($caps.status)'"
    }
    if ($null -eq $caps.permissions -or @($caps.permissions).Count -lt 1) {
        Fail-Smoke "GET /admin/capabilities missing .permissions[]"
    }
    $permList = @($caps.permissions) | ForEach-Object { [string]$_ }
    if ($permList -notcontains "admin.read") {
        Fail-Smoke "GET /admin/capabilities missing admin.read permission"
    }
    if ([string]::IsNullOrWhiteSpace([string]$caps.matrix_version)) {
        Fail-Smoke "GET /admin/capabilities missing matrix_version (admin_rbac SSOT)"
    }
    $console70 = [string]$caps.console_role_70
    if ($console70 -ne "SuperAdmin") {
        Fail-Smoke "GET /admin/capabilities console_role_70 expected SuperAdmin after Step 6b2 bootstrap, got '$console70'"
    }
    Ok-Smoke "GET /admin/capabilities auth (console_role_70=$console70 perms=$($permList.Count) matrix=$($caps.matrix_version))"

    $matrixRaw = Invoke-HttpFlexible -Path "/api/v1/admin/rbac/route-matrix" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /admin/rbac/route-matrix auth" -ExtraHeaders $authHdr
    try {
        $matrix = $matrixRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /admin/rbac/route-matrix JSON parse failed: $_"
    }
    if ([string]$matrix.status -ne "ok") {
        Fail-Smoke "GET /admin/rbac/route-matrix .status expected ok"
    }
    Ok-Smoke "GET /admin/rbac/route-matrix auth"

    $metricsRaw = Invoke-HttpFlexible -Path "/api/v1/admin/metrics/home-overview" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /admin/metrics/home-overview auth" -ExtraHeaders $authHdr
    try {
        $metrics = $metricsRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /admin/metrics/home-overview JSON parse failed: $_"
    }
    if ([string]$metrics.status -ne "ok") {
        Fail-Smoke "GET /admin/metrics/home-overview .status expected ok"
    }
    Ok-Smoke "GET /admin/metrics/home-overview auth"

    $onbRaw = Invoke-HttpFlexible -Path "/api/v1/admin/onboarding/entitlements?limit=50" -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label "GET /admin/onboarding/entitlements auth" -ExtraHeaders $authHdr
    try {
        $onb = $onbRaw.Body | ConvertFrom-Json
    } catch {
        Fail-Smoke "GET /admin/onboarding/entitlements JSON parse failed: $_"
    }
    if ($null -eq $onb.items) {
        Fail-Smoke "GET /admin/onboarding/entitlements missing .items[]"
    }
    Ok-Smoke "GET /admin/onboarding/entitlements auth items=$(@($onb.items).Count)"

    $queuePaths = @(
        @{ Path = "/api/v1/admin/provider-applications?status=submitted"; Label = "GET /admin/provider-applications submitted" },
        @{ Path = "/api/v1/admin/steward-applications?status=stake_pending"; Label = "GET /admin/steward-applications stake_pending" },
        @{ Path = "/api/v1/admin/approvals?limit=200&status=pending"; Label = "GET /admin/approvals pending" },
        @{ Path = "/api/v1/admin/community/reports?limit=200&status=open"; Label = "GET /admin/community/reports open" },
        @{ Path = "/api/v1/admin/orders?limit=200"; Label = "GET /admin/orders limit=200" },
        @{ Path = "/api/v1/admin/disputes?limit=200"; Label = "GET /admin/disputes limit=200" }
    )
    foreach ($qp in $queuePaths) {
        $raw = Invoke-HttpFlexible -Path $qp.Path -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label $qp.Label -ExtraHeaders $authHdr
        if ($raw.Code -eq 429) {
            Fail-Smoke "$($qp.Label) returned 429 — set API_RATE_LIMIT_PER_MINUTE=0 for local stack or reduce parallel admin fetches"
        }
        if ($raw.Code -eq 503) {
            Fail-Smoke "$($qp.Label) returned 503 — rebuild traveltrust-api after admin route merge"
        }
        try {
            $obj = $raw.Body | ConvertFrom-Json
        } catch {
            Fail-Smoke "$($qp.Label) JSON parse failed: $_"
        }
        if ($null -eq $obj.items) {
            Fail-Smoke "$($qp.Label) missing .items[] (admin home queue SSOT)"
        }
        Ok-Smoke "$($qp.Label) auth items=$(@($obj.items).Count)"
    }

    $opsPaths = @(
        @{ Path = "/api/v1/admin/content/countries?limit=50"; Label = "GET /admin/content/countries"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/content/publish-queue?limit=50"; Label = "GET /admin/content/publish-queue"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/content/revisions/detail?limit=50"; Label = "GET /admin/content/revisions/detail"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/content/catalog/geo-validation"; Label = "GET /admin/content/catalog/geo-validation"; ExpectItems = $false },
        @{ Path = "/api/v1/admin/growth/referral-codes?limit=50"; Label = "GET /admin/growth/referral-codes"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/growth/reward-ledger?limit=50"; Label = "GET /admin/growth/reward-ledger"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/growth/analytics/overview"; Label = "GET /admin/growth/analytics/overview"; ExpectItems = $false },
        @{ Path = "/api/v1/admin/growth/early-bird/stages?limit=50"; Label = "GET /admin/growth/early-bird/stages"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/growth/airdrop-campaigns?limit=50"; Label = "GET /admin/growth/airdrop-campaigns"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/growth/anti-fraud/rules?limit=50"; Label = "GET /admin/growth/anti-fraud/rules"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/growth/anti-fraud/scan-runs?limit=50"; Label = "GET /admin/growth/anti-fraud/scan-runs"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/official/accounts?limit=50"; Label = "GET /admin/official/accounts"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/official/guides?limit=50"; Label = "GET /admin/official/guides"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/official/itinerary-templates?limit=50"; Label = "GET /admin/official/itinerary-templates"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/official/cold-start/campaigns?limit=50"; Label = "GET /admin/official/cold-start/campaigns"; ExpectItems = $true },
        @{ Path = "/api/v1/admin/country-market/launches?limit=50"; Label = "GET /admin/country-market/launches"; ExpectItems = $true }
    )
    foreach ($op in $opsPaths) {
        $raw = Invoke-HttpFlexible -Path $op.Path -AllowedStatus @(200) -TimeoutSec $BriefTimeoutSec -Label $op.Label -ExtraHeaders $authHdr
        if ($raw.Code -eq 404) {
            Fail-Smoke "$($op.Label) returned 404 — rebuild traveltrust-api after CMS/Growth/Official admin merge"
        }
        if ($raw.Code -eq 503) {
            Fail-Smoke "$($op.Label) returned 503 — check PG migrations through 20260608120000"
        }
        try {
            $obj = $raw.Body | ConvertFrom-Json
        } catch {
            Fail-Smoke "$($op.Label) JSON parse failed: $_"
        }
        if ($op.ExpectItems) {
            if ($null -eq $obj.items) {
                Fail-Smoke "$($op.Label) missing .items[]"
            }
            Ok-Smoke "$($op.Label) auth items=$(@($obj.items).Count)"
        } else {
            if ([string]$obj.status -ne "ok") {
                Fail-Smoke "$($op.Label) .status expected ok, got '$($obj.status)'"
            }
            Ok-Smoke "$($op.Label) auth status=ok"
        }
    }
}

Assert-AdminCapabilitiesRbac

Assert-CommunityAndProfileAvatarRoutes



if ($DeepVerify) {

    $prevPort = $env:PORT

    $prevBase = $env:BASE_URL

    $env:PORT = [string]$Port

    $env:BASE_URL = $base

    $qv = Join-Path $PSScriptRoot "check-55-quick-verify.ps1"

    Write-Host "post-start-api-abi-smoke: DeepVerify -> check-55-quick-verify.ps1"

    & $qv

    $qvExit = $LASTEXITCODE

    if ($null -ne $prevPort) { $env:PORT = $prevPort } else { Remove-Item Env:PORT -ErrorAction SilentlyContinue }

    if ($null -ne $prevBase) { $env:BASE_URL = $prevBase } else { Remove-Item Env:BASE_URL -ErrorAction SilentlyContinue }

    if ($qvExit -ne 0) {

        Fail-Smoke "check-55-quick-verify.ps1 exit $qvExit"

    }

    Ok-Smoke "check-55-quick-verify.ps1 exit 0"

}



Write-Host "post-start-api-abi-smoke: exit 0 ($base · meta 728/37 + governance 807 + page-brief v6 + protocol-reference + steward/redemption + steward-seat/resign + multi-demo identity_slots L3 + me/publish-summary W1-A3 + me/wallets + me/role-applications + me/guide-profile + me/guide-exit-status/request + merchant@test merchant-listings-summary/listings + me/*-profile x4 + me/steward-application + me/steward-seat + me/sessions + security-notifications + admin/capabilities + admin/security/totp/status + rbac/route-matrix + admin/metrics/home-overview + admin/onboarding/entitlements + admin home queue lists + admin CMS/Growth/Official OPS x16 + community feed/capabilities/recommend + profile-avatar + public-catalog + wallet verify)"

exit 0

