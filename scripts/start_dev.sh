#!/usr/bin/env bash
# 一键启动：先终止占用 8080/3012 的进程，再启动后端（8080）与前端（3012）
# 用法：在仓库根执行 ./scripts/start_dev.sh
# 可选：FRONTEND_PORT=3012 ./scripts/start_dev.sh 或 API_PORT=8080 ./scripts/start_dev.sh
# 可选：TRAVELTRUST_CLEAN_FRONTEND_NEXT=1 ./scripts/start_dev.sh 在启动前端前执行 npm run clean（删 frontend/.next）
# Windows：.\scripts\start_dev.ps1（委托本脚本）；一键含 Docker 见 **start-api-with-seed.bat**
set -e
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# 后端 8080、前端 3012，与 Windows 脚本及 docs/测试账号与本地联调.md 一致
BACKEND_PORT="${API_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3012}"

echo ">>> 先终止占用 ${BACKEND_PORT} / ${FRONTEND_PORT} 的进程..."

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

kill_port "$BACKEND_PORT"
kill_port "$FRONTEND_PORT"
sleep 1

bash "$REPO_ROOT/scripts/check-sqlx-migration-prefixes.sh" || exit 1

# 先编译后端，避免 /api/v1/me、社区接口 404（设 SKIP_API_BUILD=1 可跳过）
if [ "${SKIP_API_BUILD}" != "1" ]; then
  echo ">>> 编译后端..."
  cargo build -p traveltrust-api || exit 1
fi

# 若需数据库：请先 docker compose up -d，并在项目根 .env 设置 DATABASE_URL；API 启动时会自动执行迁移。
echo ">>> 启动后端 (PORT=$BACKEND_PORT)..."
PORT="$BACKEND_PORT" cargo run -p traveltrust-api &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$REPO_ROOT/.dev_backend.pid"

echo ">>> 等待后端就绪..."
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:${BACKEND_PORT}/health" 2>/dev/null | grep -q 200; then
    echo "    后端已就绪"
    break
  fi
  [ "$i" -eq 10 ] && echo "    警告：后端可能尚未就绪，请稍后访问"
  sleep 1
done

echo ">>> 启动前端 (port $FRONTEND_PORT, Turbopack + ensure-turbo-dev)..."
(
  cd "$REPO_ROOT/frontend"
  if [ "${TRAVELTRUST_CLEAN_FRONTEND_NEXT}" = "1" ]; then
    echo ">>> TRAVELTRUST_CLEAN_FRONTEND_NEXT=1：npm run clean..."
    npm run clean || exit 1
  fi
  node ./scripts/ensure-turbo-dev.mjs || exit 1
  # 与 package.json 一致：显式 node …/next/bin，避免 Windows 上 .cmd / PATH 误解析
  node ./node_modules/next/dist/bin/next dev --turbopack -p "$FRONTEND_PORT"
) &
FRONTEND_PID=$!
echo "$FRONTEND_PID" > "$REPO_ROOT/.dev_frontend.pid"

sleep 2
echo ""
echo "---"
echo "后端: http://localhost:${BACKEND_PORT}"
echo "前端: http://localhost:${FRONTEND_PORT} （登录页: http://localhost:${FRONTEND_PORT}/auth/login）"
echo "---"
echo "停止全部: ./scripts/stop_dev.sh"
echo "前端日志见上方；按 Ctrl+C 仅停前端，后端需执行 stop_dev.sh 或 kill 端口 $BACKEND_PORT"
wait $FRONTEND_PID 2>/dev/null || true
