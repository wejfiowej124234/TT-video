#!/usr/bin/env bash
# Phase ② · C6 staging social graph E2E（关注 · 粉丝 · 私信 · 通知 · Feed/Profile · ② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起 · TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 推荐）：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-community-c6-staging-social-graph.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
EMAIL_A="c6-follower-${STAMP}@example.com"
EMAIL_B="c6-author-${STAMP}@example.com"
PASSWORD="Test123!"
MARKER="c6-staging-social-${STAMP}"
DM_MARKER="c6-dm-${STAMP}"

fail() { echo "smoke-community-c6-staging-social-graph: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c6-staging-social-graph: OK $*"; }

# shellcheck source=scripts/dev/lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
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
  [[ -z "$uid" ]] && uid="$(node -e "
    const j=JSON.parse(process.argv[1]);
    process.stdout.write(String(j.user?.id||j.id||''));
  " "${reg#*|}")"
  [[ -n "$token" && -n "$uid" ]] || fail "register ${email} missing token/user_id"
  echo "${token}|${uid}"
}

assert_posts_include_id() {
  local label="$1" json_body="$2" post_id="$3"
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' \
    C6_ASSERT_LABEL="$label" \
    C6_ASSERT_POST_ID="$post_id" \
    node -e "
    const fs = require('fs');
    const j = JSON.parse(fs.readFileSync(0, 'utf8'));
    const id = process.env.C6_ASSERT_POST_ID;
    const label = process.env.C6_ASSERT_LABEL;
    if (!(j.posts || []).some(p => String(p.id) === id)) {
      console.error('post not in ' + label);
      process.exit(1);
    }
  " <<<"$json_body"
}

assert_following_includes() {
  local json_body="$1" user_id="$2"
  node -e "
    const j=JSON.parse(process.argv[1]);
    const id=process.argv[2];
    if(!(j.following||[]).some(u=>String(u.id)===id)) process.exit(1);
  " "$json_body" "$user_id"
}

assert_followers_includes() {
  local json_body="$1" user_id="$2"
  node -e "
    const j=JSON.parse(process.argv[1]);
    const id=process.argv[2];
    if(!(j.followers||[]).some(u=>String(u.id)===id)) process.exit(1);
  " "$json_body" "$user_id"
}

echo "== smoke-community-c6-staging-social-graph (② C6) API=$API_BASE =="

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"
ok "health 200"

IFS='|' read -r TOKEN_A USER_A <<< "$(register_user "$EMAIL_A" "TT C6 Follower")"
IFS='|' read -r TOKEN_B USER_B <<< "$(register_user "$EMAIL_B" "TT C6 Author")"
ok "registered follower=$USER_A author=$USER_B"

# A follows B
follow="$(curl_json POST "${API_BASE}/api/v1/community/users/${USER_B}/follow" "" "$TOKEN_A")"
[[ "${follow%%|*}" == "200" ]] || fail "follow HTTP ${follow%%|*}"
ok "A followed B"

following="$(curl_json GET "${API_BASE}/api/v1/community/me/following?limit=20" "" "$TOKEN_A")"
[[ "${following%%|*}" == "200" ]] || fail "me/following HTTP ${following%%|*}"
assert_following_includes "${following#*|}" "$USER_B" || fail "B not in A following"
ok "following list includes B"

followers="$(curl_json GET "${API_BASE}/api/v1/community/me/followers?limit=20" "" "$TOKEN_B")"
[[ "${followers%%|*}" == "200" ]] || fail "me/followers HTTP ${followers%%|*}"
assert_followers_includes "${followers#*|}" "$USER_A" || fail "A not in B followers"
ok "followers list includes A"

# B creates post; A sees in follow feed + author_followed_by_me on detail
post_body="$(node -e "process.stdout.write(JSON.stringify({body:process.argv[1],post_type:'text'}));" "$MARKER")"
post="$(curl_json POST "${API_BASE}/api/v1/community/posts" "$post_body" "$TOKEN_B")"
[[ "${post%%|*}" == "200" ]] || fail "create post HTTP ${post%%|*}"
POST_ID="$(json_field "${post#*|}" id)"
[[ -n "$POST_ID" ]] || fail "post id missing"
ok "author post created post_id=$POST_ID"

feed="$(curl_json GET "${API_BASE}/api/v1/community/feed?mode=follow&limit=30" "" "$TOKEN_A")"
[[ "${feed%%|*}" == "200" ]] || fail "follow feed HTTP ${feed%%|*}"
assert_posts_include_id "follow feed" "${feed#*|}" "$POST_ID" || fail "post not in follow feed"
ok "follow feed includes author post"

detail="$(curl_json GET "${API_BASE}/api/v1/community/posts/${POST_ID}" "" "$TOKEN_A")"
[[ "${detail%%|*}" == "200" ]] || fail "post detail HTTP ${detail%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  if(j.post?.author_followed_by_me!==true) process.exit(1);
" "${detail#*|}" || fail "author_followed_by_me not true"
ok "post detail author_followed_by_me=true"

profile="$(curl_json GET "${API_BASE}/api/v1/community/users/${USER_B}/posts?limit=20")"
[[ "${profile%%|*}" == "200" ]] || fail "profile posts HTTP ${profile%%|*}"
assert_posts_include_id "profile posts" "${profile#*|}" "$POST_ID" || fail "post not on B profile"
ok "profile posts lists author post"

# DM: ensure → send → unread → read clears
ensure="$(curl_json POST "${API_BASE}/api/v1/community/conversations/ensure" \
  "{\"peer_user_id\":\"${USER_B}\"}" "$TOKEN_A")"
[[ "${ensure%%|*}" == "200" ]] || fail "ensure conv HTTP ${ensure%%|*}"
CONV_ID="$(json_field "${ensure#*|}" id)"
[[ -n "$CONV_ID" ]] || fail "conversation id missing"
ok "conversation ensured conv_id=$CONV_ID"

send="$(curl_json POST "${API_BASE}/api/v1/community/conversations/${CONV_ID}/messages" \
  "{\"body\":\"${DM_MARKER}\"}" "$TOKEN_A")"
[[ "${send%%|*}" == "200" ]] || fail "send dm HTTP ${send%%|*}"
ok "DM sent"

convs_before="$(curl_json GET "${API_BASE}/api/v1/community/conversations" "" "$TOKEN_B")"
[[ "${convs_before%%|*}" == "200" ]] || fail "conversations HTTP ${convs_before%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const cid=process.argv[2];
  const marker=process.argv[3];
  const row=(j.conversations||[]).find(c=>String(c.id)===cid);
  if(!row) process.exit(1);
  if(Number(row.unread_count||0)<1) process.exit(2);
  if(!String(row.last_message||'').includes(marker)) process.exit(3);
" "${convs_before#*|}" "$CONV_ID" "$DM_MARKER" || fail "unread_count / last_message mismatch"
ok "B conversations unread_count >= 1"

msgs="$(curl_json GET "${API_BASE}/api/v1/community/conversations/${CONV_ID}/messages" "" "$TOKEN_B")"
[[ "${msgs%%|*}" == "200" ]] || fail "get messages HTTP ${msgs%%|*}"
node -e "
  const marker=process.argv[1];
  const j=JSON.parse(process.argv[2]);
  if(!(j.messages||[]).some(m=>(m.body||'').includes(marker))) process.exit(1);
" "$DM_MARKER" "${msgs#*|}" || fail "DM marker not in messages"
ok "GET messages returns DM body (read state updated)"

convs_after="$(curl_json GET "${API_BASE}/api/v1/community/conversations" "" "$TOKEN_B")"
[[ "${convs_after%%|*}" == "200" ]] || fail "conversations after read HTTP ${convs_after%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const cid=process.argv[2];
  const row=(j.conversations||[]).find(c=>String(c.id)===cid);
  if(!row) process.exit(1);
  if(Number(row.unread_count||0)!==0) process.exit(2);
" "${convs_after#*|}" "$CONV_ID" || fail "unread_count not cleared after read"
ok "unread_count cleared after GET messages"

# Like → likes_received notification proxy
likes_before="$(curl_json GET "${API_BASE}/api/v1/community/me/likes-received" "" "$TOKEN_B")"
[[ "${likes_before%%|*}" == "200" ]] || fail "likes-received before HTTP ${likes_before%%|*}"
BEFORE_LIKES="$(json_field "${likes_before#*|}" likes_received)"

like="$(curl_json POST "${API_BASE}/api/v1/community/posts/${POST_ID}/like" "" "$TOKEN_A")"
[[ "${like%%|*}" == "200" ]] || fail "like HTTP ${like%%|*}"
ok "A liked B post"

likes_after="$(curl_json GET "${API_BASE}/api/v1/community/me/likes-received" "" "$TOKEN_B")"
[[ "${likes_after%%|*}" == "200" ]] || fail "likes-received after HTTP ${likes_after%%|*}"
node -e "
  const before=Number(process.argv[1]);
  const after=Number(JSON.parse(process.argv[2]).likes_received||0);
  if(after!==before+1) process.exit(1);
" "$BEFORE_LIKES" "${likes_after#*|}" || fail "likes_received did not increment"
ok "likes_received incremented for author"

echo "follower_email=${EMAIL_A}"
echo "author_email=${EMAIL_B}"
echo "follower_token=${TOKEN_A}"
echo "author_token=${TOKEN_B}"
echo "follower_user_id=${USER_A}"
echo "author_user_id=${USER_B}"
echo "marker=${MARKER}"
echo "dm_marker=${DM_MARKER}"
echo "post_id=${POST_ID}"
echo "conversation_id=${CONV_ID}"
echo "likes_received_after=$((BEFORE_LIKES + 1))"
echo "TT_COMMUNITY_C6_STAGING_SOCIAL_GRAPH: OK"
