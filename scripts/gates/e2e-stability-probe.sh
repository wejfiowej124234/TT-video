#!/usr/bin/env bash
# E2E 稳定性最小复现（勿跑全量 production gate）。通过后再跑 run-production-gate-local.sh。
#
# Usage (repo root):
#   bash scripts/gates/e2e-stability-probe.sh
#
# 检查：Postgres 可达、API 子进程继承 DATABASE_URL（见 playwright apiServer.env）、
# 登录限流关闭、Next :3012 可打开首页、93 F1–F4 链上 API 登录需 DB。
# 可选：CHECK_FRONTEND_NPM_BUILD=1 时尾段串跑 scripts/gates/check-frontend-npm-build.sh（须 node/npm；与 TT-9618 §3.5.3 及 tt-9618-onboarding-pg-evidence.sh 尾段同源；准入费 PG 一键另见 scripts/gates/tt-9618-onboarding-pg-evidence.sh 头注释）。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

PYTHON_BIN="${PYTHON_BIN:-python3}"
if ! command -v "$PYTHON_BIN" >/dev/null 2>&1 && command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
fi

require_local_postgres() {
  local db_url="${DATABASE_URL:-}"
  if [[ -z "$db_url" ]] && [[ -f "$ROOT/.env" ]]; then
    db_url="$("$PYTHON_BIN" "$ROOT/scripts/gates/read_dotenv_value.py" "$ROOT/.env" DATABASE_URL)"
  fi
  if [[ -z "$db_url" ]]; then
    echo "e2e-stability-probe: set DATABASE_URL or add to .env" >&2
    exit 1
  fi
  export DATABASE_URL="$db_url"
  if ! "$PYTHON_BIN" "$ROOT/scripts/gates/pg_tcp_check.py"; then
    echo "e2e-stability-probe: Postgres TCP check failed" >&2
    exit 1
  fi
}

require_local_postgres

echo "=== env snapshot (no secrets) ==="
echo "DATABASE_URL set: yes (host redacted)"
echo "PLAYWRIGHT_E2E_STABILITY=1 (apiServer.env + run-e2e reclaim + Next 退出尾日志)"
echo "API_RATE_LIMIT_PER_MINUTE=${API_RATE_LIMIT_PER_MINUTE:-<unset>}"
echo "CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE=${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-<unset>}"
echo "login buckets off in playwright: AUTH_LOGIN_*_MAX_PER_WINDOW=0, AUTH_*_POST_*_PER_MINUTE=0"

export P3_CHAIN_OFF="1"
export TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS="${TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS:-0}"
export CARGO_INCREMENTAL="0"
export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
export PLAYWRIGHT_E2E_STABILITY="1"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:3012}"
export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-0}"
export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-0}"
export TRAVELTRUST_DEPLOYMENT_PROFILE="${TRAVELTRUST_DEPLOYMENT_PROFILE:-local}"
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD="${PLAYWRIGHT_RELAX_META_CHAIN_GUARD:-1}"
export STRICT_SESSION_GATE="${STRICT_SESSION_GATE:-1}"
export TRAVELTRUST_GATE_ENSURE_FRESH_API="${TRAVELTRUST_GATE_ENSURE_FRESH_API:-1}"
export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-0}"
export CHAIN_RPC_URL="${CHAIN_RPC_URL:-}"
export CHAIN_WS_URL="${CHAIN_WS_URL:-}"
export P3_SEED_ARBITRATOR_EMAIL="${P3_SEED_ARBITRATOR_EMAIL:-e2e-ci-arbitrator-seed@traveltrust.test}"
export PLAYWRIGHT_ARBITRATOR_SEED_EMAIL="${PLAYWRIGHT_ARBITRATOR_SEED_EMAIL:-e2e-ci-arbitrator-seed@traveltrust.test}"

echo ""
echo "=== [1/2] chromium: smoke 首页（Next :3012 存活 + 全栈 webServer）==="
(
  cd frontend && npm run e2e -- --project=chromium "e2e/smoke.spec.ts" --grep "首页可访问"
)

echo ""
echo "=== [2/2] chromium: 93-matrix F1→F4 单条（API login 需 DB，对齐 database_required 首发现场）==="
(
  cd frontend && npm run e2e -- --project=chromium "e2e/93-matrix-path-f1-f4.spec.ts" \
    --grep "@e2e-chain-off-mock-pay"
)

if [[ "${CHECK_FRONTEND_NPM_BUILD:-}" =~ ^(1|true|yes)$ ]]; then
  echo ""
  echo "=== optional: Next npm run build (CHECK_FRONTEND_NPM_BUILD) ==="
  bash scripts/gates/check-frontend-npm-build.sh
fi

echo ""
echo "e2e-stability-probe: OK — 可恢复 run-production-gate-local.sh"
