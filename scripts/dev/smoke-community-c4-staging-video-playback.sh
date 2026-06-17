#!/usr/bin/env bash
# Phase ② · C4 staging video playback E2E（multipart · 公开 media URL · Feed/Profile · C2 门闸 · ② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起 · MinIO/S3 已配 · TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 推荐）：
#   API_BASE=http://127.0.0.1:8080 bash scripts/dev/smoke-community-c4-staging-video-playback.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
EMAIL="c4-video-${STAMP}@example.com"
PASSWORD="Test123!"
MARKER="tt-phase2-c4-playback-$(node -e "process.stdout.write(require('crypto').randomBytes(4).toString('hex'))")"
MP4_DATA='data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAA'

fail() { echo "smoke-community-c4-staging-video-playback: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c4-staging-video-playback: OK $*"; }

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

echo "== smoke-community-c4-staging-video-playback (② C4) API=$API_BASE =="

hc="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health not 200 (got $hc)"

cap="$(curl_json GET "${API_BASE}/api/v1/community/media/capabilities")"
[[ "${cap%%|*}" == "200" ]] || fail "capabilities HTTP ${cap%%|*}"
cap_body="${cap#*|}"
pub_ready="$(json_field "$cap_body" public_video_publish_ready)"
[[ "$pub_ready" == "true" ]] || fail "public_video_publish_ready=false (object storage not ready)"
ok "capabilities public_video_publish_ready=true (staging MP4 path; HLS-CDN not claimed)"

reg="$(smoke_auth_register_curl "$EMAIL" "tourist" '{"nickname":"TT C4 Playback"}')"
[[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]] || fail "register HTTP ${reg%%|*} body=${reg#*|}"
TOKEN="$(json_field "${reg#*|}" token)"
[[ -n "$TOKEN" ]] || fail "token missing"
AUTHOR_ID="$(json_field "${reg#*|}" user_id)"
[[ -z "$AUTHOR_ID" ]] && AUTHOR_ID="$(node -e "
  const j=JSON.parse(process.argv[1]);
  process.stdout.write(String(j.user?.id||j.id||''));
" "${reg#*|}")"

UPLOAD_OUT="$(node "$ROOT/scripts/dev/helpers/community-c4-multipart-upload.mjs" "$API_BASE" "$TOKEN" "$MARKER")"
ASSET_ID="$(echo "$UPLOAD_OUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).asset_id||'')")"
PLAYBACK_URL="$(echo "$UPLOAD_OUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).playback_url||'')")"
POST_ID="$(echo "$UPLOAD_OUT" | node -e "process.stdout.write(JSON.parse(require('fs').readFileSync(0,'utf8')).post_id||'')")"
HLS_MANIFEST="$(echo "$UPLOAD_OUT" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(j.hls_manifest===null?'null':String(j.hls_manifest))")"

[[ -n "$ASSET_ID" ]] || fail "multipart upload missing asset_id"
[[ -n "$PLAYBACK_URL" ]] || fail "multipart upload missing playback_url"
[[ -n "$POST_ID" ]] || fail "video post missing post_id"
ok "multipart upload asset=$ASSET_ID post=$POST_ID playback_url_len=${#PLAYBACK_URL}"

# ①② 本地 MinIO staging：桶须 anonymous download 才符合「可公开访问 staging media URL」（非 ③ 生产 CDN）
if [[ "$PLAYBACK_URL" == *"127.0.0.1:19000"* || "$PLAYBACK_URL" == *"localhost:19000"* ]]; then
  for mc_c in traveltrust-community-minio-evidence traveltrust-minio; do
    if docker exec "$mc_c" mc anonymous set download local/traveltrust-community-media 2>/dev/null; then
      ok "minio bucket anonymous download (staging local · container=$mc_c)"
      break
    fi
  done
fi

# 公开 staging media URL 可达（MP4 · 非生产 CDN/HLS）
if [[ "$PLAYBACK_URL" == http* ]]; then
  media_code="$(curl -sS -o /dev/null -w '%{http_code}' -L "$PLAYBACK_URL" || echo 000)"
else
  media_code="$(curl -sS -o /dev/null -w '%{http_code}' -L "${API_BASE}${PLAYBACK_URL}" || echo 000)"
fi
[[ "$media_code" == "200" ]] || fail "playback URL not accessible HTTP $media_code ($PLAYBACK_URL)"
ok "staging media URL GET 200 (MP4 direct; HLS-CDN pending)"

# asset status：HLS manifest 预留为 null
asset="$(curl_json GET "${API_BASE}/api/v1/community/media-assets/${ASSET_ID}" "" "$TOKEN")"
[[ "${asset%%|*}" == "200" ]] || fail "asset status HTTP ${asset%%|*}"
asset_body="${asset#*|}"
asset_state="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(j.asset?.state||'');" "$asset_body")"
[[ "$asset_state" == "ready" ]] || fail "asset state not ready: $asset_state"
manifest_null="$(node -e "const j=JSON.parse(process.argv[1]); process.stdout.write(j.asset?.playback_manifest_json===null?'yes':'no');" "$asset_body")"
[[ "$manifest_null" == "yes" ]] || fail "expected playback_manifest_json null (HLS pending)"
ok "asset ready · playback_manifest_json=null (HLS-CDN pending boundary)"

# Feed 可见
feed="$(curl_json GET "${API_BASE}/api/v1/community/feed?limit=50")"
[[ "${feed%%|*}" == "200" ]] || fail "feed HTTP ${feed%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const id=process.argv[2];
  const url=process.argv[3];
  const row=(j.posts||[]).find(p=>String(p.id)===id);
  if(!row) { console.error('post not in feed'); process.exit(1); }
  if(row.post_type!=='video') { console.error('expected video post_type'); process.exit(1); }
  const urls=row.media_urls||[];
  if(!urls.some(u=>String(u).includes(url.split('/').pop().split('.')[0]))) {
    console.error('feed media_urls missing playback fragment', urls, url);
    process.exit(1);
  }
" "${feed#*|}" "$POST_ID" "$PLAYBACK_URL"
ok "feed lists video post with media_urls"

# Profile（me/posts）
me="$(curl_json GET "${API_BASE}/api/v1/community/me/posts?limit=20" "" "$TOKEN")"
[[ "${me%%|*}" == "200" ]] || fail "me/posts HTTP ${me%%|*}"
node -e "
  const j=JSON.parse(process.argv[1]);
  const id=process.argv[2];
  if(!(j.posts||[]).some(p=>String(p.id)===id && p.post_type==='video')) process.exit(1);
" "${me#*|}" "$POST_ID"
ok "me/posts lists video post"

# C2：MP4 base64 upload-media 仍被拦截
mp4_block="$(curl_json POST "${API_BASE}/api/v1/community/posts/upload-media" \
  "{\"content_base64\":\"${MP4_DATA}\"}" "$TOKEN")"
[[ "${mp4_block%%|*}" == "400" ]] || fail "mp4 upload-media expected 400 got ${mp4_block%%|*}"
mp4_err="$(json_field "${mp4_block#*|}" error)"
[[ "$mp4_err" == "community_video_requires_object_storage_multipart" ]] || fail "expected multipart gate got $mp4_err"
ok "C2 mp4 upload-media still blocked (multipart required)"

echo "playback_url=${PLAYBACK_URL}"
echo "hls_cdn_status=HLS-CDN pending (staging MP4 playback PASS)"
echo "author_email=${EMAIL}"
echo "author_token=${TOKEN}"
echo "author_user_id=${AUTHOR_ID}"
echo "marker=${MARKER}"
echo "post_id=${POST_ID}"
echo "TT_COMMUNITY_C4_STAGING_VIDEO_PLAYBACK: OK"
