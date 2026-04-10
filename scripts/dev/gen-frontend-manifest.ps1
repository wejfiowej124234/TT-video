# 51-D3：可验证发布 — 前端 build-manifest（PowerShell，与 gen-frontend-manifest.sh 同形）
# 前置：cd frontend; npm run build
# 输出：frontend/.next/build-manifest.json
# 可选：$env:EVIDENCE_GO_DIR = "evidence\GO_20260328" 时复制 frontend-build-manifest.json + .sha256

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$Next = Join-Path $Root "frontend\.next"
if (-not (Test-Path -LiteralPath $Next -PathType Container)) {
    Write-Error "Missing $Next. Run: cd frontend; npm run build"
}

$manifestPath = Join-Path $Next "build-manifest.json"
$date = Get-Date -Format "yyyy-MM-dd"
$artifacts = New-Object System.Collections.Generic.List[hashtable]

$buildId = Join-Path $Next "BUILD_ID"
if (Test-Path -LiteralPath $buildId -PathType Leaf) {
    $h = (Get-FileHash -LiteralPath $buildId -Algorithm SHA256).Hash.ToLowerInvariant()
    [void]$artifacts.Add(@{ path = ".next/BUILD_ID"; sha256 = $h })
}

$staticDir = Join-Path $Next "static"
if (Test-Path -LiteralPath $staticDir -PathType Container) {
    $files = Get-ChildItem -LiteralPath $staticDir -Recurse -File | Sort-Object FullName
    if ($files.Count -gt 0) {
        $sha = [System.Security.Cryptography.SHA256]::Create()
        $ms = New-Object System.IO.MemoryStream
        foreach ($f in $files) {
            $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
            $ms.Write($bytes, 0, $bytes.Length)
        }
        $agg = [BitConverter]::ToString($sha.ComputeHash($ms.ToArray())).Replace("-", "").ToLowerInvariant()
        [void]$artifacts.Add(@{ path = ".next/static"; sha256 = $agg })
    }
}

$obj = [ordered]@{
    gate      = "Gate-5"
    date      = $date
    artifacts = @($artifacts | ForEach-Object { [ordered]@{ path = $_.path; sha256 = $_.sha256 } })
    sign_off  = @("发版人")
}
$json = $obj | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText($manifestPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote $manifestPath"

if ($env:EVIDENCE_GO_DIR) {
    $destDir = $env:EVIDENCE_GO_DIR
    if (-not [System.IO.Path]::IsPathRooted($destDir)) {
        $destDir = Join-Path $Root $destDir
    }
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
    $dest = Join-Path $destDir "frontend-build-manifest.json"
    Copy-Item -LiteralPath $manifestPath -Destination $dest -Force
    $hash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash.ToLowerInvariant()
    Set-Content -LiteralPath "$dest.sha256" -Value $hash -NoNewline -Encoding utf8
    Write-Host "Copied to $dest (+ .sha256)"
}
