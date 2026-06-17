#!/usr/bin/env bash
# C6 证据：社区社交图与互动 · social IT + staging social E2E + 浏览器回访 E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C6"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
IT_LOG="$EVID/social-it-${STAMP}.log"
E2E_LOG="$EVID/staging-social-e2e-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c6-staging-social-graph.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C6_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"

  echo "--- social graph IT (cargo test matrix_93_d_com_c6_*) ---"
  cargo test -p traveltrust-api matrix_93_d_com_c6_ 2>&1 | tee "$IT_LOG"
  grep -q "test result: ok" "$IT_LOG" || { echo "FAIL: social IT"; exit 1; }

  echo "--- staging social graph API E2E ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c6-staging-social-graph.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C6_STAGING_SOCIAL_GRAPH: OK" "$E2E_LOG" || { echo "FAIL: staging API E2E"; exit 1; }

  C6_FOLLOWER_EMAIL="$(grep -oE 'follower_email=c6-follower-[0-9]+@example.com' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_AUTHOR_EMAIL="$(grep -oE 'author_email=c6-author-[0-9]+@example.com' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_FOLLOWER_TOKEN="$(grep -oE 'follower_token=tts_[a-f0-9-]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_AUTHOR_TOKEN="$(grep -oE 'author_token=tts_[a-f0-9-]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_FOLLOWER_ID="$(grep -oE 'follower_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_AUTHOR_ID="$(grep -oE 'author_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_MARKER="$(grep -oE 'marker=c6-staging-social-[0-9]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_DM_MARKER="$(grep -oE 'dm_marker=c6-dm-[0-9]+' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_POST_ID="$(grep -oE 'post_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
  C6_CONV_ID="$(grep -oE 'conversation_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"

  if [[ -z "$C6_FOLLOWER_EMAIL" || -z "$C6_AUTHOR_EMAIL" || -z "$C6_FOLLOWER_ID" || -z "$C6_AUTHOR_ID" \
    || -z "$C6_MARKER" || -z "$C6_DM_MARKER" || -z "$C6_POST_ID" || -z "$C6_CONV_ID" ]]; then
    echo "FAIL: could not parse C6 smoke markers from log"
    exit 1
  fi

  echo "--- staging social graph browser E2E (Playwright) ---"
  export C6_STAGING_EVIDENCE_RUN=1
  export C6_STAGING_EVIDENCE_OUT="$EVID"
  export C6_STAGING_FOLLOWER_EMAIL="$C6_FOLLOWER_EMAIL"
  export C6_STAGING_AUTHOR_EMAIL="$C6_AUTHOR_EMAIL"
  export C6_STAGING_FOLLOWER_TOKEN="$C6_FOLLOWER_TOKEN"
  export C6_STAGING_AUTHOR_TOKEN="$C6_AUTHOR_TOKEN"
  export C6_STAGING_FOLLOWER_USER_ID="$C6_FOLLOWER_ID"
  export C6_STAGING_AUTHOR_USER_ID="$C6_AUTHOR_ID"
  export C6_STAGING_SOCIAL_MARKER="$C6_MARKER"
  export C6_STAGING_DM_MARKER="$C6_DM_MARKER"
  export C6_STAGING_POST_ID="$C6_POST_ID"
  export C6_STAGING_CONV_ID="$C6_CONV_ID"
  export C6_STAGING_PASSWORD="Test123!"
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
      cp "$FE_LOCAL" "$FE_LOCAL.bak-c6-${STAMP}"
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
  MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c6-staging-social-graph.spec.ts --project=chromium 2>&1 | tee -a "$E2E_LOG"
  cd "$REPO_ROOT"
  test -f "$EVID/browser-c6-social-summary.md" || {
    echo "FAIL: social browser E2E summary missing"
    exit 1
  }

  echo "TT_COMMUNITY_C6_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$IT_LOG")" "$EVID/latest-social-it.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-staging-social-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$IT_LOG" "$EVID/social-it.log"
cp -f "$E2E_LOG" "$EVID/staging-social-e2e.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C6 (social graph & engagement)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "social_it: $(basename "$IT_LOG")"
  echo "staging_social_e2e: $(basename "$E2E_LOG")"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C6 slot PASS only — NOT Phase ② GO / NOT C7-C12 GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
