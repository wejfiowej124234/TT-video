#!/usr/bin/env bash
# 本地/可控环境：打通 A+B 主链（注册→登录→/me→市场→下单→订单→消息），
# 校验 HTTP 成功 +（可选）PostgreSQL 落库 + GET 回读一致。
# 不涉及发布或 GO/NO_GO。须已启动 API（默认 http://127.0.0.1:8080），且建议 SEED_TEST_ACCOUNTS=1 以注入杭州 active 向导。
# DB 抽检：DATABASE_URL 已设时优先本机 psql，否则 docker exec ${SMOKE_PG_CONTAINER:-traveltrust-postgres} psql（见 docs/dev-local-smoke-baseline.md）。
set -euo pipefail

API="${API_BASE_URL:-http://127.0.0.1:8080}"
STAMP="$(date +%s)"
EMAIL="${SMOKE_EMAIL:-ab.smoke.${STAMP}@example.com}"
PASS="${SMOKE_PASSWORD:-SmokeTest123!}"

die() { echo "smoke-ab-core-chain: ERROR: $*" >&2; exit 1; }

command -v curl >/dev/null || die "curl required"
# Windows: Store 占位 `python3` 常直接退出 49；优先可用且能 `import json` 的解释器。
PYTHON_JSON=""
if command -v python >/dev/null 2>&1 && python -c "import json" 2>/dev/null; then
  PYTHON_JSON=python
elif command -v python3 >/dev/null 2>&1 && python3 -c "import json" 2>/dev/null; then
  PYTHON_JSON=python3
else
  die "python or python3 with json required"
fi
# 默认 `.smoke_ab_body.json`（相对路径）：Git Bash 的 `/c/...` 与原生 Windows Python 互不兼容，相对路径二者可读。
# 请在仓库根执行；或 `export SMOKE_BODY='C:/Users/you/proj/.smoke_ab_body.json'`（正斜杠）覆盖。
SMOKE_BODY="${SMOKE_BODY:-.smoke_ab_body.json}"

json_get() {
  "${PYTHON_JSON}" -c "import json,sys; d=json.load(sys.stdin); print(d.get('$1') or d${2:-})" 2>/dev/null
}

http_code() {
  curl -sS -o "${SMOKE_BODY}" -w "%{http_code}" "$@"
}

echo "== A+B 主链烟测（API=${API}） =="

code="$(curl -sS -o /dev/null -w "%{http_code}" "${API}/health" || true)"
[[ "$code" == "200" ]] || die "API not reachable at ${API}/health (got ${code}). Start API first (e.g. scripts/start-api-with-seed.bat or start_dev.sh)."

echo "1) POST /auth/register"
rc="$(http_code -X POST "${API}/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\",\"role\":\"traveler\"}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "register HTTP ${rc}"; }
TOKEN_REG="$("${PYTHON_JSON}" -c "import json; print(json.load(open('${SMOKE_BODY}', encoding='utf-8')).get('token',''))")"
[[ -n "$TOKEN_REG" ]] || die "no token in register response"

echo "2) POST /auth/login (same account)"
rc="$(http_code -X POST "${API}/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"${EMAIL}\",\"password\":\"${PASS}\"}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "login HTTP ${rc}"; }
TOKEN="$("${PYTHON_JSON}" -c "import json; print(json.load(open('${SMOKE_BODY}', encoding='utf-8')).get('token',''))")"
[[ -n "$TOKEN" ]] || die "no token in login response"

AUTH=( -H "Authorization: Bearer ${TOKEN}" )

echo "3) GET /api/v1/me"
rc="$(http_code "${API}/api/v1/me" "${AUTH[@]}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "me HTTP ${rc}"; }
ME_EMAIL="$("${PYTHON_JSON}" -c "import json; u=json.load(open('${SMOKE_BODY}', encoding='utf-8')); print(u.get('user',{}).get('email',''))")"
[[ "$ME_EMAIL" == "$EMAIL" ]] || die "me email mismatch: want ${EMAIL} got ${ME_EMAIL}"

echo "4) GET /api/v1/discover/orders (市场)"
rc="$(http_code "${API}/api/v1/discover/orders" "${AUTH[@]}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "discover HTTP ${rc}"; }

echo "5) GET /api/v1/guides?city=杭州 (取 guide_id)"
rc="$(http_code "${API}/api/v1/guides?city=%E6%9D%AD%E5%B7%9E")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "guides HTTP ${rc}"; }
GUIDE_ID="$("${PYTHON_JSON}" -c "import json; j=json.load(open('${SMOKE_BODY}', encoding='utf-8')); it=j.get('items') or []; print(it[0]['id'] if it else '')")"
[[ -n "$GUIDE_ID" ]] || die "no active guide in Hangzhou — set SEED_TEST_ACCOUNTS=1 and restart API, or create/stake a guide"

echo "6) POST /api/v1/orders"
rc="$(http_code -X POST "${API}/api/v1/orders" \
  -H 'Content-Type: application/json' "${AUTH[@]}" \
  -d "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"100\",\"currency\":\"USD\"}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "order_create HTTP ${rc}"; }
OID="$("${PYTHON_JSON}" -c "import json; j=json.load(open('${SMOKE_BODY}', encoding='utf-8')); print(j.get('order',{}).get('id',''))")"
[[ -n "$OID" ]] || die "no order.id in create response"

echo "7) GET /api/v1/orders/${OID} (回读订单)"
rc="$(http_code "${API}/api/v1/orders/${OID}" "${AUTH[@]}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "order_get HTTP ${rc}"; }
AMT1="$("${PYTHON_JSON}" -c "import json; j=json.load(open('${SMOKE_BODY}', encoding='utf-8')); print(j.get('order',{}).get('amount',''))")"
[[ "$AMT1" == "100" ]] || die "order amount mismatch: want 100 got ${AMT1}"

echo "8) POST /api/v1/orders/${OID}/messages"
rc="$(http_code -X POST "${API}/api/v1/orders/${OID}/messages" \
  -H 'Content-Type: application/json' "${AUTH[@]}" \
  -d '{"content":"smoke-ab-core-chain message"}')"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "message_post HTTP ${rc}"; }

echo "9) GET /api/v1/orders/${OID}/messages (回读消息)"
rc="$(http_code "${API}/api/v1/orders/${OID}/messages" "${AUTH[@]}")"
[[ "$rc" == "200" ]] || { cat "${SMOKE_BODY}" >&2; die "messages_get HTTP ${rc}"; }
"${PYTHON_JSON}" -c "import json,sys; j=json.load(open('${SMOKE_BODY}', encoding='utf-8')); items=j.get('items') or []; assert any('smoke-ab-core-chain' in (x.get('content') or '') for x in items), 'posted message not in list'; print('   messages count:', len(items))"

# DB 抽检：优先本机 psql；否则 docker exec（与 docker-compose 默认容器/用户/库一致，不依赖 PATH 中的 psql）
SMOKE_PG_CONTAINER="${SMOKE_PG_CONTAINER:-traveltrust-postgres}"
SMOKE_PG_USER="${SMOKE_PG_USER:-traveltrust}"
SMOKE_PG_DB="${SMOKE_PG_DB:-traveltrust}"

db_psql_local() {
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 "$@"
}

db_psql_docker() {
  docker exec "${SMOKE_PG_CONTAINER}" psql -U "${SMOKE_PG_USER}" -d "${SMOKE_PG_DB}" -v ON_ERROR_STOP=1 "$@"
}

docker_pg_ready() {
  command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 &&
    docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "${SMOKE_PG_CONTAINER}"
}

if [[ -n "${DATABASE_URL:-}" ]] && [[ "${SMOKE_SKIP_DB:-0}" != "1" ]]; then
  if command -v psql >/dev/null 2>&1; then
    echo "10) PostgreSQL 抽检（psql + DATABASE_URL）"
    db_psql_local -c "SELECT id::text FROM orders WHERE id='${OID}'::uuid;" | grep -q "${OID}" || die "order not found in DB"
    db_psql_local -c "SELECT email FROM users WHERE email='${EMAIL}';" | grep -q "${EMAIL}" || die "user email not found in DB"
    MC="$(db_psql_local -tAc "SELECT count(*)::text FROM order_messages WHERE order_id='${OID}'::uuid AND content LIKE '%smoke-ab-core-chain%';")"
    [[ "${MC}" != "0" ]] || die "order_messages row not found for posted content"
    echo "   DB: orders + users + order_messages OK"
  elif docker_pg_ready; then
    echo "10) PostgreSQL 抽检（docker exec ${SMOKE_PG_CONTAINER} psql，无本机 psql）"
    db_psql_docker -c "SELECT id::text FROM orders WHERE id='${OID}'::uuid;" | grep -q "${OID}" || die "order not found in DB"
    db_psql_docker -c "SELECT email FROM users WHERE email='${EMAIL}';" | grep -q "${EMAIL}" || die "user email not found in DB"
    MC="$(db_psql_docker -tAc "SELECT count(*)::text FROM order_messages WHERE order_id='${OID}'::uuid AND content LIKE '%smoke-ab-core-chain%';")"
    [[ "${MC}" != "0" ]] || die "order_messages row not found for posted content"
    echo "   DB: orders + users + order_messages OK"
  else
    echo "10) 跳过 DB 抽检（已设置 DATABASE_URL：请安装 psql，或启动容器 ${SMOKE_PG_CONTAINER} 后重跑；或设 SMOKE_SKIP_DB=1 明确跳过）"
  fi
else
  if [[ "${SMOKE_SKIP_DB:-0}" == "1" ]]; then
    echo "10) 跳过 DB 抽检（SMOKE_SKIP_DB=1）"
  else
    echo "10) 跳过 DB 抽检（未设置 DATABASE_URL 时无法对齐 API 所用库；仅 HTTP 验收）"
  fi
fi

echo ""
echo "OK: A+B 主链 HTTP + 回读一致 通过。邮箱=${EMAIL} 订单=${OID}"
