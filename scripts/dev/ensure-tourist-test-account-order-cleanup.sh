#!/usr/bin/env bash
# ① 本地 · 整理种子游客订单：压缩草稿/进行中 + 清 PG 已取消行（避免列表爆炸与「删了刷新还在」）
#
# 用法（API 已起；DB 清理后若 API 未重启须重启 TravelTrust-API 窗口）：
#   bash scripts/dev/ensure-tourist-test-account-order-cleanup.sh
# 可选：API_BASE EMAIL PASSWORD DRAFT_TARGET=3 IN_PROGRESS_TARGET=2 PURGE_CANCELLED_DB=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
EMAIL="${EMAIL:-tourist@test.com}"
PASSWORD="${PASSWORD:-Test123!}"
DRAFT_TARGET="${DRAFT_TARGET:-3}"
IN_PROGRESS_TARGET="${IN_PROGRESS_TARGET:-2}"
MAX_ROUNDS="${MAX_ROUNDS:-80}"
PURGE_CANCELLED_DB="${PURGE_CANCELLED_DB:-1}"

fail() { echo "ensure-tourist-test-account-order-cleanup: FAIL $*" >&2; exit 1; }
ok() { echo "ensure-tourist-test-account-order-cleanup: OK $*"; }
note() { echo "ensure-tourist-test-account-order-cleanup:     $*"; }

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
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

count_my_orders() {
  local list_body="$1" me_id="$2" mode="$3"
  LIST_BODY="$list_body" ME_ID="$me_id" MODE="$mode" node -e "
    const o=JSON.parse(process.env.LIST_BODY);
    const me=(process.env.ME_ID||'').toLowerCase();
    const mode=process.env.MODE||'';
    const items=(o.items||[]).filter(x=>{
      const tid=String(x.tourist_id||x.traveler_id||'').trim().toLowerCase();
      if(tid!==me) return false;
      const st=String(x.state||x.status||'').trim().toLowerCase();
      if(mode==='draft') return st==='draft';
      if(mode==='in_progress') return ['created','accepted','escrowed','funded','confirmed'].includes(st);
      if(mode==='cancelled') return st==='cancelled'||st==='canceled';
      return true;
    });
    process.stdout.write(String(items.length));
  "
}

pick_order_id() {
  local list_body="$1" me_id="$2" mode="$3"
  LIST_BODY="$list_body" ME_ID="$me_id" MODE="$mode" node -e "
    const o=JSON.parse(process.env.LIST_BODY);
    const me=(process.env.ME_ID||'').toLowerCase();
    const mode=process.env.MODE||'';
    const items=(o.items||[]).filter(x=>{
      const tid=String(x.tourist_id||x.traveler_id||'').trim().toLowerCase();
      if(tid!==me) return false;
      const st=String(x.state||x.status||'').trim().toLowerCase();
      if(mode==='draft') return st==='draft' && x.id;
      if(mode==='in_progress') return ['created','accepted','escrowed'].includes(st) && x.id;
      return false;
    });
    if(!items.length) process.exit(0);
    process.stdout.write(String(items[0].id));
  "
}

echo "== ensure-tourist-test-account-order-cleanup API=$API_BASE email=$EMAIL draft<=$DRAFT_TARGET in_progress<=$IN_PROGRESS_TARGET =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

login="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
login_code="${login%%|*}"
login_body="${login#*|}"
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code body=$login_body"
TOKEN="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o.token??''));" "$login_body")"
[[ -n "$TOKEN" ]] || fail "token missing"

ME_ID="$(node -e "
  const o=JSON.parse(process.argv[1]);
  process.stdout.write(String(o.user?.id??'').trim().toLowerCase());
" "$(curl_json GET "$API_BASE/api/v1/me" "" "$TOKEN" | cut -d'|' -f2)")"
[[ -n "$ME_ID" ]] || fail "GET /me user.id missing"

cancelled_api=0

cancel_until_at_most() {
  local mode="$1" target="$2"
  local list_url count oid cancel cancel_code
  if [[ "$mode" == "draft" ]]; then
    list_url="$API_BASE/api/v1/orders?state=draft&limit=100"
  else
    list_url="$API_BASE/api/v1/orders?limit=200"
  fi
  for ((round=0; round<MAX_ROUNDS; round++)); do
    list="$(curl_json GET "$list_url" "" "$TOKEN")"
    list_code="${list%%|*}"
    list_body="${list#*|}"
    [[ "$list_code" == "200" ]] || fail "GET orders HTTP $list_code body=$list_body"
    count="$(count_my_orders "$list_body" "$ME_ID" "$mode")"
    if [[ "$count" -le "$target" ]]; then
      note "$mode count=$count (target<=$target) api_cancelled=$cancelled_api"
      return 0
    fi
    oid="$(pick_order_id "$list_body" "$ME_ID" "$mode")"
    [[ -n "$oid" ]] || fail "$mode count=$count but no cancellable id"
    cancel="$(curl_json POST "$API_BASE/api/v1/orders/$oid/cancel" "{}" "$TOKEN")"
    cancel_code="${cancel%%|*}"
    [[ "$cancel_code" == "200" ]] || fail "POST cancel $oid HTTP $cancel_code body=${cancel#*|}"
    cancelled_api=$((cancelled_api + 1))
    echo "     cancelled $mode order $oid"
  done
  fail "$mode still above target after $MAX_ROUNDS rounds"
}

# 先释放进行中位，再压草稿（与 E2E ensureTouristItineraryHeadroom 顺序一致）
cancel_until_at_most "in_progress" "$IN_PROGRESS_TARGET"
cancel_until_at_most "draft" "$DRAFT_TARGET"

if [[ "$PURGE_CANCELLED_DB" == "1" ]]; then
  SEED_EMAILS="$EMAIL" bash "$ROOT/scripts/dev/prune-tourist-seed-orders-db.sh" || note "DB prune skipped or failed — cancelled rows may remain until API restart"
  note "若 TravelTrust-API 已在跑：请重启 API 窗口后刷新 /orders，已取消行才会从内存列表消失"
fi

list_summary="$(curl_json GET "$API_BASE/api/v1/orders?limit=200" "" "$TOKEN")"
summary_body="${list_summary#*|}"
draft_n="$(count_my_orders "$summary_body" "$ME_ID" "draft")"
prog_n="$(count_my_orders "$summary_body" "$ME_ID" "in_progress")"
canc_n="$(count_my_orders "$summary_body" "$ME_ID" "cancelled")"
ok "summary draft=$draft_n in_progress=$prog_n cancelled_in_memory=$canc_n api_cancelled=$cancelled_api"
exit 0
