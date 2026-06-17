#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_08_TREASURY_SPEND — Phase B Treasury spend (② only)
#
#   bash scripts/dev/run-tt-governance-cert-08-treasury-spend.sh
#   bash scripts/dev/run-tt-governance-cert-08-treasury-spend.sh --try-chain --finalize --signer "Sebastian Ward"  # Wave 2 · TL#2 后
#   bash scripts/dev/run-tt-governance-cert-08-treasury-spend.sh --try-chain --queue-only   # Wave 1 · TL#2 前
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP=""
FINALIZE=0
TRY_CHAIN=0
QUEUE_ONLY=0
SIGNER="${TTG_CERT_SIGNER:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --finalize) FINALIZE=1; TRY_CHAIN=1; shift ;;
    --try-chain) TRY_CHAIN=1; shift ;;
    --queue-only) QUEUE_ONLY=1; TRY_CHAIN=1; shift ;;
    --signer) SIGNER="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ "$QUEUE_ONLY" -eq 1 && "$FINALIZE" -eq 1 ]] && {
  echo "cert08: --queue-only and --finalize are mutually exclusive (Wave 1 vs Wave 2)" >&2
  exit 2
}

[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "cert08: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

export HAT_R1_PHASE_B_PAUSED="${HAT_R1_PHASE_B_PAUSED:-0}"

echo "TT_GOVERNANCE_CERT_08: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-8-treasury-spend.sh" || {
  echo "TT_GOVERNANCE_CERT_08: PREP blocked — Cert #7 execute required" >&2
  exit 2
}

if [[ "$TRY_CHAIN" -eq 1 && "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]]; then
  [[ "$QUEUE_ONLY" -eq 1 ]] && export HAT_R1_TREASURY_QUEUE_ONLY=1
  bash "$ROOT/scripts/dev/run-cert8-hat-r1-treasury-evidence.sh" || {
    echo "TT_GOVERNANCE_CERT_08: WARN treasury chain capture failed" >&2
  }
  unset HAT_R1_TREASURY_QUEUE_ONLY 2>/dev/null || true
fi

python "$ROOT/scripts/dev/gen-cert8-treasury-spend-pack.py" --stamp "$STAMP" --allow-prep-fail || {
  if [[ "$FINALIZE" -eq 1 ]]; then
    echo "TT_GOVERNANCE_CERT_08: FAIL machine gates — cannot finalize" >&2
    exit 3
  fi
  echo "TT_GOVERNANCE_CERT_08: PREP machine=FAIL (2nd Timelock / execute pending)"
}

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/treasury-spend"
echo "TT_GOVERNANCE_CERT_08: PREP_OK pack=$EVID/CERT8-WALKTHROUGH-PACK.v1.json"

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ "${HAT_R1_ALLOW_SPEND_EXECUTE:-0}" == "1" ]] || {
    echo "cert08: --finalize requires Wave 2 (HAT_R1_ALLOW_SPEND_EXECUTE=1) after TL#2 spend execute" >&2
    exit 2
  }
  [[ -n "$SIGNER" ]] || { echo "cert08: --finalize requires --signer" >&2; exit 2; }
  [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
    echo "cert08: --finalize requires HAT_R1_LIVE_WALLET_OK=1" >&2
    exit 2
  }
  bash "$ROOT/scripts/dev/record-cert8-treasury-spend-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 8 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_08: FINALIZED cert=8 tier=OPS_DONE ids=4"
fi
