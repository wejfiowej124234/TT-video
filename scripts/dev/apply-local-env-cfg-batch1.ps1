# Apply CFG batch B1 fixes to gitignored root .env + frontend/.env.local manual flags.
# Does NOT copy secrets across environments. Rotates LOCAL INTERNAL_API_SECRET (CFG-001).
# Usage: powershell -File scripts/dev/apply-local-env-cfg-batch1.ps1

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$EnvFile = Join-Path $Root ".env"
$FeLocal = Join-Path $Root "frontend\.env.local"

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Host "apply-local-env-cfg-batch1: no root .env" -ForegroundColor Yellow
    exit 1
}

function Upsert-Line([string[]]$lines, [string]$key, [string]$value) {
    $prefix = "$key="
    $out = New-Object System.Collections.Generic.List[string]
    $found = $false
    foreach ($line in $lines) {
        if ($line.StartsWith($prefix)) {
            $out.Add("$key=$value")
            $found = $true
        } elseif ($line -match '^\s*#' -or $line.Length -eq 0) {
            $out.Add($line)
        } elseif ($line -match '^WEB3-P2-003 \+ B-407' -and $script:SkipDupB407) {
            continue
        } elseif ($line -match '^# --- WEB3-P2-003 \+ B-407' -and $script:SkipDupB407) {
            continue
        } else {
            if ($line -match '^# --- WEB3-P2-003 \+ B-407') { $script:B407Seen = $true }
            if ($script:B407Seen -and $line -match '^B407_') { if ($script:KeepB407) { $out.Add($line) }; continue }
            if ($line -match '^SMTP_') { continue }
            $out.Add($line)
        }
    }
    if (-not $found) { $out.Insert(0, "$key=$value") }
    return ,$out.ToArray()
}

$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$newSecret = ([BitConverter]::ToString($bytes)).Replace("-", "").ToLower()
Write-Host "CFG-001: rotated INTERNAL_API_SECRET (local only)" -ForegroundColor Cyan

$lines = Get-Content -LiteralPath $EnvFile -Encoding UTF8
$script:B407Seen = $false
$script:KeepB407 = $true
$script:SkipDupB407 = $true

$lines = Upsert-Line $lines "SSOT_VERSION" "unset"
$lines = Upsert-Line $lines "PORT" "8080"
$lines = Upsert-Line $lines "TRAVELTRUST_DEPLOYMENT_PROFILE" "local"
$lines = Upsert-Line $lines "TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS" "0"
$lines = Upsert-Line $lines "INTERNAL_API_SECRET" $newSecret
$lines = Upsert-Line $lines "CORS_ORIGINS" "http://localhost:3012,http://127.0.0.1:3012"
$lines = Upsert-Line $lines "TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET" "1"
$lines = Upsert-Line $lines "TRAVELTRUST_EMAIL_TRANSPORT" "resend"

# CFG-025 DATABASE_URL host
$lines = $lines | ForEach-Object {
    if ($_ -match '^DATABASE_URL=') { $_ -replace '@localhost:', '@127.0.0.1:' } else { $_ }
}

$header = @(
    "# --- CFG B1 header (apply-local-env-cfg-batch1.ps1) ---",
    "# GovFreeze evidence: scripts/dev/.env.govfreeze-v2-evidence.example",
    "# Active ① chain: TT ANVIL LOCAL block -> GET /meta",
    ""
)
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($EnvFile, ($header + $lines), $utf8)
Write-Host "Wrote $EnvFile" -ForegroundColor Green

if (Test-Path -LiteralPath $FeLocal) {
    $fe = Get-Content -LiteralPath $FeLocal -Encoding UTF8 | Where-Object {
        $_ -notmatch '^NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI='
    }
    [System.IO.File]::WriteAllLines($FeLocal, $fe, $utf8)
    Write-Host "CFG-008: removed ALLOW_CHAIN_OFF_MOCK_PAY_UI from frontend/.env.local" -ForegroundColor Cyan
}

& (Join-Path $PSScriptRoot "sync-frontend-env-local-from-root.ps1")
