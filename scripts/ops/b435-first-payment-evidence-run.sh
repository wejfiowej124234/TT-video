#!/usr/bin/env bash
# TT-B435 thin orchestrator: preflight -> API up -> tx_hashes.json -> b435-evidence-internal-curls -> print result dir.
# Repo root:
#   set -a && source .env && set +a
#   export B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC>   # optional
#   export B435_FIRST_PAYMENT_TX=0x…   # optional if first_payment already in tx_hashes.json
#   export B435_AUTO_ADMIN_BEARER_MINT=1   # if no ADMIN_BEARER_TOKEN
#   bash scripts/ops/b435-first-payment-evidence-run.sh
#
# Auto-create run_<UTC> when B435_EVIDENCE_RUN_DIR unset: default on (B435_ORCH_AUTO_NEW_RUN=0 to disable).
# Skip forge-style preflight (PRIVATE_KEY check): B435_ORCH_SKIP_PREFLIGHT=1 (still requires INTERNAL_API_SECRET).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

_CALLER_API="${API_BASE_URL:-}"
_CALLER_RUN="${B435_EVIDENCE_RUN_DIR:-}"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/.env"
  set +a
fi
[[ -n "$_CALLER_API" ]] && export API_BASE_URL="$_CALLER_API"
[[ -n "$_CALLER_RUN" ]] && export B435_EVIDENCE_RUN_DIR="$_CALLER_RUN"

_strip_cr() { printf '%s' "${1//$'\r'/}"; }

echo "=== b435-first-payment-evidence-run (repo: $ROOT) ==="

# --- [1] Preflight ---
if [[ "${B435_ORCH_SKIP_PREFLIGHT:-0}" == "1" ]]; then
  echo ""
  echo "[1] preflight skipped (B435_ORCH_SKIP_PREFLIGHT=1)"
  if [[ ! -f "$ROOT/.env" ]]; then echo "FAIL: missing .env" >&2; exit 1; fi
  SEC="$(_strip_cr "${INTERNAL_API_SECRET:-}")"
  if [[ -z "${SEC// }" ]]; then
    echo "FAIL: INTERNAL_API_SECRET empty in .env" >&2
    exit 1
  fi
else
  echo ""
  echo "[1] b435-preflight-check"
  bash "$ROOT/scripts/ops/b435-preflight-check.sh"
fi

if [[ "${B435_ORCH_INCLUDE_ABI:-0}" == "1" ]]; then
  echo ""
  echo "[1b] check-55-s13 (B435_ORCH_INCLUDE_ABI=1)"
  bash "$ROOT/scripts/check-55-s13.sh"
fi

# --- [2] API strict ---
PORT="${PORT:-8080}"
BASE="${API_BASE_URL:-http://127.0.0.1:$PORT}"
BASE="$(_strip_cr "$BASE")"
echo ""
echo "[2] API check: GET $BASE/health + /meta (must HTTP 200)"
H="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 20 "$BASE/health" 2>/dev/null || echo "000")"
M="$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 3 --max-time 20 "$BASE/meta" 2>/dev/null || echo "000")"
echo "    /health -> $H   /meta -> $M"
if [[ "$H" != "200" ]] || [[ "$M" != "200" ]]; then
  echo "FAIL: start traveltrust-api (same .env) and retry. API_BASE_URL=$BASE" >&2
  exit 1
fi

# --- [3] Evidence run dir + tx_hashes.json ---
if [[ -z "${B435_EVIDENCE_RUN_DIR:-}" ]]; then
  if [[ "${B435_ORCH_AUTO_NEW_RUN:-1}" != "1" ]]; then
    echo "FAIL: set B435_EVIDENCE_RUN_DIR=evidence/b435_fullstack_fund_testnet_closeout/run_<UTC> or B435_ORCH_AUTO_NEW_RUN=1" >&2
    exit 1
  fi
  echo ""
  echo "[3a] creating new run dir (tt-testnet-fullstack-new-run-dir.sh)"
  OUT="$(bash "$ROOT/scripts/ops/tt-testnet-fullstack-new-run-dir.sh" 2>&1)" || {
    echo "$OUT" >&2
    exit 1
  }
  echo "$OUT"
  CREATED="$(echo "$OUT" | grep '^Created:' | head -1 | sed 's/^Created:[[:space:]]*//')"
  if [[ -z "$CREATED" ]]; then
    echo "FAIL: could not parse Created: line from tt-testnet-fullstack-new-run-dir.sh" >&2
    exit 1
  fi
  export B435_EVIDENCE_RUN_DIR="$CREATED"
fi

RUN_REL="$(_strip_cr "${B435_EVIDENCE_RUN_DIR:-}")"
TX_JSON="$ROOT/$RUN_REL/tx_hashes.json"
echo ""
echo "[3b] evidence dir: $RUN_REL"
if [[ ! -d "$ROOT/$RUN_REL" ]]; then
  echo "FAIL: directory not found: $ROOT/$RUN_REL" >&2
  exit 1
fi
if [[ ! -f "$TX_JSON" ]]; then
  echo "FAIL: missing $TX_JSON — create with tt-testnet-fullstack-new-run-dir.sh" >&2
  exit 1
fi

command -v jq >/dev/null 2>&1 || {
  echo "FAIL: jq required for tx_hashes validation and merge" >&2
  exit 1
}

FP="$(jq -r '.first_payment // empty' "$TX_JSON")"
FP="${FP//$'\r'/}"
if [[ -n "${B435_FIRST_PAYMENT_TX:-}" ]]; then
  export B435_FIRST_PAYMENT_TX="$(_strip_cr "$B435_FIRST_PAYMENT_TX")"
  export B435_TX_HASHES_JSON="$TX_JSON"
  echo ""
  echo "[3c] merging B435_FIRST_PAYMENT_TX into tx_hashes.json"
  bash "$ROOT/scripts/ops/b435-merge-first-payment-tx.example.sh"
  FP="$(jq -r '.first_payment // empty' "$TX_JSON")"
fi

if [[ -z "$FP" ]]; then
  echo ""
  echo "FAIL: tx_hashes.json first_payment is empty."
  echo "  Edit: $TX_JSON"
  echo "  Or:  export B435_FIRST_PAYMENT_TX=0x<64 hex> && re-run this script."
  exit 1
fi
if [[ ! "$FP" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
  echo "FAIL: first_payment must be 0x + 64 hex, got: ${FP:0:20}..." >&2
  exit 1
fi

META_CID="$(curl -sS --max-time 15 "$BASE/meta" | jq -r '.chain.chain_id // empty' 2>/dev/null || true)"
TX_CID="$(jq -r '.chain_id // empty' "$TX_JSON")"
if [[ -n "$META_CID" && "$META_CID" != "null" && -n "$TX_CID" && "$TX_CID" != "null" ]]; then
  if [[ "$META_CID" != "$TX_CID" ]]; then
    echo "WARN: /meta chain.chain_id=$META_CID vs tx_hashes chain_id=$TX_CID" >&2
  fi
fi

# --- [4] internal curls evidence ---
echo ""
echo "[4] b435-evidence-internal-curls.example.sh -> $RUN_REL"
export B435_EVIDENCE_RUN_DIR="$RUN_REL"
export API_BASE_URL="$BASE"
bash "$ROOT/scripts/ops/b435-evidence-internal-curls.example.sh"

# --- [5] Summary ---
echo ""
echo "=== done ==="
ABS="$(cd "$ROOT/$RUN_REL" && pwd)"
echo "Evidence directory (relative): $RUN_REL"
echo "Evidence directory (absolute): $ABS"
echo "Files:"
ls -la "$ROOT/$RUN_REL"/*.json 2>/dev/null | sed 's/^/  /' || true
echo ""
echo "Next (full seal with ssot + optional broadcast):"
echo "  export B435_EVIDENCE_RUN_DIR=$RUN_REL"
echo "  export B435_FIRST_PAYMENT_TX=$FP"
echo "  bash scripts/ops/tt-testnet-fullstack-seal.sh"
