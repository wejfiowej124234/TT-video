#!/usr/bin/env bash
# Phase ② · C12 staging DID / Trust / Reputation interlink API chain（② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起）：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-community-c12-staging-did-interlink.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PASSWORD="Test123!"
# shellcheck source=scripts/dev/lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"
STAMP="$(date +%s)"
HERO_EMAIL="c12-hero-${STAMP}@example.com"
TARGET_EMAIL="c12-target-${STAMP}@example.com"
MARKER="c12-did-interlink-${STAMP}"
PERIOD="all"

fail() { echo "smoke-community-c12-staging-did-interlink: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c12-staging-did-interlink: OK $*"; }

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

json_node() {
  local payload="$1"
  local script="$2"
  shift 2
  local tmp
  tmp="$(mktemp)"
  printf '%s' "$payload" > "$tmp"
  node -e "$script" "$tmp" "$@"
  local rc=$?
  rm -f "$tmp"
  return $rc
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

register_user() {
  local email="$1" nick="$2"
  local reg token uid
  reg="$(smoke_auth_register_curl "$email" "tourist" "{\"nickname\":\"${nick}\"}")"
  [[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]] || fail "register ${email} HTTP ${reg%%|*} body=${reg#*|}"
  token="$(json_field "${reg#*|}" token)"
  uid="$(json_field "${reg#*|}" user_id)"
  [[ -n "$token" && -n "$uid" ]] || fail "register ${email} missing token/user_id"
  echo "${token}|${uid}"
}

probe_did_rank() {
  local path="$1" key="$2"
  local resp
  resp="$(curl_json GET "${API_BASE}${path}?period=${PERIOD}")"
  [[ "${resp%%|*}" == "200" ]] || fail "${path} HTTP ${resp%%|*}"
  node -e "
    const j=JSON.parse(process.argv[1]);
    const k=process.argv[2];
    if(!Array.isArray(j[k])) process.exit(1);
  " "${resp#*|}" "$key" || fail "${path} missing array ${key}"
  ok "${path} 200 + ${key}[]"
}

echo "== smoke-community-c12-staging-did-interlink (② C12) API=$API_BASE =="

for slot in C1 C2 C3 C4 C5 C6 C7 C8 C9 C10 C11; do
  st="$ROOT/evidence/GO_phase2_testnet_20260526/community/${slot}/STATUS.txt"
  [[ -f "$st" ]] || fail "missing evidence ${slot}/STATUS.txt"
  grep -q "^status: PASS" "$st" || fail "${slot} STATUS not PASS"
  ok "evidence ${slot} PASS"
done

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"
ok "health 200"

probe_did_rank "/api/v1/did-rank/travelers" "travelers"
probe_did_rank "/api/v1/did-rank/guides" "guides"
probe_did_rank "/api/v1/did-rank/itineraries" "itineraries"
probe_did_rank "/api/v1/did-rank/providers" "providers"
probe_did_rank "/api/v1/did-rank/acquisitions" "acquisitions"

pool="$(curl_json GET "${API_BASE}/api/v1/did-rank/prize-pool")"
[[ "${pool%%|*}" == "200" ]] || fail "prize-pool HTTP ${pool%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  if(j.status!=='ok') process.exit(1);
  if(typeof j.monthly_amount!=='number') process.exit(1);
" "${pool#*|}" || fail "prize-pool shape invalid"
ok "prize-pool 200 ok"

guest_feed="$(curl_json GET "${API_BASE}/api/v1/community/feed?limit=30")"
[[ "${guest_feed%%|*}" == "200" ]] || fail "guest feed HTTP ${guest_feed%%|*}"
SHOWCASE_USER_ID="$(json_node "${guest_feed#*|}" '
  const j=JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const posts=j.posts||[];
  const p=posts.find(x=>x.user_id && x.author_nickname);
  process.stdout.write(p?String(p.user_id):"");
')"
[[ -n "$SHOWCASE_USER_ID" ]] || fail "no showcase user in feed sample"
ok "showcase_user_id=$SHOWCASE_USER_ID"

IFS='|' read -r HERO_TOKEN HERO_ID <<< "$(register_user "$HERO_EMAIL" "C12 Hero")"
IFS='|' read -r TARGET_TOKEN TARGET_ID <<< "$(register_user "$TARGET_EMAIL" "C12 Target")"
ok "registered hero=$HERO_ID target=$TARGET_ID"

hero_me="$(curl_json GET "${API_BASE}/api/v1/me" "" "$HERO_TOKEN")"
[[ "${hero_me%%|*}" == "200" ]] || fail "GET /me HTTP ${hero_me%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  if(!j.user || !j.user.id) process.exit(1);
  const tr=j.trust;
  if(!tr || typeof tr!=='object') process.exit(1);
  if(typeof tr.identity_status!=='string') process.exit(1);
  if(typeof tr.risk_level!=='string') process.exit(1);
" "${hero_me#*|}" || fail "GET /me trust block invalid"
TRUST_IDENTITY="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(String(j.trust?.identity_status??''));" "${hero_me#*|}")"
TRUST_RISK="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(String(j.trust?.risk_level??''));" "${hero_me#*|}")"
ok "GET /me trust identity_status=$TRUST_IDENTITY risk_level=$TRUST_RISK"

target_me="$(curl_json GET "${API_BASE}/api/v1/me" "" "$TARGET_TOKEN")"
[[ "${target_me%%|*}" == "200" ]] || fail "target GET /me HTTP ${target_me%%|*}"
TARGET_ROLE="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(String(j.user?.role??''));" "${target_me#*|}")"
[[ -n "$TARGET_ROLE" ]] || fail "target role missing"
ok "target role=$TARGET_ROLE"

follow="$(curl_json POST "${API_BASE}/api/v1/community/users/${TARGET_ID}/follow" "" "$HERO_TOKEN")"
[[ "${follow%%|*}" == "200" ]] || fail "follow HTTP ${follow%%|*}"
ok "hero follows target (identity + social coexist)"

following="$(curl_json GET "${API_BASE}/api/v1/community/me/following?limit=20" "" "$HERO_TOKEN")"
[[ "${following%%|*}" == "200" ]] || fail "me/following HTTP ${following%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const id=process.argv[2];
  const row=(j.following||[]).find(u=>String(u.id)===id);
  if(!row) process.exit(1);
  if(!row.nickname && !row.id) process.exit(1);
" "${following#*|}" "$TARGET_ID" || fail "following row missing identity fields"
ok "following list identity fields present"

post_body="$(node -e "process.stdout.write(JSON.stringify({body:process.argv[1],post_type:'text'}));" "$MARKER")"
post="$(curl_json POST "${API_BASE}/api/v1/community/posts" "$post_body" "$TARGET_TOKEN")"
[[ "${post%%|*}" == "200" ]] || fail "create post HTTP ${post%%|*}"
POST_ID="$(json_field "${post#*|}" id)"
[[ -n "$POST_ID" ]] || fail "post id missing"
ok "target post $POST_ID"

feed_after="$(curl_json GET "${API_BASE}/api/v1/community/feed?limit=50")"
[[ "${feed_after%%|*}" == "200" ]] || fail "feed after post HTTP ${feed_after%%|*}"
json_node "${feed_after#*|}" '
  const j=JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const marker=process.argv[2];
  const uid=process.argv[3];
  const p=(j.posts||[]).find(x=>String(x.body||"")===marker);
  if(!p) process.exit(1);
  if(String(p.user_id)!==uid) process.exit(1);
  if(!p.author_nickname) process.exit(1);
  if(!p.author_role) process.exit(1);
' "$MARKER" "$TARGET_ID" || fail "feed post missing author identity fields"
ok "feed author_nickname + author_role consistent"

post_detail="$(curl_json GET "${API_BASE}/api/v1/community/posts/${POST_ID}")"
[[ "${post_detail%%|*}" == "200" ]] || fail "post detail HTTP ${post_detail%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const uid=process.argv[2];
  const p=j.post||j;
  if(String(p.user_id)!==uid) process.exit(1);
  if(!p.author_role) process.exit(1);
" "${post_detail#*|}" "$TARGET_ID" || fail "post detail identity mismatch"
ok "post detail author_role consistent"

user_posts="$(curl_json GET "${API_BASE}/api/v1/community/users/${TARGET_ID}/posts?limit=10")"
[[ "${user_posts%%|*}" == "200" ]] || fail "user posts HTTP ${user_posts%%|*}"
json_node "${user_posts#*|}" '
  const j=JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
  const marker=process.argv[2];
  const posts=j.posts||[];
  if(!posts.some(p=>String(p.body||"")===marker)) process.exit(1);
' "$MARKER" || fail "profile posts surface missing marker"
ok "profile posts surface includes marker"

echo "hero_email=${HERO_EMAIL}"
echo "target_email=${TARGET_EMAIL}"
echo "hero_user_id=${HERO_ID}"
echo "target_user_id=${TARGET_ID}"
echo "showcase_user_id=${SHOWCASE_USER_ID}"
echo "marker=${MARKER}"
echo "post_id=${POST_ID}"
echo "trust_identity_status=${TRUST_IDENTITY}"
echo "trust_risk_level=${TRUST_RISK}"
echo "target_role=${TARGET_ROLE}"
echo "TT_COMMUNITY_C12_STAGING_DID_INTERLINK_API: OK"
