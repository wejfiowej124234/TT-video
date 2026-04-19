#!/usr/bin/env bash
# **一次性**：本地 **补全** **CHAIN** **+** **INTERNAL_API_SECRET** **+** **admin** **会话** 后跑 **B-387** **/** **B-388** **§3** **smoke**（**勿** **提交** **密钥**；**仅** **运维** **本机** **封口** **用**）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if ! command -v jq >/dev/null 2>&1; then
  echo "_local_b387_b388_smoke_orchestrator.sh: jq is required" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
[ -f .env ] && . ./.env
export CHAIN_RPC_URL="${CHAIN_RPC_URL:-https://rpc-amoy.polygon.technology}"
export CHAIN_ID="${CHAIN_ID:-80002}"
export INTERNAL_API_SECRET="${INTERNAL_API_SECRET:-tt-local-b387-b388-smoke}"
# **父** **shell** **（** **IDE** **/** **CI** **）** **可能** **注入** **PORT=3012** **等** **—** **本** **脚本** **默认** **钉** **8080** **与** **一键** **smoke** **/`curl`** **一致**。
export PORT="${SMOKE_API_PORT:-8080}"
set +a

BASE="${API_BASE_URL:-http://127.0.0.1:${PORT}}"
BASE="${BASE%/}"

if curl -sS -o /dev/null -w "%{http_code}" "${BASE}/health" 2>/dev/null | grep -q '^200$'; then
  echo "_local_b387_b388_smoke_orchestrator.sh: API already up on ${BASE}/health" >&2
else
  echo "_local_b387_b388_smoke_orchestrator.sh: starting API (cargo run -p traveltrust-api) …" >&2
  cargo run -p traveltrust-api >"${TMPDIR:-/tmp}/traveltrust-api-b387-b388-smoke.log" 2>&1 &
  API_PID=$!
  for _ in $(seq 1 90); do
    code="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE}/health" 2>/dev/null || true)"
    if [[ "$code" == "200" ]]; then
      echo "_local_b387_b388_smoke_orchestrator.sh: health ok" >&2
      break
    fi
    sleep 1
  done
  code="$(curl -sS -o /dev/null -w "%{http_code}" "${BASE}/health" 2>/dev/null || true)"
  if [[ "$code" != "200" ]]; then
    echo "_local_b387_b388_smoke_orchestrator.sh: API failed to become healthy (last HTTP ${code}). Log tail:" >&2
    tail -n 80 "${TMPDIR:-/tmp}/traveltrust-api-b387-b388-smoke.log" >&2 || true
    kill "$API_PID" 2>/dev/null || true
    exit 2
  fi
fi

curl -sS -X POST "${BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null || true

if [[ -n "${DATABASE_URL:-}" ]]; then
  # shellcheck disable=SC2001
  PGHOST="$(printf '%s' "$DATABASE_URL" | sed -n 's|.*@\([^:/]*\).*|\1|p')"
  if [[ "$PGHOST" == "localhost" ]] || [[ "$PGHOST" == "127.0.0.1" ]]; then
    docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -c \
      "UPDATE users SET role = 'admin' WHERE email = 'tourist@test.com';" >/dev/null 2>&1 || true
  fi
fi

LOGIN_JSON="$(curl -sS -X POST "${BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tourist@test.com","password":"Test123!"}')"
TOKEN="$(echo "$LOGIN_JSON" | jq -r '.token // empty')"
if [[ -z "$TOKEN" || "$TOKEN" == "null" ]]; then
  echo "_local_b387_b388_smoke_orchestrator.sh: login failed" >&2
  echo "$LOGIN_JSON" | head -c 800 >&2
  exit 3
fi
export ADMIN_BEARER_TOKEN="$TOKEN"
export INTERNAL_API_SECRET
export API_BASE_URL="$BASE"

echo "=== B-387 smoke ===" >&2
bash scripts/ops/b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh
out387=$?
echo "=== B-388 smoke ===" >&2
bash scripts/ops/b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh
out388=$?

if [[ "$out387" != "0" || "$out388" != "0" ]]; then
  exit 4
fi
exit 0
