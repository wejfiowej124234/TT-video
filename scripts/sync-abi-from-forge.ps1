# 与 sync-abi-from-forge.sh 等价：从 Foundry 导出 ABI 到 contracts/abi
# 用法：项目根 .\scripts\sync-abi-from-forge.ps1
# 前置：已安装 forge；contracts 目录可 forge build

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
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
    Push-Location (Join-Path $rootDir "contracts")
    try {
        $raw = & forge inspect $name abi 2>$null
        if ($LASTEXITCODE -ne 0) { return $false }
    }
    finally { Pop-Location }
    $dest = Join-Path $rootDir "contracts/abi/$name.json"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    try {
        $obj = $raw | ConvertFrom-Json
        $pretty = $obj | ConvertTo-Json -Depth 100
        [System.IO.File]::WriteAllText($dest, $pretty, $utf8NoBom)
    }
    catch {
        [System.IO.File]::WriteAllText($dest, $raw, $utf8NoBom)
    }
    Write-Host "sync-abi-from-forge: wrote $dest"
    return $true
}

foreach ($c in @("Escrow", "EscrowFactory", "Staking", "Registry", "FeeRouter", "RegionVault", "InvestorDistributionClaim", "GovernanceTimelock", "GovernanceTreasury")) {
    if (-not (Write-Abi $c)) { Fail "forge inspect $c abi failed" }
}
foreach ($c in @("IERC20", "MockERC20")) {
    if (-not (Write-Abi $c)) { Write-Host "sync-abi-from-forge: skip $c (optional)" }
}

Set-Location $rootDir
$pyExe = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) { $pyExe = "python3" }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $pyExe = "python" }
if ($pyExe) {
    & $pyExe scripts/verify-abi-forge.py
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ""
Write-Host "Next:"
Write-Host "  cp contracts/abi/Staking.json ... FeeRouter.json RegionVault.json frontend/dapp/abis/   # or copy on Windows"
Write-Host "  .\scripts\check-55-s13.ps1"
