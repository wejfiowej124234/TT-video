#!/usr/bin/env bash
# C5 证据：社区图片媒体交付 · image IT + staging image E2E + 前端多图展示 E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
IT_LOG="$EVID/image-it-${STAMP}.log"
E2E_LOG="$EVID/staging-image-e2e-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c5-staging-image-delivery.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C5_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"
  echo "delivery_mode=staging image delivery PASS · production CDN pending"

  echo "--- image delivery IT (cargo test matrix_93_d_com_c5_*) ---"
  cargo test -p traveltrust-api matrix_93_d_com_c5_ 2>&1 | tee "$IT_LOG"
  grep -q "test result: ok" "$IT_LOG" || { echo "FAIL: image IT"; exit 1; }

  echo "--- staging image delivery API E2E ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c5-staging-image-delivery.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C5_STAGING_IMAGE_DELIVERY: OK" "$E2E_LOG" || { echo "FAIL: staging API E2E"; exit 1; }

  C5_EMAIL="$(grep -oE 'author_email=c5-image-[0-9]+@example.com' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C5_TOKEN="$(grep -oE 'author_token=tts_[a-f0-9-]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C5_MARKER="$(grep -oE 'marker=c5-staging-image-delivery-[0-9]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C5_POST_ID="$(grep -oE 'post_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"

  C5_TAG="$(grep -oE 'topic_tag=c5-img-[0-9]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C5_USER_ID="$(grep -oE 'author_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"

  if [[ -z "$C5_EMAIL" || -z "$C5_MARKER" || -z "$C5_POST_ID" || -z "$C5_USER_ID" || -z "$C5_TAG" ]]; then
    echo "FAIL: could not parse C5 smoke markers from log"
    exit 1
  fi

  echo "--- staging multi-image display E2E (Playwright) ---"
  export C5_STAGING_EVIDENCE_RUN=1
  export C5_STAGING_EVIDENCE_OUT="$EVID"
  export C5_STAGING_IMAGE_EMAIL="$C5_EMAIL"
  export C5_STAGING_IMAGE_TOKEN="$C5_TOKEN"
  export C5_STAGING_IMAGE_PASSWORD="Test123!"
  export C5_STAGING_IMAGE_MARKER="$C5_MARKER"
  export C5_STAGING_IMAGE_POST_ID="$C5_POST_ID"
  export C5_STAGING_IMAGE_USER_ID="$C5_USER_ID"
  export C5_STAGING_IMAGE_TAG="$C5_TAG"
  export PLAYWRIGHT_FULL_STACK=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  export PLAYWRIGHT_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0
  export PLAYWRIGHT_REUSE_FE_SERVER=0
  export PLAYWRIGHT_API_SERVER_TIMEOUT_MS=300000
  if [[ "$API_BASE" == *"fly.dev"* ]]; then
    FE_LOCAL="$REPO_ROOT/frontend/.env.local"
    if [[ -f "$FE_LOCAL" ]]; then
      cp "$FE_LOCAL" "$FE_LOCAL.bak-c5-${STAMP}"
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
    fi
    for p in $(netstat -ano 2>/dev/null | grep ":3012" | grep LISTENING | awk '{print $5}' | sort -u); do
      taskkill //F //PID "$p" 2>/dev/null || kill "$p" 2>/dev/null || true
    done
    sleep 2
    rm -rf "$REPO_ROOT/frontend/.next" 2>/dev/null || true
  fi

  cd "$REPO_ROOT/frontend"
  MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c5-staging-image-delivery.spec.ts --project=chromium 2>&1 | tee -a "$E2E_LOG"
  cd "$REPO_ROOT"
  test -f "$EVID/browser-c5-image-summary.md" || {
    echo "FAIL: image display E2E summary missing"
    exit 1
  }

  echo "TT_COMMUNITY_C5_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$IT_LOG")" "$EVID/latest-image-it.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-staging-image-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$IT_LOG" "$EVID/image-it.log"
cp -f "$E2E_LOG" "$EVID/staging-image-e2e.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C5 (CDN image delivery staging)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "image_delivery: staging image delivery PASS"
  echo "production_cdn: pending (no production CDN edge GO)"
  echo "image_it: $(basename "$IT_LOG")"
  echo "staging_image_e2e: $(basename "$E2E_LOG")"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C5 slot PASS only — NOT Phase ② GO / NOT C6-C12 GO / NOT Production CDN GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
