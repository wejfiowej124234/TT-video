# Prune cancelled seed-tourist orders from PG before API hydrate.
param([switch]$WarnOnly)
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "lib\Invoke-RepoGitBash.ps1")
try {
    Invoke-RepoGitBash -Command "bash scripts/dev/prune-tourist-seed-orders-db.sh" -WarnOnly:$WarnOnly
    exit 0
} catch {
    if ($WarnOnly) {
        Write-Host "WARN: prune-tourist-seed-orders-db $($_.Exception.Message)"
        exit 0
    }
    Write-Host $_.Exception.Message
    exit 1
}
