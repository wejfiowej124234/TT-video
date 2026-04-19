# 与 run-check-04-routes.sh 等价：API 表、04/13-1 与 app、13-1⊆04 文档校验；选用可执行 python / python3
$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $rootDir

$pyExe = $null
foreach ($name in @("python", "python3")) {
    if (-not (Get-Command $name -ErrorAction SilentlyContinue)) { continue }
    & $name -c "import sys" 2>$null
    if ($LASTEXITCODE -eq 0) { $pyExe = $name; break }
}
if (-not $pyExe) {
    Write-Error "run-check-04-routes: need working python or python3 on PATH"
    exit 2
}

if (-not $env:STRICT_WARNINGS) { $env:STRICT_WARNINGS = "1" }
& $pyExe (Join-Path $PSScriptRoot "check-04-routes-vs-code.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $pyExe (Join-Path $PSScriptRoot "check-04-frontend-routes-vs-app.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $pyExe (Join-Path $PSScriptRoot "check-13-1-table1-routes-vs-app.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $pyExe (Join-Path $PSScriptRoot "check-13-1-routes-covered-by-04-frontend-table.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
& $pyExe (Join-Path $PSScriptRoot "check-b432-governance-ui-ssot-surface.py")
exit $LASTEXITCODE
