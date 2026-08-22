#!/usr/bin/env bash
# Read-only · Sepolia Timelock operation READY / EXECUTABLE probe (V9 Periphery Governance).
# SSOT env: evidence/GO_ttg_v9_periphery_governance_upgrade/sepolia-reality.addresses.env
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
python "$ROOT/scripts/dev/probe-ttg-v9-sepolia-timelock-reality-status.py" "$@"
