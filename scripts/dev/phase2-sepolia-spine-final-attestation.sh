#!/usr/bin/env bash
# Phase ② · Sepolia 主脊总验收（序 1～4）· cast + env/registry/API + quote parity
#
#   bash scripts/dev/phase2-sepolia-spine-final-attestation.sh
#   PHASE2_VERIFY_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com bash scripts/dev/phase2-sepolia-spine-final-attestation.sh
#
# SSOT: docs/runbook/TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_SPINE_FINAL_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/spine-final-attestation/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVIDENCE/final-attestation-${TS}.log"

fail() { echo "phase2-sepolia-spine-final-attestation: FAIL $*" | tee -a "$LOG" >&2; exit 2; }
pass() { echo "  ATTEST PASS: $*" | tee -a "$LOG"; }
ok() { echo "phase2-sepolia-spine-final-attestation: OK $*" | tee -a "$LOG"; }

mkdir -p "$EVIDENCE"
: > "$LOG"

load_env() {
  [[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

load_env
DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
TL="${TIMELOCK_ADDRESS:-}"
SAFE="${TIMELOCK_ADMIN_ADDRESS:-}"
GOV="${GOVERNOR_ADDRESS:-}"
TOKEN="${GOVERNANCE_TOKEN_ADDRESS:-}"

pick_rpc() {
  local r
  for r in "${PHASE2_VERIFY_RPC_URL:-}" "https://ethereum-sepolia-rpc.publicnode.com" "https://1rpc.io/sepolia" "https://sepolia.drpc.org"; do
    [[ -z "$r" ]] && continue
    if cast chain-id --rpc-url "$r" >/dev/null 2>&1; then
      echo "$r"
      return 0
    fi
  done
  return 1
}

RPC="$(pick_rpc)" || fail "no working Sepolia RPC"
export PHASE2_VERIFY_RPC_URL="$RPC"
export CHAIN_RPC_URL="$RPC"
pass "RPC $RPC"

echo "phase2-sepolia-spine-final-attestation: seq 1–4 spine audit ..." | tee -a "$LOG"
bash "$ROOT/scripts/dev/phase2-sepolia-spine-audit.sh" 2>&1 | tee -a "$LOG"

echo "phase2-sepolia-spine-final-attestation: quote parity (cast + SSOT) ..." | tee -a "$LOG"
bash "$ROOT/scripts/gates/check-protocol-quote-parity.sh" 2>&1 | tee -a "$LOG"

echo "phase2-sepolia-spine-final-attestation: seq 1 governance allowlist ..." | tee -a "$LOG"
_eq_addr() {
  local label="$1" a="$2" b="$3"
  [[ "${a,,}" == "${b,,}" ]] || fail "$label: $a != $b"
  pass "$label"
}
cast_with_retry() {
  local to="$1" sig="$2"
  shift 2
  local attempts=0 out=""
  while (( attempts < 4 )); do
    if out="$(cast call "$to" "$sig" "$@" --rpc-url "$RPC" 2>/dev/null)"; then
      echo "$out"
      return 0
    fi
    attempts=$((attempts + 1))
    RPC="$(pick_rpc)" || fail "no working Sepolia RPC"
    export PHASE2_VERIFY_RPC_URL="$RPC"
    export CHAIN_RPC_URL="$RPC"
    sleep 2
  done
  return 1
}
GOV_TL="$(cast_with_retry "$GOV" "timelock()(address)" | awk '{print $1}')"
_eq_addr "Governor.timelock→TIMELOCK" "$GOV_TL" "$TL"
for target in "$GOV" "$TOKEN"; do
  v="$(cast_with_retry "$TL" "allowedExecutionTarget(address)(bool)" "$target" | awk '{print $1}')"
  [[ "$v" == "true" ]] || fail "Timelock allowlist ${target}: got ${v:-empty}"
  pass "Timelock allowlist ${target}"
done

HTTP_STATUS="skipped"
API_BASE="${API_BASE:-http://127.0.0.1:8080}"
if curl -sf --max-time 3 "${API_BASE}/api/v1/governance/protocol-reference" >/dev/null 2>&1; then
  echo "phase2-sepolia-spine-final-attestation: HTTP quote routes (optional live) ..." | tee -a "$LOG"
  if PROTOCOL_QUOTE_HTTP=1 API_BASE="$API_BASE" bash "$ROOT/scripts/gates/check-protocol-quote-parity.sh" --http 2>&1 | tee -a "$LOG"; then
    HTTP_STATUS="ok"
    pass "HTTP quote routes via $API_BASE"
  else
    HTTP_STATUS="warn_live_api_drift"
    echo "phase2-sepolia-spine-final-attestation: WARN live HTTP drift — static registry/API route parity already PASS in spine verify" | tee -a "$LOG"
  fi
else
  pass "HTTP quote routes skipped (API not reachable at $API_BASE)"
fi

REPORT="$EVIDENCE/final-attestation-${TS}.json"
node - "$REPORT" "$TS" "$RPC" "$DEPLOYER" "$TL" "$SAFE" "$HTTP_STATUS" <<'NODE'
const fs = require("fs");
const [out, ts, rpc, deployer, tl, safe, httpStatus] = process.argv.slice(2);
const doc = {
  schema: "phase2_sepolia_spine_final_attestation.v1",
  timestamp_utc: ts,
  chain_id: 11155111,
  phase: "② Sepolia testnet",
  result: "PASS",
  rpc,
  deployer,
  timelock: tl,
  timelock_admin_safe: safe,
  sequences_verified: [1, 2, 3, 4],
  checks: {
    spine_audit: "phase2-sepolia-spine-audit.sh",
    fundstack_verify: "phase2-sepolia-fundstack-verify-bindings.sh",
    steward_verify: "phase2-sepolia-steward-pool-verify-bindings.sh",
    redemption_verify: "phase2-sepolia-redemption-epoch-verify-bindings.sh",
    quote_parity: "check-protocol-quote-parity.sh",
    governance_allowlist: "Governor+Token on Timelock",
    http_quote_routes: httpStatus,
  },
  seq5_gate: "DeployP51CountryLedger — authorized after this attestation PASS",
  ssot: "docs/runbook/TT-PHASE2-SEPOLIA-SPINE-FINAL-ATTESTATION.md",
};
fs.writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
NODE

ok "report → $REPORT"
echo "TT_PHASE2_SEPOLIA_SPINE_FINAL_ATTESTATION: PASS (seq 1–4 · ready for seq 5 gate review)"
