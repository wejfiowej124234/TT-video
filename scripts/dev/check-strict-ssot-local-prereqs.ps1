# 预检：STRICT_SSOT=1 或 CHECK_SSOT=1 时根 .env 是否满足 API 启动条件（与 startup/mod.rs 同源）。
# 用法：powershell -File scripts/dev/check-strict-ssot-local-prereqs.ps1
param()
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$EnvFile = Join-Path $Root ".env"
Set-Location $Root

function Get-Var([string]$name) {
    if (-not (Test-Path -LiteralPath $EnvFile)) { return "" }
    $vars = @{}
    Get-Content -LiteralPath $EnvFile -Encoding UTF8 | ForEach-Object {
        $line = $_.TrimEnd()
        if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { return }
        $idx = $line.IndexOf('=')
        if ($idx -lt 1) { return }
        $k = $line.Substring(0, $idx).Trim()
        $v = $line.Substring($idx + 1).Trim()
        if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        $vars[$k] = $v
    }
    if ($vars.ContainsKey($name)) { return [string]$vars[$name] }
    return ""
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
    Write-Host "check-strict-ssot: skip (no root .env)"
    exit 0
}

$strict = (Get-Var "STRICT_SSOT").Trim()
$check = (Get-Var "CHECK_SSOT").Trim()
if ($strict -ne "1" -and $check -ne "1") {
    Write-Host "check-strict-ssot: STRICT_SSOT/CHECK_SSOT not 1, skip"
    exit 0
}

$fail = $false
$ssotVer = (Get-Var "SSOT_VERSION").Trim()
if ([string]::IsNullOrWhiteSpace($ssotVer) -or $ssotVer -eq "unset") {
    Write-Host "check-strict-ssot: FAIL — SSOT_VERSION must be set and not literal 'unset'" -ForegroundColor Red
    $fail = $true
}

$cors = (Get-Var "CORS_ORIGINS").Trim()
if ([string]::IsNullOrWhiteSpace($cors)) {
    Write-Host "check-strict-ssot: FAIL — CORS_ORIGINS required under strict" -ForegroundColor Red
    $fail = $true
}
else {
    $lc = $cors.ToLowerInvariant()
    if ($lc -notmatch "localhost:3012" -and $lc -notmatch "127\.0\.0\.1:3012") {
        Write-Host "check-strict-ssot: WARN — add localhost:3012 or 127.0.0.1:3012 for local Next dev" -ForegroundColor Yellow
    }
}

$sha = (Get-Var "SSOT_SHA256").Trim()
$doc = Join-Path $Root "docs\spec\08-3-参数与门禁表.md"
if ([string]::IsNullOrWhiteSpace($sha)) {
    Write-Host "check-strict-ssot: FAIL — SSOT_SHA256 required" -ForegroundColor Red
    $fail = $true
}
elseif (Test-Path -LiteralPath $doc) {
    $h = Get-FileHash -LiteralPath $doc -Algorithm SHA256
    $computed = $h.Hash.ToLowerInvariant()
    if ($sha.ToLowerInvariant() -ne $computed) {
        Write-Host "check-strict-ssot: FAIL — SSOT_SHA256 mismatch env=$sha computed=$computed" -ForegroundColor Red
        $fail = $true
    }
}
else {
    Write-Host "check-strict-ssot: WARN — 08-3 doc missing, cannot verify sha" -ForegroundColor Yellow
}

$cb = (Get-Var "CHARGEBACK_POLICY").Trim()
if ([string]::IsNullOrWhiteSpace($cb) -or $cb -eq "unset") {
    Write-Host "check-strict-ssot: FAIL — CHARGEBACK_POLICY must be set" -ForegroundColor Red
    $fail = $true
}

if ($fail) {
    Write-Host "check-strict-ssot: see .env.example STRICT_SSOT block and docs/dev-local-smoke-baseline.md" -ForegroundColor Red
    exit 1
}
Write-Host "check-strict-ssot: OK"
exit 0
