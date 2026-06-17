# Step 4b · Clear f0e0b101-* guide slot rows in PG before API hydrate (GD-L5 booking smoke).
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")

$bash = Get-GitBashExe
if (-not $bash) {
    Write-Host "WARN: Git Bash not found - skip Step 4b clear hangzhou seed guide slots"
    exit 0
}

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$rootUnix = ($root -replace '\\', '/')

$proc = Start-Process -FilePath $bash -ArgumentList @(
    '-lc',
    "cd '$rootUnix' && bash scripts/dev/clear-hangzhou-seed-guide-slots-db.sh"
) -Wait -PassThru -NoNewWindow

if ($proc.ExitCode -ne 0) {
    Write-Host "FAIL: clear-hangzhou-seed-guide-slots-db exit $($proc.ExitCode)"
    exit $proc.ExitCode
}
exit 0
