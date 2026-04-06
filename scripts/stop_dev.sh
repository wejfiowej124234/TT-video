#!/usr/bin/env bash
# 终止开发环境：按 PID 文件或按端口结束前后端
# 用法：./scripts/stop_dev.sh
# Windows：.\scripts\stop_dev.ps1（委托本脚本）；亦可 **stop-all.bat**
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_PORT="${API_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3012}"

echo ">>> 停止前后端..."

kill_port() {
  local port="$1"
  if command -v npx &>/dev/null; then
    npx --yes kill-port "$port" 2>/dev/null || true
    return
  fi
  if [ -n "$WINDIR" ] || [ -n "$MSYSTEM" ]; then
    powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }" 2>/dev/null || true
    return
  fi
  if command -v lsof &>/dev/null; then
    lsof -ti:"$port" 2>/dev/null | xargs kill -9 2>/dev/null || true
  elif command -v fuser &>/dev/null; then
    fuser -k "${port}/tcp" 2>/dev/null || true
  fi
}

for pidfile in .dev_backend.pid .dev_frontend.pid; do
  if [ -f "$REPO_ROOT/$pidfile" ]; then
    pid=$(cat "$REPO_ROOT/$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || kill -9 "$pid" 2>/dev/null || true
      echo "    已结束 PID $pid ($pidfile)"
    fi
    rm -f "$REPO_ROOT/$pidfile"
  fi
done

kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"
echo "    已清理端口 $BACKEND_PORT / $FRONTEND_PORT"
echo ">>> 完成"
