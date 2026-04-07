# Clear current user's %LOCALAPPDATA%\Temp (skips locked files)
$ErrorActionPreference = "SilentlyContinue"
$tempDir = Join-Path $env:LOCALAPPDATA "Temp"

if (-not (Test-Path -LiteralPath $tempDir)) {
    Write-Host "No folder: $tempDir"
    exit 0
}

$before = (Get-ChildItem -LiteralPath $tempDir -Recurse -File -Force -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
$beforeMb = if ($null -eq $before) { 0 } else { [math]::Round($before / 1MB, 2) }
Write-Host "Cleaning: $tempDir"
Write-Host "Size before: $beforeMb MB"

Get-ChildItem -LiteralPath $tempDir -Force -ErrorAction SilentlyContinue | ForEach-Object {
    Remove-Item -LiteralPath $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
}

$after = (Get-ChildItem -LiteralPath $tempDir -Recurse -File -Force -ErrorAction SilentlyContinue |
    Measure-Object -Property Length -Sum).Sum
$afterMb = if ($null -eq $after) { 0 } else { [math]::Round($after / 1MB, 2) }
$freed = [math]::Round($beforeMb - $afterMb, 2)
Write-Host "Size after: $afterMb MB"
Write-Host "Freed (approx): $freed MB"
if ($afterMb -gt 100) {
    Write-Host "Note: Some files could not be deleted (in use). Reboot or close apps and run again."
}
