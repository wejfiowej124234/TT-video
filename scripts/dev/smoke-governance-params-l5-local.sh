#!/usr/bin/env bash
# ① Governance Params L5 · 本地烟测（vitest 绿集 + protocol-reference API 链）
# Governance Params L5 Closure：/governance/params · 84 doc mirror · pending 公开读
#
# 用法（API 已起）：
#   bash scripts/dev/smoke-governance-params-l5-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   SKIP_VITEST=1
#   SKIP_API_PROBE=1
#   SKIP_PLAYWRIGHT=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
SKIP_VITEST="${SKIP_VITEST:-0}"
SKIP_API_PROBE="${SKIP_API_PROBE:-0}"
SKIP_PLAYWRIGHT="${SKIP_PLAYWRIGHT:-1}"

fail() { echo "GP-L5-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "GP-L5-smoke: OK $*"; }

if [[ "$SKIP_VITEST" != "1" ]]; then
  echo "== vitest Governance Params L5 contracts =="
  cd "$ROOT/frontend"
  npx vitest run \
    lib/governanceParams84Readonly.test.ts \
    lib/governance/governanceParamsCountryDisplay.test.ts \
    lib/governance/governanceParamsPageL5Ui.test.tsx \
    lib/governance/governanceParamsPageL5FullClosure.contract.test.ts \
    app/governance/params/governanceParamsPage.contract.test.ts \
    app/governance/params/governanceParamsParticipatePanel.contract.test.ts
  cd "$ROOT"
  ok "vitest contracts"
fi

if [[ "$SKIP_API_PROBE" != "1" ]]; then
  echo "== API probe protocol-reference + pending (public read) =="

  ref_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/governance/protocol-reference")"
  ref_code="${ref_resp##*$'\n'}"
  ref_body="${ref_resp%$'\n'*}"
  [[ "$ref_code" == "200" ]] || fail "GET /governance/protocol-reference HTTP $ref_code body=${ref_body:0:200}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    if (!o || typeof o !== 'object') { console.error('invalid protocol-reference'); process.exit(1); }
  " "$ref_body" || fail "protocol-reference shape invalid"
  ok "GET /api/v1/governance/protocol-reference"

  pending_resp="$(curl -sS -w '\n%{http_code}' -X GET "$API_BASE/api/v1/governance/protocol-reference/pending")"
  pending_code="${pending_resp##*$'\n'}"
  pending_body="${pending_resp%$'\n'*}"
  if [[ "$pending_code" == "401" ]]; then
    fail "GET /governance/protocol-reference/pending HTTP 401 — rebuild & restart API (cargo build -p traveltrust-api)"
  fi
  [[ "$pending_code" == "200" ]] || fail "GET /governance/protocol-reference/pending HTTP $pending_code body=${pending_body:0:200}"
  node -e "
    const o=JSON.parse(process.argv[1]);
    if (!o || typeof o !== 'object') { console.error('invalid pending payload'); process.exit(1); }
  " "$pending_body" || fail "protocol-reference/pending shape invalid"
  ok "GET /api/v1/governance/protocol-reference/pending"
fi

if [[ "$SKIP_PLAYWRIGHT" != "1" ]]; then
  echo "== Playwright governance params full L5 probes =="
  cd "$ROOT/frontend"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_API_PORT="${PLAYWRIGHT_API_PORT:-${API_BASE##*:}}"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/governance-params-full-l5.spec.ts
  cd "$ROOT"
  ok "playwright full-page probes"
fi

echo "TT_GOVERNANCE_PARAMS_L5_SMOKE: OK phase=① params+pending+doc-mirror"
echo "GP-L5-smoke: ALL PASS (① local · Governance Params L5 Closure)"
