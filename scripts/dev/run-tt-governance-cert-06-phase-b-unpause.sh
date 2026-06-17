#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_06_PHASE_B_UNPAUSE — HAT-R1 unpause gate · ② only
#
#   bash scripts/dev/run-tt-governance-cert-06-phase-b-unpause.sh
#   bash scripts/dev/run-tt-governance-cert-06-phase-b-unpause.sh --finalize --signer "Sebastian Ward"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP=""
FINALIZE=0
SIGNER="${TTG_CERT_SIGNER:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --finalize) FINALIZE=1; shift ;;
    --signer) SIGNER="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "cert06: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_06: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-6-phase-b-unpause.sh"
python "$ROOT/scripts/dev/gen-cert6-phase-b-unpause-pack.py" --stamp "$STAMP"

if [[ "${CERT6_CAPTURE_EVIDENCE:-1}" == "1" ]]; then
  python "$ROOT/scripts/dev/capture-cert6-phase-b-unpause-evidence.py" --stamp "$STAMP" || {
    echo "TT_GOVERNANCE_CERT_06: WARN capture failed" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/unpause"
echo "TT_GOVERNANCE_CERT_06: PREP_OK"
echo "  Pack:   $EVID/CERT6-WALKTHROUGH-PACK.v1.json"
echo "  Flow:   $EVID/PHASE-B-UNPAUSE-FLOW-MAP.v1.json"
echo "  Machine $EVID/machine-checks/CERT6-MACHINE-CHECKS.json"

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert06: --finalize requires --signer" >&2; exit 2; }
  export HAT_R1_PHASE_B_PAUSED=0
  bash "$ROOT/scripts/dev/record-cert6-phase-b-unpause-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 6 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_06: FINALIZED cert=6 tier=OPS_DONE ids=5"
fi
