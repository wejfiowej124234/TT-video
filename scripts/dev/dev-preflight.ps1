# Dev preflight: Docker, npm, cargo, .env
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\dev-preflight.ps1
$ErrorActionPreference = "Continue"
$fail = 0

Write-Host "=== TravelTrust dev preflight ==="

docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Docker not available: start Docker Desktop (docker compose up -d for Postgres)"
    $fail = 1
}
else {
    Write-Host "OK: Docker"
}

$npm = $null
foreach ($p in @("npm", "E:\Dev\nodejs\npm.cmd", "$env:ProgramFiles\nodejs\npm.cmd")) {
    if ($p -eq "npm") {
        $c = Get-Command npm -ErrorAction SilentlyContinue
        if ($c) { $npm = $c.Source; break }
    }
    elseif (Test-Path -LiteralPath $p) { $npm = $p; break }
}
if (-not $npm) {
    Write-Warning "npm not found: install Node.js 18+ (suggest E:\Dev\nodejs) https://nodejs.org/"
    $fail = 1
}
else {
    Write-Host "OK: npm at $npm"
}

$cargo = Get-Command cargo -ErrorAction SilentlyContinue
if (-not $cargo) {
    Write-Warning "cargo not found: install Rust https://rustup.rs/"
    $fail = 1
}
else {
    Write-Host "OK: cargo"
}

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile = Join-Path $root ".env"
if (-not (Test-Path -LiteralPath $envFile)) {
    Write-Warning "Missing $envFile : copy from .env.example and set DATABASE_URL if using Docker Postgres"
    $fail = 1
}
else {
    $raw = Get-Content -LiteralPath $envFile -Raw -ErrorAction SilentlyContinue
    if ($raw -notmatch '(?m)^\s*DATABASE_URL\s*=') {
        Write-Host "Note: no DATABASE_URL in .env (API uses in-memory store)"
    }
    else {
        Write-Host "OK: .env has DATABASE_URL"
    }
}

Write-Host "=== preflight done, exit code $fail ==="
exit $fail
