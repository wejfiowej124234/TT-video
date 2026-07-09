#!/usr/bin/env bash
# 态 A · 云端 Soak Watcher（Fly）为唯一运行 SSOT + post-soak Phase② 衔接
#
#   bash scripts/ops/p2fc-cloud-soak-orchestrator.sh           # 单次 observe（Fly SSOT）
#   bash scripts/ops/p2fc-cloud-soak-orchestrator.sh --watch   # 轮询 observe → COMPLETED → Phase② 收尾链
#
# Soak 有效性：仅 Fly /data/soak/* + cloud-observe/latest.json — 不依赖本地 job/soak.log
# 态 B：仅 TT_CLOUD_LAYER_ISSUE: REPORT + Owner FIX-PROPOSAL（本脚本不自动修复）
# Phase③: Production GO 须独立 GO gate — Soak PASS 不继承 ③ 权限
# 末行: TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: PASS|INFLIGHT|STATE_B|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
COMPLETED="$SOAK_DIR/COMPLETED.json"
OBSERVE="$ROOT/scripts/ops/cloud-local-healing/observe-cloud-soak-readonly.sh"
POLL_SEC="${P2FC_CLOUD_ORCH_POLL_SEC:-300}"
WATCH=0
LOG="$SOAK_DIR/cloud-orchestrator.log"
PID_FILE="$SOAK_DIR/cloud-orchestrator.pid"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,10p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

run_once() {
  local ts observe_out last_line fp ok fp2
  ts="$(date -u +%Y-%m-%dT:%H:%M:%SZ)"
  observe_out="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$OBSERVE" 2>&1)" || true
  {
    echo "${ts} observe:"
    echo "$observe_out"
  } >>"$LOG"
  last_line="$(echo "$observe_out" | tail -1)"

  if echo "$last_line" | grep -q 'TT_CLOUD_SOAK_OBSERVE: BLOCKED.*REPORT'; then
    echo "${ts} STATE_B: cloud layer REPORT — Owner FIX-PROPOSAL required (no auto fix)" >>"$LOG"
    echo "TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: STATE_B $last_line"
    return 3
  fi

  if echo "$last_line" | grep -q 'TT_CLOUD_SOAK_OBSERVE: COMPLETED'; then
    fp="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).fail_polls??'?')}catch{console.log('?')}" "$COMPLETED" 2>/dev/null || echo '?')"
    if [[ "$fp" != "0" ]]; then
      echo "${ts} BLOCKED: COMPLETED but fail_polls=$fp (required 0 for Phase② handoff)" >>"$LOG"
      echo "TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: FAIL fail_polls=$fp"
      return 2
    fi
    echo "${ts} COMPLETED.json (Fly SSOT) — Phase② closure chain (Gap/MR12/Evidence/SSOT — not Phase③ GO)" >>"$LOG"
    bash "$ROOT/scripts/ops/p2fc-post-soak-staging-live-closure-chain.sh" 2>&1 | tee -a "$LOG" \
      || { echo "TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: FAIL closure_chain"; return 2; }
    echo "TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: PASS phase2_handoff_started phase3_go=independent_gate"
    return 0
  fi

  if echo "$last_line" | grep -q 'TT_CLOUD_SOAK_OBSERVE: INFLIGHT'; then
    ok="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).ok_polls)}catch{console.log('?')}" "$SOAK_DIR/cloud-observe/latest.json" 2>/dev/null || echo '?')"
    fp2="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).fail_polls)}catch{console.log('?')}" "$SOAK_DIR/cloud-observe/latest.json" 2>/dev/null || echo '?')"
    echo "TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: INFLIGHT ssot=fly_cloud_watcher ok_polls=$ok fail_polls=$fp2"
    return 2
  fi

  echo "${ts} observe failed or blocked: ${last_line:-empty}" >>"$LOG"
  echo "TT_P2FC_CLOUD_SOAK_ORCHESTRATOR: FAIL observe=${last_line:-blocked}"
  return 2
}

if [[ "$WATCH" == "1" ]]; then
  echo $$ >"$PID_FILE"
  echo "$(date -u +%Y-%m-%dT:%M:%SZ) cloud-orchestrator: watch poll=${POLL_SEC}s" >>"$LOG"
  while [[ ! -f "$COMPLETED" ]]; do
    run_once || true
    sleep "$POLL_SEC"
  done
  run_once
  exit $?
fi

run_once
exit $?
