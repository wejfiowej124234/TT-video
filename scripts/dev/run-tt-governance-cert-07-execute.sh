#!/usr/bin/env bash
# TT_GOVERNANCE_CERT_07_EXECUTE — Governor queue→Timelock execute (② only)
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_PHASE_B_PAUSED=0
#   bash scripts/dev/run-tt-governance-cert-07-execute.sh --try-execute
#   bash scripts/dev/run-tt-governance-cert-07-execute.sh --finalize --signer "Sebastian Ward"
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

STAMP=""
FINALIZE=0
TRY_EXECUTE=0
SIGNER="${TTG_CERT_SIGNER:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --stamp) STAMP="$2"; shift 2 ;;
    --finalize) FINALIZE=1; shift ;;
    --try-execute) TRY_EXECUTE=1; shift ;;
    --signer) SIGNER="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$STAMP" ]] || STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || { echo "cert07: run init-ttg-cert-execution-session.sh first" >&2; exit 2; }

export HAT_R1_PHASE_B_PAUSED="${HAT_R1_PHASE_B_PAUSED:-0}"
[[ "${HAT_R1_FORCE_EXECUTE:-0}" == "0" ]] || {
  echo "cert07: FAIL HAT_R1_FORCE_EXECUTE forbidden" >&2
  exit 2
}

echo "TT_GOVERNANCE_CERT_07: START stamp=${STAMP} phase=②"

bash "$ROOT/scripts/dev/enter-ttg-cert-7-execute.sh"

ETA="$(cat "$HAT_R1_ROOT"/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
NOW="$(date +%s)"

if [[ "$TRY_EXECUTE" -eq 1 || "$FINALIZE" -eq 1 ]]; then
  if [[ "$NOW" -ge "$ETA" && "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]]; then
    echo "TT_GOVERNANCE_CERT_07: attempting on-chain execute evidence"
    bash "$ROOT/scripts/dev/run-cert7-hat-r1-execute-evidence.sh" || {
      echo "TT_GOVERNANCE_CERT_07: WARN execute evidence capture failed" >&2
    }
  elif [[ "$NOW" -lt "$ETA" ]]; then
    echo "TT_GOVERNANCE_CERT_07: BLOCKED Timelock not elapsed remaining=$((ETA-NOW))s"
  else
    echo "TT_GOVERNANCE_CERT_07: BLOCKED set HAT_R1_LIVE_WALLET_OK=1 for on-chain execute"
  fi
fi

python "$ROOT/scripts/dev/gen-cert7-execute-pack.py" --stamp "$STAMP" || {
  if [[ "$FINALIZE" -eq 1 ]]; then
    echo "TT_GOVERNANCE_CERT_07: FAIL machine gates — cannot finalize" >&2
    exit 3
  fi
  echo "TT_GOVERNANCE_CERT_07: PREP machine=FAIL (Timelock/execute evidence pending)"
}

if [[ "${CERT7_CAPTURE_EVIDENCE:-1}" == "1" ]]; then
  python "$ROOT/scripts/dev/capture-cert7-execute-evidence.py" --stamp "$STAMP" || {
    echo "TT_GOVERNANCE_CERT_07: WARN capture failed" >&2
  }
fi

EVID="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/execute"
echo "TT_GOVERNANCE_CERT_07: PREP_OK"
echo "  Pack:   $EVID/CERT7-WALKTHROUGH-PACK.v1.json"
echo "  Flow:   $EVID/EXECUTE-FLOW-MAP.v1.json"
echo "  HAT:    ${HAT_R1_ROOT#"$ROOT"/}/step-07-execute/"
echo "  ETA:    execute_earliest_unix=${ETA} elapsed=$([[ "$NOW" -ge "$ETA" ]] && echo yes || echo no)"

if [[ "$FINALIZE" -eq 1 ]]; then
  [[ -n "$SIGNER" ]] || { echo "cert07: --finalize requires --signer" >&2; exit 2; }
  [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
    echo "cert07: --finalize requires HAT_R1_LIVE_WALLET_OK=1" >&2
    exit 2
  }
  [[ "$NOW" -ge "$ETA" ]] || {
    echo "cert07: --finalize requires Timelock elapsed (ETA=${ETA})" >&2
    exit 3
  }
  bash "$ROOT/scripts/dev/record-cert7-execute-signoff.sh" --stamp "$STAMP" --signer "$SIGNER"
  bash "$ROOT/scripts/dev/complete-ttg-cert-step.sh" --cert 7 --stamp "$STAMP" --signer "$SIGNER"
  echo "TT_GOVERNANCE_CERT_07: FINALIZED cert=7 tier=OPS_DONE ids=5"
fi
