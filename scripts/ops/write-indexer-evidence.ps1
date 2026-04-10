# 与 write-indexer-evidence.sh 等价：将 indexer-public-snapshot 的 JSON 写入 evidence/GO_YYYYMMDD/。
# 快照本体仍由 **bash** 运行 **scripts/indexer-public-snapshot.sh** 生成（须 **curl**、**jq**，与 .sh 相同）。
# manifest / zip 在 PowerShell 内生成（**不**再依赖 jq 生成 manifest；**zip** 用 **Compress-Archive**）。
#
# 环境变量与 .sh 一致：**API_BASE_URL**、**ADMIN_BEARER_TOKEN**、**INTERNAL_API_SECRET**、**SNAPSHOT_INTERNAL_***、**EVIDENCE_ROOT**、**EVIDENCE_DAY_GO**、**EVIDENCE_GO_DIR**、
# **INDEXER_EVIDENCE_WRITE_MANIFEST**、**INDEXER_EVIDENCE_BUNDLE_ZIP**、**INDEXER_EVIDENCE_EPIC_D_ENVELOPES**（**0** 跳过 **artifacts/epic_d_d0*.json**）、**INDEXER_EVIDENCE_MANIFEST_GATE**、**INDEXER_EVIDENCE_MANIFEST_SIGN_OFF**。
# **Epic D-10**：manifest 后 **bash** **`write-indexer-evidence.sh --epic-d10-post`** → **manifest.sha256** + **epic_d_go_bundle_closure.json**（须 **jq**）。
#
# 用法（项目根）：
#   .\scripts\write-indexer-evidence.ps1
#   $env:INDEXER_EVIDENCE_BUNDLE_ZIP='1'; .\scripts\write-indexer-evidence.ps1

$ErrorActionPreference = "Stop"

if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
    Write-Error "write-indexer-evidence.ps1: need bash (Git Bash) to run scripts/indexer-public-snapshot.sh"
    exit 1
}

$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }

$evidenceRoot = if ($env:EVIDENCE_ROOT) { $env:EVIDENCE_ROOT } else { Join-Path $rootDir "evidence" }
if ($env:EVIDENCE_GO_DIR) {
    $outDir = $env:EVIDENCE_GO_DIR
    $day = [System.IO.Path]::GetFileName($outDir.TrimEnd('\', '/'))
    $null = New-Item -ItemType Directory -Force -Path $outDir
} else {
    $day = if ($env:EVIDENCE_DAY_GO) { $env:EVIDENCE_DAY_GO } else { "GO_$([DateTime]::UtcNow.ToString('yyyyMMdd'))" }
    $outDir = Join-Path $evidenceRoot $day
    $null = New-Item -ItemType Directory -Force -Path $outDir
}

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

function Invoke-EpicDEvidenceEnvelopes {
    param([string]$Dir)
    if ($env:INDEXER_EVIDENCE_EPIC_D_ENVELOPES -eq "0") { return }
    if (-not $env:INTERNAL_API_SECRET) {
        Write-Host "write-indexer-evidence.ps1: INTERNAL_API_SECRET unset; skipping Epic D-03/04/05 artifacts/"
        return
    }
    $art = Join-Path $Dir "artifacts"
    $null = New-Item -ItemType Directory -Force -Path $art
    if (-not $env:API_BASE_URL) { $env:API_BASE_URL = "http://127.0.0.1:8080" }
    $triples = @(
        @{ args = @("scripts/internal-indexer-ops.sh", "status", "--ops-artifact"); out = "epic_d_d03_indexer_status.json" },
        @{ args = @("scripts/internal-indexer-ops.sh", "status", "--live-reconcile", "--ops-artifact"); out = "epic_d_d04_indexer_status_live.json" },
        @{ args = @("scripts/internal-indexer-ops.sh", "reconcile", "--ops-artifact"); out = "epic_d_d05_reconcile.json" }
    )
    foreach ($t in $triples) {
        $targetFile = Join-Path $art $t.out
        $ef = "$targetFile.stderr.txt"
        $p = Start-Process -FilePath "bash" -ArgumentList $t.args -WorkingDirectory $rootDir -NoNewWindow -Wait -PassThru -RedirectStandardOutput $targetFile -RedirectStandardError $ef
        if ($p.ExitCode -ne 0) {
            if (Test-Path $ef) { Get-Content $ef -ErrorAction SilentlyContinue | Write-Host }
            Remove-Item $ef -ErrorAction SilentlyContinue
            Write-Error "write-indexer-evidence.ps1: internal-indexer-ops failed for $($t.out) (exit $($p.ExitCode))"
            exit $p.ExitCode
        }
        Remove-Item $ef -ErrorAction SilentlyContinue
    }
    Write-Host "write-indexer-evidence.ps1: wrote Epic D-03/04/05 under $art"
}

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
    $artDir = Join-Path $Dir "artifacts"
    if (Test-Path $artDir) {
        Get-ChildItem -Path $artDir -Filter "*.json" -File -ErrorAction SilentlyContinue | ForEach-Object {
            $h = (Get-FileHash -Path $_.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
            $artifacts += @{ path = ("artifacts/" + $_.Name); sha256 = $h }
        }
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
    $notes = "Paths relative to GO_* day dir. Epic D-10: manifest.json + manifest.sha256 + epic_d_go_bundle_closure.json. Replace gate/sign_off per evidence/README.md. RUNBOOK §2.55 / 110."

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
    $manifestCanon = Join-Path $Dir "manifest.json"
    Copy-Item -Path $manifestPath -Destination $manifestCanon -Force
    Write-Host "write-indexer-evidence.ps1: wrote $manifestCanon"
}

function Compress-IndexerBundleZip {
    param([string]$Dir, [string]$Day)

    $zipTs = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmss") + "Z"
    $zipName = "indexer_evidence_bundle_${Day}_${zipTs}.zip"
    $zipPath = Join-Path $Dir $zipName

    $m = Join-Path $Dir "manifest.json"
    if (-not (Test-Path $m)) {
        Write-Error "write-indexer-evidence.ps1: missing manifest.json for zip"
        exit 1
    }

    $paths = @(
        (Join-Path $Dir "manifest.json"),
        (Join-Path $Dir "manifest.sha256"),
        (Join-Path $Dir "epic_d_go_bundle_closure.json")
    )
    $paths += (Get-ChildItem -Path $Dir -Filter "indexer_public_snapshot_*.json" -File | ForEach-Object { $_.FullName })
    $ad = Join-Path $Dir "artifacts"
    if (Test-Path $ad) {
        $paths += (Get-ChildItem -Path $ad -Filter "*.json" -File | ForEach-Object { $_.FullName })
    }
    Compress-Archive -Path $paths -DestinationPath $zipPath -Force
    Write-Host "write-indexer-evidence.ps1: wrote $zipPath"
}

if ($env:INDEXER_EVIDENCE_WRITE_MANIFEST -eq "1" -or $env:INDEXER_EVIDENCE_BUNDLE_ZIP -eq "1") {
    Invoke-EpicDEvidenceEnvelopes -Dir $outDir
    Write-IndexerBundleManifest -Dir $outDir
    $outDirBash = $outDir -replace '\\', '/'
    $finish = Start-Process -FilePath "bash" `
        -ArgumentList @("scripts/write-indexer-evidence.sh", "--epic-d10-post", $outDirBash) `
        -WorkingDirectory $rootDir `
        -NoNewWindow `
        -Wait `
        -PassThru
    if ($finish.ExitCode -ne 0) {
        Write-Error "write-indexer-evidence.ps1: write-indexer-evidence.sh --epic-d10-post failed (exit $($finish.ExitCode))"
        exit $finish.ExitCode
    }
}
if ($env:INDEXER_EVIDENCE_BUNDLE_ZIP -eq "1") {
    Compress-IndexerBundleZip -Dir $outDir -Day $day
}
