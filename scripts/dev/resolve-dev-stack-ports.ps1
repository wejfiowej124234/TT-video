# Resolve API + Next dev ports (mirror scripts/dev/_dev_stack_ports.sh) for Windows one-click / tooling.
# Writes a single line: "<backendPort> <frontendPort>" (ASCII digits only).
# Env overrides: API_PORT, FRONTEND_PORT (same semantics as Unix start_dev).
param(
    [string]$RepoRoot = ""
)
$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($RepoRoot)) {
    $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}
$envFile = Join-Path $RepoRoot ".env"
$envPort = ""
if (Test-Path -LiteralPath $envFile) {
    foreach ($line in Get-Content -LiteralPath $envFile -Encoding UTF8) {
        $t = $line.TrimEnd()
        if ($t -match '^\s*#' -or [string]::IsNullOrWhiteSpace($t)) { continue }
        if ($t -match '^\s*PORT\s*=') {
            $ix = $t.IndexOf("=")
            if ($ix -ge 0) {
                $v = $t.Substring($ix + 1).Trim()
                if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
                    $v = $v.Substring(1, $v.Length - 2)
                }
                $envPort = $v.Trim()
                break
            }
        }
    }
}

$apiOverride = $env:API_PORT
if (-not [string]::IsNullOrWhiteSpace($apiOverride)) {
    $backend = $apiOverride.Trim()
}
elseif ($envPort -eq "3012" -or $envPort -eq "3000") {
    $backend = "8080"
}
elseif ([string]::IsNullOrWhiteSpace($envPort)) {
    $backend = "8080"
}
else {
    $backend = $envPort.Trim()
}

$fe = $env:FRONTEND_PORT
if ([string]::IsNullOrWhiteSpace($fe)) { $frontend = "3012" }
else { $frontend = $fe.Trim() }

if ($backend -eq $frontend) {
    Write-Error "resolve-dev-stack-ports: API port ($backend) equals frontend port ($frontend). Set PORT=8080 in .env or FRONTEND_PORT=3012."
    exit 1
}

function Assert-DevPort([string]$Label, [string]$Port) {
    if ($Port -notmatch '^\d+$') {
        Write-Error "resolve-dev-stack-ports: $Label port must be decimal digits only, got: $Port"
        exit 1
    }
    $n = [int]$Port
    if ($n -lt 1 -or $n -gt 65535) {
        Write-Error "resolve-dev-stack-ports: $Label port out of range 1-65535: $n"
        exit 1
    }
}
Assert-DevPort "API" $backend
Assert-DevPort "frontend" $frontend

Write-Output "$backend $frontend"
exit 0
