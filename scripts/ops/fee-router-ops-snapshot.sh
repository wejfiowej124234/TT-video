#!/usr/bin/env bash
# 91 §八 — Machine-readable FeeRouter pause + owner snapshot (cast read-only).
# Writes fee_router_ops_snapshot.json.
#
# Usage (repo root, with .env):
#   export FEE_ROUTER_ADDRESS=0x…
#   export CHAIN_RPC_URL=…
#   export FEE_ROUTER_OPS_OUT=evidence/.../run_<UTC>/fee_router_ops_snapshot.json   # optional
#   bash scripts/ops/fee-router-ops-snapshot.sh
#
# Requires: cast (Foundry)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi

ADDR="${FEE_ROUTER_ADDRESS:-}"
ADDR="${ADDR//$'\r'/}"
RPC="${CHAIN_RPC_URL:-}"
RPC="${RPC//$'\r'/}"
OUT="${FEE_ROUTER_OPS_OUT:-$ROOT/fee_router_ops_snapshot.json}"
OUT="${OUT//$'\r'/}"

if [[ -z "$ADDR" || -z "$RPC" ]]; then
  echo "fee-router-ops-snapshot: need FEE_ROUTER_ADDRESS and CHAIN_RPC_URL" >&2
  exit 1
fi
if ! command -v cast >/dev/null 2>&1; then
  echo "fee-router-ops-snapshot: cast not on PATH" >&2
  exit 1
fi

paused="$(cast call "$ADDR" "distributePaused()(bool)" --rpc-url "$RPC" 2>/dev/null || echo "error")"
owner="$(cast call "$ADDR" "owner()(address)" --rpc-url "$RPC" 2>/dev/null || echo "error")"

export FEE_ROUTER_ADDRESS="$ADDR"
export PAUSED="$paused"
export OWNER="$owner"
python3 << 'PY' >"$OUT"
import json
import os
from datetime import datetime, timezone

print(
    json.dumps(
        {
            "schema": "traveltrust.fee_router_ops_snapshot.v1",
            "captured_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "fee_router_address": os.environ["FEE_ROUTER_ADDRESS"],
            "distribute_paused": os.environ["PAUSED"],
            "owner": os.environ["OWNER"],
        },
        indent=2,
        ensure_ascii=False,
    )
    + "\n"
)
PY

echo "fee-router-ops-snapshot: wrote $OUT"
