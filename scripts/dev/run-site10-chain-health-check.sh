#!/usr/bin/env bash
# ① Site10 全链健康检查：API :8080 + Next :3012 + /meta + DB + RBAC 探针 + E2E setup shell contract
#
# 用法（仓库根 · 须 API/Next 已 warm 或由 run-site10-p1-slices-recheck-sequential 预启）：
#   bash scripts/dev/run-site10-chain-health-check.sh
#   bash scripts/dev/run-site10-chain-health-check.sh --skip-e2e-setup
#
# 末行：TT_SITE10_CHAIN_HEALTH: OK | FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SKIP_E2E_SETUP=0
while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-e2e-setup) SKIP_E2E_SETUP=1; shift ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

# shellcheck source=scripts/dev/export-database-url-from-root-env.sh
source "$ROOT/scripts/dev/export-database-url-from-root-env.sh"

export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT:-8080}"
export PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
API_BASE="http://127.0.0.1:${PLAYWRIGHT_API_PORT}"
FE_BASE="${PLAYWRIGHT_BASE_URL}"
OUT="$ROOT/frontend/evidence/GO_local_phase1/site10-chain-health.latest.log"
STAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
mkdir -p "$(dirname "$OUT")"

fail() {
  echo "TT_SITE10_CHAIN_HEALTH: FAIL $*" | tee -a "$OUT" >&2
  exit 1
}
ok() { echo "SITE10_HEALTH_OK: $*" | tee -a "$OUT"; }

{
  echo "# site10 chain health · $STAMP (UTC)"
  echo "# API=${API_BASE} FE=${FE_BASE}"
  echo ""
} >"$OUT"

curl_code() {
  curl -sS -o /dev/null -w "%{http_code}" --max-time "${2:-30}" "$1" 2>/dev/null || echo "000"
}

# --- API /health ---
hc="$(curl_code "${API_BASE}/health" 15)"
[[ "$hc" == "200" ]] || fail "/health HTTP $hc (start API on :${PLAYWRIGHT_API_PORT})"
ok "/health $hc"

# --- GET /meta + database_connected ---
META_BODY="$(mktemp)"
trap 'rm -f "$META_BODY"' EXIT
mc="$(curl -sS -o "$META_BODY" -w "%{http_code}" --max-time 120 "${API_BASE}/meta" 2>/dev/null || echo 000)"
[[ "$mc" == "200" ]] || fail "API /meta HTTP $mc"
ok "API /meta $mc"

db_ok=0
if command -v node >/dev/null 2>&1; then
  for _ in $(seq 1 45); do
    curl -sS --max-time 120 -o "$META_BODY" "${API_BASE}/meta" 2>/dev/null || true
    if node -e "
const fs = require('fs');
const p = process.argv[1];
let j;
try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch { process.exit(2); }
const dc = j.database_connected ?? j.database?.connected;
process.exit(dc === true ? 0 : 1);
" "$META_BODY"
    then
      db_ok=1
      break
    fi
    sleep 2
  done
  [[ "$db_ok" -eq 1 ]] || fail "/meta database_connected not true after wait (check PostgreSQL + DATABASE_URL)"
  ok "/meta database_connected true"
fi

mb="$(curl_code "${API_BASE}/meta/build" 45)"
[[ "$mb" == "200" ]] || fail "/meta/build HTTP $mb"
ok "/meta/build $mb"

# --- Next :3012 shell + /meta rewrite ---
fc="$(curl_code "${FE_BASE}/" 20)"
[[ "$fc" == "200" ]] || fail "Next / HTTP $fc"
ok "Next / $fc"

ttc="$(curl_code "${FE_BASE}/traveltrust" 45)"
[[ "$ttc" == "200" ]] || fail "Next /traveltrust HTTP $ttc"
ok "Next /traveltrust $ttc"

wmc="$(curl_code "${FE_BASE}/meta" 120)"
[[ "$wmc" == "200" ]] || fail "Next /meta rewrite HTTP $wmc"
ok "Next /meta rewrite $wmc"

# --- RBAC 探针：未鉴权 /me 须 401/403（非 5xx / 000）---
me_code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "${API_BASE}/api/v1/me" 2>/dev/null || echo 000)"
if [[ "$me_code" != "401" && "$me_code" != "403" ]]; then
  fail "RBAC unauth GET /api/v1/me expected 401|403 got $me_code"
fi
ok "RBAC unauth /api/v1/me $me_code"

# --- page-brief API trigger（PI-1 / traveltrust brief-ready 同源）---
pb="$(curl_code "${API_BASE}/api/v1/traveltrust/page-brief" 30)"
[[ "$pb" == "200" ]] || fail "/api/v1/traveltrust/page-brief HTTP $pb"
ok "API page-brief trigger $pb"

# --- E2E setup shell contract ---
if [[ "$SKIP_E2E_SETUP" -eq 0 ]]; then
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-1}"
  export PLAYWRIGHT_SITE10_EXTERNAL_STACK="${PLAYWRIGHT_SITE10_EXTERNAL_STACK:-1}"
  export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
  export P3_CHAIN_OFF="${P3_CHAIN_OFF:-1}"
  export PORT="${PLAYWRIGHT_API_PORT}"
  echo "== site10 health: E2E setup meta-chain-contracts ==" | tee -a "$OUT"
  set +e
  (
    cd "$ROOT/frontend"
    env -u REQUIRE_IDEMPOTENCY_KEY node ./scripts/run-e2e-default.mjs \
      e2e/setup/meta-chain-contracts.spec.ts --project=setup-meta-chain
  ) 2>&1 | tee -a "$OUT"
  setup_rc=${PIPESTATUS[0]}
  set -e
  [[ "$setup_rc" -eq 0 ]] || fail "E2E setup meta-chain-contracts exit $setup_rc"
  ok "E2E setup meta-chain-contracts exit 0"
fi

echo "TT_SITE10_CHAIN_HEALTH: OK" | tee -a "$OUT"
