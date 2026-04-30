#Requires -Version 5.1
<#
.SYNOPSIS
  Point RUSTUP_HOME, CARGO_HOME, and user TEMP/TMP to a non-C drive (default D:\dev).

.DESCRIPTION
  Creates rustup, cargo, and temp under DevRoot. If %USERPROFILE%\.rustup and .cargo
  exist and destinations are empty, copies with robocopy (does not delete C: copies).
  Sets User-scoped environment variables. Close IDEs/terminals before -Apply.

  Also migrates Foundry (~/.foundry) to DevRoot/foundry (FOUNDRY_DIR + PATH), npm global
  prefix to DevRoot/npm-global, pip cache (PIP_CACHE_DIR) if pip
  exists, and merges PATH so cargo/foundry/npm shims prefer D:.

  Docker Desktop disk location must be changed in the GUI; this script only prints a hint.

.PARAMETER DevRoot
  Root folder on D: (or another non-C drive). Default: D:\dev

.PARAMETER Preview
  Print planned actions only.

.PARAMETER Apply
  Create folders, copy if needed, set user environment variables, fix user PATH for cargo bin, optional npm cache.

.PARAMETER RemoveLegacyCRustHome
  With -Apply: after PATH fix, delete %USERPROFILE%\.rustup and .cargo (only if RUSTUP_HOME already points under DevRoot).

.PARAMETER RemoveLegacyFoundryHome
  With -Apply: after PATH fix, delete %USERPROFILE%\.foundry (only if FOUNDRY_DIR equals DevRoot\foundry).

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Preview

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Apply

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Apply -RemoveLegacyCRustHome
#>
param(
    [string]$DevRoot = 'D:\dev',
    [switch]$Preview,
    [switch]$Apply,
    [switch]$RemoveLegacyCRustHome,
    [switch]$RemoveLegacyFoundryHome
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[windows-dev-root-on-d] $Message" -ForegroundColor Cyan
}

if (-not $Preview -and -not $Apply) {
    Write-Host @'
Usage (preview first, then apply):

  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Preview
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Apply
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Apply -RemoveLegacyCRustHome
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-root-on-d.ps1 -Apply -RemoveLegacyFoundryHome

Optional: -DevRoot E:\rust-env   (default is D:\dev)
'@
    exit 1
}

if (($RemoveLegacyCRustHome -or $RemoveLegacyFoundryHome) -and -not $Apply -and -not $Preview) {
    Write-Error 'Legacy remove switches must be used with -Apply (or with -Preview to preview).'
    exit 1
}

if ($Preview -and $Apply) {
    Write-Error 'Use either -Preview or -Apply, not both.'
    exit 1
}

$drive = Split-Path -Qualifier $DevRoot
if (-not $drive) {
    Write-Error 'DevRoot must be an absolute path, e.g. D:\dev'
    exit 1
}
if ($drive.Substring(0, 1) -eq 'C') {
    Write-Error 'DevRoot must not be on C: (use D:\dev or similar).'
    exit 1
}

$rustupDest = Join-Path $DevRoot 'rustup'
$cargoDest = Join-Path $DevRoot 'cargo'
$tempDest = Join-Path $DevRoot 'temp'

$oldRustup = Join-Path $env:USERPROFILE '.rustup'
$oldCargo = Join-Path $env:USERPROFILE '.cargo'
$oldFoundry = Join-Path $env:USERPROFILE '.foundry'
$foundryDest = Join-Path $DevRoot 'foundry'
$npmGlobalBin = Join-Path $DevRoot 'npm-global'

function Test-DirEmptyOrMissing([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) { return $true }
    return -not (Get-ChildItem -LiteralPath $Path -Force -ErrorAction SilentlyContinue | Select-Object -First 1)
}

function Invoke-RobocopyCopy([string]$Src, [string]$Dst) {
    if (-not (Test-Path -LiteralPath $Src)) { return }
    New-Item -ItemType Directory -Path $Dst -Force | Out-Null
    Write-Step "robocopy (copy only, source not deleted): $Src -> $Dst"
    $rc = & robocopy $Src $Dst /E /COPY:DAT /R:2 /W:2 /NFL /NDL /NJH /NJS
    if ($rc -ge 8) {
        throw "robocopy failed with exit code $rc"
    }
}

function Sync-UserDevToolPaths([string]$CargoHome, [string]$FoundryHome, [string]$NpmGlobal) {
    $legacyCargo = Join-Path $env:USERPROFILE '.cargo\bin'
    $legacyFoundry = Join-Path $env:USERPROFILE '.foundry\bin'
    $legacyRoamingNpm = Join-Path $env:APPDATA 'npm'

    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    if (-not $userPath) { $userPath = '' }
    $parts = $userPath -split ';' | Where-Object { $_ }

    $legacySet = @($legacyCargo, $legacyFoundry, $legacyRoamingNpm)
    $parts = $parts | Where-Object { $_ -and ($_ -notin $legacySet) }

    $prepend = @()
    $cargoBin = Join-Path $CargoHome 'bin'
    if (Test-Path -LiteralPath (Join-Path $cargoBin 'rustc.exe')) {
        $prepend += $cargoBin
    }
    $foundryBin = Join-Path $FoundryHome 'bin'
    if (Test-Path -LiteralPath (Join-Path $foundryBin 'forge.exe')) {
        $prepend += $foundryBin
    }
    if ($NpmGlobal -and (Test-Path -LiteralPath $NpmGlobal)) {
        $prepend += $NpmGlobal
    }

    $prepend = $prepend | Select-Object -Unique
    foreach ($p in $prepend) {
        $parts = $parts | Where-Object { $_ -ne $p }
    }
    $newParts = $prepend + $parts
    $newPath = ($newParts -join ';')
    [Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
    Write-Step "User PATH synced (cargo / foundry / npm-global on D: where present)."
}

function Set-NpmOnDevRoot([string]$Root) {
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Step 'npm not on PATH; skip npm cache/prefix.'
        return
    }
    $npmCache = Join-Path $Root 'npm-cache'
    $npmPrefix = Join-Path $Root 'npm-global'
    New-Item -ItemType Directory -Path $npmCache, $npmPrefix -Force | Out-Null
    & npm config set cache $npmCache --global 2>&1 | Out-Null
    & npm config set prefix $npmPrefix --global 2>&1 | Out-Null
    Write-Step "npm cache -> $npmCache ; prefix -> $npmPrefix"
}

function Set-PipCacheOnDevRoot([string]$Root) {
    if (-not (Get-Command pip -ErrorAction SilentlyContinue)) {
        Write-Step 'pip not on PATH; skip PIP_CACHE_DIR.'
        return
    }
    $pipCache = Join-Path $Root 'pip-cache'
    New-Item -ItemType Directory -Path $pipCache -Force | Out-Null
    [Environment]::SetEnvironmentVariable('PIP_CACHE_DIR', $pipCache, 'User')
    Write-Step "PIP_CACHE_DIR -> $pipCache"
}

Write-Step "DevRoot = $DevRoot"
Write-Step "Targets: RUSTUP_HOME=$rustupDest ; CARGO_HOME=$cargoDest ; TEMP/TMP=$tempDest"
Write-Step "User: $($env:USERNAME) ; USERPROFILE=$($env:USERPROFILE)"

if ($Preview) {
    Write-Host ''
    Write-Host "[Preview] Will create: $rustupDest, $cargoDest, $tempDest"
    if ((Test-Path -LiteralPath $oldRustup) -and (Test-DirEmptyOrMissing $rustupDest)) {
        Write-Host "[Preview] Will copy $oldRustup -> $rustupDest"
    } else {
        Write-Host '[Preview] Skip rustup copy (source missing or destination not empty).'
    }
    if ((Test-Path -LiteralPath $oldCargo) -and (Test-DirEmptyOrMissing $cargoDest)) {
        Write-Host "[Preview] Will copy $oldCargo -> $cargoDest"
    } else {
        Write-Host '[Preview] Skip .cargo copy (source missing or destination not empty).'
    }
    Write-Host '[Preview] Will set user env: RUSTUP_HOME, CARGO_HOME, TEMP, TMP'
    Write-Host '[Preview] Will fix user PATH: cargo + foundry + npm-global on D:, remove legacy C: shims.'
    Write-Host '[Preview] If npm exists: cache + prefix under DevRoot (npm uses TEMP/TMP for temp files).'
    Write-Host '[Preview] If pip exists: set user PIP_CACHE_DIR under DevRoot\pip-cache.'
    if ((Test-Path -LiteralPath $oldFoundry) -and (Test-DirEmptyOrMissing $foundryDest)) {
        Write-Host "[Preview] Will copy $oldFoundry -> $foundryDest and set FOUNDRY_DIR."
    } else {
        Write-Host '[Preview] Skip Foundry copy (source missing or destination not empty).'
    }
    if ($RemoveLegacyCRustHome) {
        Write-Host "[Preview] With -RemoveLegacyCRustHome: delete $oldRustup and $oldCargo after PATH fix."
    }
    if ($RemoveLegacyFoundryHome) {
        Write-Host "[Preview] With -RemoveLegacyFoundryHome: delete $oldFoundry after PATH fix."
    }
    Write-Host ''
    Write-Host 'Docker: In Docker Desktop -> Settings, move disk image / data to D: (see docker docs Resources).'
    exit 0
}

New-Item -ItemType Directory -Path $rustupDest, $cargoDest, $tempDest -Force | Out-Null

if ((Test-Path -LiteralPath $oldRustup) -and (Test-DirEmptyOrMissing $rustupDest)) {
    Invoke-RobocopyCopy -Src $oldRustup -Dst $rustupDest
} else {
    Write-Step "Skip rustup copy (source missing or $rustupDest already has files)."
}

if ((Test-Path -LiteralPath $oldCargo) -and (Test-DirEmptyOrMissing $cargoDest)) {
    Invoke-RobocopyCopy -Src $oldCargo -Dst $cargoDest
} else {
    Write-Step "Skip .cargo copy (source missing or $cargoDest already has files)."
}

if ((Test-Path -LiteralPath $oldFoundry) -and (Test-DirEmptyOrMissing $foundryDest)) {
    Invoke-RobocopyCopy -Src $oldFoundry -Dst $foundryDest
} else {
    Write-Step "Skip Foundry copy (source missing or $foundryDest already has files)."
}

Write-Step 'Setting user environment variables (restart Cursor/terminal to pick up).'
[Environment]::SetEnvironmentVariable('RUSTUP_HOME', $rustupDest, 'User')
[Environment]::SetEnvironmentVariable('CARGO_HOME', $cargoDest, 'User')
[Environment]::SetEnvironmentVariable('TEMP', $tempDest, 'User')
[Environment]::SetEnvironmentVariable('TMP', $tempDest, 'User')

if (Test-Path -LiteralPath (Join-Path $foundryDest 'bin\forge.exe')) {
    [Environment]::SetEnvironmentVariable('FOUNDRY_DIR', $foundryDest, 'User')
    Write-Step "FOUNDRY_DIR -> $foundryDest"
} else {
    Write-Step 'Skip FOUNDRY_DIR (forge.exe not found under DevRoot\foundry).'
}

Set-NpmOnDevRoot -Root $DevRoot
Set-PipCacheOnDevRoot -Root $DevRoot
Sync-UserDevToolPaths -CargoHome $cargoDest -FoundryHome $foundryDest -NpmGlobal $npmGlobalBin

if ($RemoveLegacyCRustHome) {
    $ruUser = [Environment]::GetEnvironmentVariable('RUSTUP_HOME', 'User')
    if ($ruUser -ne $rustupDest) {
        throw "Refusing to remove legacy home: user RUSTUP_HOME is '$ruUser', expected '$rustupDest'."
    }
    Write-Step "Removing legacy folders: $oldRustup , $oldCargo"
    if (Test-Path -LiteralPath $oldRustup) {
        Remove-Item -LiteralPath $oldRustup -Recurse -Force
    }
    if (Test-Path -LiteralPath $oldCargo) {
        Remove-Item -LiteralPath $oldCargo -Recurse -Force
    }
}

if ($RemoveLegacyFoundryHome) {
    $fdUser = [Environment]::GetEnvironmentVariable('FOUNDRY_DIR', 'User')
    if ($fdUser -ne $foundryDest) {
        throw "Refusing to remove legacy Foundry: user FOUNDRY_DIR is '$fdUser', expected '$foundryDest'."
    }
    Write-Step "Removing legacy folder: $oldFoundry"
    if (Test-Path -LiteralPath $oldFoundry) {
        Remove-Item -LiteralPath $oldFoundry -Recurse -Force
    }
}

Write-Host ''
Write-Host 'Done. Next steps:' -ForegroundColor Green
Write-Host '  1) Fully quit and reopen Cursor (or log off once).'
Write-Host '  2) In a NEW terminal: rustc --version ; cargo --version ; forge --version (if used)'
if (-not $RemoveLegacyCRustHome) {
    Write-Host '  3) To delete duplicate C: rust folders after you trust the setup, re-run:'
    Write-Host '       ... -Apply -RemoveLegacyCRustHome'
    Write-Host "     Or manually remove: $oldRustup and $oldCargo"
}
Write-Host ''
Write-Host 'Docker often uses the most space on C:. Move data disk in Docker Desktop Settings.'
Write-Host 'https://docs.docker.com/desktop/settings-and-maintenance/settings/#resources'
Write-Host 'See large vhdx files: scripts\windows-docker-disk-inventory.ps1'
Write-Host ''
