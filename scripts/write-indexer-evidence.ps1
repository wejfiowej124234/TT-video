# 与 write-indexer-evidence.sh 等价：将 indexer-public-snapshot 的 JSON 写入 evidence/GO_YYYYMMDD/。
# 快照本体仍由 **bash** 运行 **scripts/indexer-public-snapshot.sh** 生成（须 **curl**、**jq**，与 .sh 相同）。
# manifest / zip 在 PowerShell 内生成（**不**再依赖 jq 生成 manifest；**zip** 用 **Compress-Archive**）。
#
# 环境变量与 .sh 一致：**API_BASE_URL**、**ADMIN_BEARER_TOKEN**、**INTERNAL_API_SECRET**、**SNAPSHOT_INTERNAL_RECONCILE_RPC**、**SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_CHAIN_TIP**、**SNAPSHOT_INTERNAL_RECONCILE_INCLUDE_EVENT_LOG_ESCROW_COVERAGE**、**SNAPSHOT_INTERNAL_INDEXER_TICK**、**SNAPSHOT_INTERNAL_SKIP_RECONCILE**（**`1`** 时跳过 **`POST …/internal/indexer-reconcile`**；**snapshot_options** 内 reconcile 侧 RPC/chain_tip/event_log_coverage 键输出 **`null`**）、**EVIDENCE_ROOT**、**EVIDENCE_DAY_GO**、
# **INDEXER_EVIDENCE_WRITE_MANIFEST**、**INDEXER_EVIDENCE_BUNDLE_ZIP**、**INDEXER_EVIDENCE_MANIFEST_GATE**、**INDEXER_EVIDENCE_MANIFEST_SIGN_OFF**（须为合法 JSON 数组，如 ["automation"]）。
#
# 用法（项目根）：
#   .\scripts\write-indexer-evidence.ps1
#   $env:INDEXER_EVIDENCE_BUNDLE_ZIP='1'; .\scripts\write-indexer-evidence.ps1

$ErrorActionPreference = "Stop"

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "write-indexer-evidence.ps1: need bash (Git Bash) to run scripts/indexer-public-snapshot.sh"
    exit 1
}

$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

$evidenceRoot = if ($env:EVIDENCE_ROOT) { $env:EVIDENCE_ROOT } else { Join-Path $rootDir "evidence" }
$day = if ($env:EVIDENCE_DAY_GO) { $env:EVIDENCE_DAY_GO } else { "GO_$([DateTime]::UtcNow.ToString('yyyyMMdd'))" }
$outDir = Join-Path $evidenceRoot $day
$null = New-Item -ItemType Directory -Force -Path $outDir

$ts = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmss") + "Z"
$outFile = Join-Path $outDir "indexer_public_snapshot_$ts.json"
$snapRel = "scripts/indexer-public-snapshot.sh"

$errFile = "$outFile.stderr.txt"
$p = Start-Process -FilePath "bash" `
    -ArgumentList @($snapRel) `
    -WorkingDirectory $rootDir `
    -NoNewWindow `
    -Wait `
    -PassThru `
    -RedirectStandardOutput $outFile `
    -RedirectStandardError $errFile

if ($p.ExitCode -ne 0) {
    if (Test-Path $errFile) { Get-Content $errFile -ErrorAction SilentlyContinue | Write-Host }
    Remove-Item $errFile -ErrorAction SilentlyContinue
    Write-Error "write-indexer-evidence.ps1: indexer-public-snapshot.sh failed (exit $($p.ExitCode))"
    exit $p.ExitCode
}
Remove-Item $errFile -ErrorAction SilentlyContinue

Write-Host "write-indexer-evidence.ps1: wrote $outFile"

function Write-IndexerBundleManifest {
    param([string]$Dir)

    $snaps = @(Get-ChildItem -Path $Dir -Filter "indexer_public_snapshot_*.json" -File -ErrorAction SilentlyContinue)
    if ($snaps.Length -eq 0) {
        Write-Error "write-indexer-evidence.ps1: no indexer_public_snapshot_*.json under $Dir"
        exit 1
    }

    $artifacts = @()
    foreach ($f in $snaps) {
        $h = (Get-FileHash -Path $f.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        $artifacts += @{ path = $f.Name; sha256 = $h }
    }

    $signOffJson = $env:INDEXER_EVIDENCE_MANIFEST_SIGN_OFF
    $signOff = @("automation")
    if ($signOffJson) {
        try {
            $parsed = $signOffJson | ConvertFrom-Json
            if ($parsed -is [System.Array]) { $signOff = @($parsed) }
            elseif ($null -ne $parsed) { $signOff = @($parsed) }
        } catch {
            Write-Error "write-indexer-evidence.ps1: INDEXER_EVIDENCE_MANIFEST_SIGN_OFF must be valid JSON array"
            exit 1
        }
    }

    $gate = if ($env:INDEXER_EVIDENCE_MANIFEST_GATE) { $env:INDEXER_EVIDENCE_MANIFEST_GATE } else { "Indexer-110-public-snapshot" }
    $dateStr = [DateTime]::UtcNow.ToString("yyyy-MM-dd")
    $notes = "Paths relative to GO_* day dir. Replace gate/sign_off for formal gate per evidence/README.md. RUNBOOK §2.55 / 110."

    $manifest = [ordered]@{
        bundle_kind = "indexer_public_snapshot"
        gate        = $gate
        date        = $dateStr
        artifacts   = $artifacts
        sign_off    = $signOff
        notes       = $notes
    }

    $manifestPath = Join-Path $Dir "indexer_public_snapshot_manifest.json"
    $json = $manifest | ConvertTo-Json -Depth 8 -Compress
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($manifestPath, $json, $utf8)
    Write-Host "write-indexer-evidence.ps1: wrote $manifestPath"
}

function Compress-IndexerBundleZip {
    param([string]$Dir, [string]$Day)

    $zipTs = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmss") + "Z"
    $zipName = "indexer_evidence_bundle_${Day}_${zipTs}.zip"
    $zipPath = Join-Path $Dir $zipName

    $manifestPath = Join-Path $Dir "indexer_public_snapshot_manifest.json"
    if (-not (Test-Path $manifestPath)) {
        Write-Error "write-indexer-evidence.ps1: missing indexer_public_snapshot_manifest.json for zip"
        exit 1
    }

    $paths = @($manifestPath)
    $paths += (Get-ChildItem -Path $Dir -Filter "indexer_public_snapshot_*.json" -File | ForEach-Object { $_.FullName })
    Compress-Archive -Path $paths -DestinationPath $zipPath -Force
    Write-Host "write-indexer-evidence.ps1: wrote $zipPath"
}

if ($env:INDEXER_EVIDENCE_WRITE_MANIFEST -eq "1" -or $env:INDEXER_EVIDENCE_BUNDLE_ZIP -eq "1") {
    Write-IndexerBundleManifest -Dir $outDir
}
if ($env:INDEXER_EVIDENCE_BUNDLE_ZIP -eq "1") {
    Compress-IndexerBundleZip -Dir $outDir -Day $day
}
