# Post-start PWB-L5 provider workbench smoke (① local · vitest + merchant@test API chain).

param(

    [int]$Port = 8080,

    [switch]$WarnOnly

)



$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "lib\Resolve-GitBash.ps1")



$bash = Get-GitBashExe

if (-not $bash) {

    Write-Host "WARN: Git Bash not found - skip Step 6r PWB-L5 provider workbench smoke"

    Write-Host "       Run manually: API_BASE=http://127.0.0.1:$Port bash scripts/dev/smoke-provider-workbench-l5-local.sh"

    exit 0

}



$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path

$apiBase = "http://127.0.0.1:$Port"

$rootUnix = ($root -replace '\\', '/')



Write-Host "Step 6r - Matrix C4 merchant@test.com PWB-L5 provider workbench vitest+API API_BASE=$apiBase (SKIP_PLAYWRIGHT=1)"

$proc = Start-Process -FilePath $bash -ArgumentList @(

    '-lc',

    "cd '$rootUnix' && export API_BASE='$apiBase' SKIP_PLAYWRIGHT=1 && bash scripts/dev/smoke-provider-workbench-l5-local.sh"

) -Wait -PassThru -NoNewWindow



if ($proc.ExitCode -ne 0) {

    if ($WarnOnly) {

        Write-Host "WARN: smoke-provider-workbench-l5-local failed exit $($proc.ExitCode) - API still up"

        exit 0

    }

    Write-Host "FAIL: Step 6r matrix C4 merchant@test.com - smoke-provider-workbench-l5-local exit $($proc.ExitCode)"

    exit $proc.ExitCode

}



Write-Host "OK: Step 6r matrix C4 merchant@test.com provider workbench (TT_PROVIDER_WORKBENCH_L5_SMOKE)"

exit 0

