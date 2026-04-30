#Requires -Version 5.1
<#
.SYNOPSIS
  Quick health check: Docker compose for this repo, Rust toolchain, user env pointing at D:\dev.
#>
$ErrorActionPreference = 'Continue'
$repoRoot = Split-Path -Parent $PSScriptRoot

Write-Host '=== User env (registry User scope) ==='
foreach ($k in @('RUSTUP_HOME', 'CARGO_HOME', 'FOUNDRY_DIR', 'TEMP', 'TMP', 'PIP_CACHE_DIR', 'PYTHONUSERBASE')) {
    $v = [Environment]::GetEnvironmentVariable($k, 'User')
    Write-Host "$k=$v"
}

Write-Host ''
Write-Host '=== PATH head (User) ==='
$up = [Environment]::GetEnvironmentVariable('Path', 'User') -split ';' | Where-Object { $_ } | Select-Object -First 8
$up | ForEach-Object { Write-Host $_ }

Write-Host ''
Write-Host '=== Toolchain (refresh Path from registry) ==='
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'User') + ';' + [Environment]::GetEnvironmentVariable('Path', 'Machine')
$env:RUSTUP_HOME = [Environment]::GetEnvironmentVariable('RUSTUP_HOME', 'User')
$env:CARGO_HOME = [Environment]::GetEnvironmentVariable('CARGO_HOME', 'User')
$env:FOUNDRY_DIR = [Environment]::GetEnvironmentVariable('FOUNDRY_DIR', 'User')
foreach ($cmd in @('rustc', 'cargo', 'forge', 'npm')) {
    $x = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($x) { Write-Host "$cmd -> $($x.Source)" } else { Write-Host "$cmd -> NOT FOUND" }
}

Write-Host ''
Write-Host '=== Docker ==='
& docker version 2>&1 | Select-Object -First 6
$compose = Join-Path $repoRoot 'docker-compose.yml'
if (Test-Path -LiteralPath $compose) {
    Write-Host ""
    Write-Host "docker compose -f $compose ps"
    & docker compose -f $compose ps 2>&1
} else {
    Write-Host "No docker-compose.yml at $compose"
}

Write-Host ''
Write-Host 'where.exe node (first wins):'
& where.exe node 2>&1 | Select-Object -First 4

Write-Host ''
Write-Host 'OK: review any NOT FOUND or compose errors above.'
Write-Host 'Optional: Node portable + PYTHONUSERBASE -> scripts\windows-runtime-to-d.ps1 -Apply'
