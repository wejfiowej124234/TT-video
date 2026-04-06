# 发版前「机器可执行」聚合（Windows）：不变量、55-S13、04 路由、（可选）Forge ABI multiset。
# 与 pre-release-automation.sh 等价。不替代：缺口官方总表 P0、15 附录〇、08-4/08-2 签字、evidence、53/55 人工确认。
# 用法（项目根）：
#   .\scripts\pre-release-automation.ps1
#   $env:SKIP_FORGE_VERIFY='1'; .\scripts\pre-release-automation.ps1   # 本机无 forge 时

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }
Set-Location $rootDir

Write-Host "=== pre-release-automation: check-invariants ==="
& "$PSScriptRoot/check-invariants.ps1"
if (-not $?) { exit 1 }

Write-Host "=== pre-release-automation: 55-S13 ==="
& "$PSScriptRoot/check-55-s13.ps1"
if (-not $?) { exit 1 }

Write-Host "=== pre-release-automation: 04 API + 04/13-1 routes (app + doc subset) ==="
& "$PSScriptRoot/run-check-04-routes.ps1"
$pr = if ($null -ne $LASTEXITCODE) { $LASTEXITCODE } else { 0 }
if ($pr -eq 2) {
    Write-Host "pre-release-automation: skip 04 route check (no working python)"
} elseif ($pr -ne 0) {
    exit $pr
}

if ($env:SKIP_FORGE_VERIFY -eq "1") {
    Write-Host "=== pre-release-automation: SKIP_FORGE_VERIFY=1 — skipped verify-abi-forge ==="
} elseif (Get-Command forge -ErrorAction SilentlyContinue) {
    Write-Host "=== pre-release-automation: forge build + verify-abi-forge ==="
    Push-Location contracts
    try {
        & forge build
        if (-not $?) { exit 1 }
    } finally {
        Pop-Location
    }
    & "$PSScriptRoot/run-verify-abi-forge.ps1"
    if (-not $?) { exit 1 }
} else {
    Write-Host "=== pre-release-automation: forge not in PATH — skipped verify-abi-forge (set SKIP_FORGE_VERIFY=1 to silence) ==="
}

Write-Host ""
Write-Host "pre-release-automation: 机器步骤完成。"
Write-Host "须人工（不可替代）：缺口与待补-官方总表 P0、15 附录〇、53-收口-09-04-36-确认表、55 §八附续.9、08-4/08-2/evidence/Runbook。"
