#!/usr/bin/env bash
# ① Guide Workbench L5 · 本地烟测（vitest 绿集 + guide@test API 链）
# Guide Experience Consistency Sprint：/guide=经营 · Trust=准入 · settings=编辑（dirty-only 预览）
# Guide Order Corridor Sprint：收件箱/列表按 guide_id SSOT · /orders?hat=guide 接待订单视图
#
# 用法（API 已起）：
#   bash scripts/dev/smoke-guide-workbench-l5-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SKIP_VITEST=1
#   SKIP_API_PROBE=1
#   SKIP_PLAYWRIGHT=1（默认 1；=0 且 FE 已起时跑全页 Playwright 探针）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
PASSWORD="${SMOKE_PASSWORD:-Test123!}"
SKIP_VITEST="${SKIP_VITEST:-0}"
SKIP_API_PROBE="${SKIP_API_PROBE:-0}"
SKIP_PLAYWRIGHT="${SKIP_PLAYWRIGHT:-1}"

fail() { echo "GWB-L5-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "GWB-L5-smoke: OK $*"; }

if [[ "$SKIP_VITEST" != "1" ]]; then
  echo "== vitest Guide Workbench L5 contracts =="
  cd "$ROOT/frontend"
  npx vitest run \
    lib/guide/guideWorkbenchL5.contract.test.ts \
    lib/guide/guideWorkbenchL5FullClosure.contract.test.ts \
    lib/guide/guideWorkbenchWorkspaceL5.test.ts \
    lib/guide/guideWorkbenchAvailabilityModel.test.ts \
    lib/me/meSettingsTrustProgressModel.test.ts \
    lib/me/meSettingsTrustProgress.contract.test.ts \
    lib/guide/guideOrderCorridorModel.test.ts \
    lib/guide/guideOrderCorridor.contract.test.ts \
    app/me/identities/guide/settings/meGuideProfileSettings.contract.test.ts
  cd "$ROOT"
  ok "vitest contracts"
fi

if [[ "$SKIP_API_PROBE" != "1" ]]; then
  echo "== API probe guide@test.com workbench chain =="
  resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"guide@test.com\",\"password\":\"$PASSWORD\"}")"
  code="${resp##*$'\n'}"
  resp="${resp%$'\n'*}"
  [[ "$code" == "200" ]] || fail "login guide@test.com HTTP $code"
  token="$(node -e "const o=JSON.parse(process.argv[1]); if(!o.token) process.exit(1); process.stdout.write(o.token);" "$resp")"

  me_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me" -H "Authorization: Bearer $token")"
  me_code="${me_resp##*$'\n'}"
  [[ "$me_code" == "200" ]] || fail "GET /api/v1/me HTTP $me_code"
  me_body="${me_resp%$'\n'*}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const ev=o?.user?.email_verified_at ?? o?.email_verified_at;
    if(!ev) { console.error('missing email_verified_at on seed guide'); process.exit(1); }
  " "$me_body" || fail "guide@test.com missing email_verified_at (rebuild API + POST /auth/seed-test-accounts)"
  ok "GET /api/v1/me email_verified_at set"

  gp_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/guide-profile" -H "Authorization: Bearer $token")"
  gp_code="${gp_resp##*$'\n'}"
  gp_body="${gp_resp%$'\n'*}"
  [[ "$gp_code" == "200" ]] || fail "GET /api/v1/me/guide-profile HTTP $gp_code"
  guide_id="$(node -e "
    const o=JSON.parse(process.argv[1]);
    const id=o?.profile?.guide_id ?? o?.data?.guide_id ?? o?.guide_id ?? '';
    if(!String(id).trim()) process.exit(1);
    process.stdout.write(String(id).trim());
  " "$gp_body" 2>/dev/null || true)"
  [[ -n "$guide_id" ]] || fail "guide-profile missing guide_id"
  ok "GET /api/v1/me/guide-profile guide_id=$guide_id"

  exit_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/guide-exit-status" \
    -H "Authorization: Bearer $token")"
  exit_code="${exit_resp##*$'\n'}"
  exit_body="${exit_resp%$'\n'*}"
  if [[ "$exit_code" == "404" && -z "$(printf '%s' "$exit_body" | tr -d '[:space:]')" ]]; then
    fail "GET /api/v1/me/guide-exit-status 404 empty body — rebuild API (cargo build -p traveltrust-api) and restart 8080"
  fi
  [[ "$exit_code" == "200" ]] || fail "GET /api/v1/me/guide-exit-status HTTP $exit_code"
  node -e "
    const o=JSON.parse(process.argv[1]);
    if (o?.status !== 'ok') { console.error('expected status=ok'); process.exit(1); }
    if (!o?.exit?.guide_id) { console.error('missing exit.guide_id'); process.exit(1); }
  " "$exit_body" || fail "guide-exit-status response shape invalid"
  ok "GET /api/v1/me/guide-exit-status guide_id=$guide_id"

  av_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/guides/${guide_id}/availability" \
    -H "Authorization: Bearer $token")"
  av_code="${av_resp##*$'\n'}"
  [[ "$av_code" == "200" ]] || fail "GET /guides/:id/availability HTTP $av_code"
  ok "GET /guides/:id/availability"

  echo "== API probe multi-demo order corridor (guide_id SSOT) =="
  md_resp="$(curl -sS -w '\n%{http_code}' -X POST "$API_BASE/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"multi-demo@test.com\",\"password\":\"$PASSWORD\"}")"
  md_code="${md_resp##*$'\n'}"
  md_body="${md_resp%$'\n'*}"
  [[ "$md_code" == "200" ]] || fail "login multi-demo@test.com HTTP $md_code"
  md_token="$(node -e "const o=JSON.parse(process.argv[1]); if(!o.token) process.exit(1); process.stdout.write(o.token);" "$md_body")"

  md_gp_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/me/guide-profile" \
    -H "Authorization: Bearer $md_token")"
  md_gp_code="${md_gp_resp##*$'\n'}"
  md_gp_body="${md_gp_resp%$'\n'*}"
  [[ "$md_gp_code" == "200" ]] || fail "multi-demo GET /me/guide-profile HTTP $md_gp_code"
  md_guide_id="$(node -e "
    const o=JSON.parse(process.argv[1]);
    const id=o?.profile?.guide_id ?? o?.data?.guide_id ?? o?.guide_id ?? '';
    if(!String(id).trim()) process.exit(1);
    process.stdout.write(String(id).trim());
  " "$md_gp_body" 2>/dev/null || true)"
  [[ -n "$md_guide_id" ]] || fail "multi-demo guide-profile missing guide_id"

  ord_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/orders?business_line=trip&limit=50&hat=guide" \
    -H "Authorization: Bearer $md_token")"
  ord_code="${ord_resp##*$'\n'}"
  ord_body="${ord_resp%$'\n'*}"
  [[ "$ord_code" == "200" ]] || fail "multi-demo GET /orders?hat=guide HTTP $ord_code"
  corridor_stats="$(node -e "
    const guideRowId = process.argv[1];
    const raw = JSON.parse(process.argv[2]);
    const items = Array.isArray(raw?.items) ? raw.items : [];
    if (raw?.list_hat !== 'guide') {
      console.error('expected list_hat=guide in response');
      process.exit(1);
    }
    const mismatched = items.filter((o) => String(o?.guide_id ?? '').trim() !== guideRowId);
    if (mismatched.length) {
      console.error('server hat=guide filter leaked non-reception orders: ' + mismatched.length);
      process.exit(1);
    }
    process.stdout.write('reception=' + items.length + ' list_hat=guide');
  " "$md_guide_id" "$ord_body" 2>/dev/null || true)"
  [[ -n "$corridor_stats" ]] || fail "multi-demo order corridor parse failed"
  ok "multi-demo order corridor guide_id=$md_guide_id ($corridor_stats)"
fi

if [[ "$SKIP_PLAYWRIGHT" != "1" ]]; then
  echo "== Playwright guide workbench full L5 probes =="
  cd "$ROOT/frontend"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT:-${API_BASE##*:}}"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/guide-workbench-full-l5.spec.ts
  cd "$ROOT"
  ok "playwright full-page probes"
fi

echo "TT_GUIDE_WORKBENCH_L5_SMOKE: OK phase=① ops+trust-ssot+guide-exit+order-corridor+settings-dirty-preview"
echo "GWB-L5-smoke: ALL PASS (① local · Guide Order Corridor Closure Sprint)"
