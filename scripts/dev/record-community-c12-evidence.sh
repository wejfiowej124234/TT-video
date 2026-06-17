#!/usr/bin/env bash
# C12 证据：DID / Trust / Reputation 互链 · API/DB IT + staging smoke + browser E2E（② 测试网槽）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"
REPO_WIN="$(pwd -W 2>/dev/null || pwd)"

EVID="$REPO_ROOT/evidence/GO_phase2_testnet_20260526/community/C12"
EVID_WIN="$REPO_WIN/evidence/GO_phase2_testnet_20260526/community/C12"
mkdir -p "$EVID/screenshots"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/run-${STAMP}.log"
IT_LOG="$EVID/did-trust-it-${STAMP}.log"
E2E_LOG="$EVID/staging-did-interlink-e2e-${STAMP}.log"

API_BASE="${API_BASE:-${STAGING_API_BASE:-http://127.0.0.1:8080}}"
API_BASE="${API_BASE%/}"
export API_BASE
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,localhost,127.0.0.1"
fi
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
export PLAYWRIGHT_BASE_URL

chmod +x "$REPO_ROOT/scripts/dev/smoke-community-c12-staging-did-interlink.sh" 2>/dev/null || true

{
  echo "TT_COMMUNITY_C12_EVIDENCE: START ${STAMP}"
  echo "API_BASE=${API_BASE}"
  echo "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}"

  echo "--- DID / Trust API·IT (cargo + vitest meTrust) ---"
  {
    cargo test -p traveltrust-api p21_get_me_trust
    cargo test -p traveltrust-api matrix_93_d_com_c6_follow
    cd "$REPO_ROOT/frontend"
    npx vitest run meTrust --run
    cd "$REPO_ROOT"
  } 2>&1 | tee "$IT_LOG"
  grep -q "test result: ok" "$IT_LOG" || { echo "FAIL: did-trust IT"; exit 1; }

  echo "--- staging DID interlink API smoke ---"
  bash "$REPO_ROOT/scripts/dev/smoke-community-c12-staging-did-interlink.sh" 2>&1 | tee "$E2E_LOG"
  grep -q "TT_COMMUNITY_C12_STAGING_DID_INTERLINK_API: OK" "$E2E_LOG" || {
    echo "FAIL: staging API smoke"
    exit 1
  }

  parse_field() {
    grep -oE "$1" "$E2E_LOG" | head -1 | cut -d= -f2- || true
  }

  C12_HERO_EMAIL="$(parse_field 'hero_email=c12-hero-[0-9]+@example.com')"
  C12_TARGET_USER_ID="$(parse_field 'target_user_id=[0-9a-f-]{36}')"
  C12_SHOWCASE_USER_ID="$(parse_field 'showcase_user_id=[0-9a-f-]{36}')"
  C12_MARKER="$(parse_field 'marker=c12-did-interlink-[0-9]+')"

  if [[ -z "$C12_HERO_EMAIL" || -z "$C12_TARGET_USER_ID" || -z "$C12_SHOWCASE_USER_ID" || -z "$C12_MARKER" ]]; then
    echo "FAIL: could not parse C12 smoke markers"
    exit 1
  fi

  echo "--- staging DID interlink browser E2E (Playwright) ---"
  export C12_STAGING_EVIDENCE_RUN=1
  export C12_STAGING_EVIDENCE_OUT="$EVID"
  export C12_HERO_EMAIL="$C12_HERO_EMAIL"
  export C12_TARGET_USER_ID="$C12_TARGET_USER_ID"
  export C12_SHOWCASE_USER_ID="$C12_SHOWCASE_USER_ID"
  export C12_MARKER="$C12_MARKER"
  export C12_STAGING_PASSWORD="Test123!"
  export PLAYWRIGHT_E2E_NO_WEBSERVER=1
  export PLAYWRIGHT_FULL_STACK=0
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
  export PLAYWRIGHT_API_BASE_URL="$API_BASE"

  cd "$REPO_ROOT/frontend"
  MSYS_NO_PATHCONV=1 npx playwright test e2e/community-c12-staging-did-interlink.spec.ts --project=chromium 2>&1 | tee -a "$E2E_LOG"
  cd "$REPO_ROOT"

  test -f "$EVID/browser-c12-did-interlink-summary.md" || {
    echo "FAIL: browser summary missing"
    exit 1
  }

  for png in c12-01-feed-author-identity.png c12-02-profile-user.png c12-03-profile-me-did-wallet.png \
    c12-04-did-rank-board.png c12-05-did-rank-to-profile.png c12-06-community-back-from-profile.png \
    c12-07-friends-following-identity.png c12-08-did-rank-guide-tab.png; do
    test -f "$EVID/screenshots/$png" || { echo "FAIL: missing screenshot $png"; exit 1; }
  done

  echo "--- generate did-interlink-summary.md ---"
  python "$REPO_ROOT/scripts/gen-community-c12-did-interlink-summary.py" \
    --evidence-dir "$EVID" \
    --stamp "$STAMP" \
    --api-base "$API_BASE" \
    --frontend-base "$PLAYWRIGHT_BASE_URL" \
    --hero-email "$C12_HERO_EMAIL" \
    --target-user-id "$C12_TARGET_USER_ID" \
    --showcase-user-id "$C12_SHOWCASE_USER_ID"

  grep -q "C12 slot verdict" "$EVID/did-interlink-summary.md" || { echo "FAIL: summary incomplete"; exit 1; }

  echo "TT_COMMUNITY_C12_EVIDENCE: OK"
} 2>&1 | tee "$RUN_LOG"

ln -sfn "$(basename "$RUN_LOG")" "$EVID/latest-run.log"
ln -sfn "$(basename "$IT_LOG")" "$EVID/latest-did-trust-it.log"
ln -sfn "$(basename "$E2E_LOG")" "$EVID/latest-staging-did-interlink-e2e.log"
cp -f "$RUN_LOG" "$EVID/run.log"
cp -f "$IT_LOG" "$EVID/did-trust-it.log"
cp -f "$E2E_LOG" "$EVID/staging-did-interlink-e2e.log"

HERO_EMAIL_OUT="$(grep -oE 'hero_email=c12-hero-[0-9]+@example.com' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
TARGET_ID_OUT="$(grep -oE 'target_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"
SHOWCASE_OUT="$(grep -oE 'showcase_user_id=[0-9a-f-]{36}' "$E2E_LOG" | head -1 | cut -d= -f2 || true)"

STATUS="$EVID/STATUS.txt"
{
  echo "phase: ② testnet C12 (DID / Trust / Reputation interlink staging E2E)"
  echo "status: PASS"
  echo "last_run: ${STAMP}"
  echo "api_base: ${API_BASE}"
  echo "hero_email: ${HERO_EMAIL_OUT:-unknown}"
  echo "target_user_id: ${TARGET_ID_OUT:-unknown}"
  echo "showcase_user_id: ${SHOWCASE_OUT:-unknown}"
  echo "did_interlink_summary: did-interlink-summary.md"
  echo "did_trust_it: did-trust-it.log"
  echo "staging_did_interlink_e2e: staging-did-interlink-e2e.log"
  echo "screenshots: screenshots/"
  echo "log: $(basename "$RUN_LOG")"
  echo "note: C12 slot PASS only — NOT Phase ② GO / NOT Production GO"
} > "$STATUS"

echo "OK -> $RUN_LOG"
echo "STATUS -> $STATUS"
