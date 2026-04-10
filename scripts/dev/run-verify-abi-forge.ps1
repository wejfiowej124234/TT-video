# 与 run-verify-abi-forge.sh 等价：优先 python3，其次 python
# 用法：项目根 .\scripts\run-verify-abi-forge.ps1

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

$pyExe = $null
if (Get-Command python3 -ErrorAction SilentlyContinue) { $pyExe = "python3" }
elseif (Get-Command python -ErrorAction SilentlyContinue) { $pyExe = "python" }
if (-not $pyExe) {
    Write-Error "run-verify-abi-forge: need python3 or python on PATH"
    exit 1
}

& $pyExe (Join-Path $PSScriptRoot "verify-abi-forge.py")
exit $LASTEXITCODE
