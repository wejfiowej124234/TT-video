#Requires -Version 5.1
<#
.SYNOPSIS
  Post-migration audit: env vars, PATH, tool resolution, Docker compose, D:\dev layout hints.
  ASCII-only output for Windows PowerShell 5.1.
#>
$ErrorActionPreference = 'Continue'

function Section([string]$Title) {
    Write-Host ''
    Write-Host "=== $Title ==="
}

Section '1) User environment variables'
$keys = @(
    'RUSTUP_HOME', 'CARGO_HOME', 'FOUNDRY_DIR', 'TEMP', 'TMP',
    'PIP_CACHE_DIR', 'PYTHONUSERBASE'
)
foreach ($k in $keys) {
    $v = [Environment]::GetEnvironmentVariable($k, 'User')
    if ($v) { Write-Host "$k=$v" } else { Write-Host "$k=(not set)" }
}

Section '2) User PATH (first 25)'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not $userPath) { $userPath = '' }
$up = $userPath -split ';' | Where-Object { $_ }
$i = 0
foreach ($seg in ($up | Select-Object -First 25)) {
    $i++
    Write-Host ("{0,2} {1}" -f $i, $seg)
}

Section '3) User PATH legacy / duplicate risk (pattern scan)'
$patterns = @(
    @{ Name = 'old user .cargo\bin'; Re = '\\\.cargo\\bin' }
    @{ Name = 'old user .foundry\bin'; Re = '\\\.foundry\\bin' }
    @{ Name = 'AppData Roaming npm shims'; Re = 'Roaming\\npm\\?$' }
    @{ Name = 'nodejs-portable (multiple versions?)'; Re = 'nodejs-portable\\node-v' }
)
foreach ($p in $patterns) {
    $hits = $up | Where-Object { $_ -match $p.Re }
    if ($hits) {
        Write-Host ("-- " + $p.Name + " --")
        $hits | ForEach-Object { Write-Host "  $_" }
    }
}

Section '4) Tool resolution (merged User+Machine PATH)'
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
foreach ($k in $keys) {
    $v = [Environment]::GetEnvironmentVariable($k, 'User')
    if ($v) { Set-Item -Path "Env:$k" -Value $v }
}
foreach ($cmd in @('rustc', 'cargo', 'rustup', 'forge', 'node', 'npm', 'python', 'pip')) {
    $c = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($c) {
        Write-Host "$cmd -> $($c.Source)"
    } else {
        Write-Host "$cmd -> NOT FOUND"
    }
}

Section '5) where.exe node (order matters)'
& where.exe node 2>&1 | Select-Object -First 6 | ForEach-Object { Write-Host $_ }

Section '6) rustup home line'
& rustup show 2>&1 | Select-String -Pattern 'rustup home|active toolchain' | ForEach-Object { Write-Host $_.Line }

Section '7) Python user site (expect under D when PYTHONUSERBASE set)'
& python -m site --user-site 2>&1 | ForEach-Object { Write-Host $_ }

Section '8) npm prefix / cache'
& npm config get prefix 2>&1 | ForEach-Object { Write-Host "prefix=$_"}
& npm config get cache 2>&1 | ForEach-Object { Write-Host "cache=$_"}

Section '9) D:\dev top-level folders'
$dev = 'D:\dev'
if (Test-Path -LiteralPath $dev) {
    Get-ChildItem -LiteralPath $dev -Directory -ErrorAction SilentlyContinue |
        ForEach-Object {
            $sum = (Get-ChildItem $_.FullName -Recurse -File -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
            $gb = if ($sum) { [math]::Round($sum / 1GB, 2) } else { 0 }
            Write-Host ("{0,6} GB  {1}" -f $gb, $_.Name)
        }
} else {
    Write-Host 'D:\dev missing'
}

Section '10) Old C locations (existence only)'
$checks = @(
    "$env:USERPROFILE\.rustup",
    "$env:USERPROFILE\.cargo",
    "$env:USERPROFILE\.foundry",
    "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx"
)
foreach ($p in $checks) {
    $e = Test-Path -LiteralPath $p
    Write-Host ("{0}  {1}" -f $(if ($e) { 'EXISTS' } else { 'absent' }), $p)
}

Section '11) Docker compose (repo)'
$compose = Join-Path (Split-Path -Parent $PSScriptRoot) 'docker-compose.yml'
if (Test-Path -LiteralPath $compose) {
    & docker compose -f $compose ps -a 2>&1
} else {
    Write-Host "No docker-compose at $compose"
}

Write-Host ''
Write-Host 'Audit done. Review: multiple node-v under nodejs-portable, EXISTS on old C paths, NOT FOUND tools.'
