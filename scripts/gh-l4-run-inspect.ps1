# Thin forwarder: Windows → Git Bash + scripts/dev/gh-l4-run-inspect.sh (B-184 style).
$ErrorActionPreference = 'Stop'
$here = $PSScriptRoot
$sh = Join-Path $here 'dev/gh-l4-run-inspect.sh'
$bash = Get-Command bash -ErrorAction SilentlyContinue
if (-not $bash) {
    Write-Error 'bash not on PATH (install Git for Windows and use Git Bash, or run from Git Bash).'
    exit 127
}
& bash.exe $sh @args
exit $LASTEXITCODE
