#!/usr/bin/env bash
# P2FC · Web3 系统级安全与权限边界审计（四大域 · 只读 · 非侵入）
#
# D1 合约可升级性 · D2 治理攻击面 · D3 Admin RBAC · D4 UI/API/链上一致性
# 不 deploy · 不重启 · 不改 MR12 策略
#
#   bash scripts/ops/p2fc-run-web3-system-security-audit-readonly.sh
#   bash scripts/ops/p2fc-run-web3-system-security-audit-readonly.sh --watch  # 900s
#
# 末行：TT_P2FC_WEB3_SYSTEM_SECURITY_AUDIT: PASS|WARN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
OUT="$SOAK_DIR/web3-system-security-audit"
LOG="$OUT/web3-security-audit.log"
PID_FILE="$OUT/web3-security-watch.pid"
POLL_SEC="${P2FC_WEB3_SECURITY_AUDIT_POLL_SEC:-900}"
WATCH=0

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

mkdir -p "$OUT"

run_once() {
  local ts rc=0 line
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "${ts} web3-security-audit: start" >>"$LOG"
  bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh" >>"$LOG" 2>&1 || true
  set +e
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-web3-system-security-audit.py" \
    --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG"
  rc=${PIPESTATUS[0]}
  set -e
  line="$(grep -E '^TT_P2FC_WEB3_SYSTEM_SECURITY_AUDIT:' "$LOG" | tail -1 || true)"
  echo "${ts} web3-security-audit: done rc=${rc} ${line}" >>"$LOG"
  return "$rc"
}

if [[ "$WATCH" -eq 0 ]]; then
  run_once
  exit $?
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "p2fc-run-web3-system-security-audit: already running pid=${old_pid} log=${LOG}"
    exit 0
  fi
fi

nohup bash -c "
  ROOT=\"$ROOT\"
  SOAK_DIR=\"$SOAK_DIR\"
  POLL_SEC=\"$POLL_SEC\"
  while true; do
    bash \"\$ROOT/scripts/ops/p2fc-run-web3-system-security-audit-readonly.sh\" || true
    sleep \"\$POLL_SEC\"
  done
" >>"$LOG" 2>&1 &

echo $! >"$PID_FILE"
run_once || true
echo "p2fc-run-web3-system-security-audit: watch started pid=$(cat "$PID_FILE") poll_sec=${POLL_SEC} log=${LOG}"
exit 0
