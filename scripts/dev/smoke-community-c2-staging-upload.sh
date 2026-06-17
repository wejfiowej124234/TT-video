#!/usr/bin/env bash
# Phase ② · C2 staging upload E2E（MIME/魔数/体限/路径 · ② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起且 TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 推荐）：
#   API_BASE=https://<staging-https> bash scripts/dev/smoke-community-c2-staging-upload.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
EMAIL="c2-upload-smoke-${STAMP}@traveltrust.test"
PASSWORD="Test123!"
TINY_PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
FAKE_MIME='data:image/png;base64,/9j/4AAQSkZJRg=='

fail() { echo "smoke-community-c2-staging-upload: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c2-staging-upload: OK $*"; }

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

echo "== smoke-community-c2-staging-upload (② C2) API=$API_BASE =="

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"

reg="$(smoke_auth_register_curl "$EMAIL" "tourist" '{"nickname":"C2 Upload"}')"
reg_code="${reg%%|*}"
reg_body="${reg#*|}"
[[ "$reg_code" == "200" || "$reg_code" == "201" ]] || fail "register HTTP $reg_code body=$reg_body"
TOKEN="$(json_field "$reg_body" token)"
[[ -n "$TOKEN" ]] || fail "token missing"

# 合法 PNG
up_ok="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${TINY_PNG}\"}" "$TOKEN")"
up_ok_code="${up_ok%%|*}"
up_ok_body="${up_ok#*|}"
[[ "$up_ok_code" == "200" ]] || fail "valid png upload HTTP $up_ok_code body=$up_ok_body"
URL="$(json_field "$up_ok_body" url)"
[[ "$URL" == /api/v1/uploads/community-posts/* ]] || fail "unexpected url $URL"
NAME="${URL##*/}"
get_ok="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}${URL}")"
[[ "$get_ok" == "200" ]] || fail "GET uploaded file HTTP $get_ok"
ok "valid png upload + GET 200 ($NAME)"

# 伪造 MIME（声明 png · JPEG 魔数）
up_fake="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${FAKE_MIME}\"}" "$TOKEN")"
up_fake_code="${up_fake%%|*}"
up_fake_body="${up_fake#*|}"
[[ "$up_fake_code" == "400" ]] || fail "fake mime expected 400 got $up_fake_code body=$up_fake_body"
err="$(json_field "$up_fake_body" error)"
[[ "$err" == "mime_body_mismatch" ]] || fail "expected mime_body_mismatch got $err"
ok "fake mime rejected (mime_body_mismatch)"

# 空体
up_empty="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  '{"content_base64":"   "}' "$TOKEN")"
[[ "${up_empty%%|*}" == "400" ]] || fail "empty body expected 400"
ok "empty body rejected"

# 错扩展名 / 声明 MIME 与魔数不一致（JPEG 魔数 · 声明 PNG）
WRONG_EXT='data:image/png;base64,/9j/4AAQSkZJRg=='
up_wrong="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${WRONG_EXT}\"}" "$TOKEN")"
[[ "${up_wrong%%|*}" == "400" ]] || fail "wrong ext/mime expected 400"
ok "wrong extension / mime-body mismatch rejected"

# 超大文件（解码后 >512KiB 默认上限）
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
ok "oversized file rejected (file_too_large)"

# 视频 JSON 上传须 multipart
MP4_JSON='data:video/mp4;base64,AAAAIGZ0eXAAAAE='
up_mp4="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${MP4_JSON}\"}" "$TOKEN")"
[[ "${up_mp4%%|*}" == "400" ]] || fail "mp4 json expected 400"
ok "mp4 json upload rejected (requires multipart)"

# 恶意路径 GET（编码 traversal · 勿用未编码 ../ 以免路由规范化后 401）
bad_path="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/api/v1/uploads/community-posts/..%2Fetc%2Fpasswd")"
[[ "$bad_path" == "400" ]] || fail "path traversal expected 400 got $bad_path"
ok "path traversal rejected"

bad_name="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/api/v1/uploads/community-posts/bad-chars%21.png")"
[[ "$bad_name" == "400" ]] || fail "malicious filename expected 400 got $bad_name"
ok "malicious filename rejected"

# 测试用户发帖不污染公众 Feed（需 TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1）
MARKER="pi1-fe-c2-staging-smoke-${STAMP}"
post="$(curl_json POST "${API_BASE}/api/v1/community/posts" \
  "{\"body\":\"${MARKER}\",\"post_type\":\"text\"}" "$TOKEN")"
[[ "${post%%|*}" == "200" ]] || fail "create test post failed"
feed="$(curl -sS "${API_BASE}/api/v1/community/feed?limit=50")"
if echo "$feed" | grep -q "$MARKER"; then
  fail "test-origin post leaked to public feed (check TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1)"
fi
ok "test-origin post excluded from public feed"

echo "TT_COMMUNITY_C2_STAGING_UPLOAD: OK"
