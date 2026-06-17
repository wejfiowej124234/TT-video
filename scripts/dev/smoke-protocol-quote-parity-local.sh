#!/usr/bin/env bash
# ① 本地 · protocol quote 对拍 + 可选 Anvil 链上 immutables + 可选运行中 API HTTP
#
# 用法：
#   bash scripts/dev/smoke-protocol-quote-parity-local.sh
#   PROTOCOL_QUOTE_HTTP=1 API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-protocol-quote-parity-local.sh
#   # 含 Anvil pool（须 REGION_STEWARD_STAKE_POOL_ADDRESS + CHAIN_RPC_URL）：
#   source .env && bash scripts/dev/smoke-protocol-quote-parity-local.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "smoke-protocol-quote-parity-local: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-protocol-quote-parity-local: OK $*"; }

load_dotenv_var() {
  local key="$1"
  [[ -n "${!key:-}" ]] && return 0
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

for k in CHAIN_RPC_URL REGION_STEWARD_STAKE_POOL_ADDRESS COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS; do
  load_dotenv_var "$k"
done

bash scripts/gates/check-protocol-convergence-pregate.sh
ok "pregate (SSOT + ABI + quote parity)"

cargo test -p traveltrust-api steward_application::tests:: -- --nocapture \
  || fail "API steward/redemption quote unit tests"

PROTOCOL_QUOTE_HTTP="${PROTOCOL_QUOTE_HTTP:-0}" bash scripts/gates/check-protocol-quote-parity.sh \
  || fail "quote parity gate"

if [[ "${PROTOCOL_QUOTE_HTTP:-0}" == "1" ]]; then
  ok "HTTP quote routes (API_BASE=${API_BASE:-http://127.0.0.1:8080})"
fi

echo ""
echo "TT_SMOKE_PROTOCOL_QUOTE_PARITY: OK (① local — chain/HTTP optional; not ② staging GO)"
