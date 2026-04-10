# SSOT guard (escrow order-detail root keys) — Windows wrapper; same as .py
$ErrorActionPreference = "Stop"
$gatesDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& python (Join-Path $gatesDir "ssot-guard-escrow-orders-detail.py")
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
