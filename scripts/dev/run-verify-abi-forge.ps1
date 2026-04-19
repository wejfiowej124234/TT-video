# Runs scripts/dev/verify-abi-forge.py (same as bash run-verify-abi-forge.sh). Repo root.
$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root
$foundryBin = Join-Path $env:USERPROFILE ".foundry\bin"
if (Test-Path $foundryBin) {
    $env:PATH = "$foundryBin;$env:PATH"
}
$py = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    try { python -c "pass" 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { $py = "python" } } catch {}
}
if (-not $py -and (Get-Command py -ErrorAction SilentlyContinue)) {
    try { py -3 -c "pass" 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { $py = "py -3" } } catch {}
}
if (-not $py) {
    Write-Host "run-verify-abi-forge.ps1: need working python on PATH" -ForegroundColor Red
    exit 1
}
$script = Join-Path $Root "scripts\dev\verify-abi-forge.py"
if ($py -eq "py -3") {
    & py -3 $script
} else {
    & python $script
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
exit 0
