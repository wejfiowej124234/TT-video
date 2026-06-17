#!/usr/bin/env bash
# C10 证据：社区 Critical User Journey · Feed 宽路径 staging E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C10"
mkdir -p "$EVID/screenshots"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
E2E_LOG="$EVID/critical-journey-e2e-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

C10_FE_PID=""
cleanup_c10_fe() {
  if [[ -n "${C10_FE_PID:-}" ]]; then
    taskkill //F //PID "$C10_FE_PID" 2>/dev/null || kill "$C10_FE_PID" 2>/dev/null || true
  fi
}
trap cleanup_c10_fe EXIT

ensure_c10_frontend_dev() {
  local fe_code i
  if [[ "$API_BASE" != *"fly.dev"* ]]; then
    fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "${PLAYWRIGHT_BASE_URL}/community" 2>/dev/null || echo 000)"
    if [[ "$fe_code" == "200" ]]; then
      echo "OK frontend already up ${PLAYWRIGHT_BASE_URL}/community"
      return 0
    fi
  fi

  FE_LOCAL="$REPO_ROOT/frontend/.env.local"
  if [[ -f "$FE_LOCAL" ]]; then
    cp "$FE_LOCAL" "$FE_LOCAL.bak-c10-${STAMP}"
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
    if [[ "$API_BASE" == *"fly.dev"* ]]; then
      MINIO_TUNNEL="${C4_MINIO_TUNNEL_URL:-https://thirty-dryers-give.loca.lt}"
      MINIO_PUBLIC="${MINIO_TUNNEL}/traveltrust-community-media"
      if grep -qE '^[[:space:]]*NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=' "$FE_LOCAL"; then
        sed -i.bak "s|^[[:space:]]*NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${MINIO_PUBLIC}|" "$FE_LOCAL" && rm -f "${FE_LOCAL}.bak"
      else
        echo "NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL=${MINIO_PUBLIC}" >>"$FE_LOCAL"
      fi
    fi
  fi

  for p in $(netstat -ano 2>/dev/null | grep ":3012" | grep LISTENING | awk '{print $5}' | sort -u); do
    taskkill //F //PID "$p" 2>/dev/null || kill "$p" 2>/dev/null || true
  done
  sleep 2
  rm -rf "$REPO_ROOT/frontend/.next" 2>/dev/null || true

  echo "--- starting Next dev for C10 critical journey (${PLAYWRIGHT_BASE_URL}) ---"
  (
    cd "$REPO_ROOT/frontend"
    export FRONTEND_PORT=3012
    export TRAVELTRUST_FRONTEND_PORT=3012
    export NEXT_PUBLIC_API_BASE_URL="$API_BASE"
    export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0
    if [[ "$API_BASE" == *"fly.dev"* ]]; then
      MINIO_TUNNEL="${C4_MINIO_TUNNEL_URL:-https://thirty-dryers-give.loca.lt}"
      export NEXT_PUBLIC_COMMUNITY_MEDIA_S3_PUBLIC_BASE_URL="${MINIO_TUNNEL}/traveltrust-community-media"
    fi
    npm run dev
  ) >"$EVID/c10-fe-dev-${STAMP}.log" 2>&1 &
  C10_FE_PID=$!

  for i in $(seq 1 90); do
    fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "${PLAYWRIGHT_BASE_URL}/community" 2>/dev/null || echo 000)"
    if [[ "$fe_code" == "200" ]]; then
      echo "OK frontend ready after ${i} attempts"
      return 0
    fi
    sleep 4
  done
  echo "FAIL: frontend ${PLAYWRIGHT_BASE_URL}/community not ready"
  exit 1
}

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c10-staging-critical-journey.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C10_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"

  echo "--- ensure local FE dev (Playwright NO_WEBSERVER) ---"
  ensure_c10_frontend_dev

  echo "--- staging critical journey API smoke ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c10-staging-critical-journey.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C10_STAGING_CRITICAL_JOURNEY_API: OK" "$E2E_LOG" || {
    echo "FAIL: API smoke"
    exit 1
  }

  parse_field() {
    grep -oE "$1" "$E2E_LOG" | head -1 | cut -d= -f2- || true
  }

  C10_HERO_EMAIL="$(parse_field 'hero_email=c10-hero-[0-9]+@example.com')"
  C10_HERO_TOKEN="$(parse_field 'hero_token=tts_[a-f0-9-]+')"
  C10_HERO_USER_ID="$(parse_field 'hero_user_id=[0-9a-f-]{36}')"
  C10_TARGET_USER_ID="$(parse_field 'target_user_id=[0-9a-f-]{36}')"
  C10_TEXT_MARKER="$(parse_field 'text_marker=c10-journey-text-[0-9]+')"
  C10_PHOTO_MARKER="$(parse_field 'photo_marker=c10-journey-photo-[0-9]+')"
  C10_VIDEO_MARKER="$(parse_field 'video_marker=c10-journey-video-[0-9]+')"
  C10_COMMENT_MARKER="$(parse_field 'comment_marker=c10-journey-comment-[0-9]+')"
  C10_DM_MARKER="$(parse_field 'dm_marker=c10-journey-dm-[0-9]+')"
  C10_TARGET_POST_ID="$(parse_field 'target_post_id=[0-9a-f-]{36}')"
  C10_PHOTO_POST_ID="$(parse_field 'photo_post_id=[0-9a-f-]{36}')"
  C10_VIDEO_POST_ID="$(parse_field 'video_post_id=[0-9a-f-]{36}')"
  if [[ -z "$C10_VIDEO_POST_ID" ]]; then
    C10_VIDEO_POST_ID=""
  fi
  C10_VIDEO_PATH="$(grep -oE 'video_path=(full|skipped_[a-z_]+)' "$E2E_LOG" | head -1 | cut -d= -f2 || echo full)"
  C10_CONV_ID="$(parse_field 'conversation_id=[0-9a-f-]{36}')"
  C10_SPAM_POST_ID="$(parse_field 'spam_post_id=[0-9a-f-]{36}')"

  if [[ -z "$C10_HERO_EMAIL" || -z "$C10_HERO_TOKEN" || -z "$C10_HERO_USER_ID" || -z "$C10_TARGET_USER_ID" || -z "$C10_VIDEO_MARKER" || -z "$C10_SPAM_POST_ID" ]]; then
    echo "FAIL: could not parse C10 smoke markers"
    exit 1
  fi

  echo "--- staging critical journey browser E2E (Playwright) ---"
  export C10_STAGING_EVIDENCE_RUN=1
  export C10_STAGING_EVIDENCE_OUT="$EVID"
  export C10_HERO_EMAIL="$C10_HERO_EMAIL"
  export C10_HERO_TOKEN="$C10_HERO_TOKEN"
  export C10_HERO_USER_ID="$C10_HERO_USER_ID"
  export C10_TARGET_USER_ID="$C10_TARGET_USER_ID"
  export C10_TEXT_MARKER="$C10_TEXT_MARKER"
  export C10_PHOTO_MARKER="$C10_PHOTO_MARKER"
  export C10_VIDEO_MARKER="$C10_VIDEO_MARKER"
  export C10_COMMENT_MARKER="$C10_COMMENT_MARKER"
  export C10_DM_MARKER="$C10_DM_MARKER"
  export C10_TARGET_POST_ID="$C10_TARGET_POST_ID"
  export C10_PHOTO_POST_ID="$C10_PHOTO_POST_ID"
  export C10_VIDEO_POST_ID="$C10_VIDEO_POST_ID"
  export C10_VIDEO_PATH="$C10_VIDEO_PATH"
  export C10_CONVERSATION_ID="$C10_CONV_ID"
  export C10_SPAM_POST_ID="$C10_SPAM_POST_ID"
  export C10_STAGING_PASSWORD="Test123!"
  export PLAYWRIGHT_E2E_NO_WEBSERVER=1
  export PLAYWRIGHT_FULL_STACK=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  export PLAYWRIGHT_REUSE_FE_SERVER=1
  export PLAYWRIGHT_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0

  cd "$REPO_ROOT/frontend"
  MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c10-staging-critical-journey.spec.ts --project=chromium 2>&1 | tee -a "$E2E_LOG"
  cd "$REPO_ROOT"

  test -f "$EVID/browser-c10-journey-summary.md" || { echo "FAIL: browser summary missing"; exit 1; }

  for png in c10-01-guest-feed.png c10-05-feed-posts.png c10-08-dm-thread.png c10-09-activity.png \
    c10-10-report-submitted.png c10-11-revisit-me-posts.png; do
    test -f "$EVID/screenshots/$png" || { echo "FAIL: missing screenshot $png"; exit 1; }
  done

  echo "--- generate journey-summary.md ---"
  python "$REPO_ROOT/scripts/gen-community-c10-journey-summary.py" \
    --repo-root "$REPO_ROOT" \
    --evidence-dir "$EVID" \
    --stamp "$STAMP" \
    --api-base "$API_BASE" \
    --frontend-base "$PLAYWRIGHT_BASE_URL" \
    --hero-email "$C10_HERO_EMAIL" \
    --target-user-id "$C10_TARGET_USER_ID"

  grep -q "C10 slot verdict" "$EVID/journey-summary.md" || { echo "FAIL: journey-summary incomplete"; exit 1; }

  echo "TT_COMMUNITY_C10_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-critical-journey-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$E2E_LOG" "$EVID/critical-journey-e2e.log"

HERO_EMAIL_OUT="$(grep -oE 'hero_email=c10-hero-[0-9]+@example.com' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
TARGET_ID_OUT="$(grep -oE 'target_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C10 (critical user journey / feed wide-path staging E2E)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "hero_email: ${HERO_EMAIL_OUT:-unknown}"
  echo "target_user_id: ${TARGET_ID_OUT:-unknown}"
  echo "journey_summary: journey-summary.md"
  echo "critical_journey_e2e: critical-journey-e2e.log"
  echo "screenshots: screenshots/"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C10 slot PASS only — NOT Phase ② GO / NOT C11-C12 GO / NOT Production GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
