# 刷新桌面 Docker 快捷方式：目标为真实 Docker Desktop.exe；若 settings-store.json 中数据目录在 D:，
# 桌面文件名为「Docker Desktop (C程序-D数据).lnk」，属性「注释」含 Exe 与 Data/WSL 路径，与迁移策略对齐。
#
# 常见误解：在 Docker Desktop 里把「磁盘镜像 / 数据目录」迁到 D: 后，**Docker Desktop.exe 仍多在 C:\Program Files\Docker**。
# 这是官方设计：程序在 C，大文件（WSL2 / disk image）在 D。注册表可查：HKLM\SOFTWARE\Docker Inc.\Docker\1.0 → AppPath。
#
# 若你确实把 **整个** Docker 装到 D:（或便携版），请任选其一告诉本脚本真实 exe 路径：
#   1) 环境变量 DOCKER_DESKTOP_EXE 或 TRAVELTRUST_DOCKER_DESKTOP_EXE
#   2) 命令行参数：-ExePath 'D:\你的路径\Docker Desktop.exe'
#
param(
    [string]$ExePath = ""
)

$ErrorActionPreference = "Stop"

function Test-Exe([string]$p) {
    return ($p -and (Test-Path -LiteralPath $p))
}

$target = $null

if (Test-Exe $ExePath) {
    $target = $ExePath
}

if (-not $target) {
    foreach ($k in @("DOCKER_DESKTOP_EXE", "TRAVELTRUST_DOCKER_DESKTOP_EXE")) {
        $v = [Environment]::GetEnvironmentVariable($k, "User")
        if (-not $v) { $v = [Environment]::GetEnvironmentVariable($k, "Machine") }
        if (Test-Exe $v) {
            $target = $v
            break
        }
    }
}

# D 盘优先（再 C），符合「迁到 D 后仍希望快捷方式找 D」的预期；若 D 无 exe 会回落到 C。
$candidates = @(
    "D:\Program Files\Docker\Docker\Docker Desktop.exe"
    "D:\Docker\Docker Desktop.exe"
    "D:\Apps\Docker\Docker\Docker Desktop.exe"
    "D:\Software\Docker\Docker\Docker Desktop.exe"
    "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe"
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe"
)

if (-not $target) {
    foreach ($p in $candidates) {
        if (Test-Exe $p) {
            $target = $p
            break
        }
    }
}

if (-not $target) {
    $roots = @(
        "D:\Program Files\Docker"
        "D:\Docker"
        "${env:ProgramFiles}\Docker"
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

    foreach ($root in $roots) {
        $hit = Get-ChildItem -LiteralPath $root -Filter "Docker Desktop.exe" -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty FullName
        if ($hit) {
            $target = $hit
            break
        }
    }
}

if (-not $target) {
    Write-Error @"
未找到 Docker Desktop.exe。
- 若只把「磁盘镜像」迁到 D:，请继续用 C 盘程序路径（快捷方式指向 C 是正常的）。
- 若 exe 在其它目录：设置用户环境变量 DOCKER_DESKTOP_EXE 后重试，或执行：
  powershell -File .\scripts\win\fix-docker-desktop-shortcut.ps1 -ExePath 'D:\完整路径\Docker Desktop.exe'
"@
    exit 1
}

# 与 Docker Desktop 设置里的「数据/WSL 目录」对齐（快捷方式注释 + 桌面显示名）
$dataDir = $null
$settingsPath = Join-Path $env:APPDATA "Docker\settings-store.json"
if (Test-Path -LiteralPath $settingsPath) {
    try {
        $j = Get-Content -LiteralPath $settingsPath -Raw -Encoding utf8 | ConvertFrom-Json
        if ($j.CustomWslDistroDir) {
            $dataDir = [string]$j.CustomWslDistroDir
        }
    }
    catch {
        # ignore parse errors
    }
}

$desktop = [Environment]::GetFolderPath("Desktop")
# 桌面名称体现「程序 C + 数据 D」，与 settings-store.json 一致；双击仍启动同一 exe
$lnkName = if ($dataDir -and ($dataDir -match '^[Dd]:')) {
    "Docker Desktop (C程序-D数据).lnk"
}
else {
    "Docker Desktop.lnk"
}
$lnkPath = Join-Path $desktop $lnkName

# 避免桌面两个 Docker 图标并存
$legacy = Join-Path $desktop "Docker Desktop.lnk"
$aligned = Join-Path $desktop "Docker Desktop (C程序-D数据).lnk"
if ($lnkName -ne "Docker Desktop.lnk") {
    if (Test-Path -LiteralPath $legacy) {
        Remove-Item -LiteralPath $legacy -Force -ErrorAction SilentlyContinue
    }
}
else {
    if (Test-Path -LiteralPath $aligned) {
        Remove-Item -LiteralPath $aligned -Force -ErrorAction SilentlyContinue
    }
}

$descParts = @(
    "Docker Desktop"
    "Exe: $target"
)
if ($dataDir) {
    $descParts += "Data/WSL: $dataDir"
}
$description = ($descParts -join " | ")
if ($description.Length -gt 240) {
    $description = $description.Substring(0, 237) + "..."
}

$shell = New-Object -ComObject WScript.Shell
$shortcut = $shell.CreateShortcut($lnkPath)
$shortcut.TargetPath = $target
$shortcut.WorkingDirectory = Split-Path -Parent $target
$shortcut.Description = $description
$shortcut.IconLocation = "$target,0"
$shortcut.Save()

Write-Host "OK: shortcut -> $lnkPath"
Write-Host "     Target  -> $target"
Write-Host "     Desktop -> $desktop"
if ($dataDir) {
    Write-Host "     Data dir -> $dataDir"
}
