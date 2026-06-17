#!/usr/bin/env bash
# Complete one §14 certification step — validate evidence, write tier overrides, refresh MTM
#
# Cert #1 (after Owner recordings):
#   bash scripts/dev/complete-ttg-cert-step.sh --cert 1 --stamp <stamp> --signer "Sebastian Ward"
#
# Cert #1 uses existing human signoff script when human-uat evidence present.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

CERT=""
STAMP=""
SIGNER="${TTG_CERT_SIGNER:-}"
EVID=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cert) CERT="$2"; shift 2 ;;
    --stamp) STAMP="$2"; shift 2 ;;
    --signer) SIGNER="$2"; shift 2 ;;
    --evidence-dir) EVID="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ -n "$CERT" && "$CERT" =~ ^[0-9]+$ && "$CERT" -ge 1 && "$CERT" -le 12 ]] || {
  echo "complete-cert: --cert 1..12 required" >&2
  exit 2
}

if [[ -z "$STAMP" ]]; then
  STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
fi
[[ -n "$STAMP" ]] || { echo "complete-cert: --stamp required" >&2; exit 2; }

EVID="${EVID:-evidence/GO_ttg_cert/${STAMP}}"
[[ -d "$ROOT/$EVID" ]] || { echo "complete-cert: missing $EVID" >&2; exit 2; }

LEDGER="$ROOT/$EVID/CERT-EXECUTION-LEDGER.v1.json"
[[ -f "$LEDGER" ]] || { echo "complete-cert: missing ledger — run init-ttg-cert-execution-session.sh" >&2; exit 2; }

OVERRIDES="$ROOT/docs/spec/governance-token/artifacts/ttg-governance-tier-overrides.v1.json"

# Cert-specific evidence gates (minimal — no fake pass)
case "$CERT" in
  1)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #1" >&2; exit 2; }
    AI_STAMP="$(cat "$ROOT/evidence/GO_ai_pre_human_uat/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
    AI_PASS="$ROOT/evidence/GO_ai_pre_human_uat/${AI_STAMP}/AI-PRE-HUMAN-UAT-PASS.json"
    if [[ ! -f "$AI_PASS" ]]; then
      echo "complete-cert: FAIL cert #1 — run bash scripts/dev/run-ai-pre-human-uat-check.sh first" >&2
      exit 3
    fi
    AI_VERDICT="$(python -c "import json; print(json.load(open('$AI_PASS'))['verdict'])")"
    [[ "$AI_VERDICT" == "PASS" ]] || {
      echo "complete-cert: FAIL cert #1 — AI_PRE_HUMAN_UAT=${AI_VERDICT} (need PASS before human signoff)" >&2
      exit 3
    }
    HUAT="$EVID/human-uat"
    mkdir -p "$ROOT/$HUAT/recordings" "$ROOT/$HUAT/screenshots"
    REC_COUNT="$(find "$ROOT/$HUAT/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #1 — no recordings in $HUAT/recordings/" >&2
      echo "  Owner must add A1–D4 screen recordings before signoff." >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-govfreeze-v2-human-screen-acceptance.sh" \
      --evidence-dir "$HUAT" \
      --signer "$SIGNER"
    ;;
  2)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #2" >&2; exit 2; }
    MI="$EVID/walkthrough/multi-identity"
    PACK="$ROOT/$MI/CERT2-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #2 — run run-tt-governance-cert-02-multi-identity-walkthrough.sh first" >&2
      exit 3
    }
    mkdir -p "$ROOT/$MI/recordings" "$ROOT/$MI/screenshots"
    REC_COUNT="$(find "$ROOT/$MI/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #2 — no recordings in $MI/recordings/" >&2
      echo "  Owner must add B1–B4 six-role walkthrough recordings before signoff." >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert2-multi-identity-walkthrough-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  3)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #3" >&2; exit 2; }
    AD="$EVID/walkthrough/admin"
    PACK="$ROOT/$AD/CERT3-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #3 — run run-tt-governance-cert-03-admin-walkthrough.sh first" >&2
      exit 3
    }
    RBAC_STAMP="$(python - <<'PY'
from pathlib import Path
print(Path("evidence/GO_admin_rbac_alignment/latest-stamp.txt").read_text(encoding="utf-8").strip())
PY
)"
    GAP="evidence/GO_admin_rbac_alignment/${RBAC_STAMP}/RBAC-GAP-LIST.v1.json"
    [[ -f "$ROOT/$GAP" ]] || {
      echo "complete-cert: FAIL cert #3 — missing RBAC-GAP-LIST" >&2
      exit 3
    }
    HANDLERS_GAP="$(python - <<PY
import json
from pathlib import Path
p = Path("$GAP")
print(json.loads(p.read_text(encoding="utf-8"))["handlers_gap"])
PY
)"
    [[ "$HANDLERS_GAP" == "0" ]] || {
      echo "complete-cert: FAIL cert #3 — RBAC-GAP-LIST handlers_gap=$HANDLERS_GAP" >&2
      exit 3
    }
    mkdir -p "$ROOT/$AD/recordings" "$ROOT/$AD/screenshots"
    REC_COUNT="$(find "$ROOT/$AD/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #3 — no recordings in $AD/recordings/" >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert3-admin-walkthrough-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  4)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #4" >&2; exit 2; }
    SF="$EVID/walkthrough/safe"
    PACK="$ROOT/$SF/CERT4-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #4 — run run-tt-governance-cert-04-safe-walkthrough.sh first" >&2
      exit 3
    }
    C3="$ROOT/$EVID/walkthrough/admin/ADMIN-WALKTHROUGH-SIGNOFF.json"
    [[ -f "$C3" ]] || {
      echo "complete-cert: FAIL cert #4 — Cert #3 signoff required" >&2
      exit 3
    }
    mkdir -p "$ROOT/$SF/recordings" "$ROOT/$SF/screenshots"
    REC_COUNT="$(find "$ROOT/$SF/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #4 — no recordings in $SF/recordings/" >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert4-safe-walkthrough-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  5)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #5" >&2; exit 2; }
    FF="$EVID/walkthrough/finance"
    PACK="$ROOT/$FF/CERT5-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #5 — run run-tt-governance-cert-05-finance-walkthrough.sh first" >&2
      exit 3
    }
    C4="$ROOT/$EVID/walkthrough/safe/SAFE-WALKTHROUGH-SIGNOFF.json"
    [[ -f "$C4" ]] || { echo "complete-cert: FAIL cert #5 — Cert #4 required" >&2; exit 3; }
    FL="$ROOT/evidence/GO_tt_country_pool_revenue_enterprise_hat/20260616T084248Z/four-ledger-reconcile.json"
    [[ -f "$FL" ]] || { echo "complete-cert: FAIL cert #5 — missing four-ledger evidence" >&2; exit 3; }
    mkdir -p "$ROOT/$FF/recordings" "$ROOT/$FF/screenshots"
    REC_COUNT="$(find "$ROOT/$FF/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #5 — no recordings in $FF/recordings/" >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert5-finance-walkthrough-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  6)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #6" >&2; exit 2; }
    PB="$EVID/phase-b/unpause"
    PACK="$ROOT/$PB/CERT6-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #6 — run run-tt-governance-cert-06-phase-b-unpause.sh first" >&2
      exit 3
    }
    C5="$ROOT/$EVID/walkthrough/finance/FINANCE-WALKTHROUGH-SIGNOFF.json"
    [[ -f "$C5" ]] || { echo "complete-cert: FAIL cert #6 — Cert #5 required" >&2; exit 3; }
    HAT="$HAT_R1_ROOT/EXECUTE_EARLIEST_UNIX.txt"
    [[ -f "$HAT" ]] || { echo "complete-cert: FAIL cert #6 — missing HAT-R1 Phase A ETA" >&2; exit 3; }
    mkdir -p "$ROOT/$PB/recordings" "$ROOT/$PB/screenshots"
    REC_COUNT="$(find "$ROOT/$PB/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #6 — no recordings in $PB/recordings/" >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert6-phase-b-unpause-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  7)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #7" >&2; exit 2; }
    EX="$EVID/phase-b/execute"
    PACK="$ROOT/$EX/CERT7-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #7 — run run-tt-governance-cert-07-execute.sh first" >&2
      exit 3
    }
    C6="$ROOT/$EVID/phase-b/unpause/PHASE-B-UNPAUSE-SIGNOFF.json"
    [[ -f "$C6" ]] || { echo "complete-cert: FAIL cert #7 — Cert #6 required" >&2; exit 3; }
    HAT_EXEC="$HAT_R1_ROOT/step-07-execute/tx-execute.json"
    [[ -f "$HAT_EXEC" ]] || {
      echo "complete-cert: FAIL cert #7 — missing HAT-R1 step-07-execute tx evidence" >&2
      exit 3
    }
    ETA="$(cat "$HAT_R1_ROOT/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
    NOW="$(date +%s)"
    [[ "$NOW" -ge "$ETA" ]] || {
      echo "complete-cert: FAIL cert #7 — Timelock not elapsed (ETA=${ETA})" >&2
      exit 3
    }
    [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
      echo "complete-cert: FAIL cert #7 — HAT_R1_LIVE_WALLET_OK=1 required" >&2
      exit 3
    }
    [[ "${HAT_R1_FORCE_EXECUTE:-0}" == "0" ]] || {
      echo "complete-cert: FAIL cert #7 — HAT_R1_FORCE_EXECUTE forbidden" >&2
      exit 3
    }
    mkdir -p "$ROOT/$EX/recordings" "$ROOT/$EX/screenshots"
    REC_COUNT="$(find "$ROOT/$EX/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #7 — no recordings in $EX/recordings/" >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert7-execute-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  8)
    [[ -n "$SIGNER" ]] || { echo "complete-cert: --signer required for cert #8" >&2; exit 2; }
    TS="$EVID/phase-b/treasury-spend"
    PACK="$ROOT/$TS/CERT8-WALKTHROUGH-PACK.v1.json"
    [[ -f "$PACK" ]] || {
      echo "complete-cert: FAIL cert #8 — run run-tt-governance-cert-08-treasury-spend.sh first" >&2
      exit 3
    }
    C7="$ROOT/$EVID/phase-b/execute/PHASE-B-EXECUTE-SIGNOFF.json"
    [[ -f "$C7" ]] || { echo "complete-cert: FAIL cert #8 — Cert #7 required" >&2; exit 3; }
    HAT_SPEND="$HAT_R1_ROOT/step-10-treasury-execute/tx-execute.json"
    [[ -f "$HAT_SPEND" ]] || {
      echo "complete-cert: FAIL cert #8 — missing treasury spend execute tx" >&2
      exit 3
    }
    T_ETA="$(cat "$HAT_R1_ROOT/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
    NOW="$(date +%s)"
    [[ "$NOW" -ge "$T_ETA" ]] || {
      echo "complete-cert: FAIL cert #8 — 2nd Timelock not elapsed (ETA=${T_ETA})" >&2
      exit 3
    }
    [[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
      echo "complete-cert: FAIL cert #8 — HAT_R1_LIVE_WALLET_OK=1 required" >&2
      exit 3
    }
    mkdir -p "$ROOT/$TS/recordings" "$ROOT/$TS/screenshots"
    REC_COUNT="$(find "$ROOT/$TS/recordings" -type f 2>/dev/null | wc -l | tr -d ' ')"
    [[ "$REC_COUNT" -ge 1 ]] || {
      echo "complete-cert: FAIL cert #8 — no recordings in $TS/recordings/" >&2
      exit 3
    }
    bash "$ROOT/scripts/dev/record-cert8-treasury-spend-signoff.sh" \
      --stamp "$STAMP" \
      --signer "$SIGNER"
    ;;
  *)
    SUBDIR="$(python -c "import importlib.util as u, pathlib as p; f=p.Path('$ROOT/scripts/dev/gen-ttg-cert-execution-ledger.py'); s=u.spec_from_file_location('l', f); m=u.module_from_spec(s); s.loader.exec_module(m); print(m.CERT_STEPS[int('$CERT')]['evidence_subdir'])")"
    SIG="$(python -c "import importlib.util as u, pathlib as p; f=p.Path('$ROOT/scripts/dev/gen-ttg-cert-execution-ledger.py'); s=u.spec_from_file_location('l', f); m=u.module_from_spec(s); s.loader.exec_module(m); print(m.CERT_STEPS[int('$CERT')]['signoff_file'])")"
    SIG_PATH="$ROOT/$EVID/$SUBDIR/$SIG"
    [[ -f "$SIG_PATH" ]] || {
      echo "complete-cert: FAIL cert #$CERT — missing signoff $EVID/$SUBDIR/$SIG" >&2
      exit 3
    }
    ;;
esac

if [[ "$CERT" -eq 6 || "$CERT" -eq 7 || "$CERT" -eq 8 || "$CERT" -eq 9 ]]; then
  [[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "0" ]] || {
    echo "complete-cert: FAIL cert #$CERT — Phase B PAUSED (need UAT + unpause + Timelock)" >&2
    exit 3
  }
fi

python "$ROOT/scripts/dev/complete-ttg-cert-step-apply.py" \
  --cert "$CERT" \
  --stamp "$STAMP" \
  --signer "$SIGNER" \
  --evidence-dir "$EVID"

python "$ROOT/scripts/dev/apply-ttg-cert-tier-upgrades.py"

echo "TTG_CERT_STEP: OK cert=$CERT stamp=$STAMP"
