param(
    [int]$Port = 8080,
    [switch]$WarnOnly
)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Invoke-RepoGitBash.ps1")
$cmd = "export API_BASE='http://127.0.0.1:$Port' && bash scripts/dev/ensure-tourist-itinerary-draft-headroom.sh"
try {
    Invoke-RepoGitBash -Command $cmd -WarnOnly:$WarnOnly
    exit 0
} catch {
    Write-Host $_.Exception.Message
    exit 1
}
