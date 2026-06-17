#!/usr/bin/env bash
# C4 证据：社区视频播放链 · video IT + staging playback E2E + 播放器 E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C4"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
IT_LOG="$EVID/video-it-${STAMP}.log"
E2E_LOG="$EVID/staging-video-playback-e2e-${STAMP}.log"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c4-staging-video-playback.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C4_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"
  echo "playback_mode=staging MP4 PASS · HLS-CDN pending"

  echo "--- video playback IT (cargo test matrix_93_d_com_c4_* + primary_media_asset_id) ---"
  cargo test -p traveltrust-api matrix_93_d_com_c4_ 2>&1 | tee "$IT_LOG"
  cargo test -p traveltrust-api matrix_93_d_com_primary_media_asset_id_ 2>&1 | tee -a "$IT_LOG"
  grep -c "test result: ok" "$IT_LOG" | grep -qE '^[2-9]' || { echo "FAIL: video IT"; exit 1; }

  echo "--- staging video playback API E2E ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c4-staging-video-playback.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C4_STAGING_VIDEO_PLAYBACK: OK" "$E2E_LOG" || { echo "FAIL: staging API E2E"; exit 1; }

  C4_EMAIL="$(grep -oE 'author_email=c4-video-[0-9]+@example.com' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C4_TOKEN="$(grep -oE 'author_token=tts_[a-f0-9-]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C4_USER_ID="$(grep -oE 'author_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C4_MARKER="$(grep -oE 'marker=tt-phase2-c4-playback-[0-9a-f]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C4_POST_ID="$(grep -oE 'post_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"

  if [[ -z "$C4_EMAIL" || -z "$C4_MARKER" || -z "$C4_POST_ID" || -z "$C4_TOKEN" || -z "$C4_USER_ID" ]]; then
    echo "FAIL: could not parse C4 smoke markers from log"
    exit 1
  fi

  echo "--- staging video player E2E (Playwright canplay) ---"
  export C4_STAGING_EVIDENCE_RUN=1
  export C4_STAGING_EVIDENCE_OUT="$EVID"
  export C4_STAGING_VIDEO_EMAIL="$C4_EMAIL"
  export C4_STAGING_VIDEO_TOKEN="$C4_TOKEN"
  export C4_STAGING_VIDEO_USER_ID="$C4_USER_ID"
  export C4_STAGING_VIDEO_PASSWORD="Test123!"
  export C4_STAGING_VIDEO_MARKER="$C4_MARKER"
  export C4_STAGING_VIDEO_POST_ID="$C4_POST_ID"
  export PLAYWRIGHT_FULL_STACK=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  export PLAYWRIGHT_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  export PLAYWRIGHT_API_SERVER_TIMEOUT_MS=300000
  if [[ "$API_BASE" == *"fly.dev"* ]]; then
    MINIO_TUNNEL="${C4_MINIO_TUNNEL_URL:-https://thirty-dryers-give.loca.lt}"
    MINIO_PUBLIC="${MINIO_TUNNEL}/traveltrust-community-media"
    export NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="$MINIO_PUBLIC"
    export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_POST_MEDIA_URL_PREFIXES="${MINIO_PUBLIC},${MINIO_TUNNEL}"
    FE_LOCAL="$REPO_ROOT/frontend/.env.local"
      if [[ -f "$FE_LOCAL" ]]; then
      cp "$FE_LOCAL" "$FE_LOCAL.bak-c4-${STAMP}"
      if grep -qE '^[[:space:]]*NEXT_PUBLIC_API_BASE_URL=' "$FE_LOCAL"; then
        sed -i.bak "s|^[[:space:]]*NEXT_PUBLIC_API_BASE_URL=.*|NEXT_PUBLIC_API_BASE_URL=${API_BASE}|" "$FE_LOCAL" && rm -f "${FE_LOCAL}.bak"
      else
        echo "NEXT_PUBLIC_API_BASE_URL=${API_BASE}" >>"$FE_LOCAL"
      fi
      if grep -qE '^[[:space:]]*NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=' "$FE_LOCAL"; then
        sed -i.bak "s|^[[:space:]]*NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=.*|NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0|" "$FE_LOCAL" && rm -f "${FE_LOCAL}.bak"
      else
        echo "NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0" >>"$FE_LOCAL"
      fi
      if grep -qE '^[[:space:]]*NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=' "$FE_LOCAL"; then
        sed -i.bak "s|^[[:space:]]*NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${MINIO_PUBLIC}|" "$FE_LOCAL" && rm -f "${FE_LOCAL}.bak"
      else
        echo "NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${MINIO_PUBLIC}" >>"$FE_LOCAL"
      fi
    fi
    for p in $(netstat -ano 2>/dev/null | grep ":3012" | grep LISTENING | awk '{print $5}' | sort -u); do
      taskkill //F //PID "$p" 2>/dev/null || kill "$p" 2>/dev/null || true
    done
    sleep 2
    rm -rf "$REPO_ROOT/frontend/.next" 2>/dev/null || true
  fi

  cd "$REPO_ROOT/frontend"
  MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c4-staging-video-playback.spec.ts --project=chromium 2>&1 | tee -a "$E2E_LOG"
  cd "$REPO_ROOT"
  test -f "$EVID/browser-c4-player-summary.md" || {
    echo "FAIL: player E2E summary missing"
    exit 1
  }

  echo "TT_COMMUNITY_C4_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$IT_LOG")" "$EVID/latest-video-it.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-staging-video-playback-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$IT_LOG" "$EVID/video-it.log"
cp -f "$E2E_LOG" "$EVID/staging-video-playback-e2e.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C4 (HLS/MP4 + CDN staging playback)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "playback: staging MP4 PASS"
  echo "hls_cdn: pending (no production HLS/manifest/CDN GO)"
  echo "video_it: $(basename "$IT_LOG")"
  echo "staging_video_playback_e2e: $(basename "$E2E_LOG")"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C4 slot PASS only — NOT Phase ② GO / NOT C5-C12 GO / NOT Production CDN/HLS GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
