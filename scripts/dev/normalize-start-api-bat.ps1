# Normalize scripts/dev/start-api-with-seed.bat for Windows cmd.exe double-click.
# - CRLF line endings
# - REM lines: no fullwidth parens (cmd mis-parses as block closers)
# - GBK (CP936) body for Chinese echo on zh-CN Windows
param(
    [switch]$Utf8Only
)
$path = Join-Path $PSScriptRoot "start-api-with-seed.bat"
$raw = Get-Content -LiteralPath $path -Encoding UTF8 -Raw
$raw = $raw -replace "`r`n", "`n" -replace "`r", "`n"
$raw = $raw.Replace([char]0x2014, '-').Replace([char]0xFF1A, ':')
$lines = $raw -split "`n", -1
$out = foreach ($line in $lines) {
    if ($line.StartsWith('REM ')) {
        $line.Replace([char]0xFF08, '[').Replace([char]0xFF09, ']')
    } else {
        $line
    }
}
$text = ($out -join "`r`n").TrimEnd() + "`r`n"
if ($Utf8Only) {
    [System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
    Write-Host "normalized UTF-8 CRLF: $path"
} else {
    $enc = [System.Text.Encoding]::GetEncoding(936)
    [System.IO.File]::WriteAllText($path, $text, $enc)
    Write-Host "normalized GBK CRLF: $path"
}
