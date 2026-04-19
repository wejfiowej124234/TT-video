# Sync frontend/.env.local NEXT_PUBLIC_* from repo root .env (same source as traveltrust-api ChainConfig).
# 部署一致性：NEXT_PUBLIC_* 仅反映根 .env；预发/生产须与链上实际部署地址一致（见 docs/spec/14-合约-API-ABI-前后端对齐.md）。
# Maps GOVERNANCE_TOKEN_ADDRESS -> NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS (TTG / GovernanceVotesToken; distinct from GOVERNOR_ADDRESS).
# Keeps lines not managed by this script (e.g. NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID).
# Called from start-api-with-seed.bat; or: powershell -File scripts/dev/sync-frontend-env-local-from-root.ps1
#
# -ApiListenPort：一键启动若强制 PORT（与根 .env 中 PORT 不一致），传入实际监听端口，避免 NEXT_PUBLIC_API_BASE_URL 指向错误端口。

param(
    [string]$ApiListenPort = ""
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$EnvFile = Join-Path $Root ".env"
$OutFile = Join-Path $Root "frontend\.env.local"
$MarkerBegin = "# --- BEGIN TT NEXT_PUBLIC sync ---"
$MarkerEnd = "# --- END TT NEXT_PUBLIC sync ---"

if (-not (Test-Path $EnvFile)) {
    Write-Host "sync-frontend-env: skip (no root .env). Copy .env.example to .env and set CHAIN_* / contract addresses."
    exit 0
}

$vars = @{}
Get-Content -LiteralPath $EnvFile -Encoding UTF8 | ForEach-Object {
    $line = $_.TrimEnd()
    if ($line -match '^\s*#' -or [string]::IsNullOrWhiteSpace($line)) { return }
    $idx = $line.IndexOf('=')
    if ($idx -lt 1) { return }
    $k = $line.Substring(0, $idx).Trim()
    $v = $line.Substring($idx + 1).Trim()
    if ($v.Length -ge 2 -and $v.StartsWith('"') -and $v.EndsWith('"')) {
        $v = $v.Substring(1, $v.Length - 2)
    }
    $vars[$k] = $v
}

function Get-Var([string]$name) {
    if ($vars.ContainsKey($name)) { return $vars[$name] }
    return ""
}

# NEXT_PUBLIC_API_BASE_URL must be the API listen port (default 8080), never the Next dev port (3012), or fetches return HTML (api_html_not_json).
$port = ""
if (-not [string]::IsNullOrWhiteSpace($ApiListenPort)) {
    $port = $ApiListenPort.Trim()
}
else {
    $fromEnv = Get-Var "API_LISTEN_PORT"
    if (-not [string]::IsNullOrWhiteSpace($fromEnv)) {
        $port = $fromEnv.Trim()
    }
    else {
        $port = Get-Var "PORT"
        if ([string]::IsNullOrWhiteSpace($port)) { $port = "8080" }
        if ($port -eq "3012" -or $port -eq "3000") {
            Write-Host "sync-frontend-env: WARN: root .env PORT=$port looks like a Next.js dev port, not traveltrust-api. Using 8080 for NEXT_PUBLIC_API_BASE_URL. Set PORT=8080 or API_LISTEN_PORT=8080 in .env." -ForegroundColor Yellow
            $port = "8080"
        }
    }
}
$apiBase = "http://127.0.0.1:$port"

$syncLines = New-Object System.Collections.Generic.List[string]
$syncLines.Add($MarkerBegin)
$syncLines.Add("# Same source as root .env; change root .env then re-run one-click start")
$syncLines.Add("NEXT_PUBLIC_API_BASE_URL=$apiBase")

$chainId = Get-Var "CHAIN_ID"
if (-not [string]::IsNullOrWhiteSpace($chainId)) { $syncLines.Add("NEXT_PUBLIC_CHAIN_ID=$chainId") }

$rpc = Get-Var "CHAIN_RPC_URL"
if (-not [string]::IsNullOrWhiteSpace($rpc)) { $syncLines.Add("NEXT_PUBLIC_RPC_URL=$rpc") }

$map = @{
    "FEE_ROUTER_ADDRESS"        = "NEXT_PUBLIC_FEE_ROUTER_ADDRESS"
    "ESCROW_FACTORY_ADDRESS"   = "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS"
    "REGISTRY_ADDRESS"         = "NEXT_PUBLIC_REGISTRY_ADDRESS"
    "GUIDE_STAKING_ADDRESS"    = "NEXT_PUBLIC_GUIDE_STAKING_ADDRESS"
    "STAKING_PROVIDER_ADDRESS" = "NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS"
}
foreach ($e in $map.GetEnumerator()) {
    $val = Get-Var $e.Key
    if (-not [string]::IsNullOrWhiteSpace($val)) { $syncLines.Add("$($e.Value)=$val") }
}
# TTG：优先 GOVERNANCE_TOKEN_ADDRESS（.env.example 七键），兼容历史别名 GOVERNANCE_VOTES_TOKEN_ADDRESS
$govTok = Get-Var "GOVERNANCE_TOKEN_ADDRESS"
if ([string]::IsNullOrWhiteSpace($govTok)) { $govTok = Get-Var "GOVERNANCE_VOTES_TOKEN_ADDRESS" }
if (-not [string]::IsNullOrWhiteSpace($govTok)) { $syncLines.Add("NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=$govTok") }

$settle = Get-Var "SETTLEMENT_TOKEN"
if ([string]::IsNullOrWhiteSpace($settle)) { $settle = Get-Var "PAYMENT_TOKEN" }
if (-not [string]::IsNullOrWhiteSpace($settle)) { $syncLines.Add("NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=$settle") }

$claim = Get-Var "INVESTOR_DISTRIBUTION_CLAIM_ADDRESS"
if (-not [string]::IsNullOrWhiteSpace($claim)) { $syncLines.Add("NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS=$claim") }

$syncLines.Add($MarkerEnd)

$prefixesManaged = @(
    "NEXT_PUBLIC_API_BASE_URL=",
    "NEXT_PUBLIC_CHAIN_ID=",
    "NEXT_PUBLIC_RPC_URL=",
    "NEXT_PUBLIC_FEE_ROUTER_ADDRESS=",
    "NEXT_PUBLIC_ESCROW_FACTORY_ADDRESS=",
    "NEXT_PUBLIC_REGISTRY_ADDRESS=",
    "NEXT_PUBLIC_GUIDE_STAKING_ADDRESS=",
    "NEXT_PUBLIC_STAKING_PROVIDER_ADDRESS=",
    "NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS=",
    "NEXT_PUBLIC_SETTLEMENT_TOKEN_ADDRESS=",
    "NEXT_PUBLIC_INVESTOR_DISTRIBUTION_CLAIM_ADDRESS="
)

$kept = New-Object System.Collections.Generic.List[string]
if (Test-Path -LiteralPath $OutFile) {
    $inside = $false
    Get-Content -LiteralPath $OutFile -Encoding UTF8 | ForEach-Object {
        $line = $_
        if ($line -eq $MarkerBegin -or $line -match '^\# --- BEGIN TT NEXT_PUBLIC sync') { $inside = $true; return }
        if ($line -eq $MarkerEnd) { $inside = $false; return }
        if ($inside) { return }
        $isManaged = $false
        foreach ($p in $prefixesManaged) {
            if ($line.StartsWith($p)) { $isManaged = $true; break }
        }
        if (-not $isManaged) {
            if ([string]::IsNullOrWhiteSpace($line)) { return }
            if ($line.StartsWith("#") -and (
                    $line.Contains("frontend/.env.local") -or
                    $line.Contains("Manual lines") -or
                    $line.Contains("BEGIN TT NEXT_PUBLIC sync (") -or
                    $line.Contains("Sepolia") -or
                    $line.Contains([char]0x4EE5 + [char]0x4E0B + [char]0x4E3A) -or
                    $line.Contains([char]0x7531 + [char]0x5DE5 + [char]0x5177)
                )) { return }
            $kept.Add($line)
        }
    }
}

$out = New-Object System.Collections.Generic.List[string]
$out.Add("# frontend/.env.local - TT NEXT_PUBLIC block maintained by sync-frontend-env-local-from-root.ps1 (gitignored)")
if ($kept.Count -gt 0) {
    $out.Add("# --- Manual lines (not overwritten by sync) ---")
    $null = $out.AddRange($kept)
    $out.Add("")
}
$null = $out.AddRange($syncLines)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllLines($OutFile, $out.ToArray(), $utf8NoBom)

$cid = Get-Var "CHAIN_ID"
$rpc = Get-Var "CHAIN_RPC_URL"
if (-not [string]::IsNullOrWhiteSpace($cid) -and [string]::IsNullOrWhiteSpace($rpc)) {
    Write-Host "sync-frontend-env: WARN — CHAIN_ID set but CHAIN_RPC_URL empty; chain reads / wagmi may fail" -ForegroundColor Yellow
}
$gt = Get-Var "GOVERNANCE_TOKEN_ADDRESS"
if (-not [string]::IsNullOrWhiteSpace($cid) -and [string]::IsNullOrWhiteSpace($gt)) {
    Write-Host "sync-frontend-env: WARN — CHAIN_ID set but GOVERNANCE_TOKEN_ADDRESS empty; governance token UI may miss NEXT_PUBLIC_GOVERNANCE_TOKEN_ADDRESS" -ForegroundColor Yellow
}
$cors = Get-Var "CORS_ORIGINS"
$strict = Get-Var "STRICT_SSOT"
$check = Get-Var "CHECK_SSOT"
if (($strict -eq "1" -or $check -eq "1") -and [string]::IsNullOrWhiteSpace($cors)) {
    Write-Host "sync-frontend-env: WARN — STRICT_SSOT/CHECK_SSOT=1 but CORS_ORIGINS empty in root .env; API will refuse to start until set" -ForegroundColor Yellow
}

Write-Host "sync-frontend-env: wrote $OutFile (NEXT_PUBLIC aligned with root .env)"
