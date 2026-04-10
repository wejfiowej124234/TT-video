# Fail if two crates/api/migrations/*.sql files share the same numeric prefix (SQLx PK on version).
# Usage: repo root, powershell -NoProfile -File scripts/check-sqlx-migration-prefixes.ps1
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$MigDir = Join-Path $Root "crates\api\migrations"
if (-not (Test-Path -LiteralPath $MigDir)) {
    Write-Error "check-sqlx-migration-prefixes: missing $MigDir"
    exit 1
}
$byPrefix = @{}
Get-ChildItem -LiteralPath $MigDir -Filter "*.sql" -File | ForEach-Object {
    if ($_.Name -match '^(\d+)_.*\.sql$') {
        $p = $Matches[1]
        if (-not $byPrefix.ContainsKey($p)) { $byPrefix[$p] = [System.Collections.Generic.List[string]]::new() }
        $byPrefix[$p].Add($_.Name) | Out-Null
    }
}
$dup = $byPrefix.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
if ($dup) {
    Write-Host "check-sqlx-migration-prefixes: duplicate migration version prefix(es) will break _sqlx_migrations PK:" -ForegroundColor Red
    foreach ($e in $dup | Sort-Object Name) {
        Write-Host "  $($e.Key):"
        foreach ($n in $e.Value) { Write-Host "    $n" }
    }
    Write-Host "Rename one file so each prefix is unique (lexicographic order = apply order)."
    exit 1
}
Write-Host "check-sqlx-migration-prefixes: OK"
