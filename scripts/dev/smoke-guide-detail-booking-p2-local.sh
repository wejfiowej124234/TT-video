#!/usr/bin/env bash
# ① GD-L5-P2 · 向导预约业务闭环：冲突 · 接单占档 · 取消释放 · 改期
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/dev/lib/release-seed-guide-slot.sh
source "$ROOT/scripts/dev/lib/release-seed-guide-slot.sh"
# shellcheck source=scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh
source "$ROOT/scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
RESTART_API="${RESTART_API:-1}"
PASSWORD="Test123!"
TOURIST_EMAIL="tourist@test.com"
# Trust-gate 杭州种子向导（内存 + 公众 catalog 可见；与 guide@test.com 不同账号）
GUIDE_EMAIL="${GUIDE_EMAIL:-tg_guide_main@trustgate-e2e.local}"
GUIDE_ID="${GUIDE_ID:-f0e0b101-0001-4001-8001-000000000001}"
API_LOG="${TMPDIR:-/tmp}/gd-l5-p2-booking-api-$$.log"
API_PIDFILE="${TMPDIR:-/tmp}/gd-l5-p2-booking-api-$$.pid"

fail() { echo "GD-L5-P2-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "GD-L5-P2-smoke: OK $*"; }

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

json_nested() {
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$1" "$2"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

future_trip() {
  node -e "
    const d=new Date();
    d.setDate(d.getDate()+14);
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    const start=\`\${y}-\${m}-\${day}\`;
    d.setDate(d.getDate()+2);
    const y2=d.getFullYear();
    const m2=String(d.getMonth()+1).padStart(2,'0');
    const day2=String(d.getDate()).padStart(2,'0');
    const end=\`\${y2}-\${m2}-\${day2}\`;
    process.stdout.write(start+'|'+end);
  "
}

ranges_cover() {
  node -e "
    const ranges=JSON.parse(process.argv[1]).occupied_ranges||[];
    const s=process.argv[2], e=process.argv[3];
    const hit=ranges.some(r=>r.start_date<=e && r.end_date>=s);
    process.stdout.write(hit?'1':'0');
  " "$1" "$2" "$3"
}

kill_api_8080() {
  local pid
  pid="$(netstat -ano 2>/dev/null | grep ':8080' | grep LISTENING | awk '{print $NF}' | head -1 || true)"
  if [[ -n "$pid" ]]; then
    taskkill //F //PID "$pid" 2>/dev/null || true
    sleep 2
  fi
}

wait_api_health() {
  local i
  for i in $(seq 1 90); do
    if curl -sf --max-time 4 "${API_BASE}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  fail "API health timeout (${API_BASE}/health)"
}

start_fresh_api() {
  kill_api_8080
  if [[ -f "$ROOT/.env" ]]; then
    local line
    line="$(grep -E '^DATABASE_URL=' "$ROOT/.env" | head -1 || true)"
    if [[ -n "$line" ]]; then
      export DATABASE_URL="${line#DATABASE_URL=}"
      DATABASE_URL="${DATABASE_URL%$'\r'}"
    fi
  fi
  export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
  export DID_RANK_SEED_MARKET_DEMO="${DID_RANK_SEED_MARKET_DEMO:-1}"
  export PORT=8080
  export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
  export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
  export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
  export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"
  echo "Starting traveltrust-api (P2 fresh) ..."
  cargo run -p traveltrust-api >"$API_LOG" 2>&1 &
  echo $! >"$API_PIDFILE"
  wait_api_health
  ok "API restarted (pid=$(cat "$API_PIDFILE"), log=$API_LOG)"
}

cleanup_api() {
  if [[ "${RESTART_API}" != "1" ]]; then
    return 0
  fi
  if [[ -f "$API_PIDFILE" ]]; then
    local pid
    pid="$(cat "$API_PIDFILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]]; then
      taskkill //F //PID "$pid" 2>/dev/null || true
    fi
    rm -f "$API_PIDFILE"
  fi
}
trap cleanup_api EXIT

login_token() {
  local email="$1"
  local resp code body
  resp="$(curl_json POST "${API_BASE}/auth/login" "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")"
  code="${resp%%|*}"
  body="${resp#*|}"
  [[ "$code" == "200" ]] || fail "login ${email} HTTP $code"
  json_field "$body" token
}

release_guide_orders() {
  local email="$1"
  node -e "
    const api=process.argv[1], email=process.argv[2], pwd=process.argv[3];
    const idem=()=>require('crypto').randomUUID();
    (async()=>{
      const lr=await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:pwd})});
      if(!lr.ok) return;
      const {token}=await lr.json();
      if(!token) return;
      const or=await fetch(api+'/api/v1/orders',{headers:{Authorization:'Bearer '+token}});
      if(!or.ok) return;
      const {items=[]}=await or.json();
      for (const row of items) {
        const id=String(row.id||'').trim();
        if(!id) continue;
        const st=String(row.state||row.status||'').toLowerCase();
        const opts={method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json','Idempotency-Key':idem()}};
        if(st==='escrowed'){
          await fetch(api+'/api/v1/orders/'+encodeURIComponent(id)+'/confirm-completion',{...opts,body:'{}'}).catch(()=>{});
        } else if(['draft','open','created','accepted'].includes(st)){
          await fetch(api+'/api/v1/orders/'+encodeURIComponent(id)+'/cancel',{...opts,body:'{}'}).catch(()=>{});
        }
      }
    })();
  " "$API_BASE" "$email" "$PASSWORD" >/dev/null 2>&1 || true
}

echo "== GD-L5-P2 guide booking closure smoke (①) API=${API_BASE} =="

if [[ "$RESTART_API" == "1" ]]; then
  clear_hangzhou_seed_guide_slots_db || true
  start_fresh_api
else
  health="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || true)"
  [[ "$health" == "200" ]] || fail "API /health not 200 (got $health); set RESTART_API=1"
fi

curl_json POST "${API_BASE}/auth/seed-test-accounts" "{}" >/dev/null || true
release_seed_guide_slot "$API_BASE"
release_guide_orders "$GUIDE_EMAIL"
release_guide_orders "$TOURIST_EMAIL"

TOURIST_TOKEN="$(login_token "$TOURIST_EMAIL")"
GUIDE_TOKEN="$(login_token "$GUIDE_EMAIL")"
[[ -n "$GUIDE_TOKEN" ]] || fail "guide token empty (${GUIDE_EMAIL})"
probe="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}" "" "$TOURIST_TOKEN")"
[[ "${probe%%|*}" == "200" ]] || fail "GET /guides/${GUIDE_ID} not reachable (${probe#*|})"
ok "guide_id=${GUIDE_ID} (${GUIDE_EMAIL})"

TRIP="$(future_trip)"
START="${TRIP%%|*}"
END="${TRIP#*|}"

detail="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}" "" "$TOURIST_TOKEN")"
[[ "${detail%%|*}" == "200" ]] || fail "GET guide detail"
body="${detail#*|}"
node -e "
  const g=JSON.parse(process.argv[1]).guide||{};
  if(!('rating' in g) || !('completedCount' in g)) process.exit(1);
" "$body" || fail "guide decision stats missing"
ok "GET /guides/:id decision stats (rating, completedCount)"

avail0="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$TOURIST_TOKEN")"
[[ "${avail0%%|*}" == "200" ]] || fail "GET availability"

IDEM1="$(node -e "process.stdout.write(require('crypto').randomUUID())")"
create1="$(curl_json POST "${API_BASE}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"88.01\",\"currency\":\"USD\",\"start_date\":\"${START}\",\"end_date\":\"${END}\"}" \
  "$TOURIST_TOKEN")"
[[ "${create1%%|*}" == "200" || "${create1%%|*}" == "201" ]] || fail "POST order1 ${create1#*|}"
ORDER1="$(json_nested "${create1#*|}" "order.id")"
[[ -n "$ORDER1" ]] || fail "order1 id"
ok "POST /orders with trip dates"

avail_created="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$TOURIST_TOKEN")"
[[ "$(ranges_cover "${avail_created#*|}" "$START" "$END")" == "0" ]] || fail "Created should not show on calendar yet"
ok "Created order not on calendar (matrix)"

accept="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER1}/accept" "{}" "$GUIDE_TOKEN")"
[[ "${accept%%|*}" == "200" ]] || fail "accept ${accept#*|}"
ok "guide accept"

avail_accept="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$TOURIST_TOKEN")"
[[ "$(ranges_cover "${avail_accept#*|}" "$START" "$END")" == "1" ]] || fail "Accepted should show on calendar"
ok "Accepted trip on calendar"

conflict="$(curl_json POST "${API_BASE}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"88.99\",\"currency\":\"USD\",\"start_date\":\"${START}\",\"end_date\":\"${END}\"}" \
  "$TOURIST_TOKEN")"
[[ "${conflict%%|*}" == "409" ]] || fail "overlapping POST should 409 (got ${conflict%%|*})"
node -e "
  const o=JSON.parse(process.argv[1]);
  const ok=['schedule_conflict','guide_has_active_order'].includes(o.error);
  if(!ok) process.exit(1);
" "${conflict#*|}" || fail "409 body.error not schedule_conflict|guide_has_active_order"
ok "POST 409 on overlapping trip (schedule conflict)"

NEW_START="$(node -e "
  const [y,m,d]=process.argv[1].split('-').map(Number);
  const dt=new Date(y,m-1,d+5);
  process.stdout.write(dt.toISOString().slice(0,10));
" "$START")"
NEW_END="$(node -e "
  const [y,m,d]=process.argv[1].split('-').map(Number);
  const dt=new Date(y,m-1,d+7);
  process.stdout.write(dt.toISOString().slice(0,10));
" "$END")"
patch="$(curl_json PATCH "${API_BASE}/api/v1/orders/${ORDER1}/trip-dates" \
  "{\"start_date\":\"${NEW_START}\",\"end_date\":\"${NEW_END}\"}" "$TOURIST_TOKEN")"
[[ "${patch%%|*}" == "200" ]] || fail "PATCH trip-dates ${patch#*|}"
ok "PATCH trip-dates reschedule"

avail_resched="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$TOURIST_TOKEN")"
[[ "$(ranges_cover "${avail_resched#*|}" "$NEW_START" "$NEW_END")" == "1" ]] || fail "rescheduled range not on calendar"
[[ "$(ranges_cover "${avail_resched#*|}" "$START" "$END")" == "0" ]] || fail "old range still on calendar"
ok "reschedule migrated calendar range"

cancel="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER1}/cancel" "{}" "$TOURIST_TOKEN")"
[[ "${cancel%%|*}" == "200" ]] || fail "cancel ${cancel#*|}"
ok "tourist cancel"

avail_cancel="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$TOURIST_TOKEN")"
[[ "$(ranges_cover "${avail_cancel#*|}" "$NEW_START" "$NEW_END")" == "0" ]] || fail "cancelled range still on calendar"
ok "cancel released calendar"

IDEM2="$(node -e "process.stdout.write(require('crypto').randomUUID())")"
create2="$(curl_json POST "${API_BASE}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"88.02\",\"currency\":\"USD\",\"start_date\":\"${START}\",\"end_date\":\"${END}\"}" \
  "$TOURIST_TOKEN")"
[[ "${create2%%|*}" == "200" || "${create2%%|*}" == "201" ]] || fail "POST order2 after cancel"
ORDER2="$(json_nested "${create2#*|}" "order.id")"
accept2="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER2}/accept" "{}" "$GUIDE_TOKEN")"
[[ "${accept2%%|*}" == "200" ]] || fail "accept2"
ok "re-book after cancel release"

cd "$ROOT/frontend"
npx vitest run lib/l5/guideBookingP2.contract.test.ts lib/guideBookingDates.test.ts --reporter=dot >/dev/null
ok "vitest P2 contract green"

echo ""
echo "TT_GD_L5_BOOKING_P2_SMOKE: OK (① local · conflict·accept·reschedule·cancel·decision-stats)"
exit 0
