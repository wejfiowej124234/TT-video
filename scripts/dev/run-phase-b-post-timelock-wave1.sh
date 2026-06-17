#!/usr/bin/env bash
# Phase B · Wave 1（② · TL#1 到期后 · 一次性）
#   Cert #7 execute+finalize（闭环）→ Cert #8 queue only → 进入 TL#2 → 回到维护窗
#
#   export HAT_R1_LIVE_WALLET_OK=1
#   export HAT_R1_PHASE_B_PAUSED=0
#   bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"
#
# 完成后仅跑：bash scripts/dev/run-phase-b-daily-maintenance.sh
# 禁止：Cert #8 spend execute · Cert #8 finalize
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SIGNER="${TTG_CERT_SIGNER:-}"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --signer) SIGNER="$2"; shift 2 ;;
    --queue-only)
      echo "wave1: --queue-only is implicit; run full wave1 after Cert #7 execute" >&2
      shift
      ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

[[ "${HAT_R1_LIVE_WALLET_OK:-}" == "1" ]] || {
  echo "wave1: FAIL set HAT_R1_LIVE_WALLET_OK=1" >&2
  exit 2
}
[[ "${HAT_R1_PHASE_B_PAUSED:-1}" == "0" ]] || {
  echo "wave1: FAIL set HAT_R1_PHASE_B_PAUSED=0" >&2
  exit 2
}

HAT="$ROOT/evidence/GO_hat_r1_sepolia/20260616T063612Z"
STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
ETA="$(cat "$HAT/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
NOW="$(date +%s)"
[[ "$NOW" -ge "$ETA" ]] || {
  echo "wave1: FAIL TL#1 not elapsed remaining=$((ETA-NOW))s" >&2
  echo "  maintenance until then: bash scripts/dev/run-phase-b-daily-maintenance.sh" >&2
  exit 3
}

echo "== Phase B Wave 1 · TL#1 elapsed =="

if [[ ! -f "$HAT/step-07-execute/tx-execute.json" ]]; then
  [[ -n "$SIGNER" ]] || { echo "wave1: --signer required for Cert #7 execute+finalize" >&2; exit 2; }
  bash "$ROOT/scripts/dev/run-tt-governance-cert-07-execute.sh" \
    --try-execute --finalize --signer "$SIGNER"
else
  echo "wave1: Cert #7 execute tx present"
  if [[ -n "$STAMP" && ! -f "$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/execute/PHASE-B-EXECUTE-SIGNOFF.json" ]]; then
    [[ -n "$SIGNER" ]] || { echo "wave1: --signer required for Cert #7 finalize" >&2; exit 2; }
    bash "$ROOT/scripts/dev/run-tt-governance-cert-07-execute.sh" \
      --finalize --signer "$SIGNER"
  fi
fi

if [[ ! -f "$HAT/step-09-treasury-queue/timelock-eta.json" ]]; then
  bash "$ROOT/scripts/dev/run-tt-governance-cert-08-treasury-spend.sh" --try-chain --queue-only
else
  echo "wave1: Cert #8 treasury queue already present — skip queue"
fi

echo "== TL#2 countdown =="
bash "$ROOT/scripts/dev/probe-phase-b-timelock-countdown.sh"

TL2="$(cat "$HAT/TREASURY_EXECUTE_EARLIEST_UNIX.txt" 2>/dev/null | tr -d '\r\n' || echo missing)"
echo "TT_PHASE_B_WAVE1: OK cert7=closed cert8=queued treasury_execute_earliest_unix=${TL2}"
echo "  resume maintenance: bash scripts/dev/run-phase-b-daily-maintenance.sh"
