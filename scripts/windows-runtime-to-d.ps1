#Requires -Version 5.1
<#
.SYNOPSIS
  Put Node.js (official Windows zip) and Python user packages under DevRoot on D:.

.DESCRIPTION
  - Downloads Node win-x64 zip matching the major.minor of `node -v` from PATH (or -NodeVersion).
  - Extracts to DevRoot\nodejs-portable\<version>-win-x64 and prepends that directory to User PATH
    (so it wins over Machine PATH entries like C:\Program Files\nodejs when placed first in User PATH).
  - Sets PYTHONUSERBASE to DevRoot\python-userbase and prepends ...\Python313\Scripts to User PATH
    when that folder exists or after first pip install --user.

.PARAMETER DevRoot
  Default D:\dev

.PARAMETER NodeVersion
  Optional override e.g. 22.22.0 (without v). If omitted, parsed from `node -v`.

.PARAMETER Preview
  Show plan only.

.PARAMETER Apply
  Download/extract, set env vars, update User PATH.
#>
param(
    [string]$DevRoot = 'D:\dev',
    [string]$NodeVersion = '',
    [switch]$Preview,
    [switch]$Apply
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Message) {
    Write-Host "[runtime-to-d] $Message" -ForegroundColor Cyan
}

if (-not $Preview -and -not $Apply) {
    Write-Host 'Usage: ... -Preview | ... -Apply   (optional -NodeVersion 22.22.0 -DevRoot D:\dev)'
    exit 1
}
if ($Preview -and $Apply) {
    Write-Error 'Use either -Preview or -Apply.'
    exit 1
}

$drive = Split-Path -Qualifier $DevRoot
if (-not $drive -or $drive.Substring(0, 1) -eq 'C') {
    Write-Error 'DevRoot must be on a non-C drive (default D:\dev).'
    exit 1
}

$ver = $NodeVersion.Trim()
if (-not $ver) {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error 'node not on PATH; pass -NodeVersion 22.22.0'
        exit 1
    }
    $nv = (& node -v).Trim()
    if ($nv.StartsWith('v')) { $nv = $nv.Substring(1) }
    $ver = $nv
}

$nodeDirName = "node-v$ver-win-x64"
$nodeRoot = Join-Path $DevRoot 'nodejs-portable'
$nodeBin = Join-Path $nodeRoot $nodeDirName
$zipPath = Join-Path $DevRoot '_node_win_x64.zip'
$pyUser = Join-Path $DevRoot 'python-userbase'

if ($Preview) {
    Write-Host "DevRoot=$DevRoot"
    Write-Host "Node zip: https://nodejs.org/dist/v$ver/node-v$ver-win-x64.zip"
    Write-Host "Extract to: $nodeBin"
    Write-Host "PYTHONUSERBASE -> $pyUser"
    Write-Host 'User PATH: prepend node bin dir; prepend Python313\Scripts under PYTHONUSERBASE if present.'
    exit 0
}

New-Item -ItemType Directory -Path $DevRoot -Force | Out-Null
New-Item -ItemType Directory -Path $pyUser -Force | Out-Null

if (-not (Test-Path -LiteralPath (Join-Path $nodeBin 'node.exe'))) {
    $url = "https://nodejs.org/dist/v$ver/node-v$ver-win-x64.zip"
    Write-Step "Downloading $url"
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing
    Write-Step "Extracting to $nodeRoot"
    New-Item -ItemType Directory -Path $nodeRoot -Force | Out-Null
    Expand-Archive -LiteralPath $zipPath -DestinationPath $nodeRoot -Force
    Remove-Item -LiteralPath $zipPath -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path -LiteralPath (Join-Path $nodeBin 'node.exe'))) {
        throw "node.exe missing after extract: expected $nodeBin"
    }
} else {
    Write-Step "Reusing existing $nodeBin"
}

[Environment]::SetEnvironmentVariable('PYTHONUSERBASE', $pyUser, 'User')
Write-Step "PYTHONUSERBASE -> $pyUser"

$pyMajor = 3
$pyMinor = 13
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pv = & python -c "import sys; print(sys.version_info[0], sys.version_info[1])" 2>$null
    if ($pv -match '^(\d+)\s+(\d+)') {
        $pyMajor = [int]$Matches[1]
        $pyMinor = [int]$Matches[2]
    }
}
$pyLeaf = "Python$pyMajor$pyMinor"
$pyScripts = Join-Path $pyUser (Join-Path $pyLeaf 'Scripts')
$pySite = Join-Path $pyUser (Join-Path $pyLeaf 'site-packages')
New-Item -ItemType Directory -Path $pyScripts, $pySite -Force | Out-Null
Write-Step "Python user dirs -> $pyLeaf under $pyUser"

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not $userPath) { $userPath = '' }
$parts = $userPath -split ';' | Where-Object { $_ }

$parts = $parts | Where-Object {
    $_ -notmatch '\\nodejs-portable\\node-v[\d\.]+-win-x64\\?$' -and
    $_ -notmatch '\\python-userbase\\Python\d{2,3}\\Scripts\\?$'
}

$prepend = @()
if (Test-Path -LiteralPath (Join-Path $nodeBin 'node.exe')) {
    $prepend += $nodeBin
}
if (Test-Path -LiteralPath $pyScripts) {
    $prepend += $pyScripts
}

foreach ($p in $prepend) {
    $parts = $parts | Where-Object { $_ -ne $p }
}
$newParts = $prepend + $parts
$newPath = ($newParts -join ';')
[Environment]::SetEnvironmentVariable('Path', $newPath, 'User')
Write-Step 'User PATH updated (node portable + python user Scripts first).'

$npmCmd = Join-Path $nodeBin 'npm.cmd'
$npmGlobal = Join-Path $DevRoot 'npm-global'
$npmCache = Join-Path $DevRoot 'npm-cache'
if (Test-Path -LiteralPath $npmCmd) {
    New-Item -ItemType Directory -Path $npmGlobal, $npmCache -Force | Out-Null
    & $npmCmd config set prefix $npmGlobal --global 2>&1 | Out-Null
    & $npmCmd config set cache $npmCache --global 2>&1 | Out-Null
    Write-Step "npm global prefix -> $npmGlobal ; cache -> $npmCache (portable node resets these if omitted)"
}

Write-Host ''
Write-Host 'Done. Restart terminals / Cursor. Verify: where.exe node ; python -m site --user-site' -ForegroundColor Green
Write-Host "Node expected first: $nodeBin"
Write-Host ''
