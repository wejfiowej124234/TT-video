#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_03_ADMIN_WALKTHROUGH — launch (RBAC-GAP-LIST=0 · ② only)
#
#   bash scripts/dev/run-tt-governance-cert-03-admin-walkthrough.sh
#   bash scripts/dev/run-tt-governance-cert-03-admin-walkthrough.sh --skip-api
#   bash scripts/dev/run-tt-governance-cert-03-admin-walkthrough.sh --finalize --signer "Sebastian Ward"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP=""
SKIP_API=0
FINALIZE=0
SIGNER="${TTG_CERT_SIGNER:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --skip-api) SKIP_API=1; shift ;;
    --finalize) FINALIZE=1; shift ;;
    --signer) SIGNER="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "cert03: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_03: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-3-admin-walkthrough.sh"

ARGS=(python "$ROOT/scripts/dev/gen-cert3-admin-walkthrough-pack.py" --stamp "$STAMP")
[[ "$SKIP_API" -eq 1 ]] && ARGS+=(--skip-api)
"${ARGS[@]}"

if [[ "${CERT3_CAPTURE_EVIDENCE:-1}" == "1" ]]; then
  python "$ROOT/scripts/dev/capture-cert3-admin-walkthrough-evidence.py" --stamp "$STAMP" || {
    echo "TT_GOVERNANCE_CERT_03: WARN capture failed — add recordings manually" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/admin"
echo "TT_GOVERNANCE_CERT_03: PREP_OK"
echo "  Pack:     $EVID/CERT3-WALKTHROUGH-PACK.v1.json"
echo "  Machine:  $EVID/machine-checks/CERT3-MACHINE-CHECKS.json"
echo ""
echo "Then: bash scripts/dev/record-cert3-admin-walkthrough-signoff.sh --stamp ${STAMP} --signer \"<Owner>\""
echo "      bash scripts/dev/complete-ttg-cert-step.sh --cert 3 --stamp ${STAMP} --signer \"<Owner>\""

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert03: --finalize requires --signer" >&2; exit 2; }
  bash "$ROOT/scripts/dev/record-cert3-admin-walkthrough-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 3 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_03: FINALIZED cert=3 tier=HUMAN_DONE ids=10"
fi
