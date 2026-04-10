<#
.SYNOPSIS
  Move Desktop + Documents + Downloads to D:\Profile\... (shell folders stay valid).
.DESCRIPTION
  Run as your normal Windows user AFTER D: exists. Save work and close apps first.
.NOTES
  Does NOT require Administrator.
#>
param(
  [string]$BaseOnD = 'D:\Profile'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath 'D:\')) {
  Write-Error 'D:\ not found. Run disk-shrink-c-and-create-d.ps1 as Administrator first.'
  exit 1
}

$userShell = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders'
$shell = 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Shell Folders'

$jobs = @(
  @{
    DestName     = 'Desktop'
    SrcPath      = [Environment]::GetFolderPath('Desktop')
    UserKey      = 'Desktop'
    LegacyKey    = 'Desktop'
  },
  @{
    DestName     = 'Documents'
    SrcPath      = [Environment]::GetFolderPath('MyDocuments')
    UserKey      = 'Personal'
    LegacyKey    = 'Personal'
  },
  @{
    DestName     = 'Downloads'
    SrcPath      = (Join-Path $env:USERPROFILE 'Downloads')
    UserKey      = '{374DE290-123F-4565-9164-39C4925E467B}'
    LegacyKey    = '{374DE290-123F-4565-9164-39C4925E467B}'
  }
)

foreach ($j in $jobs) {
  $src = $j.SrcPath
  if (-not $src -or -not (Test-Path -LiteralPath $src)) {
    Write-Warning "Skip $($j.DestName): source missing ($src)."
    continue
  }

  $dest = Join-Path $BaseOnD $j.DestName
  Write-Host "Syncing $src -> $dest"
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  robocopy $src $dest /E /COPY:DAT /R:2 /W:2 /XJ /NFL /NDL /NJH /NJS | Out-Null
  $rc = $LASTEXITCODE
  if ($rc -ge 8) {
    Write-Error "robocopy failed for $($j.DestName) (exit $rc)."
    exit 1
  }

  Set-ItemProperty -LiteralPath $userShell -Name $j.UserKey -Value $dest -Type String -Force
  Set-ItemProperty -LiteralPath $shell -Name $j.LegacyKey -Value $dest -Type String -Force
}

Write-Host 'Restarting Explorer...'
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-Process explorer

Write-Host "Done. Folders now under $BaseOnD — shortcuts on Desktop keep working."
Write-Host 'If the shell looks odd, sign out and sign in once.'
