#!/usr/bin/env bash
# 一键启动：先终止占用后端端口与 Next 端口的进程，再启动 traveltrust-api 与 Next（默认 3012）
# 用法：在仓库根执行 ./scripts/start_dev.sh
# 端口：后端默认 8080（或根 .env 的 PORT）；Next 默认 3012。二者不得相同（见 scripts/dev/_dev_stack_ports.sh）
# 可选：FRONTEND_PORT=3000 ./scripts/start_dev.sh（当根 .env 将 PORT 设为 3012 仅跑 API 时，避免与 Next 3012 冲突）
# 可选：TRAVELTRUST_CLEAN_FRONTEND_NEXT=1 ./scripts/start_dev.sh 在启动前端前执行 npm run clean（删 frontend/.next）
# 可选：SKIP_ABI_GATE=1 跳过 check-55-s13；TRAVELTRUST_ABI_FORGE_VERIFY=1 额外跑 run-verify-abi-forge.sh（须 forge）
# 可选：SKIP_FRONTEND_ENV_SYNC=1 跳过 frontend/.env.local 与根 .env 同步
# ABI：合约或 contracts/abi 变更后先 forge build + scripts/sync-abi-from-forge.sh，再同步 55-S13 子集到 frontend/dapp/abis；勿长期 SKIP_ABI_GATE=1（与 start-api-with-seed.bat Step 1b 同源）。
# Windows：.\scripts\start_dev.ps1（委托本脚本）；一键含 Docker 见 **start-api-with-seed.bat**
set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# shellcheck source=scripts/dev/_dev_stack_ports.sh
source "$REPO_ROOT/scripts/dev/_dev_stack_ports.sh"

if [[ "$BACKEND_PORT" == "$FRONTEND_PORT" ]]; then
  echo ">>> ERROR: API 监听端口 (${BACKEND_PORT}) 与 Next 开发端口 (${FRONTEND_PORT}) 相同，无法同时启动。"
  echo "    推荐全栈：根 .env 设 PORT=8080（API），Next 保持 3012；NEXT_PUBLIC 由 sync 脚本指向 http://127.0.0.1:8080"
  echo "    若须 API 与 Next 同机不同组合：改 FRONTEND_PORT（例 3000）或显式 API_PORT=8080 ./scripts/start_dev.sh"
  exit 1
fi

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

if [ "${SKIP_ABI_GATE:-0}" != "1" ]; then
  echo ">>> ABI gate (55-S13: contracts/abi vs frontend/dapp/abis)..."
  bash "$REPO_ROOT/scripts/check-55-s13.sh" || exit 1
fi
if [ "${TRAVELTRUST_ABI_FORGE_VERIFY:-0}" = "1" ]; then
  echo ">>> forge ABI multiset (TRAVELTRUST_ABI_FORGE_VERIFY=1)..."
  export PATH="${HOME}/.foundry/bin:${PATH}"
  bash "$REPO_ROOT/scripts/run-verify-abi-forge.sh" || exit 1
fi

# 先编译后端，避免 /api/v1/me、社区接口 404（设 SKIP_API_BUILD=1 可跳过）
if [ "${SKIP_API_BUILD}" != "1" ]; then
  echo ">>> 编译后端..."
  cargo build -p traveltrust-api || exit 1
fi

# 若需数据库：请先 docker compose up -d，并在项目根 .env 设置 DATABASE_URL；API 启动时会自动执行迁移。
# ESCROW_FACTORY_ADDRESS 须与链上 Escrow.factory() 一致（索引器只拉该工厂日志）；改后需重启 API；若曾对账 missing_projection，另按 ops runbook 做 rewind/tick/replay。
echo ">>> 启动后端 (PORT=$BACKEND_PORT)..."
PORT="$BACKEND_PORT" cargo run -p traveltrust-api &
BACKEND_PID=$!
echo "$BACKEND_PID" > "$REPO_ROOT/.dev_backend.pid"

echo ">>> 等待后端就绪 (wait-for-api.sh)..."
PORT="$BACKEND_PORT" bash "$REPO_ROOT/scripts/dev/wait-for-api.sh" || {
  echo "    警告：/health 未在超时内就绪，请检查 cargo 日志与 .env"
}

if [ "${SKIP_FRONTEND_ENV_SYNC:-0}" != "1" ]; then
  echo ">>> sync frontend/.env.local from root .env (NEXT_PUBLIC_*)..."
  API_LISTEN_PORT="$BACKEND_PORT" bash "$REPO_ROOT/scripts/dev/sync-frontend-env-local-from-root.sh" || exit 1
fi

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
echo "frontend/.env.local 中 NEXT_PUBLIC_API_BASE_URL 应对齐上述后端端口（已 sync）；勿与 Next 端口相同，否则 api_html_not_json"
echo "---"
echo "停止全部: ./scripts/stop_dev.sh"
echo "前端日志见上方；按 Ctrl+C 仅停前端，后端需执行 stop_dev.sh 或 kill 端口 $BACKEND_PORT"
wait $FRONTEND_PID 2>/dev/null || true
