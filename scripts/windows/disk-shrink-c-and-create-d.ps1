#Requires -RunAsAdministrator
<#
.SYNOPSIS
  Shrink C: to a fixed size and create/format D: on the same disk (no reinstall).
.DESCRIPTION
  Run ONLY from an elevated PowerShell (Run as administrator).
  Backup important data first. Close heavy apps before running.
.PARAMETER TargetCSizeGB
  Final size of C: after shrink (default 260).
.PARAMETER NewDriveLetter
  Letter for the new data volume (default D).
.PARAMETER VolumeLabel
  NTFS label for the new volume (default DevData).
#>
param(
  [int]$TargetCSizeGB = 260,
  [char]$NewDriveLetter = 'D',
  [string]$VolumeLabel = 'DevData'
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
  $id = [Security.Principal.WindowsIdentity]::GetCurrent()
  $p = New-Object Security.Principal.WindowsPrincipal($id)
  if (-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Error 'This script must run as Administrator. Right-click PowerShell -> Run as administrator.'
    exit 1
  }
}

Assert-Admin

$dl = [string]$NewDriveLetter
if (Get-Partition -DriveLetter $dl -ErrorAction SilentlyContinue) {
  Write-Error "Drive $dl already exists. Remove or choose another letter."
  exit 1
}

$partC = Get-Partition -DriveLetter 'C'
$diskNum = $partC.DiskNumber
$beforeGB = [math]::Round($partC.Size / 1GB, 2)
Write-Host "C: current size: $beforeGB GB on Disk $diskNum"

$bl = Get-BitLockerVolume -MountPoint 'C:' -ErrorAction SilentlyContinue
if ($bl -and $bl.ProtectionStatus -eq 'On') {
  Write-Host 'BitLocker is on for C:. Suspending for this session so partition can resize...'
  Suspend-BitLocker -MountPoint 'C:' -RebootCount 0
}

$supported = Get-PartitionSupportedSize -InputObject $partC
$minGB = [math]::Round($supported.SizeMin / 1GB, 2)
$maxGB = [math]::Round($supported.SizeMax / 1GB, 2)
Write-Host "C: allowed size range (GB): min=$minGB max=$maxGB"

$targetBytes = [uint64]([uint64]$TargetCSizeGB * 1024UL * 1024UL * 1024UL)
if ($targetBytes -lt $supported.SizeMin) {
  Write-Error "Target C ($TargetCSizeGB GB) is below minimum allowed ($minGB GB). Free space or remove unmovable files (pagefile/hiberfil), then retry."
  exit 1
}
if ($targetBytes -ge $partC.Size) {
  Write-Error "Target C must be smaller than current C:."
  exit 1
}

Write-Host "Resizing C: to $TargetCSizeGB GiB..."
Resize-Partition -InputObject $partC -Size $targetBytes

Write-Host "Creating partition on Disk $diskNum using maximum unallocated space -> $dl :"
$newPart = New-Partition -DiskNumber $diskNum -UseMaximumSize -DriveLetter $dl

Write-Host "Formatting ${dl}: as NTFS..."
Format-Volume -Partition $newPart -FileSystem NTFS -NewFileSystemLabel $VolumeLabel -Confirm:$false

if ($bl -and $bl.ProtectionStatus -eq 'On') {
  Write-Host 'Resuming BitLocker on C:...'
  Resume-BitLocker -MountPoint 'C:' -ErrorAction SilentlyContinue
}

$after = Get-Partition -DriveLetter 'C'
Write-Host ('Done. C: is now ~{0} GB. {1}: is ready.' -f [math]::Round($after.Size / 1GB, 2), $dl)
Write-Host 'Next (optional): run move-user-profile-folders-to-d.ps1 as your normal user to relocate Desktop/Documents to D:\Profile\'
