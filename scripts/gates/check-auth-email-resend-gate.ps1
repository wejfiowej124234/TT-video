# Mirrors scripts/gates/check-auth-email-resend-gate.sh (Resend fail-closed when transport=resend).
# Used by scripts/dev/start-api-with-seed.bat Step 1d — avoids PATH bash.exe (often WSL stub → execvpe /bin/bash failed).
# Usage (repo root): powershell -NoProfile -ExecutionPolicy Bypass -File scripts/gates/check-auth-email-resend-gate.ps1
$ErrorActionPreference = 'Stop'
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envPath = Join-Path $RepoRoot '.env'

$proc = [Environment]::GetEnvironmentVariables('Process')
function Test-ProcEnvKey([string]$name) { return $proc.ContainsKey($name) }

$transportW = Test-ProcEnvKey 'TRAVELTRUST_EMAIL_TRANSPORT'
$keyW = Test-ProcEnvKey 'TRAVELTRUST_RESEND_API_KEY'
$fromW = Test-ProcEnvKey 'TRAVELTRUST_RESEND_FROM'
$preTransport = if ($transportW) { [string]$proc['TRAVELTRUST_EMAIL_TRANSPORT'] } else { $null }
$preKey = if ($keyW) { [string]$proc['TRAVELTRUST_RESEND_API_KEY'] } else { $null }
$preFrom = if ($fromW) { [string]$proc['TRAVELTRUST_RESEND_FROM'] } else { $null }

if (Test-Path -LiteralPath $envPath) {
    foreach ($line in Get-Content -LiteralPath $envPath -Encoding utf8) {
        $t = $line.TrimEnd()
        if ($t -match '^\s*#') { continue }
        if ([string]::IsNullOrWhiteSpace($t)) { continue }
        $ix = $t.IndexOf('=')
        if ($ix -lt 1) { continue }
        $k = $t.Substring(0, $ix).Trim()
        if ($k.Length -eq 0) { continue }
        $v = $t.Substring($ix + 1).Trim()
        if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        [Environment]::SetEnvironmentVariable($k, $v, 'Process')
    }
}

if ($transportW) { [Environment]::SetEnvironmentVariable('TRAVELTRUST_EMAIL_TRANSPORT', $preTransport, 'Process') }
if ($keyW) { [Environment]::SetEnvironmentVariable('TRAVELTRUST_RESEND_API_KEY', $preKey, 'Process') }
if ($fromW) { [Environment]::SetEnvironmentVariable('TRAVELTRUST_RESEND_FROM', $preFrom, 'Process') }

$transport = [Environment]::GetEnvironmentVariable('TRAVELTRUST_EMAIL_TRANSPORT', 'Process')
$norm = if ([string]::IsNullOrEmpty($transport)) { '' } else { $transport.ToLowerInvariant() -replace '\s', '' }
if ($norm -ne 'resend') {
    Write-Host 'OK: check-auth-email-resend-gate (TRAVELTRUST_EMAIL_TRANSPORT is not resend; skip)'
    exit 0
}

$key = [Environment]::GetEnvironmentVariable('TRAVELTRUST_RESEND_API_KEY', 'Process')
$from = [Environment]::GetEnvironmentVariable('TRAVELTRUST_RESEND_FROM', 'Process')
if ([string]::IsNullOrWhiteSpace($key)) {
    [Console]::Error.WriteLine('ERROR: TRAVELTRUST_EMAIL_TRANSPORT=resend but TRAVELTRUST_RESEND_API_KEY is unset or empty.')
    exit 1
}
if ([string]::IsNullOrWhiteSpace($from)) {
    [Console]::Error.WriteLine('ERROR: TRAVELTRUST_EMAIL_TRANSPORT=resend but TRAVELTRUST_RESEND_FROM is unset or empty.')
    exit 1
}

Write-Host 'OK: check-auth-email-resend-gate (resend + key + from present)'
exit 0
