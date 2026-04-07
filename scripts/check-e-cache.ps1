# Audit: user env + E:\Cache / E:\Dev + common profile folders + leftover C: usage
$names = @(
    "TEMP", "TMP",
    "PIP_CACHE_DIR", "PYTHONUSERBASE",
    "CARGO_HOME", "RUSTUP_HOME", "GOMODCACHE", "GOPATH",
    "NUGET_PACKAGES", "GRADLE_USER_HOME", "DOTNET_CLI_HOME",
    "XDG_CACHE_HOME", "XDG_CONFIG_HOME", "XDG_STATE_HOME",
    "UV_CACHE_DIR", "HF_HOME", "TORCH_HOME",
    "AZURE_CONFIG_DIR", "TF_PLUGIN_CACHE_DIR",
    "PLAYWRIGHT_BROWSERS_PATH", "CYPRESS_CACHE_FOLDER",
    "NPM_CONFIG_PREFIX", "BUN_INSTALL"
)
Write-Host "=== User environment variables (E: dev layout) ==="
foreach ($n in $names) {
    $v = [Environment]::GetEnvironmentVariable($n, "User")
    if ([string]::IsNullOrEmpty($v)) {
        Write-Host ("{0}: (not set)" -f $n)
    }
    else {
        Write-Host ("{0}={1}" -f $n, $v)
    }
}

$pnpmHome = [Environment]::GetEnvironmentVariable("PNPM_HOME", "User")
if (-not [string]::IsNullOrEmpty($pnpmHome)) {
    Write-Host "WARN: PNPM_HOME=$pnpmHome (should usually be unset; pnpm CLI uses its own install path. Global bins: E:\Dev\pnpm-global + pnpm config global-bin-dir. Re-run setup-e-cache.ps1 to clear.)"
}

Write-Host ""
Write-Host "=== User PATH contains E:\Dev entries? ==="
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
foreach ($token in @("E:\Dev\npm-global", "E:\Dev\pnpm-global", "E:\Dev\python-user\Scripts", "E:\Dev\bun\bin")) {
    if ($userPath -like "*$token*") {
        Write-Host "OK: $token"
    }
    else {
        Write-Host "MISSING: $token (re-run setup-e-cache.ps1, then sign out)"
    }
}

Write-Host ""
Write-Host "=== pip.ini (cache-dir) ==="
$pipIni = Join-Path $env:APPDATA "pip\pip.ini"
if (Test-Path -LiteralPath $pipIni) {
    $raw = Get-Content -LiteralPath $pipIni -Raw -ErrorAction SilentlyContinue
    if ($raw -match 'cache-dir\s*=\s*E:\\Cache\\pip') {
        Write-Host "OK: pip.ini cache-dir -> E:\Cache\pip"
    }
    elseif ($raw -match 'cache-dir') {
        Write-Host "WARN: pip.ini has cache-dir but not E:\Cache\pip - review $pipIni"
    }
    else {
        Write-Host "WARN: pip.ini exists but no cache-dir line"
    }
}
else {
    Write-Host "MISSING: $pipIni (run setup-e-cache.ps1)"
}

Write-Host ""
Write-Host "=== E:\Cache (top-level) ==="
if (Test-Path "E:\Cache") {
    Get-ChildItem "E:\Cache" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.FullName }
}
else {
    Write-Host "E:\Cache missing - run setup-e-cache.ps1"
}

Write-Host ""
Write-Host "=== E:\Dev (top-level) ==="
if (Test-Path "E:\Dev") {
    Get-ChildItem "E:\Dev" -Directory -ErrorAction SilentlyContinue | ForEach-Object { Write-Host $_.FullName }
}
else {
    Write-Host "E:\Dev missing - run setup-e-cache.ps1"
}

$userProfile = $env:USERPROFILE
$legacy = @(
    "$userProfile\.cargo",
    "$userProfile\.rustup",
    "$userProfile\.npm",
    "$userProfile\AppData\Local\npm-cache",
    "$userProfile\AppData\Local\pnpm\store",
    "$userProfile\.gradle",
    "$userProfile\.m2\repository",
    "$userProfile\AppData\Local\pip\cache",
    "$userProfile\AppData\Roaming\npm",
    "$userProfile\.dotnet\tools",
    "$userProfile\.vscode\extensions",
    "$userProfile\.cursor\extensions"
)
Write-Host ""
Write-Host "=== Profile paths (exist + size MB) ==="
Write-Host "[junction] = reparse point; size follows target (may look large; not always extra C: usage)."
foreach ($p in $legacy) {
    if (Test-Path $p) {
        $item = Get-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
        $j = ""
        if ($null -ne $item -and ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            $j = " [junction]"
        }
        $sum = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $mb = if ($null -eq $sum) { 0 } else { [math]::Round($sum / 1MB, 2) }
        Write-Host ("{0} MB  {1}{2}" -f $mb, $p, $j)
    }
}

Write-Host ""
Write-Host "=== Leftover real folders on C: (not junctions) ==="
$watch = @(
    "$userProfile\.m2\repository",
    "$userProfile\.gradle",
    "$userProfile\AppData\Local\npm-cache",
    "$userProfile\AppData\Local\pnpm\store",
    "$userProfile\.dotnet"
)
foreach ($p in $watch) {
    if (-not (Test-Path -LiteralPath $p)) {
        continue
    }
    $item = Get-Item -LiteralPath $p -Force -ErrorAction SilentlyContinue
    if ($null -eq $item -or ($item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
        continue
    }
    $sum = (Get-ChildItem $p -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $mb = if ($null -eq $sum) { 0 } else { [math]::Round($sum / 1MB, 2) }
    if ($mb -gt 50) {
        Write-Host "WARN: ${mb} MB still on C: at $p - after tools use E: paths, you can delete or migrate (close IDEs first)."
    }
}

$localTemp = Join-Path $env:LOCALAPPDATA "Temp"
if (Test-Path -LiteralPath $localTemp) {
    $tSum = (Get-ChildItem $localTemp -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    $tMb = if ($null -eq $tSum) { 0 } else { [math]::Round($tSum / 1MB, 2) }
    if ($tMb -gt 500) {
        Write-Host "WARN: AppData\Local\Temp ~${tMb} MB - if you already set user TEMP to E:\, sign out once so new processes stop using this folder; then Disk Cleanup."
    }
}

Write-Host ""
Write-Host "=== Manual (GUI / one-time) ==="
Write-Host "Docker Desktop: Settings -> Resources -> Disk image location -> E:\..."
Write-Host "WSL2: move ext4.vhdx or wsl --export/--import to E:\ (see Microsoft docs)."
Write-Host "Windows: Settings -> System -> Storage -> Where new content is saved -> E: for apps/docs."
Write-Host "Scoop: new install only: `$env:SCOOP='E:\Dev\scoop'` (do not move an existing C: scoop with env alone)."
Write-Host "Android Studio / Android SDK: install SDK to E:\Dev\android-sdk in SDK Manager."
Write-Host "Yarn Berry: ~/.yarnrc.yml -> cacheFolder: E:/Cache/yarn"
Write-Host "GOPATH moved to E:\Dev\go - old GOPATH projects must be under that tree or use modules in project dirs."

Write-Host ""
Write-Host "=== Note ==="
Write-Host "Re-open terminals / sign out after setup-e-cache.ps1 so PATH and TEMP refresh."
