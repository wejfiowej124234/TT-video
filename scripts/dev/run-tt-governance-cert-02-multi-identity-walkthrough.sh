#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_02_MULTI_IDENTITY_WALKTHROUGH — launch (MTM 146 SSOT · ② only)
#
#   bash scripts/dev/run-tt-governance-cert-02-multi-identity-walkthrough.sh
#   bash scripts/dev/run-tt-governance-cert-02-multi-identity-walkthrough.sh --skip-api
#   bash scripts/dev/run-tt-governance-cert-02-multi-identity-walkthrough.sh --finalize --signer "Sebastian Ward"
#
# 禁止：新增功能 · GovFreeze 复审计 · 扩展 docs/spec
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
[[ -n "$STAMP" ]] || { echo "cert02: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

echo "TT_GOVERNANCE_CERT_02: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-2-multi-identity.sh"

ARGS=(python "$ROOT/scripts/dev/gen-cert2-multi-identity-walkthrough-pack.py" --stamp "$STAMP")
[[ "$SKIP_API" -eq 1 ]] && ARGS+=(--skip-api)
"${ARGS[@]}"

if [[ "${CERT2_CAPTURE_EVIDENCE:-1}" == "1" ]]; then
  python "$ROOT/scripts/dev/capture-cert2-multi-identity-walkthrough-evidence.py" --stamp "$STAMP" || {
    echo "TT_GOVERNANCE_CERT_02: WARN capture failed — add recordings manually" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/multi-identity"
echo "TT_GOVERNANCE_CERT_02: PREP_OK"
echo "  Pack:     $EVID/CERT2-WALKTHROUGH-PACK.v1.json"
echo "  Checklist $EVID/CERT2-OWNER-RECORDING-CHECKLIST.md"
echo "  Machine:  $EVID/machine-checks/CERT2-MACHINE-CHECKS.json"
echo ""
echo "Owner: 六角色录屏 → recordings/ · 截图 → screenshots/"
echo "Then: bash scripts/dev/record-cert2-multi-identity-walkthrough-signoff.sh --stamp ${STAMP} --signer \"<Owner>\""
echo "      bash scripts/dev/complete-ttg-cert-step.sh --cert 2 --stamp ${STAMP} --signer \"<Owner>\""

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert02: --finalize requires --signer" >&2; exit 2; }
  bash "$ROOT/scripts/dev/record-cert2-multi-identity-walkthrough-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 2 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_02: FINALIZED cert=2 tier=HUMAN_DONE ids=11"
fi
