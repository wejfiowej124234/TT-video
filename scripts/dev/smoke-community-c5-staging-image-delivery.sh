#!/usr/bin/env bash
# Phase ② · C5 staging image delivery E2E（upload · Cache-Control · 多图 Feed/Profile/Explore · C2 门闸 · ② 槽 · 非 Phase ② GO / 非 Production CDN GO）
#
# 用法（仓库根 · API 已起 · TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 推荐）：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-community-c5-staging-image-delivery.sh
set -euo pipefail

# Git Bash MSYS path conversion breaks `/api/...` when passed as node argv (C5 post_body only).
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
EMAIL="c5-image-${STAMP}@example.com"
PASSWORD="Test123!"
MARKER="c5-staging-image-delivery-${STAMP}"
TAG="c5-img-${STAMP}"
TINY_PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
FAKE_MIME='data:image/png;base64,/9j/4AAQSkZJRg=='

fail() { echo "smoke-community-c5-staging-image-delivery: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c5-staging-image-delivery: OK $*"; }

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

assert_cache_control() {
  local url="$1"
  local full="${url}"
  if [[ "$full" != http* ]]; then
    full="${API_BASE}${url}"
  fi
  local cc
  cc="$(curl -sS -o /dev/null -D - "$full" | grep -i '^cache-control:' | tr -d '\r' || true)"
  [[ "$cc" == *"immutable"* && "$cc" == *"max-age=86400"* ]] || fail "Cache-Control missing immutable/max-age=86400 for $url (got $cc)"
  ok "Cache-Control policy OK ($url)"
}

echo "== smoke-community-c5-staging-image-delivery (② C5) API=$API_BASE =="

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"
ok "health 200 (staging image delivery via API uploads path; production CDN pending)"

# shellcheck source=scripts/dev/lib/smoke-auth-register.sh
source "$ROOT/scripts/dev/lib/smoke-auth-register.sh"

reg="$(smoke_auth_register_curl "$EMAIL" "tourist" '{"nickname":"TT C5 Delivery"}')"
[[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]] || fail "register HTTP ${reg%%|*} body=${reg#*|}"
TOKEN="$(json_field "${reg#*|}" token)"
USER_ID="$(json_field "${reg#*|}" user_id)"
[[ -z "$USER_ID" ]] && USER_ID="$(node -e "
  const j=JSON.parse(process.argv[1]);
  process.stdout.write(String(j.user?.id||j.id||''));
" "${reg#*|}")"
[[ -n "$TOKEN" ]] || fail "token missing"
[[ -n "$USER_ID" ]] || fail "user_id missing"

# 上传两张 PNG（对象存储 = API 本地磁盘 serve · 非生产 CDN edge）
up_a="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${TINY_PNG}\"}" "$TOKEN")"
[[ "${up_a%%|*}" == "200" ]] || fail "png upload A HTTP ${up_a%%|*}"
URL_A="$(json_field "${up_a#*|}" url)"
[[ "$URL_A" == /api/v1/uploads/community-posts/* ]] || fail "unexpected url A $URL_A"

up_b="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${TINY_PNG}\"}" "$TOKEN")"
[[ "${up_b%%|*}" == "200" ]] || fail "png upload B HTTP ${up_b%%|*}"
URL_B="$(json_field "${up_b#*|}" url)"

get_a="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}${URL_A}")"
[[ "$get_a" == "200" ]] || fail "GET url A HTTP $get_a"
get_b="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}${URL_B}")"
[[ "$get_b" == "200" ]] || fail "GET url B HTTP $get_b"
ok "upload + public GET 200 for both images"

assert_cache_control "$URL_A"
assert_cache_control "$URL_B"

# 多图帖子：cover_url = 缩略图读路径 · media_urls = 原图/轮播读路径
post_body="$(MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' node -e "
const marker=process.argv[1], tag=process.argv[2], urlA=process.argv[3], urlB=process.argv[4];
process.stdout.write(JSON.stringify({
  body: marker,
  post_type: 'photo',
  media_urls: [urlA, urlB],
  cover_url: urlA,
  tags: [tag],
}));
" "$MARKER" "$TAG" "$URL_A" "$URL_B")"
post="$(curl_json POST "${API_BASE}/api/v1/community/posts" "$post_body" "$TOKEN")"
[[ "${post%%|*}" == "200" ]] || fail "create photo post HTTP ${post%%|*}"
POST_ID="$(json_field "${post#*|}" id)"
[[ -n "$POST_ID" ]] || fail "post id missing"
ok "multi-image photo post created post_id=$POST_ID"

assert_post_surfaces() {
  local label="$1" uri="$2" auth="${3:-}"
  local resp code body
  resp="$(curl_json GET "${API_BASE}${uri}" "" "$auth")"
  code="${resp%%|*}"
  body="${resp#*|}"
  [[ "$code" == "200" ]] || fail "$label HTTP $code"
  MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*' \
    C5_ASSERT_LABEL="$label" \
    C5_ASSERT_POST_ID="$POST_ID" \
    C5_ASSERT_MARKER="$MARKER" \
    C5_ASSERT_COVER="$URL_A" \
    node -e "
    const fs = require('fs');
    const j = JSON.parse(fs.readFileSync(0, 'utf8'));
    const id = process.env.C5_ASSERT_POST_ID;
    const marker = process.env.C5_ASSERT_MARKER;
    const cover = process.env.C5_ASSERT_COVER;
    const label = process.env.C5_ASSERT_LABEL;
    const row = (j.posts || []).find(p => String(p.id) === id || (p.body || '').includes(marker));
    if (!row) { console.error('post not in ' + label); process.exit(1); }
    const urls = row.media_urls || [];
    if (urls.length < 2) { console.error('expected >=2 media_urls in ' + label, urls); process.exit(1); }
    if (row.cover_url !== cover) { console.error('cover_url mismatch in ' + label, row.cover_url, cover); process.exit(1); }
  " <<<"$body"
  ok "$label lists multi-image post (cover + media_urls)"
}

assert_post_surfaces "feed" "/api/v1/community/feed?limit=50"
assert_post_surfaces "explore/recommend feed" "/api/v1/community/feed?limit=50&mode=recommend"
assert_post_surfaces "me/posts" "/api/v1/community/me/posts?limit=20" "$TOKEN"
assert_post_surfaces "profile posts" "/api/v1/community/users/${USER_ID}/posts?limit=20"

detail="$(curl_json GET "${API_BASE}/api/v1/community/posts/${POST_ID}")"
[[ "${detail%%|*}" == "200" ]] || fail "post detail HTTP ${detail%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const urls=j.post?.media_urls||[];
  if(urls.length<2) process.exit(1);
" "${detail#*|}"
ok "post detail exposes media_urls (>=2)"

# C2 安全规则持续生效
up_fake="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${FAKE_MIME}\"}" "$TOKEN")"
[[ "${up_fake%%|*}" == "400" ]] || fail "fake mime expected 400 got ${up_fake%%|*}"
fake_err="$(json_field "${up_fake#*|}" error)"
[[ "$fake_err" == "mime_body_mismatch" ]] || fail "expected mime_body_mismatch got $fake_err"
ok "C2 fake mime still blocked (mime_body_mismatch)"

OVERSIZED_JSON="$(mktemp)"
node -e "
const n=524288+64;
const buf=Buffer.alloc(n,0);
buf[0]=0x89;buf[1]=0x50;buf[2]=0x4e;buf[3]=0x47;
buf[4]=0x0d;buf[5]=0x0a;buf[6]=0x1a;buf[7]=0x0a;
const payload='data:image/png;base64,'+buf.toString('base64');
require('fs').writeFileSync(process.argv[1], JSON.stringify({content_base64:payload}));
" "$OVERSIZED_JSON"
up_big_code="$(curl -sS -o "$OVERSIZED_JSON.resp" -w '%{http_code}' -X POST \
  "${API_BASE}/api/v1/community/posts/upload-media" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d @"$OVERSIZED_JSON")"
up_big_body="$(cat "$OVERSIZED_JSON.resp")"
rm -f "$OVERSIZED_JSON" "$OVERSIZED_JSON.resp"
[[ "$up_big_code" == "400" ]] || fail "oversized expected 400 got $up_big_code"
big_err="$(json_field "$up_big_body" error)"
[[ "$big_err" == "file_too_large" ]] || fail "expected file_too_large got $big_err"
ok "C2 oversized still blocked (file_too_large)"

echo "image_url_a=${URL_A}"
echo "image_url_b=${URL_B}"
echo "cdn_status=staging image delivery PASS · production CDN pending"
echo "topic_tag=${TAG}"
echo "author_email=${EMAIL}"
echo "author_token=${TOKEN}"
echo "author_user_id=${USER_ID}"
echo "marker=${MARKER}"
echo "post_id=${POST_ID}"
echo "TT_COMMUNITY_C5_STAGING_IMAGE_DELIVERY: OK"
