#!/usr/bin/env bash
# P2FC · post-soak graduation rerun（② · SSOT · 非 legacy orchestrator）
#
# 检测 evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json 后跑 post-soak 毕业闸链。
#
#   P2FC_SOAK_DIR=evidence/P2FC_SOAK_72H_STAGING bash scripts/ops/p2fc-rerun-after-soak.sh
#   bash scripts/ops/p2fc-rerun-after-soak.sh --watch   # 轮询直至 COMPLETED
#
# 诚实边界：② staging 毕业轨 · ≠ ③ Production GO · TESTNET_STAGING_FREEZE 仍 ACTIVE
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
WATCH=0
POLL_SEC="${P2FC_RERUN_POLL_SEC:-300}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

COMPLETED="$SOAK_DIR/COMPLETED.json"
LOG="${SOAK_DIR}/rerun-watcher.log"
PID_FILE="${SOAK_DIR}/rerun-watcher.pid"

mkdir -p "$SOAK_DIR"
echo $$ >"$PID_FILE"

wait_completed() {
  while [[ ! -f "$COMPLETED" ]]; do
    ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    line="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>/dev/null || true)"
    echo "${ts} p2fc-rerun-after-soak: waiting COMPLETED.json attest=${line:-MISSING}" | tee -a "$LOG"
    sleep "$POLL_SEC"
  done
}

if [[ "$WATCH" -eq 1 ]]; then
  wait_completed
fi

if [[ ! -f "$COMPLETED" ]]; then
  echo "p2fc-rerun-after-soak: FAIL missing $COMPLETED (use --watch or run after soak completes)" >&2
  exit 2
fi

ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "${ts} p2fc-rerun-after-soak: COMPLETED detected — post-soak graduation closure" | tee -a "$LOG"

export P2FC_SOAK_DIR="$SOAK_DIR"
bash "$ROOT/scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh" --audit-only \
  2>&1 | tee -a "$LOG"

echo "${ts} p2fc-rerun-after-soak: audit-only done — run TN-P1-010 + full graduation when gates ready" | tee -a "$LOG"
echo "TT_P2FC_RERUN_AFTER_SOAK: PASS dir=$SOAK_DIR"
exit 0
