#!/usr/bin/env bash
# C9 证据：社区 Shell Token / Visual Sign-off（Founder Review + 88 §18.7 · ② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C9"
mkdir -p "$EVID/screenshots"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

C9_FE_PID=""
cleanup_c9_fe() {
  if [[ -n "${C9_FE_PID:-}" ]]; then
    taskkill //F //PID "$C9_FE_PID" 2>/dev/null || kill "$C9_FE_PID" 2>/dev/null || true
  fi
}
trap cleanup_c9_fe EXIT

ensure_c9_frontend_dev() {
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
    cp "$FE_LOCAL" "$FE_LOCAL.bak-c9-${STAMP}"
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

  echo "--- starting Next dev for C9 shell sign-off (${PLAYWRIGHT_BASE_URL}) ---"
  (
    cd "$REPO_ROOT/frontend"
    export FRONTEND_PORT=3012
    export TRAVELTRUST_FRONTEND_PORT=3012
    export NEXT_PUBLIC_API_BASE_URL="$API_BASE"
    export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0
    npm run dev
  ) >"$EVID/c9-fe-dev-${STAMP}.log" 2>&1 &
  C9_FE_PID=$!

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

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c9-staging-shell-signoff.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C9_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"

  echo "--- ensure local FE dev (C9 smoke requires /community 200) ---"
  ensure_c9_frontend_dev

  echo "--- C1–C8 evidence STATUS pre-check ---"
  for slot in C1 C2 C3 C4 C5 C6 C7 C8; do
    st="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/${slot}/STATUS.txt"
    grep -q "^status: PASS" "$st" || { echo "FAIL: ${slot} not PASS"; exit 1; }
    echo "OK ${slot} PASS"
  done

  echo "--- staging shell sign-off smoke ---"
  smoke_out="$(mktemp)"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c9-staging-shell-signoff.sh" 2>&1 | tee "$smoke_out"
  grep -q "TT_COMMUNITY_C9_STAGING_SHELL_SIGNOFF: OK" "$smoke_out" || { echo "FAIL: shell signoff smoke"; exit 1; }

  SHOWCASE_USER_ID="$(grep -oE 'showcase_user_id=[0-9a-f-]{36}' "$smoke_out" | head -1 | cut -d= -f2 || true)"
  LOGIN_EMAIL="$(grep -oE 'staging_login_email=c6-author-[0-9]+@example.com' "$smoke_out" | head -1 | cut -d= -f2 || true)"
  FEED_COUNT="$(grep -oE 'feed_count=[0-9]+' "$smoke_out" | head -1 | cut -d= -f2 || echo 0)"
  [[ -n "$SHOWCASE_USER_ID" ]] || { echo "FAIL: showcase_user_id missing"; exit 1; }

  echo "--- staging shell browser sign-off (Playwright) ---"
  export C9_STAGING_EVIDENCE_RUN=1
  export C9_STAGING_EVIDENCE_OUT="$EVID"
  export C9_SHOWCASE_USER_ID="$SHOWCASE_USER_ID"
  export C9_STAGING_PASSWORD="Test123!"
  if [[ -n "$LOGIN_EMAIL" ]]; then
    export C9_STAGING_LOGIN_EMAIL="$LOGIN_EMAIL"
  fi
  export PLAYWRIGHT_E2E_NO_WEBSERVER=1
  export PLAYWRIGHT_FULL_STACK=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  export PLAYWRIGHT_REUSE_FE_SERVER=1
  export PLAYWRIGHT_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_API_BASE_URL="$API_BASE"
  export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=0

  cd "$REPO_ROOT/frontend"
  MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c9-staging-shell-signoff.spec.ts --project=chromium 2>&1
  cd "$REPO_ROOT"
  test -f "$EVID/browser-c9-shell-summary.md" || { echo "FAIL: browser summary missing"; exit 1; }

  for png in c9-feed-desktop.png c9-explore-desktop.png c9-friends-desktop.png c9-messages-desktop.png \
    c9-activity-desktop.png c9-profile-user-desktop.png c9-did-rank-desktop.png c9-feed-mobile.png; do
    test -f "$EVID/screenshots/$png" || { echo "FAIL: missing screenshot $png"; exit 1; }
  done

  echo "--- generate visual-review.md ---"
  python "$REPO_ROOT/scripts/gen-community-c9-visual-review.py" \
    --repo-root "$REPO_ROOT" \
    --evidence-dir "$EVID" \
    --stamp "$STAMP" \
    --api-base "$API_BASE" \
    --frontend-base "$PLAYWRIGHT_BASE_URL" \
    --showcase-user-id "$SHOWCASE_USER_ID" \
    --feed-count "$FEED_COUNT" \
    --automation-leak 0 \
    --login-email "${LOGIN_EMAIL:-}"

  grep -q "C9 slot verdict" "$EVID/visual-review.md" || { echo "FAIL: visual-review.md incomplete"; exit 1; }
  grep -q "\*\*PASS\*\*" "$EVID/visual-review.md" || { echo "FAIL: visual-review verdict not PASS"; exit 1; }

  echo "TT_COMMUNITY_C9_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

SHOWCASE_USER_ID="$(grep -oE 'showcase_user_id=[0-9a-f-]{36}' "$RUN_LOG" | head -1 | cut -d= -f2 || true)"
LOGIN_EMAIL="$(grep -oE 'staging_login_email=c6-author-[0-9]+@example.com' "$RUN_LOG" | head -1 | cut -d= -f2 || true)"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
cp -f "$RUN_LOG" "$EVID/run.log"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C9 (shell token / visual sign-off)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "showcase_user_id: ${SHOWCASE_USER_ID:-00000000-0000-4000-8000-000000000401}"
  echo "visual_review: visual-review.md"
  echo "screenshots: screenshots/"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C9 slot PASS only — NOT Phase ② GO / NOT C10-C12 GO / NOT Production GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
