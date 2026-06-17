# Local stack ABI alignment: optional forge export + 55-S13 frontend copy + gate check
# Usage: powershell -File scripts/dev/align-api-abi-local.ps1 [-FromForge] [-CheckOnly]
# Called from start-api-with-seed.bat Step 1b (default copy+gate; -CheckOnly when TRAVELTRUST_ABI_AUTO_ALIGN=0; -FromForge on retry).
param(
    [switch]$FromForge,
    [switch]$CheckOnly
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

# Default on (unset): auto forge export when protocol ABIs missing or verify-abi-forge reports drift.
$syncFromForgeEnabled = $true
if ($env:TRAVELTRUST_ABI_SYNC_FROM_FORGE -eq "0") { $syncFromForgeEnabled = $false }

function Invoke-Step {
    param([string]$Label, [scriptblock]$Body)
    Write-Host "align-api-abi-local: $Label"
    & $Body
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if (-not $CheckOnly -and -not $FromForge) {
    Write-Host "align-api-abi-local: protocol + governance ABIs present (forge multiset via check-protocol-abi-present)"
    powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\dev\check-protocol-abi-present.ps1")
    if ($LASTEXITCODE -ne 0) {
        if ($syncFromForgeEnabled) {
            Write-Host "align-api-abi-local: will sync from forge (TRAVELTRUST_ABI_SYNC_FROM_FORGE)" -ForegroundColor Yellow
            $FromForge = $true
        } else {
            exit $LASTEXITCODE
        }
    } else {
        $foundryBin = Join-Path $env:USERPROFILE ".foundry\bin"
        if (Test-Path $foundryBin) { $env:PATH = "$foundryBin;$env:PATH" }
        $forge = Get-Command forge -ErrorAction SilentlyContinue
        if ($forge -and $syncFromForgeEnabled) {
            $py = $null
            $pyArgs = $null
            if (Get-Command python -ErrorAction SilentlyContinue) { $py = "python" }
            elseif (Get-Command py -ErrorAction SilentlyContinue) { $py = "py"; $pyArgs = @("-3") }
            elseif (Get-Command python3 -ErrorAction SilentlyContinue) { $py = "python3" }
            if ($py) {
                Write-Host "align-api-abi-local: verify contracts/abi vs forge multiset"
                $verify = Join-Path $Root "scripts\dev\verify-abi-forge.py"
                if ($pyArgs) { & $py @pyArgs $verify } else { & $py $verify }
                if ($LASTEXITCODE -ne 0) {
                    Write-Host "align-api-abi-local: forge drift - syncing from forge" -ForegroundColor Yellow
                    $FromForge = $true
                }
            }
        }
    }
}

if (-not $CheckOnly) {
    if ($FromForge) {
        $forge = Get-Command forge -ErrorAction SilentlyContinue
        if (-not $forge) {
            Write-Host "align-api-abi-local: forge not in PATH; skip sync-abi-from-forge" -ForegroundColor Yellow
        } else {
            Invoke-Step "forge export -> contracts/abi" {
                powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\dev\sync-abi-from-forge.ps1")
            }
        }
    }
    Invoke-Step "copy 55-S13 subset -> frontend/dapp/abis" {
        powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\dev\sync-55-s13-frontend-abis.ps1")
    }
}

Invoke-Step "55-S13 gate" {
    powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $Root "scripts\dev\check-55-s13.ps1")
}
Write-Host "align-api-abi-local: OK"
exit 0
