# ① Anvil 全栈对齐（FundStack + TTG + .env supersede + frontend sync）
param(
    [switch]$ForceTtgRedeploy
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "../..")).Path
$bashSh = Join-Path $Root "scripts/dev/align-anvil-local-stack.sh"

if (-not (Test-Path -LiteralPath $bashSh)) {
    Write-Error "missing $bashSh"
}

. (Join-Path $PSScriptRoot "lib/Resolve-GitBash.ps1")
$bashExe = Get-GitBashExe
if (-not $bashExe) {
    Write-Error "Git Bash bash.exe not found — install Git for Windows or set GIT_BASH"
}

$env:SKIP_ANVIL_STOP = "1"
if ($ForceTtgRedeploy) {
    $env:TTG_ANVIL_FORCE_DEPLOY = "1"
}

Push-Location $Root
try {
    & $bashExe $bashSh
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

Write-Host "align-anvil-local-stack.ps1: OK"
