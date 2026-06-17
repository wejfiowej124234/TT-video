#!/usr/bin/env bash
# Phase ② · C9 staging Shell Token / visual sign-off smoke（② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API + FE 已起）：
#   API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
#     bash scripts/dev/smoke-community-c9-staging-shell-signoff.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
FE_BASE="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
FE_BASE="${FE_BASE%/}"
EVID_ROOT="$ROOT/evidence/GO_phase2_testnet_20260526/community"

fail() { echo "smoke-community-c9-staging-shell-signoff: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c9-staging-shell-signoff: OK $*"; }

echo "== smoke-community-c9-staging-shell-signoff (② C9) API=$API_BASE FE=$FE_BASE =="

for slot in C1 C2 C3 C4 C5 C6 C7 C8; do
  st="$EVID_ROOT/${slot}/STATUS.txt"
  [[ -f "$st" ]] || fail "missing evidence $st"
  grep -q "^status: PASS" "$st" || fail "${slot} STATUS not PASS"
  ok "evidence ${slot}/STATUS.txt PASS"
done

hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health HTTP $hc"
ok "GET /health 200"

fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${FE_BASE}/community" || echo 000)"
[[ "$fe_code" == "200" ]] || fail "frontend ${FE_BASE}/community HTTP $fe_code"
ok "GET ${FE_BASE}/community 200"

feed_json="$(curl -sS --max-time 20 "${API_BASE}/api/v1/community/feed?limit=30" || true)"
[[ -n "$feed_json" ]] || fail "empty feed response"
echo "$feed_json" | grep -q '"status":"ok"' || fail "feed status not ok"
feed_count="$(echo "$feed_json" | python -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('posts') or []))" 2>/dev/null || echo 0)"
[[ "${feed_count:-0}" -ge 10 ]] || fail "feed_count=${feed_count} < 10"
ok "feed_count=${feed_count}"

automation_leak="$(echo "$feed_json" | python -c "
import json,re,sys
d=json.load(sys.stdin)
pat=re.compile(r'^(e2e-|pi1-fe-|browser-minio-)', re.I)
leak=[p for p in (d.get('posts') or []) if pat.match(str(p.get('body') or '').strip())]
print(len(leak))
" 2>/dev/null || echo 999)"
[[ "${automation_leak:-999}" -eq 0 ]] || fail "automation_leak=${automation_leak}"
ok "automation_leak=0"

showcase_user_id="$(echo "$feed_json" | python -c "
import json,sys
d=json.load(sys.stdin)
for p in d.get('posts') or []:
    nick=str(p.get('author_nickname') or '')
    if 'Aurora' in nick or 'Kento' in nick:
        print(p.get('user_id') or '')
        break
" 2>/dev/null || true)"
[[ -n "$showcase_user_id" ]] || fail "could not resolve showcase_user_id from feed"
ok "showcase_user_id=${showcase_user_id}"

echo "--- vitest shell token contracts (① frozen · ② staging sign-off gate) ---"
cd "$ROOT/frontend"
npx vitest run \
  components/community/communityShellTheme.contract.test.ts \
  components/community/communityDrawerTheme.contract.test.ts \
  components/community/communityPageTheme.contract.test.ts \
  app/community/communitySubRoutes.contract.test.ts \
  2>&1
cd "$ROOT"
ok "vitest shell token contracts exit 0"

# Optional login for /community/me (prefer C6 author from latest C6 log)
login_email=""
c6_log="$EVID_ROOT/C6/latest-staging-social-e2e.log"
if [[ -f "$c6_log" ]]; then
  login_email="$(grep -oE 'author_email=c6-author-[0-9]+@example.com' "$c6_log" | head -1 | cut -d= -f2 || true)"
fi

echo "showcase_user_id=${showcase_user_id}"
echo "staging_login_email=${login_email:-none}"
echo "TT_COMMUNITY_C9_STAGING_SHELL_SIGNOFF: OK"
