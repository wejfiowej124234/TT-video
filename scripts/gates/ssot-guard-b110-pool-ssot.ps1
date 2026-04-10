# SSOT guard (B-110 governance/pool four-pool root chain SSOT) — Windows wrapper; same as .py
$ErrorActionPreference = "Stop"
$gatesDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& python (Join-Path $gatesDir "ssot-guard-b110-pool-ssot.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
