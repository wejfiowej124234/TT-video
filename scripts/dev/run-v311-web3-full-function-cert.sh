#!/usr/bin/env bash
# Master control · TT_V311_WEB3_FULL_FUNCTION_CERT
# Real Sepolia RPC · per-item Evidence · FAIL until 100% (incl. Owner Tier C)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

command -v cast >/dev/null 2>&1 || { echo "cast (Foundry) required" >&2; exit 2; }
PY=python
command -v python >/dev/null 2>&1 || PY=python3

echo "== V311 Web3 Deployment & Functional Certification =="
echo "inventory=registry/v311-web3-deployment-inventory.v1.json"
echo "broadcast_ok=${TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK:-0}"
echo "NOTE: Owner keys / Safe multisig / Sign-off are NOT replaced by this script"

"$PY" "$ROOT/scripts/dev/lib/run_v311_web3_full_function_cert.py"
exit $?
