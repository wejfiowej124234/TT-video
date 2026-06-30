#!/usr/bin/env bash
# Playwright 专用：在仓库根启动 traveltrust-api（默认 :8080），供 `PLAYWRIGHT_FULL_STACK=1` 与 Next 并行拉起。
# 须已能 `cargo run -p traveltrust-api`（本机 Rust）；`.env` 由 Rust `dotenvy` 从仓库根加载。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=lib/local-build-git-sha.sh
source "$(dirname "$0")/lib/local-build-git-sha.sh"
local_build_git_sha_export "$ROOT"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
export DID_RANK_SEED_MARKET_DEMO="${DID_RANK_SEED_MARKET_DEMO:-1}"
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE="${TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE:-1}"
# 勿默认 P3_CHAIN_OFF=1：会先于 dotenv 写入进程环境，导致根 .env 的 P3_CHAIN_OFF=0（测试网 / 链上 E2E）被覆盖。
# 链下 mock-pay E2E 请在根 `.env` 设 `P3_CHAIN_OFF=1`；CI workflow 已对 job 注入该变量。
# 全栈 E2E 单 IP 高频轮询 / 双账号切换易触达 50-B1 与关键写限流（429）；Playwright 专用入口默认关闭，可在环境变量中覆盖为非 0
export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
# F-007 / PH1-FE-05：有 DATABASE_URL 时允许本机 profile-avatar 落盘（非 S3 路径）
export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"
# GET /meta 治理 eth_call 叠压易超 30s → HTTP 408；与 run-e2e-default.mjs 同源
export REQUEST_TIMEOUT_SECS="${REQUEST_TIMEOUT_SECS:-120}"
# 与 CI E2E、sync-frontend-env 一致：勿把 Next 端口误当作 API
if [[ -n "${API_PORT:-}" ]]; then
  export PORT="$API_PORT"
elif [[ -z "${PORT:-}" ]] || [[ "$PORT" == "3012" ]] || [[ "$PORT" == "3000" ]]; then
  export PORT="${PLAYWRIGHT_API_PORT:-8080}"
fi
# 勿直接 exec 旧 debug 二进制，否则改了 `crates/api` 后 E2E 仍跑陈旧行为；统一走 cargo 以增量编译。
exec cargo run -p traveltrust-api
