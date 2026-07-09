#!/usr/bin/env bash
# P2FC · post-soak watcher 待机审计（只读 · 不 deploy · 不改 soak worker）
#
# 验证四态机在 Soak INFLIGHT 期间：
#   · stalled 仅 WARN，不 ABORT
#   · watcher 进程存活
#   · 无 TT_P2FC_WATCHER_ABORT 历史（本轮待机）
#
#   bash scripts/ops/p2fc-audit-watcher-standby.sh
#   bash scripts/ops/p2fc-audit-watcher-standby.sh --watch
#
# 末行：TT_P2FC_WATCHER_STANDBY_AUDIT: PASS|WARN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
EXEC_DIR="$SOAK_DIR/post-soak-one-shot"
PID_FILE="$EXEC_DIR/one-shot-watcher.pid"
STATE_FILE="$EXEC_DIR/soak-watcher-state.json"
LOG="$EXEC_DIR/one-shot-watcher.log"
COMPLETED="$SOAK_DIR/COMPLETED.json"
WATCH=0
POLL_SEC="${P2FC_WATCHER_AUDIT_POLL_SEC:-600}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

# shellcheck source=scripts/ops/lib/p2fc-soak-watcher-state-lib.sh
source "$ROOT/scripts/ops/lib/p2fc-soak-watcher-state-lib.sh"

run_audit() {
  local rc=0 verdict="PASS"
  local wp soak_line eval_rc soak_state frozen_sec dead_streak abort_count warn_count

  if [[ -f "$COMPLETED" ]]; then
    echo "TT_P2FC_WATCHER_STANDBY_AUDIT: PASS note=COMPLETED.json_present_skip_standby"
    return 0
  fi

  wp="$(cat "$PID_FILE" 2>/dev/null || echo "")"
  if [[ -z "$wp" ]] || ! kill -0 "$wp" 2>/dev/null; then
    echo "TT_P2FC_WATCHER_STANDBY_AUDIT: FAIL reason=watcher_not_alive pid=${wp:-none}" >&2
    return 2
  fi

  if [[ -f "$SOAK_DIR/FAIL.json" ]]; then
    echo "TT_P2FC_WATCHER_STANDBY_AUDIT: FAIL reason=soak_FAIL.json_present" >&2
    return 2
  fi

  soak_line="$(P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" 2>/dev/null || true)"
  set +e
  p2fc_soak_watcher_eval_cycle "$SOAK_DIR" "$soak_line" "$STATE_FILE" >/dev/null
  eval_rc=$?
  set -e

  soak_state="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).soak_state||'')}catch{}" "$STATE_FILE" 2>/dev/null || echo "")"
  frozen_sec="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).frozen_sec||0)}catch{console.log(0)}" "$STATE_FILE" 2>/dev/null || echo 0)"
  dead_streak="$(node -e "try{console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).dead_streak||0)}catch{console.log(0)}" "$STATE_FILE" 2>/dev/null || echo 0)"

  abort_count=0
  warn_count=0
  [[ -f "$LOG" ]] && abort_count="$(rg -c 'TT_P2FC_WATCHER_ABORT' "$LOG" 2>/dev/null || echo 0)"
  [[ -f "$LOG" ]] && warn_count="$(rg -c 'TT_P2FC_WATCHER_WARN.*stalled' "$LOG" 2>/dev/null || echo 0)"

  if [[ "$eval_rc" -eq 2 ]]; then
    echo "TT_P2FC_WATCHER_STANDBY_AUDIT: FAIL reason=eval_cycle_abort soak_state=${soak_state} eval_rc=${eval_rc}" >&2
    return 2
  fi

  if [[ "$abort_count" -gt 0 ]]; then
    echo "TT_P2FC_WATCHER_STANDBY_AUDIT: FAIL reason=watcher_log_has_ABORT count=${abort_count}" >&2
    return 2
  fi

  if [[ "$soak_state" == "stalled" ]]; then
    verdict="WARN"
    rc=1
  fi

  if [[ "$eval_rc" -eq 1 ]]; then
    verdict="WARN"
    rc=1
  fi

  echo "TT_P2FC_WATCHER_STANDBY_AUDIT: ${verdict} watcher_pid=${wp} soak_state=${soak_state:-alive} eval_rc=${eval_rc} dead_streak=${dead_streak} frozen_sec=${frozen_sec} stall_warns=${warn_count} aborts=${abort_count}"
  echo "  attest=${soak_line:-MISSING}"
  return "$rc"
}

if [[ "$WATCH" -eq 1 ]]; then
  while [[ ! -f "$COMPLETED" ]]; do
    run_audit || true
    sleep "$POLL_SEC"
  done
  run_audit
  exit $?
fi

run_audit
exit $?
