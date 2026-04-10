# 与 export_deployment_params.sh 等价：17 条 #5 / checklist-17，产出可附入 evidence/GO_YYYYMMDD/ 或 08-3 的部署与构建快照。
# forge inspect：Escrow、EscrowFactory、Staking、Registry、FeeRouter、MockERC20。
# 用法（项目根）：.\scripts\export_deployment_params.ps1
#              .\scripts\export_deployment_params.ps1 path\to\deployment-params.txt

param(
    [Parameter(Position = 0)]
    [string]$OutPath = ""
)

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not $rootDir) { $rootDir = (Get-Location).Path }
$contractsDir = Join-Path $rootDir "contracts"

function Section { param([string]$Title) ""; "=== $Title ===" }

$main = {
    Section "meta"
    "exported_utc: $([DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ'))"
    "repo_root: $rootDir"
    Push-Location $rootDir
    try {
        $gh = (git rev-parse HEAD 2>$null)
        if ($gh) { "git_commit: $($gh.Trim())" } else { "git_commit: n/a" }
    } finally {
        Pop-Location
    }

    Section "contracts / forge"
    if (Get-Command forge -ErrorAction SilentlyContinue) {
        $fv = & forge --version 2>&1
        foreach ($line in @($fv)) { "forge_version: $line" }
        Push-Location $contractsDir
        try {
            & forge build
            if ($LASTEXITCODE -ne 0) { throw "forge build failed (exit $LASTEXITCODE)" }
            foreach ($c in @("Escrow", "EscrowFactory", "Staking", "Registry", "FeeRouter", "MockERC20")) {
                $inspect = & forge inspect $c bytecode 2>$null
                $raw = if ($null -ne $inspect) { ($inspect | Out-String).Trim() } else { "" }
                $blen = if ($raw) { $raw.Length } else { 0 }
                "bytecode_chars_${c}: $blen"
            }
        } finally {
            Pop-Location
        }
    } else {
        "forge: not in PATH — install Foundry, then re-run for bytecode lengths"
    }

    Section "optional slither"
    "Run: cd contracts && slither . --json slither-report.json"
    "Attach slither-report.json or this file to evidence/GO_YYYYMMDD/ per checklist-17 #5."
}

if ($OutPath) {
    # Tee-Object 在 Windows PowerShell 5.x 默认 UTF-16；与 .sh 文本证据对齐为 UTF-8 无 BOM
    $fullOut = if ([System.IO.Path]::IsPathRooted($OutPath)) { $OutPath } else { Join-Path $rootDir $OutPath }
    $lines = @(& $main)
    $utf8 = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllLines($fullOut, $lines, $utf8)
    $lines
} else {
    & $main
}
