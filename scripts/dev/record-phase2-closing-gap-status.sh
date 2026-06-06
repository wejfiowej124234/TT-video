#!/usr/bin/env bash
# 刷新 Phase ② Closing Gap 总 STATUS.txt（读各 Gap 子目录 STATUS.txt）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/evidence/GO_phase2_testnet_20260526/closing-gap"
mkdir -p "$EVID"/{G1-r003-staging,G2-report-json,G3-c-gov,G4-stripe-g4,G5-onboarding-smoke,G6-sepolia-stake,G7-cdn-hls-prep}

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
STATUS="$EVID/STATUS.txt"
RUN_LOG="$EVID/run-${STAMP}.log"

read_gap() {
  local id="$1" path="$2"
  if [[ -f "$path/STATUS.txt" ]] && grep -q "^status: PASS" "$path/STATUS.txt"; then
    echo "${id}:PASS"
  elif [[ -f "$path/STATUS.txt" ]] && grep -q "^status: PARTIAL" "$path/STATUS.txt"; then
    echo "${id}:PARTIAL"
  elif [[ -f "$path/STATUS.txt" ]] && grep -q "^status: PREP_PASS" "$path/STATUS.txt"; then
    echo "${id}:PREP_PASS"
  else
    echo "${id}:NOT_STARTED"
  fi
}

COMMUNITY_PASS=0
for s in C1 C2 C3 C4 C5 C6 C7 C8 C9 C10 C11 C12; do
  st="$ROOT/evidence/GO_phase2_testnet_20260526/community/${s}/STATUS.txt"
  if [[ -f "$st" ]] && grep -q "^status: PASS" "$st"; then
    COMMUNITY_PASS=$((COMMUNITY_PASS + 1))
  fi
done

G1="$(read_gap G1 "$EVID/G1-r003-staging")"
G2="$(read_gap G2 "$EVID/G2-report-json")"
G3="$(read_gap G3 "$ROOT/evidence/GO_phase2_testnet_20260526/governance-manual-p1")"
[[ "$G3" == "G3:NOT_STARTED" ]] && G3="$(read_gap G3 "$EVID/G3-c-gov")"
G4="$(read_gap G4 "$EVID/G4-stripe-g4")"
G5="$(read_gap G5 "$ROOT/evidence/GO_phase2_testnet_20260526/onboarding-smoke")"
[[ "$G5" == "G5:NOT_STARTED" ]] && G5="$(read_gap G5 "$EVID/G5-onboarding-smoke")"
G6="$(read_gap G6 "$ROOT/evidence/GO_phase2_steward_stake_sepolia")"
[[ "$G6" == "G6:NOT_STARTED" ]] && G6="$(read_gap G6 "$EVID/G6-sepolia-stake")"
G7="$(read_gap G7 "$EVID/G7-cdn-hls-prep")"

GO_COUNT=0
for g in "$G1" "$G2" "$G3" "$G4" "$G5" "$G6"; do
  [[ "${g#*:}" == "PASS" ]] && GO_COUNT=$((GO_COUNT + 1))
done
# G7: PREP_PASS counts toward GO_READY
[[ "${G7#*:}" == "PASS" || "${G7#*:}" == "PREP_PASS" ]] && GO_COUNT=$((GO_COUNT + 1))

VERDICT="NOT_MET"
if [[ "$COMMUNITY_PASS" -eq 12 && "$GO_COUNT" -eq 7 ]]; then
  VERDICT="PHASE2_GO_READY"
elif [[ "$GO_COUNT" -ge 1 ]]; then
  VERDICT="PARTIAL"
fi

{
  echo "phase: ② testnet closing gap (full-site · post Community C1-C12)"
  echo "tt_phase2_go_verdict: ${VERDICT}"
  echo "community_c1_c12_pass: ${COMMUNITY_PASS}/12"
  echo "closing_gap_pass: ${GO_COUNT}/7"
  echo "last_refresh: ${STAMP}"
  echo "gap_g1_r003: ${G1#*:}"
  echo "gap_g2_report_json: ${G2#*:}"
  echo "gap_g3_c_gov: ${G3#*:}"
  echo "gap_g4_stripe_g4: ${G4#*:}"
  echo "gap_g5_onboarding_smoke: ${G5#*:}"
  echo "gap_g6_sepolia_stake: ${G6#*:}"
  echo "gap_g7_cdn_hls_prep: ${G7#*:}"
  echo "ssot: docs/runbook/PHASE2-CLOSING-GAP.md"
  echo "note: PHASE2_GO_READY ≠ Phase ③ Production GO"
} | tee "$RUN_LOG" > "$STATUS"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
cp -f "$RUN_LOG" "$EVID/run.log"

echo "TT_PHASE2_CLOSING_GAP_STATUS: OK verdict=${VERDICT} gaps=${GO_COUNT}/7"
echo "STATUS -> $STATUS"
