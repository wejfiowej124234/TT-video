#!/usr/bin/env bash
# P0 · Community media read-path + PostDetailDrawer regression (① local + ② staging API).
# Does NOT re-open C1–C12 PASS verdicts; does NOT claim Production CDN/HLS GO.
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/P0-media-read-detail"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
IT_LOG="$EVID/primary-media-it-${STAMP}.log"
API_LOG="$EVID/staging-api-smokes-${STAMP}.log"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
export API_BASE

{
  echo "TT_COMMUNITY_MEDIA_P0_REGRESSION: START ${STAMP}"
  echo "phase_scope=① local IT + ② staging API smokes (NOT ③ CDN/HLS GO)"
  echo "API_BASE=${API_BASE}"

  echo "--- IT: matrix_93_d_com_primary_media_asset_id ---"
  cargo test -p traveltrust-api matrix_93_d_com_primary_media_asset_id_ 2>&1 | tee "$IT_LOG"
  grep -q "test result: ok" "$IT_LOG" || { echo "FAIL: primary_media_asset_id IT"; exit 1; }

  echo "--- staging API smokes: C2 upload · C4 video · C5 image ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c2-staging-upload.sh" 2>&1 | tee "$API_LOG"
  grep -q "TT_COMMUNITY_C2_STAGING_UPLOAD: OK" "$API_LOG" || { echo "FAIL: C2 smoke"; exit 1; }

  bash "$REPO_ROOT/scripts/dev/smoke-community-c4-staging-video-playback.sh" 2>&1 | tee -a "$API_LOG"
  grep -q "TT_COMMUNITY_C4_STAGING_VIDEO_PLAYBACK: OK" "$API_LOG" || { echo "FAIL: C4 smoke"; exit 1; }

  C4_POST_ID="$(grep -oE 'post_id=[0-9a-f-]{36}' "$API_LOG" | tail -1 | cut -d= -f2 || true)"
  C4_ASSET_ID="$(grep -oE 'asset=[0-9a-f-]{36}' "$API_LOG" | tail -1 | cut -d= -f2 || true)"
  if [[ -z "$C4_POST_ID" || -z "$C4_ASSET_ID" ]]; then
    echo "FAIL: could not parse C4 post/asset from smoke log"
    exit 1
  fi

  bash "$REPO_ROOT/scripts/dev/smoke-community-c5-staging-image-delivery.sh" 2>&1 | tee -a "$API_LOG"
  grep -q "TT_COMMUNITY_C5_STAGING_IMAGE_DELIVERY: OK" "$API_LOG" || { echo "FAIL: C5 smoke"; exit 1; }

  echo "--- JSON field probe: feed / detail / me-posts / user-posts ---"
  DETAIL_JSON="$(curl -fsS "${API_BASE}/api/v1/community/posts/${C4_POST_ID}")"
  echo "$DETAIL_JSON" | grep -q '"primary_media_asset_id"' || { echo "FAIL: detail missing primary_media_asset_id key"; exit 1; }
  echo "$DETAIL_JSON" | grep -q "$C4_ASSET_ID" || { echo "FAIL: detail primary_media_asset_id mismatch"; exit 1; }

  FEED_JSON="$(curl -fsS "${API_BASE}/api/v1/community/feed?limit=5")"
  echo "$FEED_JSON" | grep -q '"primary_media_asset_id"' || { echo "FAIL: feed missing primary_media_asset_id key"; exit 1; }

  C4_EMAIL="$(grep -oE 'author_email=c4-video-[0-9]+@example.com' "$API_LOG" | tail -1 | cut -d= -f2 || true)"
  if [[ -n "$C4_EMAIL" ]]; then
    TOKEN="$(curl -fsS -X POST "${API_BASE}/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"${C4_EMAIL}\",\"password\":\"Test123!\"}" | python -c "import sys,json; print(json.load(sys.stdin).get('token',''))")"
    if [[ -n "$TOKEN" ]]; then
      ME_JSON="$(curl -fsS "${API_BASE}/api/v1/community/me/posts?limit=5" -H "Authorization: Bearer ${TOKEN}")"
      echo "$ME_JSON" | grep -q '"primary_media_asset_id"' || { echo "FAIL: me/posts missing primary_media_asset_id key"; exit 1; }
      USER_ID="$(echo "$DETAIL_JSON" | python -c "import sys,json; print(json.load(sys.stdin)['post']['user_id'])")"
      USER_JSON="$(curl -fsS "${API_BASE}/api/v1/community/users/${USER_ID}/posts?limit=5")"
      echo "$USER_JSON" | grep -q '"primary_media_asset_id"' || { echo "FAIL: user-posts missing primary_media_asset_id key"; exit 1; }
    else
      echo "WARN: could not login C4 author — skipped me/posts + user-posts probe"
    fi
  fi

  PLAYBACK_URL="$(grep -oE 'playback_url=http[^[:space:]]+' "$API_LOG" | tail -1 | cut -d= -f2- || true)"
  if [[ -n "$PLAYBACK_URL" ]]; then
    HTTP_CODE="$(curl -sS -o /dev/null -w '%{http_code}' "$PLAYBACK_URL")"
    echo "media_url_http=${HTTP_CODE} url=${PLAYBACK_URL}"
    [[ "$HTTP_CODE" == "200" ]] || { echo "FAIL: media URL not 200"; exit 1; }
  fi

  echo "--- frontend vitest: communityFeedMappers.postRoleMedia ---"
  cd "$REPO_ROOT/frontend"
  npx vitest run components/community/communityFeedMappers.postRoleMedia.test.ts 2>&1 | tee -a "$RUN_LOG"
  cd "$REPO_ROOT"

  echo "post_id=${C4_POST_ID}"
  echo "primary_media_asset_id=${C4_ASSET_ID}"
  echo "playback_url=${PLAYBACK_URL:-n/a}"
  echo "TT_COMMUNITY_MEDIA_P0_REGRESSION: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$IT_LOG")" "$EVID/latest-primary-media-it.log"
ln -sfn "$(basename "$API_LOG")" "$EVID/latest-staging-api-smokes.log"
cp -f "$RUN_LOG" "$EVID/run.log"

{
  echo "phase: ① IT + ② staging API (P0 media read-path + detail drawer fix regression)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "note: P0 maintenance — C1–C12 historical PASS unchanged; NOT Production CDN/HLS GO"
} > "$EVID/STATUS.txt"
