# SSOT guard (B-110 governance/pool four-pool root chain SSOT) — Windows wrapper; same as .py
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& python "$root/scripts/ssot-guard-b110-pool-ssot.py"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
