# Ensure crates/api SQLx migrations applied (align local PG before API startup).
# Usage: powershell -File scripts/dev/ensure-api-db-migrations.ps1 [-WarnOnly]
# Env: DATABASE_URL (defaults to docker compose local PG when unset).
# Probes: community media + data_origin + identity + did_rank + acquisition PD-009 + sessions hardening
# + user_security_notifications + disputes legacy align + admin_console_roles + admin_2fa_policy + admin_totp_enrollments
# + compliance DSAR export fields + CMS catalog P1/S2 + Official OPS P2 + Growth P3/G-S3/G-S6
# + Sprint168 country_market_launches + growth_fraud_scan_runs (through 20260608120000)
# + guides hourly_rate/avatar_url (20260609120000 · Identity P2 guide-profile)
# + guides public_title (20260612120000 · market listing display name)
# + guide_exit_requests (20260613120000 · GWB guide-exit-status/request).

param(
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

function Read-RootDotEnvValue {
    param([string]$Key)
    $envPath = Join-Path $Root ".env"
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

if (-not $env:DATABASE_URL) {
    $fromFile = Read-RootDotEnvValue "DATABASE_URL"
    if ($fromFile) {
        $env:DATABASE_URL = $fromFile
        Write-Host "ensure-api-db-migrations: DATABASE_URL from root .env"
    } else {
        $env:DATABASE_URL = "postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust"
        Write-Host "ensure-api-db-migrations: DATABASE_URL unset — using docker default"
    }
}

function Invoke-SqlxMigrate {
    $sqlx = Get-Command sqlx -ErrorAction SilentlyContinue
    if ($sqlx) {
        & sqlx migrate run --source crates/api/migrations 2>&1 | ForEach-Object { Write-Host $_ }
        return [int]$LASTEXITCODE
    }
    $out = & cargo sqlx migrate run --source crates/api/migrations 2>&1
    if ($LASTEXITCODE -eq 0) {
        if ($out) { Write-Host $out }
        return 0
    }
    $msg = ($out | Out-String).Trim()
    if ($msg -match 'no such subcommand|could not find sqlx') {
        Write-Host "ensure-api-db-migrations: WARN sqlx-cli not installed; API will migrate on startup" -ForegroundColor Yellow
        return 0
    }
    Write-Host $msg
    return [int]$LASTEXITCODE
}

Write-Host "ensure-api-db-migrations: sqlx migrate run (crates/api/migrations)"
$code = Invoke-SqlxMigrate
if ($code -is [System.Array]) {
    $code = [int]$code[-1]
} else {
    $code = [int]$code
}
if ($code -ne 0) {
    if ($WarnOnly) {
        Write-Host "ensure-api-db-migrations: WARN migrate exit $code (continuing)" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "ensure-api-db-migrations: FAIL exit $code" -ForegroundColor Red
    Write-Host "  Fix: RESET_DOCKER_DB=1 or docker compose down -v; check crates/api/migrations prefixes"
    exit $code
}

function Assert-PgSchemaProbes {
    $pg = docker ps -q -f "name=^traveltrust-postgres$" 2>$null
    if (-not $pg) {
        Write-Host "ensure-api-db-migrations: WARN postgres container not running — skip PG schema probe"
        return $true
    }
    $checks = @(
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='community_media_assets' LIMIT 1"; label = "community_media_assets table" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='primary_media_asset_id' LIMIT 1"; label = "community_posts.primary_media_asset_id" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='community_posts' AND column_name='data_origin' LIMIT 1"; label = "community_posts.data_origin" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='data_origin' LIMIT 1"; label = "orders.data_origin" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='guides' AND column_name='data_origin' LIMIT 1"; label = "guides.data_origin" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='market_listings' AND column_name='data_origin' LIMIT 1"; label = "market_listings.data_origin" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='order_kind' LIMIT 1"; label = "orders.order_kind" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='orders' AND column_name='market_listing_id' LIMIT 1"; label = "orders.market_listing_id (acquisition PD-009)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='staking_positions' AND column_name='user_id' LIMIT 1"; label = "staking_positions.user_id (acquisition publish/fulfillment bond)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='acquisition_publish_suspended_until' LIMIT 1"; label = "users.acquisition_publish_suspended_until (PD-009 admin suspend)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='wallets' LIMIT 1"; label = "wallets table (role_identity Phase A)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='role_applications' LIMIT 1"; label = "role_applications table (role_identity Phase A)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='did_rank_rank_snapshots' LIMIT 1"; label = "did_rank_rank_snapshots table" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='sessions' AND column_name='revoked_at' LIMIT 1"; label = "sessions.revoked_at (20260501120000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_security_notifications' LIMIT 1"; label = "user_security_notifications table (20260502123000)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='disputes' AND column_name='arb_fee_paid' LIMIT 1"; label = "disputes.arb_fee_paid (20260602120000 legacy align)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='disputes' AND column_name='dispute_sequence' LIMIT 1"; label = "disputes.dispute_sequence (20260602120000)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND column_name='bio' LIMIT 1"; label = "users.bio (20260529120000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_console_roles' LIMIT 1"; label = "admin_console_roles table (20260603120000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_security_policies' LIMIT 1"; label = "admin_security_policies table (20260603120000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_totp_enrollments' LIMIT 1"; label = "admin_totp_enrollments table (20260603140000)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='compliance_data_requests' AND column_name='export_signature' LIMIT 1"; label = "compliance_data_requests.export_signature (20260603140000)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='compliance_data_requests' AND column_name='record_hash_fingerprint' LIMIT 1"; label = "compliance_data_requests.record_hash_fingerprint (20260603140000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='onboarding_entitlements' LIMIT 1"; label = "onboarding_entitlements table (admin onboarding hub)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='onboarding_payment_events' LIMIT 1"; label = "onboarding_payment_events table (admin onboarding hub)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='catalog_countries' LIMIT 1"; label = "catalog_countries table (20260607120000 cms_catalog_p1)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='catalog_content_revisions' LIMIT 1"; label = "catalog_content_revisions table (20260607120000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='catalog_pricing_templates' LIMIT 1"; label = "catalog_pricing_templates table (20260607130000 cms_catalog_s2_004)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='catalog_media_assets' LIMIT 1"; label = "catalog_media_assets table (20260607130000)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ops_official_accounts' LIMIT 1"; label = "ops_official_accounts table (20260607120100 cms_official_ops_p2)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ops_official_itinerary_templates' LIMIT 1"; label = "ops_official_itinerary_templates table (20260607120100)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ops_official_guide_posts' LIMIT 1"; label = "ops_official_guide_posts table (20260607120100)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ops_cold_start_campaigns' LIMIT 1"; label = "ops_cold_start_campaigns table (20260607120100)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='referral_codes' LIMIT 1"; label = "referral_codes table (20260607120200 cms_growth_p3)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='growth_point_ledger' LIMIT 1"; label = "growth_point_ledger table (20260607120200)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='early_bird_stages' LIMIT 1"; label = "early_bird_stages table (20260607120200)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='airdrop_campaigns' LIMIT 1"; label = "airdrop_campaigns table (20260607120200)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='growth_fraud_signals' LIMIT 1"; label = "growth_fraud_signals table (20260607120200)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='growth_registration_seq' LIMIT 1"; label = "growth_registration_seq table (20260607140000 growth_early_bird_g_s3)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='growth_fraud_scan_runs' LIMIT 1"; label = "growth_fraud_scan_runs table (20260608120000 sprint168)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='country_market_launches' LIMIT 1"; label = "country_market_launches table (20260608120000)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='guides' AND column_name='hourly_rate' LIMIT 1"; label = "guides.hourly_rate (20260609120000 Identity P2)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='guides' AND column_name='avatar_url' LIMIT 1"; label = "guides.avatar_url (20260609120000 Identity P2)" },
        @{ q = "SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='guides' AND column_name='public_title' LIMIT 1"; label = "guides.public_title (20260612120000 market display)" },
        @{ q = "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='guide_exit_requests' LIMIT 1"; label = "guide_exit_requests table (20260613120000 GWB guide-exit)" }
    )
    foreach ($c in $checks) {
        $out = (docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -t -A -c $c.q 2>&1 | Out-String).Trim()
        if ($out -ne "1") {
            Write-Host "ensure-api-db-migrations: FAIL missing $($c.label) after migrate" -ForegroundColor Red
            return $false
        }
    }
    Write-Host "ensure-api-db-migrations: OK PG schema (community + identity + admin RBAC + CMS catalog + Official OPS + Growth + Sprint168 + guides P2 cols + public_title + guide_exit_requests through 20260613120000)"
    return $true
}

if (-not (Assert-PgSchemaProbes)) {
    if ($WarnOnly) {
        Write-Host "ensure-api-db-migrations: WARN schema probe failed (continuing)" -ForegroundColor Yellow
        exit 0
    }
    exit 1
}

Write-Host "ensure-api-db-migrations: OK"
exit 0
