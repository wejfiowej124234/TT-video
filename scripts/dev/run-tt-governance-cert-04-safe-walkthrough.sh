#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_04_SAFE_WALKTHROUGH — launch (GovFreeze V2 baseline · GORP evidence · ② only)
#
#   bash scripts/dev/run-tt-governance-cert-04-safe-walkthrough.sh
#   bash scripts/dev/run-tt-governance-cert-04-safe-walkthrough.sh --finalize --signer "Sebastian Ward"
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
[[ -n "$STAMP" ]] || { echo "cert04: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_04: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-4-safe-walkthrough.sh"

python "$ROOT/scripts/dev/gen-cert4-safe-walkthrough-pack.py" --stamp "$STAMP"

if [[ "${CERT4_CAPTURE_EVIDENCE:-1}" == "1" ]]; then
  python "$ROOT/scripts/dev/capture-cert4-safe-walkthrough-evidence.py" --stamp "$STAMP" || {
    echo "TT_GOVERNANCE_CERT_04: WARN capture failed — add recordings manually" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/safe"
echo "TT_GOVERNANCE_CERT_04: PREP_OK"
echo "  Pack:     $EVID/CERT4-WALKTHROUGH-PACK.v1.json"
echo "  Matrix:   $EVID/DUAL-TIMELOCK-OPS-MATRIX.v1.json"
echo "  Machine:  $EVID/machine-checks/CERT4-MACHINE-CHECKS.json"
echo ""
echo "Then: bash scripts/dev/record-cert4-safe-walkthrough-signoff.sh --stamp ${STAMP} --signer \"<Owner>\""
echo "      bash scripts/dev/complete-ttg-cert-step.sh --cert 4 --stamp ${STAMP} --signer \"<Owner>\""

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert04: --finalize requires --signer" >&2; exit 2; }
  bash "$ROOT/scripts/dev/record-cert4-safe-walkthrough-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 4 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_04: FINALIZED cert=4 tier=OPS_DONE ids=4"
fi
