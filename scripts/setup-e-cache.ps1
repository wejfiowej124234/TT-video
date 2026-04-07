# Dev stack defaults to E: (caches under E:\Cache, tools/workspaces under E:\Dev)
param(
    [switch]$SkipMigration,
    [switch]$SkipIdeExtensions
)

$ErrorActionPreference = "Stop"

function Move-UserDevFolder {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination
    )
    if (-not (Test-Path -LiteralPath $Source)) {
        return $false
    }
    $srcItem = Get-Item -LiteralPath $Source -Force -ErrorAction SilentlyContinue
    if ($null -ne $srcItem -and ($srcItem.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        Write-Host "Skip migration (path is already a junction/reparse point): $Source"
        return $false
    }
    $robocopy = Join-Path $env:SystemRoot "System32\robocopy.exe"
    if (-not (Test-Path $robocopy)) {
        throw "robocopy.exe not found; cannot migrate $Source"
    }

    Write-Host "Migrating (robocopy /MOVE, OK across C: -> E:):`n  from $Source`n  to   $Destination"

    $destParent = [System.IO.Path]::GetDirectoryName($Destination)
    if (-not (Test-Path -LiteralPath $destParent)) {
        New-Item -ItemType Directory -Force -Path $destParent | Out-Null
    }

    if (Test-Path -LiteralPath $Destination) {
        $hasDestItems = $null -ne (Get-ChildItem -LiteralPath $Destination -Force -ErrorAction SilentlyContinue | Select-Object -First 1)
        if (-not $hasDestItems) {
            Remove-Item -LiteralPath $Destination -Force -Recurse -ErrorAction Stop
        }
    }
    if (-not (Test-Path -LiteralPath $Destination)) {
        New-Item -ItemType Directory -Force -Path $Destination | Out-Null
    }

    & $robocopy $Source $Destination /E /MOVE /COPY:DAT /R:2 /W:2 /NFL /NDL /NJH /NJS | Out-Null
    $code = $LASTEXITCODE
    if ($code -gt 7) {
        throw "robocopy /MOVE failed with exit code $code"
    }

    if (Test-Path -LiteralPath $Source) {
        Remove-Item -LiteralPath $Source -Recurse -Force -ErrorAction SilentlyContinue
    }
    return $true
}

$TtMakeJunction = {
    param([string]$PathToLink, [string]$PathToTarget)
    if ([string]::IsNullOrWhiteSpace($PathToLink) -or [string]::IsNullOrWhiteSpace($PathToTarget)) {
        Write-Warning "TtMakeJunction: empty path (skip)"
        return
    }
    if (-not (Test-Path -LiteralPath $PathToTarget)) {
        return
    }
    if (Test-Path -LiteralPath $PathToLink) {
        $item = Get-Item -LiteralPath $PathToLink -Force -ErrorAction SilentlyContinue
        if ($null -ne $item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            Write-Host "Junction already exists: $PathToLink"
            return
        }
        return
    }
    $parent = [System.IO.Path]::GetDirectoryName($PathToLink)
    if (-not (Test-Path -LiteralPath $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    try {
        if ($PSVersionTable.PSVersion.Major -ge 7) {
            New-Item -ItemType Junction -Path $PathToLink -Target $PathToTarget -ErrorAction Stop | Out-Null
        }
        else {
            New-Item -ItemType Junction -Path $PathToLink -Value $PathToTarget -ErrorAction Stop | Out-Null
        }
        Write-Host "Junction: $PathToLink -> $PathToTarget"
    }
    catch {
        $null = cmd.exe /c "mklink /J `"$PathToLink`" `"$PathToTarget`""
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "Could not create junction $PathToLink -> $PathToTarget (exit $LASTEXITCODE)"
        }
        else {
            Write-Host "Junction: $PathToLink -> $PathToTarget"
        }
    }
}

function Add-UserPathEntry {
    param([string]$Dir)
    if ([string]::IsNullOrWhiteSpace($Dir)) {
        return
    }
    if (-not (Test-Path -LiteralPath $Dir)) {
        New-Item -ItemType Directory -Force -Path $Dir | Out-Null
    }
    $norm = $Dir.TrimEnd('\')
    $path = [Environment]::GetEnvironmentVariable("Path", "User")
    if ([string]::IsNullOrEmpty($path)) {
        [Environment]::SetEnvironmentVariable("Path", $norm, "User")
        Write-Host "PATH set: $norm"
        return
    }
    $parts = $path -split ';' | Where-Object { $_.Trim() -ne '' }
    foreach ($p in $parts) {
        if ($p.TrimEnd('\') -ieq $norm) {
            Write-Host "PATH already has: $norm"
            return
        }
    }
    [Environment]::SetEnvironmentVariable("Path", "$norm;$path", "User")
    Write-Host "PATH prepended: $norm"
}

function Ensure-MavenLocalRepo {
    $m2Dir = Join-Path $env:USERPROFILE ".m2"
    $settingsPath = Join-Path $m2Dir "settings.xml"
    $repo = "E:/Cache/m2"
    New-Item -ItemType Directory -Force -Path $m2Dir | Out-Null
    New-Item -ItemType Directory -Force -Path $repo.Replace("/", "\") | Out-Null

    if (-not (Test-Path -LiteralPath $settingsPath)) {
        $xml = @"
<?xml version="1.0" encoding="UTF-8"?>
<settings xmlns="http://maven.apache.org/SETTINGS/1.2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:schemaLocation="http://maven.apache.org/SETTINGS/1.2.0 https://maven.apache.org/xsd/settings-1.2.0.xsd">
  <localRepository>$repo</localRepository>
</settings>
"@
        $xml | Set-Content -LiteralPath $settingsPath -Encoding UTF8
        Write-Host "Maven: created $settingsPath (localRepository -> $repo)"
        return
    }

    try {
        [xml]$doc = Get-Content -LiteralPath $settingsPath
        $existing = $doc.SelectSingleNode("//*[local-name()='localRepository']")
        if ($null -ne $existing) {
            $cur = $existing.InnerText.Trim()
            if ($cur -eq $repo) {
                Write-Host "Maven: localRepository already $repo"
            }
            else {
                Write-Host "Maven: keeping existing localRepository=$cur (not overwriting)"
            }
            return
        }
        $de = $doc.DocumentElement
        $ns = $de.NamespaceURI
        $newEl = if ($ns) { $doc.CreateElement("localRepository", $ns) } else { $doc.CreateElement("localRepository") }
        $newEl.InnerText = $repo
        [void]$de.PrependChild($newEl)
        $doc.Save($settingsPath)
        Write-Host "Maven: added localRepository -> $repo in $settingsPath"
    }
    catch {
        Write-Warning "Maven: could not patch settings.xml: $_"
    }
}

function Ensure-PipIni {
    $pipDir = Join-Path $env:APPDATA "pip"
    $pipIni = Join-Path $pipDir "pip.ini"
    New-Item -ItemType Directory -Force -Path $pipDir | Out-Null
    $line = "cache-dir = E:\Cache\pip"
    if (-not (Test-Path -LiteralPath $pipIni)) {
        @"
[global]
$line
"@ | Set-Content -LiteralPath $pipIni -Encoding UTF8
        Write-Host "pip: created $pipIni ($line)"
        return
    }
    $text = Get-Content -LiteralPath $pipIni -Raw -ErrorAction SilentlyContinue
    if ($text -match 'cache-dir\s*=') {
        Write-Host "pip: pip.ini already has cache-dir (not overwriting)"
        return
    }
    if ($text -match '\[global\]') {
        $newText = $text -replace '(\[global\]\s*\r?\n)', "`$1$line`r`n"
        Set-Content -LiteralPath $pipIni -Value $newText.TrimEnd() -Encoding UTF8 -NoNewline
        Write-Host "pip: appended $line under [global]"
    }
    else {
        Add-Content -LiteralPath $pipIni -Value "`r`n[global]`r`n$line" -Encoding UTF8
        Write-Host "pip: appended [global] section to pip.ini"
    }
}

function Test-CondaListContains {
    param([string]$Key, [string]$ValueNeedle)
    try {
        $raw = & conda config --show $Key 2>&1 | Out-String
        return ($raw -like "*$ValueNeedle*")
    }
    catch {
        return $false
    }
}

function Ensure-CondaDir {
    param([string]$Key, [string]$PathValue)
    if (-not (Get-Command conda -ErrorAction SilentlyContinue)) {
        return $false
    }
    $needle = $PathValue.Replace('/', '\')
    if (Test-CondaListContains -Key $Key -ValueNeedle $needle) {
        Write-Host "conda: $Key already lists $PathValue"
        return $true
    }
    & conda config --append $Key $PathValue 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "conda config --append $Key failed (exit $LASTEXITCODE)"
        return $false
    }
    Write-Host "conda: appended $Key -> $PathValue"
    return $true
}

function Invoke-NpmCmd {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$NpmArgs)
    $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($npmCmd) {
        & npm @NpmArgs
        return $true
    }
    $candidates = @(
        "E:\Dev\nodejs\npm.cmd",
        (Join-Path $env:ProgramFiles "nodejs\npm.cmd"),
        (Join-Path ${env:ProgramFiles(x86)} "nodejs\npm.cmd")
    )
    foreach ($c in $candidates) {
        if (Test-Path -LiteralPath $c) {
            & $c @NpmArgs
            return $true
        }
    }
    return $false
}

function Invoke-PnpmCmd {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$PnpmArgs)
    if (Get-Command pnpm -ErrorAction SilentlyContinue) {
        & pnpm @PnpmArgs
        return $true
    }
    $local = Join-Path $env:APPDATA "npm\pnpm.cmd"
    if (Test-Path -LiteralPath $local) {
        & $local @PnpmArgs
        return $true
    }
    return $false
}

function Migrate-ExtensionsFolder {
    param(
        [string]$SourceExtensionsDir,
        [string]$DestRoot
    )
    if (-not (Test-Path -LiteralPath $SourceExtensionsDir)) {
        return
    }
    $item = Get-Item -LiteralPath $SourceExtensionsDir -Force -ErrorAction SilentlyContinue
    if ($null -ne $item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        Write-Host "IDE: already junction: $SourceExtensionsDir"
        return
    }
    try {
        $moved = Move-UserDevFolder -Source $SourceExtensionsDir -Destination $DestRoot
        if ($moved) {
            & $TtMakeJunction $SourceExtensionsDir $DestRoot
        }
        elseif (-not (Test-Path -LiteralPath $SourceExtensionsDir) -and (Test-Path -LiteralPath $DestRoot)) {
            $has = Get-ChildItem -LiteralPath $DestRoot -Force -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($null -ne $has) {
                & $TtMakeJunction $SourceExtensionsDir $DestRoot
            }
        }
    }
    catch {
        Write-Warning "IDE extensions migration failed ($SourceExtensionsDir): $_"
    }
}

# --- directories ---
$dirs = @(
    "E:\Cache\Temp",
    "E:\Cache\npm",
    "E:\Cache\pnpm\store",
    "E:\Cache\pip",
    "E:\Cache\cargo",
    "E:\Cache\rustup",
    "E:\Cache\go\pkg\mod",
    "E:\Cache\nuget\packages",
    "E:\Cache\gradle",
    "E:\Cache\m2",
    "E:\Cache\conda\pkgs",
    "E:\Cache\yarn",
    "E:\Cache\dotnet-cli",
    "E:\Cache\xdg-cache",
    "E:\Cache\xdg-config",
    "E:\Cache\xdg-state",
    "E:\Cache\uv",
    "E:\Cache\huggingface",
    "E:\Cache\torch",
    "E:\Cache\azure",
    "E:\Cache\terraform-plugins",
    "E:\Cache\playwright",
    "E:\Cache\cypress",
    "E:\Dev\go",
    "E:\Dev\npm-global",
    "E:\Dev\pnpm-global",
    "E:\Dev\python-user",
    "E:\Dev\conda-envs",
    "E:\Dev\vscode-extensions",
    "E:\Dev\cursor-extensions",
    "E:\Dev\bun"
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

# Leftover from older script revision; safe to remove if empty
$obsoleteBunCache = "E:\Cache\bun-install"
if (Test-Path -LiteralPath $obsoleteBunCache) {
    $left = Get-ChildItem -LiteralPath $obsoleteBunCache -Force -ErrorAction SilentlyContinue
    if ($null -eq $left -or $left.Count -eq 0) {
        Remove-Item -LiteralPath $obsoleteBunCache -Force -ErrorAction SilentlyContinue
        Write-Host "Removed empty obsolete folder: $obsoleteBunCache"
    }
}

# --- Rust / cargo (same as before) ---
$rustupOld = Join-Path $env:USERPROFILE ".rustup"
$cargoOld = Join-Path $env:USERPROFILE ".cargo"
$rustupNew = "E:\Cache\rustup"
$cargoNew = "E:\Cache\cargo"

if (-not $SkipMigration) {
    Write-Host "=== Folder migration (close Rust/IDE first) ==="
    try {
        $movedRust = Move-UserDevFolder -Source $rustupOld -Destination $rustupNew
        if ($movedRust) {
            & $TtMakeJunction $rustupOld $rustupNew
        }
    }
    catch {
        Write-Warning "Rustup migration failed: $_"
    }
    try {
        $movedCargo = Move-UserDevFolder -Source $cargoOld -Destination $cargoNew
        if ($movedCargo) {
            & $TtMakeJunction $cargoOld $cargoNew
        }
    }
    catch {
        Write-Warning "Cargo migration failed: $_"
    }

    if (-not (Test-Path -LiteralPath $rustupOld) -and (Test-Path -LiteralPath $rustupNew)) {
        $hasRust = $null -ne (Get-ChildItem -LiteralPath $rustupNew -Force -ErrorAction SilentlyContinue | Select-Object -First 1)
        if ($hasRust) {
            & $TtMakeJunction $rustupOld $rustupNew
        }
    }
    if (-not (Test-Path -LiteralPath $cargoOld) -and (Test-Path -LiteralPath $cargoNew)) {
        $hasCargo = $null -ne (Get-ChildItem -LiteralPath $cargoNew -Force -ErrorAction SilentlyContinue | Select-Object -First 1)
        if ($hasCargo) {
            & $TtMakeJunction $cargoOld $cargoNew
        }
    }

    if (-not $SkipIdeExtensions) {
        Write-Host "=== IDE extensions -> E:\Dev (optional) ==="
        Migrate-ExtensionsFolder -SourceExtensionsDir (Join-Path $env:USERPROFILE ".vscode\extensions") -DestRoot "E:\Dev\vscode-extensions"
        Migrate-ExtensionsFolder -SourceExtensionsDir (Join-Path $env:USERPROFILE ".cursor\extensions") -DestRoot "E:\Dev\cursor-extensions"
    }
}
else {
    Write-Host "SkipMigration: skipped folder moves / IDE extensions"
}

$userScope = [System.EnvironmentVariableTarget]::User

# Core caches & tools
[Environment]::SetEnvironmentVariable("TEMP", "E:\Cache\Temp", $userScope)
[Environment]::SetEnvironmentVariable("TMP", "E:\Cache\Temp", $userScope)
[Environment]::SetEnvironmentVariable("PIP_CACHE_DIR", "E:\Cache\pip", $userScope)
[Environment]::SetEnvironmentVariable("CARGO_HOME", "E:\Cache\cargo", $userScope)
[Environment]::SetEnvironmentVariable("RUSTUP_HOME", "E:\Cache\rustup", $userScope)
[Environment]::SetEnvironmentVariable("GOMODCACHE", "E:\Cache\go\pkg\mod", $userScope)
[Environment]::SetEnvironmentVariable("GOPATH", "E:\Dev\go", $userScope)
[Environment]::SetEnvironmentVariable("NUGET_PACKAGES", "E:\Cache\nuget\packages", $userScope)
[Environment]::SetEnvironmentVariable("GRADLE_USER_HOME", "E:\Cache\gradle", $userScope)
[Environment]::SetEnvironmentVariable("DOTNET_CLI_HOME", "E:\Cache\dotnet-cli", $userScope)
[Environment]::SetEnvironmentVariable("XDG_CACHE_HOME", "E:\Cache\xdg-cache", $userScope)
[Environment]::SetEnvironmentVariable("XDG_CONFIG_HOME", "E:\Cache\xdg-config", $userScope)
[Environment]::SetEnvironmentVariable("XDG_STATE_HOME", "E:\Cache\xdg-state", $userScope)
[Environment]::SetEnvironmentVariable("UV_CACHE_DIR", "E:\Cache\uv", $userScope)
[Environment]::SetEnvironmentVariable("HF_HOME", "E:\Cache\huggingface", $userScope)
[Environment]::SetEnvironmentVariable("TORCH_HOME", "E:\Cache\torch", $userScope)
[Environment]::SetEnvironmentVariable("AZURE_CONFIG_DIR", "E:\Cache\azure", $userScope)
[Environment]::SetEnvironmentVariable("TF_PLUGIN_CACHE_DIR", "E:\Cache\terraform-plugins", $userScope)
[Environment]::SetEnvironmentVariable("PLAYWRIGHT_BROWSERS_PATH", "E:\Cache\playwright", $userScope)
[Environment]::SetEnvironmentVariable("CYPRESS_CACHE_FOLDER", "E:\Cache\cypress", $userScope)
[Environment]::SetEnvironmentVariable("PYTHONUSERBASE", "E:\Dev\python-user", $userScope)
[Environment]::SetEnvironmentVariable("NPM_CONFIG_PREFIX", "E:\Dev\npm-global", $userScope)
# Do not set PNPM_HOME here: official pnpm uses it for the pnpm CLI dir; global bins -> pnpm config global-bin-dir + PATH below
[Environment]::SetEnvironmentVariable("BUN_INSTALL", "E:\Dev\bun", $userScope)
# Clear mistaken PNPM_HOME from earlier runs (conflicts with pnpm's own meaning)
[Environment]::SetEnvironmentVariable("PNPM_HOME", $null, $userScope)

Write-Host ""
Write-Host "User environment variables set (caches -> E:\Cache, workspaces -> E:\Dev):"
Write-Host "  TEMP, TMP, PIP_CACHE_DIR, UV_CACHE_DIR, PLAYWRIGHT_BROWSERS_PATH, CYPRESS_CACHE_FOLDER"
Write-Host "  CARGO_HOME, RUSTUP_HOME, GOMODCACHE, GOPATH, NUGET_PACKAGES, GRADLE_USER_HOME"
Write-Host "  DOTNET_CLI_HOME, XDG_CACHE_HOME, XDG_CONFIG_HOME, XDG_STATE_HOME"
Write-Host "  HF_HOME, TORCH_HOME, AZURE_CONFIG_DIR, TF_PLUGIN_CACHE_DIR"
Write-Host "  PYTHONUSERBASE, NPM_CONFIG_PREFIX, BUN_INSTALL (pnpm: global-bin-dir via config + PATH)"

Ensure-MavenLocalRepo
Ensure-PipIni

if (Get-Command conda -ErrorAction SilentlyContinue) {
    $null = Ensure-CondaDir -Key "pkgs_dirs" -PathValue "E:\Cache\conda\pkgs"
    $null = Ensure-CondaDir -Key "envs_dirs" -PathValue "E:\Dev\conda-envs"
}
else {
    Write-Host "Skip: conda not in PATH (re-run after conda init)"
}

Add-UserPathEntry "E:\Dev\npm-global"
Add-UserPathEntry "E:\Dev\pnpm-global"
Add-UserPathEntry "E:\Dev\python-user\Scripts"
Add-UserPathEntry "E:\Dev\bun\bin"

if (Invoke-NpmCmd config set cache "E:\Cache\npm") {
    Write-Host "npm cache -> E:\Cache\npm"
}
else {
    Write-Host "Skip: npm not found (install Node or re-run this script)"
}

if (Invoke-NpmCmd config set prefix "E:\Dev\npm-global") {
    Write-Host "npm prefix -> E:\Dev\npm-global"
}

if (Invoke-PnpmCmd config set store-dir "E:\Cache\pnpm\store") {
    Write-Host "pnpm store-dir -> E:\Cache\pnpm\store"
}
else {
    Write-Host "Skip: pnpm not found (optional: install then re-run)"
}

if (Invoke-PnpmCmd config set global-bin-dir "E:\Dev\pnpm-global") {
    Write-Host "pnpm global-bin-dir -> E:\Dev\pnpm-global"
}

if (Get-Command yarn -ErrorAction SilentlyContinue) {
    try {
        & yarn config set cache-folder "E:\Cache\yarn" 2>$null
        Write-Host "yarn cache-folder -> E:\Cache\yarn (Yarn v1)"
    }
    catch {
        Write-Host "yarn v2+: add to ~/.yarnrc.yml: cacheFolder: E:/Cache/yarn"
    }
}
else {
    Write-Host "Skip: yarn not in PATH"
}

if (Get-Command bun -ErrorAction SilentlyContinue) {
    Write-Host "bun: BUN_INSTALL=E:\Dev\bun (install bun with this env set for consistency)"
}

Write-Host ""
Write-Host "Done. Sign out and sign in (or reboot) so PATH and TEMP apply everywhere."
Write-Host "Docker: Docker Desktop -> Settings -> Resources -> Advanced -> Disk image location -> folder on E:."
Write-Host "WSL: wsl --shutdown then move ext4.vhdx or export/import distro to E: (see Microsoft docs)."
Write-Host "Windows Store apps: Settings -> System -> Storage -> Change where new content is saved -> E:."
