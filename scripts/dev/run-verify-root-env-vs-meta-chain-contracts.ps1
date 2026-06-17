# Post-start: root .env chain contract keys vs GET /meta chain.contracts (759 alignment).
# Usage: powershell -File scripts/dev/run-verify-root-env-vs-meta-chain-contracts.ps1 -Port 8080 [-WarnOnly]
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$bashSh = Join-Path $Root "scripts/dev/verify-root-env-vs-meta-chain-contracts.sh"

if (-not (Test-Path -LiteralPath $bashSh)) {
    Write-Error "missing $bashSh"
}

. (Join-Path $PSScriptRoot "lib/Resolve-GitBash.ps1")
$bashExe = Get-GitBashExe
if (-not $bashExe) {
    if ($WarnOnly) {
        Write-Host "run-verify-root-env-vs-meta: WARN Git Bash not found — skip" -ForegroundColor Yellow
        exit 0
    }
    Write-Error "Git Bash bash.exe not found — install Git for Windows or set GIT_BASH"
}

$env:API_BASE_URL = "http://127.0.0.1:$Port"

Push-Location $Root
try {
    & $bashExe $bashSh
    if ($LASTEXITCODE -ne 0) {
        if ($WarnOnly) {
            Write-Host "run-verify-root-env-vs-meta: WARN exit $LASTEXITCODE (continuing)" -ForegroundColor Yellow
            exit 0
        }
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

Write-Host "run-verify-root-env-vs-meta: OK ($($env:API_BASE_URL))"
exit 0
