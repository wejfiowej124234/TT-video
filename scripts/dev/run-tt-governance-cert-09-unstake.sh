#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_09_UNSTAKE — Phase B Region Steward requestRelease (② only)
#
#   bash scripts/dev/run-tt-governance-cert-09-unstake.sh --try-chain --stamp 20260616T100918Z
#   bash scripts/dev/run-tt-governance-cert-09-unstake.sh --try-chain --finalize --signer "Sebastian Ward"
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
[[ -n "$STAMP" ]] || { echo "cert09: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

export HAT_R1_PHASE_B_PAUSED="${HAT_R1_PHASE_B_PAUSED:-0}"

echo "TT_GOVERNANCE_CERT_09: START stamp=${STAMP} phase=②"

C8="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/treasury-spend/PHASE-B-TREASURY-SPEND-SIGNOFF.json"
[[ -f "$C8" ]] || {
  echo "TT_GOVERNANCE_CERT_09: PREP blocked — Cert #8 treasury spend signoff required" >&2
  exit 2
}

if [[ "$TRY_CHAIN" -eq 1 && "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]]; then
  bash "$ROOT/scripts/dev/run-cert9-hat-r1-unstake-evidence.sh" || {
    echo "TT_GOVERNANCE_CERT_09: WARN unstake chain capture failed" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/unstake"
mkdir -p "$EVID"/{recordings,screenshots,machine-checks}
echo "TT_GOVERNANCE_CERT_09: PREP_OK evid=$EVID"

if [[ "$FINALIZE" -eq 1 ]]; then
  # shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
  source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
  [[ -n "$SIGNER" ]] || { echo "cert09: --finalize requires --signer" >&2; exit 2; }
  [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
    echo "cert09: --finalize requires HAT_R1_LIVE_WALLET_OK=1" >&2
    exit 2
  }
  [[ -f "$(hat_r1_resolve_evid_dir "$ROOT")/step-10-unstake/exit-read.json" ]] || {
    echo "cert09: --finalize requires step-10-unstake evidence" >&2
    exit 2
  }
  python "$ROOT/scripts/dev/record-cert9-unstake-signoff.py" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 9 --stamp "$STAMP" --signer "$SIGNER"
  node "$ROOT/scripts/dev/gen-ttg-cert-production-evidence-index.cjs"
  echo "TT_GOVERNANCE_CERT_09: FINALIZED cert=9 tier=OPS_DONE"
fi
