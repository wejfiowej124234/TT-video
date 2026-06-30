# Post-start SWB-L5 steward workbench smoke (① local · vitest + multi-demo steward API).
param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 6t SWB-L5 steward workbench smoke"
    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-steward-workbench-l5-local.sh"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$apiBase = "http://127.0.0.1:$Port"
$rootUnix = ($root -replace '\\', '/')

Write-Host "Step 6t - Matrix C1 multi-demo@test.com SWB-L5 steward workbench vitest+API API_BASE=$apiBase (SKIP_PLAYWRIGHT=1)"
$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && export API_BASE='$apiBase' SKIP_PLAYWRIGHT=1 && bash scripts/dev/smoke-steward-workbench-l5-local.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    if ($WarnOnly) {
        Write-Host "WARN: smoke-steward-workbench-l5-local exit $($proc.ExitCode) (continuing)" -ForegroundColor Yellow
        exit 0
    }
    exit $proc.ExitCode
}

Write-Host "run-post-start-steward-workbench-l5-smoke: OK Step 6t matrix C1 multi-demo@test.com"
exit 0
