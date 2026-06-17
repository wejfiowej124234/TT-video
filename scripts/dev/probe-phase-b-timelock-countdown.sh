#!/usr/bin/env bash
# Phase B · 双 Timelock 倒计时探测（② · 只读）
#
#   bash scripts/dev/probe-phase-b-timelock-countdown.sh
#   bash scripts/dev/run-phase-b-daily-maintenance.sh   # 每日：probe + post-change
#
# TL#1 → Cert #7 Execute · TL#2 → Cert #8 Treasury execute（Queue 完成后写入 TREASURY_EXECUTE_EARLIEST_UNIX.txt）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

HAT="${HAT_R1_EVID_DIR:-$ROOT/evidence/GO_hat_r1_sepolia/20260616T063612Z}"
STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
NOW="$(date +%s)"

fmt_eta() {
  python -c "import datetime; print(datetime.datetime.fromtimestamp(int('$1'), datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'))"
}

TL1="$(cat "$HAT/EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
TL2="$(cat "$HAT/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo 0)"
TL1_EL=no
TL2_EL=no
[[ "$TL1" != "0" && "$NOW" -ge "$TL1" ]] && TL1_EL=yes
[[ "$TL2" != "0" && "$NOW" -ge "$TL2" ]] && TL2_EL=yes
TL1_REM=$((TL1 - NOW))
TL2_REM=$((TL2 - NOW))
[[ "$TL1_REM" -lt 0 ]] && TL1_REM=0
[[ "$TL2_REM" -lt 0 ]] && TL2_REM=0

EXEC_TX=no
[[ -f "$HAT/step-07-execute/tx-execute.json" ]] && EXEC_TX=yes
QUEUE=no
[[ -f "$HAT/step-09-treasury-queue/timelock-eta.json" ]] && QUEUE=yes
SPEND_TX=no
[[ -f "$HAT/step-10-treasury-execute/tx-execute.json" ]] && SPEND_TX=yes

WALLET_OK="${HAT_R1_LIVE_WALLET_OK:-0}"
PAUSED="${HAT_R1_PHASE_B_PAUSED:-1}"

echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: phase=② maintenance=baseline_only"
echo "  cert_session=${STAMP:-missing}"
echo "  TL1_cert7_execute unix=${TL1} utc=$(fmt_eta "$TL1" 2>/dev/null || echo n/a) elapsed=${TL1_EL} remaining_s=${TL1_REM}"
echo "  TL2_cert8_spend   unix=${TL2} utc=$(fmt_eta "$TL2" 2>/dev/null || echo n/a) elapsed=${TL2_EL} remaining_s=${TL2_REM}"
echo "  chain: execute_tx=${EXEC_TX} treasury_queue=${QUEUE} spend_execute_tx=${SPEND_TX}"
echo "  gates: HAT_R1_LIVE_WALLET_OK=${WALLET_OK} HAT_R1_PHASE_B_PAUSED=${PAUSED}"

if [[ "$TL1_EL" == "no" ]]; then
  echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=PRE_TL1_MAINTENANCE"
  echo "  only: bash scripts/dev/run-phase-b-daily-maintenance.sh"
  exit 0
fi

if [[ "$EXEC_TX" == "no" ]]; then
  if [[ "$WALLET_OK" == "1" && "$PAUSED" == "0" ]]; then
    echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=TL1_READY_WAVE1"
    echo "  next: bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer \"Sebastian Ward\""
  else
    echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=TL1_ELAPSED_BLOCKED_WALLET"
    echo "  next: export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0"
  fi
  exit 0
fi

if [[ "$QUEUE" == "no" ]]; then
  echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=WAVE1_CERT8_QUEUE_PENDING"
  echo "  next: bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer \"Sebastian Ward\""
  exit 0
fi

if [[ "$TL2_EL" == "no" ]]; then
  echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=TL2_COUNTDOWN"
  echo "  only: bash scripts/dev/run-phase-b-daily-maintenance.sh"
  exit 0
fi

if [[ "$SPEND_TX" == "no" ]]; then
  echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=TL2_ELAPSED_SPEND_BLOCKED"
  echo "  spend execute blocked until explicit Wave 2 (HAT_R1_ALLOW_SPEND_EXECUTE=1)"
  exit 0
fi

echo "TT_PHASE_B_TIMELOCK_COUNTDOWN: MODE=TL2_SPEND_EXECUTE_PRESENT"
exit 0
