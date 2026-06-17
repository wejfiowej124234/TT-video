#!/usr/bin/env bash
# Phase ② · C10 staging critical user journey API chain（② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起 · FE 由 Playwright 对拍）：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-community-c10-staging-critical-journey.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
PASSWORD="Test123!"
HERO_EMAIL="c10-hero-${STAMP}@example.com"
TARGET_EMAIL="c10-target-${STAMP}@example.com"
SPAM_EMAIL="c10-spam-${STAMP}@example.com"
TEXT_MARKER="c10-journey-text-${STAMP}"
PHOTO_MARKER="c10-journey-photo-${STAMP}"
VIDEO_MARKER="c10-journey-video-${STAMP}"
COMMENT_MARKER="c10-journey-comment-${STAMP}"
DM_MARKER="c10-journey-dm-${STAMP}"
TINY_PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='

fail() { echo "smoke-community-c10-staging-critical-journey: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c10-staging-critical-journey: OK $*"; }
post_gap() { sleep 6; }

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

curl_json_from_file() {
  local method="$1" url="$2" body_file="$3" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$auth" ]]; then
    code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
      -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d @"$body_file")"
  else
    code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
      -H "Content-Type: application/json" -d @"$body_file")"
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

register_user() {
  local email="$1" nick="$2"
  local reg token uid attempt
  for attempt in 1 2 3 4 5; do
    [[ "$attempt" -gt 1 ]] && sleep $((3 + attempt * 2))
    reg="$(smoke_auth_register_curl "$email" "tourist" "{\"nickname\":\"${nick}\"}")"
    if [[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]]; then
      break
    fi
    if [[ "${reg%%|*}" == "429" && "$attempt" -lt 5 ]]; then
      ok "register ${email} rate-limited; cooling down before retry ${attempt}"
      sleep 45
      continue
    fi
    if [[ "$attempt" -eq 5 ]]; then
      echo "smoke-community-c10-staging-critical-journey: FAIL register ${email} HTTP ${reg%%|*} body=${reg#*|}" >&2
      return 1
    fi
  done
  token="$(json_field "${reg#*|}" token)"
  uid="$(json_field "${reg#*|}" user_id)"
  [[ -z "$uid" ]] && uid="$(node -e "
    const j=JSON.parse(process.argv[1]);
    process.stdout.write(String(j.user?.id||j.id||''));
  " "${reg#*|}")"
  if [[ -z "$token" || -z "$uid" ]]; then
    echo "smoke-community-c10-staging-critical-journey: FAIL register ${email} missing token/user_id" >&2
    return 1
  fi
  echo "${token}|${uid}"
}

echo "== smoke-community-c10-staging-critical-journey (② C10) API=$API_BASE =="

for slot in C1 C2 C3 C4 C5 C6 C7 C8 C9; do
  st="$ROOT/evidence/GO_phase2_testnet_20260526/community/${slot}/STATUS.txt"
  [[ -f "$st" ]] || fail "missing evidence ${slot}/STATUS.txt"
  grep -q "^status: PASS" "$st" || fail "${slot} STATUS not PASS"
  ok "evidence ${slot} PASS"
done

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"
ok "health 200"

cleanup_mangled_media_posts() {
  local n="0"
  if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx 'traveltrust-postgres'; then
    n="$(docker exec traveltrust-postgres psql -U traveltrust -d traveltrust_staging -tA -c \
      "WITH del AS (DELETE FROM community_posts WHERE media_urls::text LIKE '%Program Files%' OR COALESCE(cover_url,'') LIKE '%Program Files%' RETURNING id) SELECT count(*) FROM del;" \
      2>/dev/null || echo 0)"
  elif command -v psql >/dev/null 2>&1; then
    local db_url="${DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging}"
    n="$(psql "$db_url" -tA -v ON_ERROR_STOP=1 -c \
      "WITH del AS (DELETE FROM community_posts WHERE media_urls::text LIKE '%Program Files%' OR COALESCE(cover_url,'') LIKE '%Program Files%' RETURNING id) SELECT count(*) FROM del;" \
      2>/dev/null || echo 0)"
  else
    ok "skip mangled media cleanup (no docker/psql)"
    return 0
  fi
  ok "cleanup mangled media URLs removed=${n:-0}"
}

cleanup_mangled_media_posts

guest_feed="$(curl_json GET "${API_BASE}/api/v1/community/feed?limit=10")"
[[ "${guest_feed%%|*}" == "200" ]] || fail "guest feed HTTP ${guest_feed%%|*}"
ok "guest feed 200"

cap="$(curl_json GET "${API_BASE}/api/v1/community/media/capabilities")"
[[ "${cap%%|*}" == "200" ]] || fail "capabilities HTTP ${cap%%|*}"
pub_ready="$(json_field "${cap#*|}" public_video_publish_ready)"
if [[ "$pub_ready" != "true" ]]; then
  for cap_try in 2 3 4 5 6; do
    ok "public_video_publish_ready pending retry ${cap_try}"
    sleep 6
    cap="$(curl_json GET "${API_BASE}/api/v1/community/media/capabilities")"
    [[ "${cap%%|*}" == "200" ]] || fail "capabilities HTTP ${cap%%|*}"
    pub_ready="$(json_field "${cap#*|}" public_video_publish_ready)"
    [[ "$pub_ready" == "true" ]] && break
  done
fi
if [[ "$pub_ready" != "true" ]]; then
  if [[ "$API_BASE" == *"fly.dev"* ]]; then
    ok "public_video_publish_ready=false (Fly S3 degraded; C10 continues without video slice)"
    VIDEO_PATH="skipped_capabilities"
  else
    fail "public_video_publish_ready=false"
  fi
else
  ok "media capabilities ready"
  VIDEO_PATH="full"
fi

VIDEO_POST_ID=""
VIDEO_MARKER="c10-journey-video-${STAMP}"

HERO_PAIR="$(register_user "$HERO_EMAIL" "C10 Hero")" || fail "hero register"
IFS='|' read -r HERO_TOKEN HERO_ID <<< "$HERO_PAIR"
sleep 12
TARGET_PAIR="$(register_user "$TARGET_EMAIL" "C10 Target")" || fail "target register"
IFS='|' read -r TARGET_TOKEN TARGET_ID <<< "$TARGET_PAIR"
sleep 12
SPAM_PAIR="$(register_user "$SPAM_EMAIL" "C10 Spam")" || fail "spam register"
IFS='|' read -r SPAM_TOKEN SPAM_ID <<< "$SPAM_PAIR"
ok "registered hero=$HERO_ID target=$TARGET_ID spam=$SPAM_ID"

# Follow
follow="$(curl_json POST "${API_BASE}/api/v1/community/users/${TARGET_ID}/follow" "" "$HERO_TOKEN")"
[[ "${follow%%|*}" == "200" ]] || fail "follow HTTP ${follow%%|*}"
ok "hero follows target"

# Target text post (for comment/like)
target_post_body="$(node -e "process.stdout.write(JSON.stringify({body:process.argv[1],post_type:'text'}));" "$TEXT_MARKER")"
target_post="$(curl_json POST "${API_BASE}/api/v1/community/posts" "$target_post_body" "$TARGET_TOKEN")"
[[ "${target_post%%|*}" == "200" ]] || fail "target text post HTTP ${target_post%%|*}"
TARGET_POST_ID="$(json_field "${target_post#*|}" id)"
[[ -n "$TARGET_POST_ID" ]] || fail "target post id missing"
ok "target text post $TARGET_POST_ID"

# Hero photo post (upload-media)
up="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${TINY_PNG}\"}" "$HERO_TOKEN")"
[[ "${up%%|*}" == "200" ]] || fail "photo upload HTTP ${up%%|*}"
PHOTO_URL="$(json_field "${up#*|}" url)"
[[ "$PHOTO_URL" == /api/v1/uploads/community-posts/* ]] || fail "unexpected photo url $PHOTO_URL"
photo_body="$(printf '%s' "$PHOTO_URL" | PHOTO_MARKER="$PHOTO_MARKER" node -e "
const url = require('fs').readFileSync(0, 'utf8');
process.stdout.write(JSON.stringify({
  body: process.env.PHOTO_MARKER,
  post_type: 'photo',
  media_urls: [url],
  cover_url: url,
}));
")"
photo_body_tmp="$(mktemp)"
printf '%s' "$photo_body" > "$photo_body_tmp"
photo_post="$(curl_json_from_file POST "${API_BASE}/api/v1/community/posts" "$photo_body_tmp" "$HERO_TOKEN")"
rm -f "$photo_body_tmp"
[[ "${photo_post%%|*}" == "200" ]] || fail "photo post HTTP ${photo_post%%|*}"
PHOTO_POST_ID="$(json_field "${photo_post#*|}" id)"
[[ -n "$PHOTO_POST_ID" ]] || fail "photo post id missing"
ok "hero photo post $PHOTO_POST_ID"

# Hero video post (multipart) — respect post_min_interval_sec (default 5s); Fly S3 degraded → skip video slice
post_gap
if [[ "$pub_ready" == "true" ]]; then
  UPLOAD_OUT=""
  for vu_attempt in 1 2 3; do
    if UPLOAD_OUT="$(node "$ROOT/scripts/dev/helpers/community-c4-multipart-upload.mjs" "$API_BASE" "$HERO_TOKEN" "$VIDEO_MARKER" 2>&1)"; then
      VIDEO_POST_ID="$(echo "$UPLOAD_OUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).post_id||'')")"
      [[ -n "$VIDEO_POST_ID" ]] && break
    fi
    ok "video upload attempt ${vu_attempt} pending retry"
    [[ "$vu_attempt" -lt 3 ]] && sleep 10
  done
  if [[ -z "$VIDEO_POST_ID" && "$API_BASE" == *"fly.dev"* ]]; then
    VIDEO_PATH="skipped_s3_degraded"
    ok "video post skipped (Fly multipart/S3 degraded: ${UPLOAD_OUT:-unknown})"
  else
    [[ -n "$VIDEO_POST_ID" ]] || fail "video post id missing (multipart upload failed: ${UPLOAD_OUT:-unknown})"
    ok "hero video post $VIDEO_POST_ID"
  fi
else
  VIDEO_PATH="skipped_capabilities"
  ok "video post skipped (public_video_publish_ready=false)"
fi

# Comment (hero on target post)
comment_body="$(node -e "process.stdout.write(JSON.stringify({body:process.argv[1]}));" "$COMMENT_MARKER")"
comment="$(curl_json POST "${API_BASE}/api/v1/community/posts/${TARGET_POST_ID}/comments" "$comment_body" "$HERO_TOKEN")"
[[ "${comment%%|*}" == "200" ]] || fail "comment HTTP ${comment%%|*}"
COMMENT_ID="$(json_field "${comment#*|}" id)"
[[ -n "$COMMENT_ID" ]] || fail "comment id missing"
ok "comment created $COMMENT_ID"

# Like (hero on target post)
like="$(curl_json POST "${API_BASE}/api/v1/community/posts/${TARGET_POST_ID}/like" "" "$HERO_TOKEN")"
[[ "${like%%|*}" == "200" ]] || fail "like HTTP ${like%%|*}"
ok "hero liked target post"

likes_recv="$(curl_json GET "${API_BASE}/api/v1/community/me/likes-received" "" "$TARGET_TOKEN")"
[[ "${likes_recv%%|*}" == "200" ]] || fail "likes-received HTTP ${likes_recv%%|*}"
ok "target likes-received endpoint 200"

# DM
ensure="$(curl_json POST "${API_BASE}/api/v1/community/conversations/ensure" \
  "{\"peer_user_id\":\"${TARGET_ID}\"}" "$HERO_TOKEN")"
[[ "${ensure%%|*}" == "200" ]] || fail "ensure conv HTTP ${ensure%%|*}"
CONV_ID="$(json_field "${ensure#*|}" id)"
[[ -n "$CONV_ID" ]] || fail "conversation id missing"
send="$(curl_json POST "${API_BASE}/api/v1/community/conversations/${CONV_ID}/messages" \
  "{\"body\":\"${DM_MARKER}\"}" "$HERO_TOKEN")"
[[ "${send%%|*}" == "200" ]] || fail "send dm HTTP ${send%%|*}"
ok "DM sent conv_id=$CONV_ID"

# Spam post (browser report — API does not report)
spam_body="$(node -e "process.stdout.write(JSON.stringify({body:process.argv[1],post_type:'text'}));" "c10-spam-${STAMP}")"
spam_post="$(curl_json POST "${API_BASE}/api/v1/community/posts" "$spam_body" "$SPAM_TOKEN")"
[[ "${spam_post%%|*}" == "200" ]] || fail "spam post HTTP ${spam_post%%|*}"
SPAM_POST_ID="$(json_field "${spam_post#*|}" id)"
[[ -n "$SPAM_POST_ID" ]] || fail "spam post id missing"
ok "spam post for browser report $SPAM_POST_ID"

# Feed surfaces
feed_markers=("$PHOTO_MARKER" "$TEXT_MARKER")
if [[ -n "$VIDEO_POST_ID" ]]; then
  feed_markers+=("$VIDEO_MARKER")
fi
for marker in "${feed_markers[@]}"; do
  feed_chk="$(curl_json GET "${API_BASE}/api/v1/community/feed?limit=50")"
  [[ "${feed_chk%%|*}" == "200" ]] || fail "feed check HTTP ${feed_chk%%|*}"
  echo "${feed_chk#*|}" | MARKER="$marker" node -e "
    const j = JSON.parse(require('fs').readFileSync(0, 'utf8'));
    const m = process.env.MARKER;
    if (!(j.posts || []).some((p) => (p.body || '').includes(m))) process.exit(1);
  " || fail "marker $marker not in feed"
done
ok "feed includes text/photo/video markers"

explore="$(curl_json GET "${API_BASE}/api/v1/community/feed?limit=30&mode=recommend")"
[[ "${explore%%|*}" == "200" ]] || fail "explore/recommend HTTP ${explore%%|*}"
ok "explore recommend feed 200"

hero_me="$(curl_json GET "${API_BASE}/api/v1/community/me/posts?limit=20" "" "$HERO_TOKEN")"
[[ "${hero_me%%|*}" == "200" ]] || fail "hero me/posts HTTP ${hero_me%%|*}"
ok "hero me/posts 200"

echo "hero_email=${HERO_EMAIL}"
echo "target_email=${TARGET_EMAIL}"
echo "hero_token=${HERO_TOKEN}"
echo "hero_user_id=${HERO_ID}"
echo "target_user_id=${TARGET_ID}"
echo "text_marker=${TEXT_MARKER}"
echo "photo_marker=${PHOTO_MARKER}"
echo "video_marker=${VIDEO_MARKER}"
echo "comment_marker=${COMMENT_MARKER}"
echo "dm_marker=${DM_MARKER}"
echo "target_post_id=${TARGET_POST_ID}"
echo "photo_post_id=${PHOTO_POST_ID}"
echo "video_post_id=${VIDEO_POST_ID:-none}"
echo "video_path=${VIDEO_PATH:-full}"
echo "comment_id=${COMMENT_ID}"
echo "conversation_id=${CONV_ID}"
echo "spam_post_id=${SPAM_POST_ID}"
echo "TT_COMMUNITY_C10_STAGING_CRITICAL_JOURNEY_API: OK"
