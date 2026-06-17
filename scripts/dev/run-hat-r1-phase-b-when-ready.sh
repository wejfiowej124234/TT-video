#!/usr/bin/env bash
# HAT-R1 Phase B · wait for 48h Timelock → Execute → Treasury → Unstake + optional concentration audit
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_BROWSER_ACCEPT_OK=1
#   bash scripts/dev/run-hat-r1-phase-b-when-ready.sh
#
#   bash scripts/dev/run-hat-r1-phase-b-when-ready.sh --run-concentration-audit
#   bash scripts/dev/run-hat-r1-phase-b-when-ready.sh --dry-run
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

HAT_EVID="$(hat_r1_resolve_evid_dir "$ROOT")"
DRY=0
RUN_AUDIT=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY=1 ;;
    --run-concentration-audit) RUN_AUDIT=1 ;;
  esac
done

[[ -f "$HAT_EVID/EXECUTE_EARLIEST_UNIX.txt" ]] || {
  echo "HAT_R1_PHASE_B: FAIL missing $HAT_EVID/EXECUTE_EARLIEST_UNIX.txt — run Phase A first" >&2
  exit 2
}

if [[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "1" ]]; then
  echo "HAT_R1_PHASE_B: PAUSED — GovFreeze V2 acceptance-only window" >&2
  echo "  1) bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh" >&2
  echo "  2) record screen + bash scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh" >&2
  echo "  3) export HAT_R1_PHASE_B_PAUSED=0  # Owner after human UAT + Timelock ready" >&2
  echo "  docs/runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md" >&2
  echo "TT_HAT_R1_PHASE_B_SUMMARY: PAUSED_HUMAN_UAT" >&2
  [[ "$DRY" == "1" ]] && exit 0
  exit 4
fi

ETA="$(cat "$HAT_EVID/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
NOW="$(date +%s)"
REMAIN=$((ETA - NOW))

if [[ "$REMAIN" -gt 0 ]]; then
  HUMAN="$(python -c "s=$REMAIN; print(f'{s//86400}d {(s%86400)//3600}h {(s%3600)//60}m')")"
  echo "HAT_R1_PHASE_B: WAIT timelock not elapsed remaining=${REMAIN}s (~${HUMAN}) execute_earliest_unix=${ETA}"
  echo "TT_HAT_R1_PHASE_B_SUMMARY: WAIT_TIMelock"
  echo "HAT_R1_PHASE_B_NOTE: human screen acceptance while waiting — bash scripts/dev/run-govfreeze-v2-human-screen-acceptance-prep.sh"
  if [[ "$RUN_AUDIT" == "1" ]]; then
    bash "$ROOT/scripts/dev/run-governance-concentration-audit-sepolia.sh"
  fi
  exit 0
fi

if [[ "${HAT_R1_SKIP_ENTERPRISE_HAT:-0}" != "1" ]]; then
  if [[ "${TT_GOVERNANCE_ENTERPRISE_HAT_OK:-}" != "1" ]]; then
    echo "HAT_R1_PHASE_B: BLOCKED — TT_GOVERNANCE_ENTERPRISE_HAT required before Phase B" >&2
    echo "  bash scripts/dev/run-tt-governance-enterprise-hat-review.sh" >&2
    echo "  bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --all-pass" >&2
    echo "  export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1" >&2
    echo "TT_HAT_R1_PHASE_B_SUMMARY: BLOCKED_ENTERPRISE_HAT" >&2
    exit 3
  fi
  bash "$ROOT/scripts/dev/assert-tt-governance-enterprise-hat-pass.sh" >>/dev/null 2>&1 || {
    echo "HAT_R1_PHASE_B: BLOCKED — Enterprise HAT signoff incomplete" >&2
    exit 3
  }
fi

echo "HAT_R1_PHASE_B: Timelock elapsed — starting Phase B evidence=${HAT_EVID}"
[[ "$DRY" == "1" ]] && { echo "TT_HAT_R1_PHASE_B_SUMMARY: DRY_RUN_READY"; exit 0; }

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "HAT_R1_PHASE_B: set HAT_R1_LIVE_WALLET_OK=1" >&2
  exit 2
}

export HAT_R1_EVID_DIR="$HAT_EVID"
export HAT_R1_PHASE_A_PAUSED=0
bash "$ROOT/scripts/dev/run-hat-r1-sepolia-live-wallet.sh" --phase b

if [[ "$RUN_AUDIT" == "1" ]] || [[ "${HAT_R1_RUN_CONCENTRATION_AUDIT:-1}" == "1" ]]; then
  bash "$ROOT/scripts/dev/run-governance-concentration-audit-sepolia.sh" || true
fi

echo "TT_HAT_R1_PHASE_B_SUMMARY: PASS phase=b"
