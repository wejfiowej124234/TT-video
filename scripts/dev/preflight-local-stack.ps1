# TravelTrust local stack preflight: Docker, toolchain, root .env hints.
# Exit 1 if Docker unusable; warnings only for soft issues.
# -FrontendOnly: Node/npm + frontend lockfile only (TRAVELTRUST_FRONTEND_ONLY=1).

param([switch]$FrontendOnly)

$ErrorActionPreference = "Continue"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location -LiteralPath $repoRoot

$failed = $false

function Write-Warn([string]$m) { Write-Host "preflight: WARN $m" -ForegroundColor Yellow }
function Write-Info([string]$m) { Write-Host "preflight: $m" }

Write-Host "======== TravelTrust preflight (repo: $repoRoot) ========"
if ($FrontendOnly) {
    Write-Info "mode: FrontendOnly (skip Docker / Rust)"
}

if (-not $FrontendOnly) {
    $ensureDocker = Join-Path $PSScriptRoot "ensure-docker-daemon.ps1"
    if (Test-Path -LiteralPath $ensureDocker) {
        & powershell -NoProfile -ExecutionPolicy Bypass -File $ensureDocker
        if ($LASTEXITCODE -ne 0) { $failed = $true }
        else { Write-Info "Docker: OK" }
    }
    else {
        docker info 2>$null | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "preflight: ERROR Docker not available. Start Docker Desktop before start-api-with-seed." -ForegroundColor Red
            $failed = $true
        }
        else {
            Write-Info "Docker: OK"
        }
    }

    foreach ($exe in @("rustc", "cargo")) {
        $p = Get-Command $exe -ErrorAction SilentlyContinue
        if (-not $p) {
            Write-Host "preflight: ERROR missing $exe (install Rust toolchain)." -ForegroundColor Red
            $failed = $true
        }
        else {
            $ver = (& $exe --version 2>&1 | Out-String).Trim()
            Write-Info "${exe}: $ver"
        }
    }
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
    Write-Host "preflight: ERROR npm not found (need Node 18+)." -ForegroundColor Red
    $failed = $true
}
else {
    $nv = (node -v 2>&1 | Out-String).Trim()
    $mv = (npm -v 2>&1 | Out-String).Trim()
    Write-Info "node: $nv  npm: $mv"
    if ($nv -match '^v(\d+)' -and [int]$Matches[1] -lt 18) {
        Write-Warn "Node major < 18; upgrade LTS for Next 15."
    }
}

$envFile = Join-Path $repoRoot ".env"
if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Warn "No root .env — copy .env.example to .env and set DATABASE_URL / PORT / CORS per comments."
}
else {
    Write-Info "root .env: present"
    $lines = Get-Content -LiteralPath $envFile -Encoding UTF8 -ErrorAction SilentlyContinue
    $kv = @{}
    foreach ($line in $lines) {
        $t = $line.TrimEnd()
        if ([string]::IsNullOrWhiteSpace($t) -or $t.StartsWith("#")) { continue }
        $ix = $t.IndexOf("=")
        if ($ix -lt 1) { continue }
        $k = $t.Substring(0, $ix).Trim()
        $v = $t.Substring($ix + 1).Trim()
        $kv[$k] = $v
    }
    $port = $kv["PORT"]
    if ($port -eq "3012" -or $port -eq "3000") {
        Write-Warn "PORT=$port looks like Next dev port; API should listen on 8080 for this stack."
    }
    $strict = ($kv["STRICT_SSOT"] -eq "1") -or ($kv["CHECK_SSOT"] -eq "1")
    if ($strict) {
        if ([string]::IsNullOrWhiteSpace($kv["SSOT_VERSION"]) -or $kv["SSOT_VERSION"] -eq "unset") {
            Write-Host "preflight: ERROR STRICT_SSOT/CHECK_SSOT=1 requires SSOT_VERSION (non-unset). See .env.example." -ForegroundColor Red
            $failed = $true
        }
        if ([string]::IsNullOrWhiteSpace($kv["SSOT_SHA256"])) {
            Write-Host "preflight: ERROR STRICT_SSOT/CHECK_SSOT=1 requires SSOT_SHA256 matching docs/spec/08-3-参数与门禁表.md." -ForegroundColor Red
            $failed = $true
        }
        if ([string]::IsNullOrWhiteSpace($kv["CHARGEBACK_POLICY"]) -or $kv["CHARGEBACK_POLICY"] -eq "unset") {
            Write-Host "preflight: ERROR STRICT_SSOT/CHECK_SSOT=1 requires CHARGEBACK_POLICY (see crates/api startup)." -ForegroundColor Red
            $failed = $true
        }
        if ([string]::IsNullOrWhiteSpace($kv["CORS_ORIGINS"])) {
            Write-Host "preflight: ERROR STRICT_SSOT/CHECK_SSOT=1 requires CORS_ORIGINS (include http://localhost:3012 for local UI)." -ForegroundColor Red
            $failed = $true
        }
    }
}

$pkg = Join-Path $repoRoot "frontend\package.json"
$lock = Join-Path $repoRoot "frontend\package-lock.json"
if ((Test-Path $pkg) -and -not (Test-Path $lock)) {
    Write-Warn "frontend has no package-lock.json — consider npm install to lock deps."
}

Write-Host "======== preflight done ========"
if ($failed) { exit 1 }
exit 0
