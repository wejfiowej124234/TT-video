#!/usr/bin/env bash
# ① 本地 · 发布中心 /me/publish L5 演示数据（唯一账号 multi-demo@test.com）
#
# 内容对齐 manifest：frontend/evidence/GO_local_auth_l5/publish-hub-multi-demo-seed-manifest.v1.json
# ② 测试网：G-1/G-2 清闸后可按 manifest 复灌同账号 · 本轮不触网
#
# 用法（仓库根）：
#   bash scripts/dev/seed-publish-hub-multi-demo-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SEED_PUBLISH_HUB_ARCHIVE_LEGACY=1   # 归档旧 "Publish Hub demo" listing（默认 1）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
EMAIL="multi-demo@test.com"
PASSWORD="Test123!"
MULTI_DEMO_WALLET="0x104FCb93B5e097F92c93Ee4621C487C6C953D212"
GOV_CHAIN_ID="${TRAVELTRUST_CHAIN_ID:-31337}"
ARCHIVE_LEGACY="${SEED_PUBLISH_HUB_ARCHIVE_LEGACY:-1}"

# L5 固定文案（与 manifest 同源 · 不含时间戳）
TRIP_DEST="日本"
TRIP_CITY="京都"
TRIP_DATE="2026-11-08"
MERCHANT_TITLE="西溪印象城 · 旅拍写真套餐"
ACQ_TITLE="京都限量版手办代购 · 悬赏任务"
MERCHANT_COVER="http://127.0.0.1:19000/traveltrust-community-media/dev/publish-hub-merchant-cover.jpg"
ACQ_COVER="http://127.0.0.1:19000/traveltrust-community-media/dev/publish-hub-acquisition-cover.jpg"
GOV_TITLE_1="TT-华东 · 区域手续费参数校准"
GOV_TITLE_2="社区内容治理 · 投票委托说明更新"
COMM_POST_1="多重身份演示 · 京都手办收购经验分享：发布悬赏后可在「收购任务 listing」轨查看进度，承运方接单走托管流程。"
COMM_POST_2="杭州旅拍工作室 · 橱窗上新：西溪印象城旅拍套餐已上架，欢迎在市场子站浏览详情。"

fail() { echo "seed-publish-hub-multi-demo: FAIL $*" >&2; exit 1; }
ok() { echo "seed-publish-hub-multi-demo: OK $*"; }
warn() { echo "seed-publish-hub-multi-demo: WARN $*" >&2; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

json_nested() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$json" "$path"
}

write_json_temp() {
  local tmp
  tmp="$(mktemp)"
  node -e "const fs=require('fs'); fs.writeFileSync(process.argv[1], JSON.stringify(JSON.parse(process.argv[2])));" "$tmp" "$1"
  echo "$tmp"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code body_file=""
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    body_file="$(mktemp)"
    printf '%s' "$body" > "$body_file"
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json; charset=utf-8" -H "Authorization: Bearer $auth" -d @"$body_file")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json; charset=utf-8" -d @"$body_file")"
    fi
    rm -f "$body_file"
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

listing_has_cover() {
  local json="$1" needle="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const needle=process.argv[2];
    const row=(o.published||[]).find(r=>String(r.title||'').includes(needle));
    if(!row) { process.stdout.write('missing'); }
    else {
      const c=row.cover_url;
      process.stdout.write(typeof c==='string' && c.trim() ? 'yes' : 'no');
    }
  " "$json" "$needle"
}

archive_listing_by_title() {
  local token="$1" get_path="$2" archive_prefix="$3" title_needle="$4"
  local get_out body
  get_out="$(curl_json GET "$API_BASE$get_path" "" "$token")"
  [[ "${get_out%%|*}" == "200" ]] || return 0
  body="${get_out#*|}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const needle=process.argv[2];
    for (const r of o.published||[]) {
      if (String(r.title||'').includes(needle)) console.log(r.id);
    }
  " "$body" "$title_needle" | while read -r lid; do
    [[ -z "$lid" ]] && continue
    curl_json POST "$API_BASE/api/v1/market/${archive_prefix}/listings/${lid}/archive" "{}" "$token" >/dev/null || true
  done
}

ensure_merchant_listing_l5() {
  local token="$1"
  local get_out body state
  get_out="$(curl_json GET "$API_BASE/api/v1/me/merchant-listings" "" "$token")"
  body="${get_out#*|}"
  state="$(listing_has_cover "$body" "$MERCHANT_TITLE")"
  if [[ "$state" == "yes" ]]; then
    ok "merchant listing already present (with cover)"
    return 0
  fi
  if [[ "$state" == "no" ]]; then
    archive_listing_by_title "$token" "/api/v1/me/merchant-listings" provider "$MERCHANT_TITLE"
  fi
  MERCH_TMP="$(write_json_temp "{\"payload\":{\"kind\":\"merchant_showcase_studio_v1\",\"title\":\"${MERCHANT_TITLE}\",\"city\":\"杭州\",\"category\":\"travel\",\"description\":\"含精修 20 张 · 西溪湿地外景 · 可约周末档\",\"cover_url\":\"${MERCHANT_COVER}\"}}")"
  merchant_out="$(curl_json POST "$API_BASE/api/v1/market/provider/listings" "$(cat "$MERCH_TMP")" "$TOKEN")"
  rm -f "$MERCH_TMP"
  [[ "${merchant_out%%|*}" == "200" || "${merchant_out%%|*}" == "201" ]] \
    || fail "POST merchant listing HTTP ${merchant_out%%|*} body=${merchant_out#*|}"
  ok "merchant listing · ${MERCHANT_TITLE}"
}

ensure_acquisition_listing_l5() {
  local token="$1"
  local get_out body state code
  get_out="$(curl_json GET "$API_BASE/api/v1/me/acquisition-listings" "" "$token")"
  code="${get_out%%|*}"
  body="${get_out#*|}"
  if [[ "$code" != "200" ]]; then
    ACQ_TMP="$(write_json_temp "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"${ACQ_TITLE}\",\"bountyMinUsdc\":180,\"bountyMaxUsdc\":520,\"description\":\"限定款手办 · 须保留原盒 · 东京池袋面交或邮寄\",\"cover_url\":\"${ACQ_COVER}\"}}")"
    acq_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings" "$(cat "$ACQ_TMP")" "$TOKEN")"
    rm -f "$ACQ_TMP"
    [[ "${acq_out%%|*}" == "200" || "${acq_out%%|*}" == "201" ]] \
      || fail "POST acquisition listing HTTP ${acq_out%%|*} body=${acq_out#*|}"
    ok "acquisition listing · ${ACQ_TITLE}"
    return 0
  fi
  state="$(listing_has_cover "$body" "$ACQ_TITLE")"
  if [[ "$state" == "yes" ]]; then
    ok "acquisition listing already present (with cover)"
    return 0
  fi
  if [[ "$state" == "no" ]]; then
    archive_listing_by_title "$token" "/api/v1/me/acquisition-listings" acquisition "$ACQ_TITLE"
  fi
  ACQ_TMP="$(write_json_temp "{\"agree_escrow_copy\":true,\"payload\":{\"kind\":\"acquisition_carry_studio_v1\",\"title\":\"${ACQ_TITLE}\",\"bountyMinUsdc\":180,\"bountyMaxUsdc\":520,\"description\":\"限定款手办 · 须保留原盒 · 东京池袋面交或邮寄\",\"cover_url\":\"${ACQ_COVER}\"}}")"
  acq_out="$(curl_json POST "$API_BASE/api/v1/market/acquisition/listings" "$(cat "$ACQ_TMP")" "$TOKEN")"
  rm -f "$ACQ_TMP"
  [[ "${acq_out%%|*}" == "200" || "${acq_out%%|*}" == "201" ]] \
    || fail "POST acquisition listing HTTP ${acq_out%%|*} body=${acq_out#*|}"
  ok "acquisition listing · ${ACQ_TITLE}"
}

archive_legacy_listings() {
  local token="$1" variant="$2" get_path="$3" archive_prefix="$4"
  local get_out code body
  get_out="$(curl_json GET "$API_BASE$get_path" "" "$token")"
  code="${get_out%%|*}"
  body="${get_out#*|}"
  [[ "$code" == "200" ]] || return 0
  node -e "
    const o=JSON.parse(process.argv[1]);
    const prefix=process.argv[2];
    for (const r of o.published||[]) {
      const t=String(r.title||'');
      if (t.includes('Publish Hub demo') || t.includes('Multi-demo')) {
        console.log(r.id);
      }
    }
  " "$body" "$archive_prefix" | while read -r lid; do
    [[ -z "$lid" ]] && continue
    curl_json POST "$API_BASE/api/v1/market/${archive_prefix}/listings/${lid}/archive" "{}" "$token" >/dev/null || true
  done
}

seed_governance_proposals_for_multi_demo() {
  if [[ -z "${DATABASE_URL:-}" ]]; then
    warn "DATABASE_URL unset — skip governance proposer seed"
    return 0
  fi
  local proposer_hex="${MULTI_DEMO_WALLET#0x}"
  proposer_hex="$(echo "$proposer_hex" | tr '[:upper:]' '[:lower:]')"
  local title1 title2
  title1="$(printf '%s' "$GOV_TITLE_1" | sed "s/'/''/g")"
  title2="$(printf '%s' "$GOV_TITLE_2" | sed "s/'/''/g")"
  local sql="
UPDATE governance_proposals_projection
SET proposer = decode('${proposer_hex}', 'hex'),
    title = '${title1}',
    chain_state = 'active',
    updated_at = now()
WHERE chain_id = ${GOV_CHAIN_ID}
  AND proposal_id = '911919911919911919911919911919911919'::numeric;
INSERT INTO governance_proposals_projection (
  chain_id, proposal_id, proposer, snapshot_block, vote_start_block, vote_end_block,
  title, for_votes, against_votes, abstain_votes, chain_state, operation_id, updated_at
) VALUES (
  ${GOV_CHAIN_ID},
  (920000000000000000000000000000000002)::numeric,
  decode('${proposer_hex}', 'hex'),
  1, 1, 999999999,
  '${title2}',
  0, 0, 0, 'active', NULL, now()
)
ON CONFLICT (chain_id, proposal_id) DO UPDATE SET
  proposer = EXCLUDED.proposer,
  title = EXCLUDED.title,
  updated_at = now();
"
  if command -v psql >/dev/null 2>&1; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "$sql" >/dev/null \
      && ok "governance proposals (L5 titles · proposer=$MULTI_DEMO_WALLET)" \
      || warn "governance PG seed failed (non-fatal)"
    return 0
  fi
  if docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
    docker exec -i traveltrust-postgres psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 -c "$sql" >/dev/null \
      && ok "governance proposals (L5 titles · docker psql)" \
      || warn "governance PG seed via docker failed (non-fatal)"
    return 0
  fi
  warn "psql unavailable — skip governance proposer seed"
}

echo "== seed-publish-hub-multi-demo-local (① L5 · manifest v1) API=$API_BASE =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

curl_json POST "$API_BASE/auth/seed-test-accounts" "{}" >/dev/null
curl_json POST "$API_BASE/auth/seed-governance-e2e" "{}" >/dev/null
ok "seed accounts + governance e2e"

login_out="$(curl_json POST "$API_BASE/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")"
login_code="${login_out%%|*}"
login_body="${login_out#*|}"
[[ "$login_code" == "200" ]] || fail "login HTTP $login_code"
TOKEN="$(json_field "$login_body" token)"
[[ -n "$TOKEN" ]] || fail "token missing"
ok "login $EMAIL"

if [[ "$ARCHIVE_LEGACY" == "1" ]]; then
  archive_legacy_listings "$TOKEN" provider "/api/v1/me/merchant-listings" provider
  archive_legacy_listings "$TOKEN" acquisition "/api/v1/me/acquisition-listings" acquisition
  ok "archived legacy Publish Hub demo listings (if any)"
fi

# —— 行程预览（幂等：已有京都草稿则跳过）
trip_get="$(curl_json GET "$API_BASE/api/v1/orders?business_line=trip&hat=traveler&limit=20" "" "$TOKEN")"
trip_body="${trip_get#*|}"
has_kyoto="$(node -e "
  const o=JSON.parse(process.argv[1]);
  const hit=(o.items||[]).some(x=>String(x.city||x.destination||'').includes('京都')||String(x.destination||'').includes('日本'));
  process.stdout.write(hit?'yes':'no');
" "$trip_body")"
if [[ "$has_kyoto" == "yes" ]]; then
  ok "trip draft already present (京都/日本)"
else
  ITIN_TMP="$(write_json_temp "{\"destination\":\"${TRIP_DEST}\",\"city\":\"${TRIP_CITY}\",\"travel_date\":\"${TRIP_DATE}\",\"days\":6,\"cities\":[\"京都\",\"奈良\"],\"budget_min\":1200}")"
  itin_out="$(curl_json POST "$API_BASE/api/v1/itineraries" "$(cat "$ITIN_TMP")" "$TOKEN")"
  rm -f "$ITIN_TMP"
  itin_code="${itin_out%%|*}"
  [[ "$itin_code" == "200" || "$itin_code" == "201" || "$itin_code" == "409" ]] \
    || fail "POST itineraries HTTP $itin_code body=${itin_out#*|}"
  ok "trip draft (${TRIP_CITY} · ${TRIP_DATE})"
fi

# —— 商家橱窗（L5 · 含 cover_url）
ensure_merchant_listing_l5 "$TOKEN"

# —— 收购任务（L5 · 含 cover_url）
ensure_acquisition_listing_l5 "$TOKEN"

# —— 社区帖（各 1 条 · 按正文前缀幂等）
for idx in 1 2; do
  body_text="$COMM_POST_1"
  [[ "$idx" == "2" ]] && body_text="$COMM_POST_2"
  comm_check="$(curl_json GET "$API_BASE/api/v1/community/me/posts?limit=20&visibility=all" "" "$TOKEN")"
  comm_check_body="${comm_check#*|}"
  has_post="$(node -e "
    const o=JSON.parse(process.argv[1]);
    const p=process.argv[2];
    process.stdout.write((o.posts||[]).some(x=>String(x.body||'').startsWith(p.slice(0,24)))?'yes':'no');
  " "$comm_check_body" "$body_text")"
  if [[ "$has_post" == "yes" ]]; then
    ok "community post #${idx} already present"
    continue
  fi
  [[ "$idx" -gt 1 ]] && sleep 2
  POST_TMP="$(mktemp)"
  node -e "const fs=require('fs'); fs.writeFileSync(process.argv[1], JSON.stringify({body:process.argv[2],post_type:'text'}));" "$POST_TMP" "$body_text"
  post_out="$(curl_json POST "$API_BASE/api/v1/community/posts" "$(cat "$POST_TMP")" "$TOKEN")"
  rm -f "$POST_TMP"
  [[ "${post_out%%|*}" == "200" || "${post_out%%|*}" == "201" ]] \
    || fail "POST community post HTTP ${post_out%%|*} body=${post_out#*|}"
  ok "community post #${idx}"
done

export MULTI_DEMO_WALLET GOV_CHAIN_ID
seed_governance_proposals_for_multi_demo

# —— 读回
merch_final="$(curl_json GET "$API_BASE/api/v1/me/merchant-listings" "" "$TOKEN")"
acq_final="$(curl_json GET "$API_BASE/api/v1/me/acquisition-listings" "" "$TOKEN")"
gov_final="$(curl_json GET "$API_BASE/api/v1/governance/proposals?mine=1" "" "$TOKEN")"
comm_final="$(curl_json GET "$API_BASE/api/v1/community/me/posts?limit=5&visibility=all" "" "$TOKEN")"

node -e "
const m=JSON.parse(process.argv[1]);
const a=JSON.parse(process.argv[2]);
const g=JSON.parse(process.argv[3]);
const c=JSON.parse(process.argv[4]);
console.log(JSON.stringify({
  merchant_published: (m.published||[]).length,
  acquisition_published: (a.published||[]).length,
  governance_mine: (g.items||[]).length,
  community_posts: (c.posts||[]).length,
}, null, 2));
" "${merch_final#*|}" "${acq_final#*|}" "${gov_final#*|}" "${comm_final#*|}"

echo ""
echo "TT_PUBLISH_HUB_SEED: OK phase=① account=$EMAIL manifest=publish-hub-multi-demo-seed-manifest.v1.json"
echo "  刷新 http://localhost:3012/me/publish · 提案 tab / 打开提案中心 / 新建提案 → /governance/proposals/new"
if [[ "${acq_final%%|*}" == "404" ]]; then
  echo "  WARN: GET /me/acquisition-listings 404 — 重启 API 后收购轨才可见"
fi
