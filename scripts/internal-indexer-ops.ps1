# 与 internal-indexer-ops.sh 对齐的 Windows 入口。
# - **evidence** / **evidence-bundle**：直接调用 **write-indexer-evidence.ps1**（无需为整段 curl 重写）。
# - **tick | replay | reconcile | status | probe | recover**：委托 **bash scripts/internal-indexer-ops.sh**（须 **Git Bash**；环境与 .sh 相同：**API_BASE_URL**、**INTERNAL_API_SECRET** 等）。
#
# 用法（项目根）：
#   .\scripts\internal-indexer-ops.ps1 evidence
#   .\scripts\internal-indexer-ops.ps1 evidence --skip-internal-reconcile
#   .\scripts\internal-indexer-ops.ps1 evidence-bundle --with-indexer-tick   # 慎用
#   .\scripts\internal-indexer-ops.ps1 status
#   .\scripts\internal-indexer-ops.ps1 status --live-reconcile
#   .\scripts\internal-indexer-ops.ps1 recover status

param(
    [Parameter(Position = 0)]
    [string]$Command = "",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs = @()
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
if (-not $rootDir) { $rootDir = (Get-Location).Path }

function Usage {
    Write-Host @"
Usage: internal-indexer-ops.ps1 tick|replay|reconcile|status|probe|recover|evidence|evidence-bundle [options]

  evidence         -> write-indexer-evidence.ps1 (optional --skip-internal-reconcile, --with-indexer-tick)
  evidence-bundle  -> INDEXER_EVIDENCE_BUNDLE_ZIP=1 + write-indexer-evidence.ps1 (same optional flags)
  tick|replay|reconcile|status|probe|recover -> bash scripts/internal-indexer-ops.sh (requires Git Bash)
    reconcile: optional --persist, --rpc, --backfill-chain-id, --chain-scope-*, --event-log-scope-*, --correction-executor-scope-*, --memory-sync-from-db, --include-chain-tip, --include-event-log-escrow-coverage (pass-through to .sh)

See scripts/internal-indexer-ops.sh and ops/RUNBOOK.md §2.55.
"@ -ForegroundColor Yellow
}

if (-not $Command) {
    Usage
    exit 1
}

switch ($Command) {
    "evidence" {
        $prevSkip = $env:SNAPSHOT_INTERNAL_SKIP_RECONCILE
        $prevTick = $env:SNAPSHOT_INTERNAL_INDEXER_TICK
        try {
            foreach ($a in $RemainingArgs) {
                if ($a -eq "--skip-internal-reconcile") {
                    $env:SNAPSHOT_INTERNAL_SKIP_RECONCILE = "1"
                } elseif ($a -eq "--with-indexer-tick") {
                    $env:SNAPSHOT_INTERNAL_INDEXER_TICK = "1"
                } else {
                    Write-Error "internal-indexer-ops.ps1 evidence: unknown option: $a"
                    exit 1
                }
            }
            & "$PSScriptRoot/write-indexer-evidence.ps1"
            exit $LASTEXITCODE
        } finally {
            if ($null -eq $prevSkip -or $prevSkip -eq "") {
                Remove-Item Env:\SNAPSHOT_INTERNAL_SKIP_RECONCILE -ErrorAction SilentlyContinue
            } else {
                $env:SNAPSHOT_INTERNAL_SKIP_RECONCILE = $prevSkip
            }
            if ($null -eq $prevTick -or $prevTick -eq "") {
                Remove-Item Env:\SNAPSHOT_INTERNAL_INDEXER_TICK -ErrorAction SilentlyContinue
            } else {
                $env:SNAPSHOT_INTERNAL_INDEXER_TICK = $prevTick
            }
        }
    }
    "evidence-bundle" {
        $prevZip = $env:INDEXER_EVIDENCE_BUNDLE_ZIP
        $prevSkip = $env:SNAPSHOT_INTERNAL_SKIP_RECONCILE
        $prevTick = $env:SNAPSHOT_INTERNAL_INDEXER_TICK
        try {
            foreach ($a in $RemainingArgs) {
                if ($a -eq "--skip-internal-reconcile") {
                    $env:SNAPSHOT_INTERNAL_SKIP_RECONCILE = "1"
                } elseif ($a -eq "--with-indexer-tick") {
                    $env:SNAPSHOT_INTERNAL_INDEXER_TICK = "1"
                } else {
                    Write-Error "internal-indexer-ops.ps1 evidence-bundle: unknown option: $a"
                    exit 1
                }
            }
            $env:INDEXER_EVIDENCE_BUNDLE_ZIP = "1"
            & "$PSScriptRoot/write-indexer-evidence.ps1"
            exit $LASTEXITCODE
        } finally {
            if ($null -eq $prevZip -or $prevZip -eq "") {
                Remove-Item Env:\INDEXER_EVIDENCE_BUNDLE_ZIP -ErrorAction SilentlyContinue
            } else {
                $env:INDEXER_EVIDENCE_BUNDLE_ZIP = $prevZip
            }
            if ($null -eq $prevSkip -or $prevSkip -eq "") {
                Remove-Item Env:\SNAPSHOT_INTERNAL_SKIP_RECONCILE -ErrorAction SilentlyContinue
            } else {
                $env:SNAPSHOT_INTERNAL_SKIP_RECONCILE = $prevSkip
            }
            if ($null -eq $prevTick -or $prevTick -eq "") {
                Remove-Item Env:\SNAPSHOT_INTERNAL_INDEXER_TICK -ErrorAction SilentlyContinue
            } else {
                $env:SNAPSHOT_INTERNAL_INDEXER_TICK = $prevTick
            }
        }
    }
    { $_ -in @("-h", "--help", "help") } {
        Usage
        exit 0
    }
    Default {
        if (-not (Get-Command bash -ErrorAction SilentlyContinue)) {
            Write-Error "internal-indexer-ops.ps1: command '$Command' requires Git Bash (bash on PATH). For evidence without tick/status, use: evidence | evidence-bundle"
            exit 1
        }
        $bashArgs = @("scripts/internal-indexer-ops.sh", $Command) + $RemainingArgs
        Push-Location $rootDir
        try {
            & bash @bashArgs
            exit $LASTEXITCODE
        } finally {
            Pop-Location
        }
    }
}
