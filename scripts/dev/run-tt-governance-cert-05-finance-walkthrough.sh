#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_05_FINANCE_WALKTHROUGH — launch (Four-Ledger + cutover + HAT-R1 · ② only)
#
#   bash scripts/dev/run-tt-governance-cert-05-finance-walkthrough.sh
#   bash scripts/dev/run-tt-governance-cert-05-finance-walkthrough.sh --finalize --signer "Sebastian Ward"
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
[[ -n "$STAMP" ]] || { echo "cert05: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_05: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-5-finance-walkthrough.sh"
python "$ROOT/scripts/dev/gen-cert5-finance-walkthrough-pack.py" --stamp "$STAMP"

if [[ "${CERT5_CAPTURE_EVIDENCE:-1}" == "1" ]]; then
  python "$ROOT/scripts/dev/capture-cert5-finance-walkthrough-evidence.py" --stamp "$STAMP" || {
    echo "TT_GOVERNANCE_CERT_05: WARN capture failed" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/finance"
echo "TT_GOVERNANCE_CERT_05: PREP_OK"
echo "  Pack:   $EVID/CERT5-WALKTHROUGH-PACK.v1.json"
echo "  Flow:   $EVID/FINANCE-OPS-FLOW-MAP.v1.json"
echo "  Machine $EVID/machine-checks/CERT5-MACHINE-CHECKS.json"

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert05: --finalize requires --signer" >&2; exit 2; }
  bash "$ROOT/scripts/dev/record-cert5-finance-walkthrough-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 5 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_05: FINALIZED cert=5 tier=OPS_DONE ids=4"
fi
