#!/usr/bin/env bash
# Playwright 专用：在仓库根启动 traveltrust-api（默认 :8080），供 `PLAYWRIGHT_FULL_STACK=1` 与 Next 并行拉起。
# 须已能 `cargo run -p traveltrust-api`（本机 Rust）；`.env` 由 Rust `dotenvy` 从仓库根加载。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
# 勿默认 P3_CHAIN_OFF=1：会先于 dotenv 写入进程环境，导致根 .env 的 P3_CHAIN_OFF=0（测试网 / 链上 E2E）被覆盖。
# 链下 mock-pay E2E 请在根 `.env` 设 `P3_CHAIN_OFF=1`；CI workflow 已对 job 注入该变量。
# 全栈 E2E 单 IP 高频轮询 / 双账号切换易触达 50-B1 与关键写限流（429）；Playwright 专用入口默认关闭，可在环境变量中覆盖为非 0
export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
# 与 CI E2E、sync-frontend-env 一致：勿把 Next 端口误当作 API
if [[ -n "${API_PORT:-}" ]]; then
  export PORT="$API_PORT"
elif [[ -z "${PORT:-}" ]] || [[ "$PORT" == "3012" ]] || [[ "$PORT" == "3000" ]]; then
  export PORT="${PLAYWRIGHT_API_PORT:-8080}"
fi
# 勿直接 exec 旧 debug 二进制，否则改了 `crates/api` 后 E2E 仍跑陈旧行为；统一走 cargo 以增量编译。
exec cargo run -p traveltrust-api
