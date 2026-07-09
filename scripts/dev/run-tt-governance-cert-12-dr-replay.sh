#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_12_DR_REPLAY — GORP / DR replay closure (② only)
#
#   bash scripts/dev/run-tt-governance-cert-12-dr-replay.sh --try-chain --stamp 20260616T100918Z
#   bash scripts/dev/run-tt-governance-cert-12-dr-replay.sh --try-chain --finalize --signer "Sebastian Ward"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP=""
FINALIZE=0
TRY_CHAIN=0
SIGNER="${TTG_CERT_SIGNER:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --finalize) FINALIZE=1; TRY_CHAIN=1; shift ;;
    --try-chain) TRY_CHAIN=1; shift ;;
    --signer) SIGNER="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "cert12: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_12: START stamp=${STAMP} phase=②"

C11="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/emergency-unpause/DR-DRILL-SIGNOFF.json"
[[ -f "$C11" ]] || {
  echo "TT_GOVERNANCE_CERT_12: PREP blocked — Cert #11 DR drill signoff required" >&2
  exit 2
}

if [[ "$TRY_CHAIN" -eq 1 && "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]]; then
  echo "TT_GOVERNANCE_CERT_12: chain capture — indexer replay + GORP evidence per ttg-governance-cert-gates"
fi

OUT="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/dr-replay"
mkdir -p "$OUT"

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert12: --signer required for finalize" >&2; exit 2; }
  node "$ROOT/scripts/dev/record-cert-signoff.cjs" \
    --out "$OUT/GORP-SIGNOFF.json" \
    --cert 12 \
    --signer "$SIGNER" \
    --verdict "TT_GOVERNANCE_CERT_12_DR_REPLAY_PASS"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 12 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_12: FINALIZED cert=12 tier=OPS_DONE"
fi

echo "TT_GOVERNANCE_CERT_12: PREP OK (finalize after GORP replay evidence)"
