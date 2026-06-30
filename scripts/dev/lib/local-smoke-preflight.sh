#!/usr/bin/env bash
# ① 本地烟测共用 preflight：仓库 .env DATABASE_URL · mock-pay API 就绪探针（非新测试轨）
#
# 用法（在 scripts/dev/*.sh 内）：
#   source "$ROOT/scripts/dev/lib/local-smoke-preflight.sh"
#   local_smoke_load_repo_env
#   local_smoke_require_mock_pay_api "$API_BASE"   # 需要 mock-pay 的脚本
set -euo pipefail

local_smoke_repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd
}

local_smoke_load_repo_env() {
  local root env_file line
  root="$(local_smoke_repo_root)"
  env_file="$root/.env"
  if [[ -z "${DATABASE_URL:-}" && -f "$env_file" ]]; then
    line="$(grep -E '^DATABASE_URL=' "$env_file" | head -1 || true)"
    if [[ -n "$line" ]]; then
      export DATABASE_URL="${line#DATABASE_URL=}"
      DATABASE_URL="${DATABASE_URL//$'\r'/}"
      DATABASE_URL="${DATABASE_URL%\"}"
      DATABASE_URL="${DATABASE_URL#\"}"
    fi
  fi
}

# P3 chain_off mock-pay 订单常为内存态；默认跳过 PG 对齐（HTTP 验收为主）
local_smoke_default_skip_chain_off_db() {
  if [[ -n "${SMOKE_REQUIRE_DB:-}" ]]; then
    return 0
  fi
  if [[ -z "${SMOKE_SKIP_DB:-}" ]]; then
    export SMOKE_SKIP_DB=1
  fi
}

# POST mock-pay 探针：501+P3 hint → API 未开 chain_off mock-pay；401/400/404 → 路由已启用
local_smoke_require_mock_pay_api() {
  local api_base="${1:-http://127.0.0.1:8080}"
  local tmp code
  api_base="${api_base%/}"
  tmp="$(mktemp)"
  code="$(curl -sS -o "$tmp" -w '%{http_code}' -X POST \
    "${api_base}/api/v1/orders/00000000-0000-4000-8000-000000000001/mock-pay" \
    -H 'Content-Type: application/json' 2>/dev/null || echo "000")"
  if [[ "$code" == "501" ]] && grep -q 'P3_CHAIN_OFF=1' "$tmp" 2>/dev/null; then
    rm -f "$tmp"
    echo "local-smoke-preflight: FAIL mock-pay unavailable (API P3_CHAIN_OFF!=1). Restart with P3_CHAIN_OFF=1 or scripts/start-api-with-seed.bat (default mock-pay)." >&2
    return 1
  fi
  if [[ "$code" == "000" ]]; then
    rm -f "$tmp"
    echo "local-smoke-preflight: FAIL API unreachable at ${api_base}/health" >&2
    return 1
  fi
  rm -f "$tmp"
  return 0
}
