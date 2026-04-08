# SSOT guard (escrow order-detail root keys) — Windows wrapper; same as .py
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
& python "$root/scripts/ssot-guard-escrow-orders-detail.py"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
