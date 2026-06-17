param([switch]$WarnOnly)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Invoke-RepoGitBash.ps1")
try {
    Invoke-RepoGitBash -Command "bash scripts/dev/check-admin-capabilities-route.sh" -WarnOnly:$WarnOnly
    exit 0
} catch {
    Write-Host $_.Exception.Message
    exit 1
}
