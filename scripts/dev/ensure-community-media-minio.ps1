# Ensure local community media MinIO (:19000) for multipart video / staging playback.
# Reuses running container; creates bucket; merges COMMUNITY_MEDIA_S3_* into root .env when missing.
# Usage: powershell -File scripts/dev/ensure-community-media-minio.ps1 [-WarnOnly]
param(
    [switch]$WarnOnly
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $Root

$MinioPort = if ($env:MINIO_API_PORT) { $env:MINIO_API_PORT.Trim() } else { "19000" }
$Bucket = if ($env:COMMUNITY_MEDIA_S3_BUCKET) { $env:COMMUNITY_MEDIA_S3_BUCKET.Trim() } else { "traveltrust-community-media" }
$McUser = if ($env:MINIO_ROOT_USER) { $env:MINIO_ROOT_USER.Trim() } else { "minio" }
$McPass = if ($env:MINIO_ROOT_PASSWORD) { $env:MINIO_ROOT_PASSWORD.Trim() } else { "minio12345" }
$PublicBase = "http://127.0.0.1:${MinioPort}/${Bucket}"
$Container = "traveltrust-community-minio-evidence"

function Fail-Step([string]$Msg) {
    if ($WarnOnly) {
        Write-Host "WARN: $Msg" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "FAIL: $Msg" -ForegroundColor Red
    exit 1
}

function Test-MinioLive {
    try {
        $r = Invoke-WebRequest -Uri "http://127.0.0.1:${MinioPort}/minio/health/live" -UseBasicParsing -TimeoutSec 4
        return [int]$r.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-MinioLive {
    param([int]$MaxSec = 45)
    for ($i = 0; $i -lt $MaxSec; $i++) {
        if (Test-MinioLive) { return $true }
        Start-Sleep -Seconds 1
    }
    return $false
}

function Merge-CommunityMediaEnvIfMissing {
    $envFile = Join-Path $Root ".env"
    $snippetPath = Join-Path $Root "scripts\dev\community-media-minio-local.env.snippet"
    if (Test-Path -LiteralPath $envFile) {
        $body = Get-Content -LiteralPath $envFile -Raw -Encoding UTF8
        if ($body -match '(?m)^COMMUNITY_MEDIA_S3_BUCKET=') {
            Write-Host "ensure-community-media-minio: root .env already has COMMUNITY_MEDIA_S3_BUCKET (persistent config kept)"
            return
        }
    }
    $snippet = @"

# --- community video MinIO local [ensure-community-media-minio.ps1] ---
COMMUNITY_MEDIA_S3_BUCKET=$Bucket
COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=$PublicBase
COMMUNITY_MEDIA_S3_ENDPOINT=http://127.0.0.1:${MinioPort}
COMMUNITY_MEDIA_S3_REGION=us-east-1
COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=1
AWS_ACCESS_KEY_ID=$McUser
AWS_SECRET_ACCESS_KEY=$McPass
TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=$PublicBase,http://127.0.0.1:${MinioPort}
NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=$PublicBase,http://127.0.0.1:${MinioPort}
"@
    if (Test-Path -LiteralPath $snippetPath) {
        Set-Content -LiteralPath $snippetPath -Value ($snippet.TrimStart() + "`n") -Encoding UTF8
    }
    if (Test-Path -LiteralPath $envFile) {
        Add-Content -LiteralPath $envFile -Value $snippet -Encoding UTF8
        Write-Host "ensure-community-media-minio: appended COMMUNITY_MEDIA_S3_* block to root .env [restart API to pick up]"
    } else {
        Write-Host "ensure-community-media-minio: WARN no root .env — copy scripts/dev/community-media-minio-local.env.snippet" -ForegroundColor Yellow
    }
}

function Ensure-MinioBucket {
    $running = docker ps -q -f "name=^${Container}$" 2>$null
    if (-not $running) { return }
    docker exec $Container mc alias set local http://127.0.0.1:9000 $McUser $McPass 2>$null | Out-Null
    docker exec $Container mc mb "local/${Bucket}" --ignore-existing 2>$null | Out-Null
    Write-Host "ensure-community-media-minio: bucket $Bucket ready in $Container"
}

if (Test-MinioLive) {
    Ensure-MinioBucket
    Merge-CommunityMediaEnvIfMissing
    Write-Host "ensure-community-media-minio: OK MinIO :${MinioPort} healthy ($Container)"
    exit 0
}

$running = docker ps -q -f "name=^${Container}$" 2>$null
if (-not $running) {
    $exists = docker ps -aq -f "name=^${Container}$" 2>$null
    if ($exists) {
        Write-Host "ensure-community-media-minio: docker start $Container ..."
        docker start $Container 2>&1 | ForEach-Object { Write-Host $_ }
    } else {
        $compose = Join-Path $Root "evidence\community-media-local-minio-chain\docker-compose.yml"
        if (-not (Test-Path -LiteralPath $compose)) {
            Fail-Step "missing $compose"
        }
        Write-Host "ensure-community-media-minio: docker compose up -d minio [evidence chain, persistent volume] ..."
        docker compose -f $compose up -d minio 2>&1 | ForEach-Object { Write-Host $_ }
        if ($LASTEXITCODE -ne 0) {
            Fail-Step "docker compose minio exit $LASTEXITCODE"
        }
    }
}

if (-not (Wait-MinioLive)) {
    Fail-Step "MinIO :${MinioPort} not healthy after wait"
}

Ensure-MinioBucket
Merge-CommunityMediaEnvIfMissing
Write-Host "ensure-community-media-minio: OK MinIO :${MinioPort} ready"
exit 0
