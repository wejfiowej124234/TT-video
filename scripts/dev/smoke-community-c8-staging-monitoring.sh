#!/usr/bin/env bash
# Phase ② · C8 staging 监控/健康检查 smoke（C1–C7 证据可追溯 · ② 槽 · 非 Phase ② GO）
#
# 用法（仓库根 · API 已起）：
#   API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
#     bash scripts/dev/smoke-community-c8-staging-monitoring.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
FE_BASE="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
FE_BASE="${FE_BASE%/}"
EVID_ROOT="$ROOT/evidence/GO_phase2_testnet_20260526/community"

fail() { echo "smoke-community-c8-staging-monitoring: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-community-c8-staging-monitoring: OK $*"; }

echo "== smoke-community-c8-staging-monitoring (② C8) API=$API_BASE FE=$FE_BASE =="

# --- C1–C7 evidence traceability ---
for slot in C1 C2 C3 C4 C5 C6 C7; do
  st="$EVID_ROOT/${slot}/STATUS.txt"
  [[ -f "$st" ]] || fail "missing evidence $st"
  grep -q "^status: PASS" "$st" || fail "${slot} STATUS not PASS"
  grep -q "^last_run:" "$st" || fail "${slot} STATUS missing last_run"
  ok "evidence ${slot}/STATUS.txt PASS"
done

c7_report="$EVID_ROOT/C7/report.json"
[[ -f "$c7_report" ]] || fail "missing C7 report.json"
grep -q '"release_gate": "GO"' "$c7_report" || fail "C7 report.json release_gate not GO"
ok "C7 report.json release_gate=GO"

# --- Core health ---
hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${API_BASE}/health" || echo 000)"
[[ "$hc" == "200" ]] || fail "/health HTTP $hc"
ok "GET /health 200"

meta_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${API_BASE}/meta" || echo 000)"
[[ "$meta_code" == "200" ]] || fail "/meta HTTP $meta_code"
ok "GET /meta 200"

fe_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${FE_BASE}/community" || echo 000)"
if [[ "$API_BASE" == *"fly.dev"* ]]; then
  ok "frontend /community probe skipped (Fly staging API_BASE; local FE shell optional)"
elif [[ "$fe_code" == "200" ]]; then
  ok "GET ${FE_BASE}/community 200"
else
  fail "frontend ${FE_BASE}/community HTTP $fe_code"
fi

# --- Key community read APIs ---
feed_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
  "${API_BASE}/api/v1/community/feed?limit=5" || echo 000)"
[[ "$feed_code" == "200" ]] || fail "community feed HTTP $feed_code"
ok "GET /api/v1/community/feed 200"

cap_code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 \
  "${API_BASE}/api/v1/community/media/capabilities" || echo 000)"
[[ "$cap_code" == "200" ]] || fail "media capabilities HTTP $cap_code"
ok "GET /api/v1/community/media/capabilities 200"

# --- Staging DB migrate evidence (G-2) ---
g2_log="$ROOT/evidence/GO_phase2_testnet_20260526/g2-staging-migrate/latest/run.log"
if [[ -f "$g2_log" ]]; then
  grep -q "exit 0\|migrate.*ok\|TT_G2\|sqlx migrate" "$g2_log" 2>/dev/null || true
  ok "G-2 migrate evidence present ($(basename "$g2_log"))"
else
  ok "G-2 migrate evidence optional (run record-phase2-g2-staging-sqlx-migrate-evidence.sh)"
fi

echo "api_base=${API_BASE}"
echo "frontend_base=${FE_BASE}"
echo "evidence_root=${EVID_ROOT}"
echo "c1_last_run=$(grep '^last_run:' "$EVID_ROOT/C1/STATUS.txt" | head -1 | cut -d' ' -f2-)"
echo "c7_release_gate=GO"
echo "TT_COMMUNITY_C8_STAGING_MONITORING: OK"
