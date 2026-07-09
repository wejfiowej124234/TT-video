#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_11_EMERGENCY_UNPAUSE — Phase B emergency unpause / recovery (② only)
#
#   bash scripts/dev/run-tt-governance-cert-11-emergency-unpause.sh --try-chain --stamp 20260616T100918Z
#   bash scripts/dev/run-tt-governance-cert-11-emergency-unpause.sh --try-chain --finalize --signer "Sebastian Ward"
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
[[ -n "$STAMP" ]] || { echo "cert11: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_11: START stamp=${STAMP} phase=②"

C10="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/emergency-pause/INCIDENT-TABLETOP-SIGNOFF.json"
[[ -f "$C10" ]] || {
  echo "TT_GOVERNANCE_CERT_11: PREP blocked — Cert #10 emergency pause signoff required" >&2
  exit 2
}

if [[ "$TRY_CHAIN" -eq 1 && "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]]; then
  echo "TT_GOVERNANCE_CERT_11: chain capture — use HAT R1 unpause / GORP walkthrough evidence"
fi

OUT="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/emergency-unpause"
mkdir -p "$OUT"

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert11: --signer required for finalize" >&2; exit 2; }
  node "$ROOT/scripts/dev/record-cert-signoff.cjs" \
    --out "$OUT/DR-DRILL-SIGNOFF.json" \
    --cert 11 \
    --signer "$SIGNER" \
    --verdict "TT_GOVERNANCE_CERT_11_EMERGENCY_UNPAUSE_PASS"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 11 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_11: FINALIZED cert=11 tier=DR_DONE"
fi

echo "TT_GOVERNANCE_CERT_11: PREP OK (finalize after recovery drill evidence)"
