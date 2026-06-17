# Post-start Publish Hub L5 smoke (① · Step 6s · seed + W1-A3 API + optional vitest).
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6s Publish Hub L5 smoke"
    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-publish-hub-post-start-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

$vitestFlag = ""
if ($env:TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST -eq "1") {
    $vitestFlag = "export TRAVELTRUST_POST_START_PUBLISH_HUB_VITEST=1 && "
}

Write-Host "Step 6s - Publish Hub L5 seed+API+vitest API_BASE=$apiBase (SKIP_VITEST default 1)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' && ${vitestFlag}bash scripts/dev/smoke-publish-hub-post-start-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-publish-hub-post-start-local failed exit $($proc.ExitCode) - API still up"
        exit 0
    }
    Write-Host "FAIL: smoke-publish-hub-post-start-local exit $($proc.ExitCode)"
    exit $proc.ExitCode
}

Write-Host "OK: smoke-publish-hub-post-start-local (TT_PUBLISH_HUB_POST_START)"
exit 0
