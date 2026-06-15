# 与 sync-abi-from-forge.sh 等价：从 Foundry 导出 ABI 到 contracts/abi
# 用法：项目根 .\scripts\sync-abi-from-forge.ps1
# 前置：已安装 forge；contracts 目录可 forge build

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

function Fail($msg) { Write-Error "sync-abi-from-forge: $msg"; exit 1 }

$forge = Get-Command forge -ErrorAction SilentlyContinue
if (-not $forge) { Fail "forge not in PATH. Install Foundry: https://book.getfoundry.sh" }

Push-Location (Join-Path $rootDir "contracts")
try {
    & forge build
    if ($LASTEXITCODE -ne 0) { Fail "forge build failed" }
}
finally { Pop-Location }

function Write-Abi($name) {
    $dest = Join-Path $rootDir "contracts/abi/$name.json"
    $artifact = Join-Path $rootDir "contracts/out/$name.sol/$name.json"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false

    # Prefer forge build artifact (.abi array) — matches sync-abi-from-forge.sh; avoids Windows table output from `forge inspect`.
    if (Test-Path -LiteralPath $artifact) {
        $full = Get-Content -LiteralPath $artifact -Raw -Encoding UTF8 | ConvertFrom-Json
        if (-not $full.abi) { return $false }
        $pretty = $full.abi | ConvertTo-Json -Depth 100
        [System.IO.File]::WriteAllText($dest, $pretty, $utf8NoBom)
        Write-Host "sync-abi-from-forge: wrote $dest"
        return $true
    }

    Push-Location (Join-Path $rootDir "contracts")
    try {
        $raw = (& forge inspect $name abi 2>$null | Out-String).Trim()
        if ($LASTEXITCODE -ne 0 -or -not $raw) { return $false }
    }
    finally { Pop-Location }

    try {
        $obj = $raw | ConvertFrom-Json
        $pretty = $obj | ConvertTo-Json -Depth 100
        [System.IO.File]::WriteAllText($dest, $pretty, $utf8NoBom)
    }
    catch {
        Write-Host "sync-abi-from-forge: forge inspect $name returned non-JSON; run forge build first" -ForegroundColor Red
        return $false
    }
    Write-Host "sync-abi-from-forge: wrote $dest"
    return $true
}

# Must match scripts/dev/sync-abi-from-forge.sh (incl. protocol convergence steward + redemption epoch)
$required = @(
    "Escrow", "EscrowFactory", "GuideIdentityStakingPool", "ProviderIdentityStakingPool", "Registry",
    "FeeRouter", "RegionVault", "ReserveVault", "SlashRouter", "InvestorDistributionClaim",
    "GovernanceTimelock", "GovernanceTreasury", "GovernanceVotesToken", "TravelTrustGovernor",
    "RegionStewardStakePool", "CountryPoolSubVaultsV0", "CountryPoolRedemptionEpochV0"
)
foreach ($c in $required) {
    if (-not (Write-Abi $c)) { Fail "forge inspect $c abi failed" }
}
foreach ($c in @("IERC20", "MockERC20")) {
    if (-not (Write-Abi $c)) { Write-Host "sync-abi-from-forge: skip $c (optional)" }
}

Set-Location $rootDir
$pyExe = $null
$pyArgs = $null
if (Get-Command python -ErrorAction SilentlyContinue) { $pyExe = "python" }
elseif (Get-Command py -ErrorAction SilentlyContinue) { $pyExe = "py" ; $pyArgs = @("-3") }
elseif (Get-Command python3 -ErrorAction SilentlyContinue) { $pyExe = "python3" }
if ($pyExe) {
    $verifyScript = Join-Path $PSScriptRoot "verify-abi-forge.py"
    if ($pyArgs) { & $pyExe @pyArgs $verifyScript } else { & $pyExe $verifyScript }
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

& (Join-Path $PSScriptRoot "sync-55-s13-frontend-abis.ps1")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "sync-abi-from-forge: contracts/abi + frontend/dapp/abis (55-S13 subset) aligned"
Write-Host "  .\scripts\check-55-s13.ps1"
