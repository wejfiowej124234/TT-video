#Requires -Version 5.1
<#
.SYNOPSIS
  Report Docker Desktop WSL disk usage on Windows (ASCII-only for Windows PowerShell 5.1).
  Reads CustomWslDistroDir from Roaming settings-store.json when present.
#>
$ErrorActionPreference = 'Continue'

function Write-TopFiles([string]$Root, [string]$Label) {
    Write-Host ""
    Write-Host "=== $Label ==="
    Write-Host "Path: $Root"
    if (-not (Test-Path -LiteralPath $Root)) {
        Write-Host '(missing)'
        return
    }
    $files = @(Get-ChildItem -LiteralPath $Root -Recurse -File -ErrorAction SilentlyContinue)
    if ($files.Count -eq 0) {
        Write-Host '(no files under this path)'
        return
    }
    $files | Sort-Object Length -Descending |
        Select-Object -First 15 @{ N = 'SizeGB'; E = { [math]::Round($_.Length / 1GB, 2) } }, FullName |
        Format-Table -AutoSize
}

$ss = Join-Path $env:APPDATA 'Docker\settings-store.json'
$customDir = $null
if (Test-Path -LiteralPath $ss) {
    try {
        $j = Get-Content -LiteralPath $ss -Raw | ConvertFrom-Json
        if ($j.PSObject.Properties.Name -contains 'CustomWslDistroDir' -and $j.CustomWslDistroDir) {
            $customDir = $j.CustomWslDistroDir
        }
    } catch {
        Write-Host "Could not parse settings-store.json: $_"
    }
}

if ($customDir) {
    Write-TopFiles -Root $customDir -Label 'Custom WSL distro dir (Docker data on D: or custom path)'
} else {
    Write-Host 'CustomWslDistroDir not set in settings-store.json (Docker may still use default C: layout).'
}

$legacyWsl = Join-Path $env:LOCALAPPDATA 'Docker\wsl'
Write-TopFiles -Root $legacyWsl -Label 'Legacy LOCALAPPDATA Docker\wsl (should be small after move to D:)'

Write-Host ''
Write-Host 'Full settings-store.json:'
if (Test-Path -LiteralPath $ss) {
    Get-Content -LiteralPath $ss -Raw | Write-Host
}

Write-Host ''
Write-Host 'Docker data location docs:'
Write-Host 'https://docs.docker.com/desktop/settings-and-maintenance/settings/#resources'
