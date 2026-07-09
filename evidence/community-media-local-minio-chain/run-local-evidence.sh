#!/usr/bin/env bash
# ① 本地对象存储真链路（curl + DB）。失败即 exit 1。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EVD="$(cd "$(dirname "$0")" && pwd)"
OUT="$EVD/out"
MP4="$ROOT/frontend/e2e/fixtures/minimal-1s-h264.mp4"
mkdir -p "$OUT"
rm -f "$OUT"/*
command -v jq >/dev/null || { echo "need jq"; exit 1; }
command -v curl >/dev/null || { echo "need curl"; exit 1; }
test -f "$MP4" || { echo "missing $MP4"; exit 1; }

echo "== MinIO ==" | tee "$OUT/00-steps.log"
(cd "$EVD" && docker compose up -d)
docker compose -f "$EVD/docker-compose.yml" ps | tee "$OUT/01-docker-ps.txt"
sleep 8
docker compose -f "$EVD/docker-compose.yml" logs minio-init --tail 120 | tee "$OUT/02-minio-init.log"

echo "== Postgres ==" | tee -a "$OUT/00-steps.log"
cd "$ROOT"
docker compose up -d postgres 2>&1 | tee "$OUT/03-postgres-up.log" || true

export DATABASE_URL="${DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"
# Rebind for this harness (ignore inherited PORT from dev shells).
EVIDENCE_API_PORT="${TRAVELTRUST_COMMUNITY_MEDIA_EVIDENCE_API_PORT:-8080}"
export PORT="$EVIDENCE_API_PORT"
API="${API:-http://127.0.0.1:${EVIDENCE_API_PORT}}"
export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
export CORS_ORIGINS="${CORS_ORIGINS:-http://localhost:3012,http://127.0.0.1:3012}"
export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
export CHAIN_RPC_URL="${CHAIN_RPC_URL:- }"
export COMMUNITY_MEDIA_S3_BUCKET="${COMMUNITY_MEDIA_S3_BUCKET:-traveltrust-community-evidence}"
export COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="${COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL:-http://127.0.0.1:19000/traveltrust-community-evidence}"
export COMMUNITY_MEDIA_S3_ENDPOINT="${COMMUNITY_MEDIA_S3_ENDPOINT:-http://127.0.0.1:19000}"
export COMMUNITY_MEDIA_S3_REGION="${COMMUNITY_MEDIA_S3_REGION:-us-east-1}"
export COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE="${COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE:-1}"
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-minio}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-minio12345}"
export TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS="${TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS:-0}"
export TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED="${TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED:-1}"
export TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES="${TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES:-http://127.0.0.1:19000/traveltrust-community-evidence}"

echo "== API ==" | tee -a "$OUT/00-steps.log"
cd "$ROOT"
cargo build -p traveltrust-api -q
(cargo run -p traveltrust-api --bin traveltrust-api >"$OUT/04-api.log" 2>&1) &
APIPID=$!
cleanup() { if kill -0 "$APIPID" 2>/dev/null; then kill "$APIPID" || true; wait "$APIPID" 2>/dev/null || true; fi }
trap cleanup EXIT
for i in $(seq 1 120); do
  if curl -fsS "$API/health" -o "$OUT/05-health-body.txt" 2>/dev/null; then break; fi
  sleep 1
  if [[ "$i" == "120" ]]; then echo "health timeout"; tail -200 "$OUT/04-api.log"; exit 1; fi
done

curl -sS -D "$OUT/06-health-headers.txt" -o "$OUT/06-health-body.txt" "$API/health"
head -1 "$OUT/06-health-headers.txt" | tee "$OUT/06-health-status-line.txt" | grep -q '200' || { echo "health not 200"; exit 1; }

curl -sS "$API/api/v1/community/media/capabilities" | tee "$OUT/07-capabilities.json" | jq .
jq -e '.public_video_publish_ready == true' "$OUT/07-capabilities.json" >/dev/null
jq -e '.max_video_seconds == 180' "$OUT/07-capabilities.json" >/dev/null

curl -sS -X POST "$API/auth/seed-test-accounts" -H 'Content-Type: application/json' -d '{}' | tee "$OUT/08-seed.json" >/dev/null
curl -sS -X POST "$API/auth/login" -H 'Content-Type: application/json' \
  -d '{"email":"tourist@test.com","password":"Test123!"}' | tee "$OUT/09-login.json" >/dev/null
TOKEN="$(jq -r .token "$OUT/09-login.json")"
[[ -n "$TOKEN" && "$TOKEN" != "null" ]] || { echo "login failed"; exit 1; }

BYTES="$(wc -c <"$MP4" | tr -d ' ')"
curl -sS -X POST "$API/api/v1/community/media-assets/sessions" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "{\"content_type\":\"video/mp4\",\"byte_length\":$BYTES}" | tee "$OUT/10-session-create.json" | jq .
ASSET="$(jq -r .asset_id "$OUT/10-session-create.json")"

curl -sS -X POST "$API/api/v1/community/media-assets/sessions/$ASSET/parts" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"part_numbers":[1]}' | tee "$OUT/11-presign.json" | jq .
PURL="$(jq -r '.parts[0].url' "$OUT/11-presign.json")"

mapfile -t HDRS < <(jq -r '.parts[0].headers | to_entries[] | "\(.key): \(.value)"' "$OUT/11-presign.json")
CURL_ARGS=(-sS -D "$OUT/13-put-response-headers.txt" -o "$OUT/13-put-response-body.txt" -X PUT)
for h in "${HDRS[@]}"; do CURL_ARGS+=(-H "$h"); done
CURL_ARGS+=(--data-binary "@$MP4" "$PURL")
curl "${CURL_ARGS[@]}"
ETAG="$(grep -i '^etag:' "$OUT/13-put-response-headers.txt" | head -1 | sed 's/^[Ee][Tt][Aa][Gg]: *//;s/\r$//')"
[[ -n "$ETAG" ]] || { echo "no etag"; exit 1; }

COMP="$(jq -n --arg e "$ETAG" '{parts:[{part_number:1, etag:$e}]}')"
curl -sS -X POST "$API/api/v1/community/media-assets/sessions/$ASSET/complete" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "$COMP" | tee "$OUT/15-complete.json" | jq .
jq -e '.state == "ready"' "$OUT/15-complete.json" >/dev/null
PLAYBACK="$(jq -r .playback_url "$OUT/15-complete.json")"
echo "$PLAYBACK" > "$OUT/16-playback-url.txt"

curl -sS "$API/api/v1/community/media-assets/$ASSET" -H "Authorization: Bearer $TOKEN" | tee "$OUT/17-asset-get.json" | jq .
curl -sS -D "$OUT/18-head-object-headers.txt" -o /dev/null -I "$PLAYBACK" || true

BODY_TEXT="evidence-minio-multipart-$(date -u +%Y%m%dT%H%M%SZ)"
POST_JSON="$(jq -n --arg aid "$ASSET" --arg b "$BODY_TEXT" '{post_type:"video", body:$b, tags:[], media_asset_id:$aid}')"
curl -sS -X POST "$API/api/v1/community/posts" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d "$POST_JSON" | tee "$OUT/19-create-post.json" | jq .
POST_ID="$(jq -r .id "$OUT/19-create-post.json")"
[[ -n "$POST_ID" && "$POST_ID" != "null" ]] || { echo "post failed"; exit 1; }

curl -sS "$API/api/v1/community/feed?limit=30" | tee "$OUT/20-feed.json" | jq .
jq -e --arg id "$POST_ID" '.posts | map(select(.id == $id)) | length == 1' "$OUT/20-feed.json" >/dev/null

docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -c \
  "SELECT id, state, left(playback_url,120) as playback_prefix, byte_length FROM community_media_assets WHERE id='$ASSET'::uuid;" \
  | tee "$OUT/21-db-asset.txt"
docker exec traveltrust-postgres psql -U traveltrust -d traveltrust -c \
  "SELECT id, post_type, left(body,80) as body_prefix, media_urls, primary_media_asset_id FROM community_posts WHERE id='$POST_ID'::uuid;" \
  | tee "$OUT/22-db-post.txt"



{
  printf "# Local evidence env snapshot\n"
  echo "API=$API"
  echo "PORT=$PORT"
  echo "COMMUNITY_MEDIA_S3_BUCKET=$COMMUNITY_MEDIA_S3_BUCKET"
  echo "COMMUNITY_MEDIA_S3_ENDPOINT=$COMMUNITY_MEDIA_S3_ENDPOINT"
  echo "COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=$COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL"
  echo "COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE=$COMMUNITY_MEDIA_S3_FORCE_PATH_STYLE"
  echo "TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES=$TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES"
  echo "TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED=$TRAVELTRUST_COMMUNITY_PUBLIC_VIDEO_SPEC_REQUIRED"
  echo "TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS=$TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS"
  echo "AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID"
} >"$OUT/24-env-snapshot.txt"

cat >"$OUT/25-curl-recap.txt" << EOF
# Full bodies: sibling JSON/txt in out/. Replace <token> from 09-login.json.
curl -sS -D - -o $OUT/06-health-body.txt $API/health
curl -sS $API/api/v1/community/media/capabilities
curl -sS -X POST $API/auth/seed-test-accounts -H 'Content-Type: application/json' -d '{}'
curl -sS -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"email":"tourist@test.com","password":"Test123!"}'
curl -sS -X POST $API/api/v1/community/media-assets/sessions -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' -d '{"content_type":"video/mp4","byte_length":<bytes>}'
curl -sS -X POST $API/api/v1/community/media-assets/sessions/<asset>/parts -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' -d '{"part_numbers":[1]}'
# PUT presigned URL from 11-presign.json; body = real MP4; ETag in 13-put-response-headers.txt
curl -sS -X POST $API/api/v1/community/media-assets/sessions/<asset>/complete -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' -d '{"parts":[{"part_number":1,"etag":"<etag>"}]}'
curl -sS -I "$(cat $OUT/16-playback-url.txt)"
curl -sS -X POST $API/api/v1/community/posts -H "Authorization: Bearer <token>" -H 'Content-Type: application/json' -d '{"post_type":"video","body":"…","tags":[],"media_asset_id":"<asset>"}'
curl -sS "$API/api/v1/community/feed?limit=30"
EOF

echo OK | tee "$OUT/99-result.txt"
