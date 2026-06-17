#!/usr/bin/env bash
# Cross-Domain Integration Audit · ① API 跨域传播 + ② PG 一致性
#
#   bash scripts/dev/run-cross-domain-integration-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${CDIA_OUT:-$ROOT/evidence/cross-domain-integration-audit/${STAMP}}"
mkdir -p "$OUT"

export CDIA_API_BASE="${CDIA_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"
export CDIA_OUT="$OUT"
export CDIA_PASSWORD="${CDIA_PASSWORD:-TestPass12!}"
export CDIA_ADMIN_PASSWORD="${CDIA_ADMIN_PASSWORD:-Test123!}"
export CDIA_ADMIN_EMAIL="${CDIA_ADMIN_EMAIL:-tourist@test.com}"
export CDIA_SKIP_P2_GAPS="${CDIA_SKIP_P2_GAPS:-1}"
export P3_CHAIN_OFF=1

PY="${PYTHON:-}"
if [[ -z "$PY" ]]; then
  command -v python >/dev/null 2>&1 && PY=python || PY=python3
fi

echo "admin_email=${CDIA_ADMIN_EMAIL} (seed promote_admin)"
echo "== Cross-Domain Integration Audit · ${STAMP} =="
echo "api=${CDIA_API_BASE}"
echo "NOTE: 须 P3_CHAIN_OFF=1 + SEED_TEST_ACCOUNTS=1 + DATABASE_URL"

ARB_EMAIL="${CDIA_ARBITRATOR_EMAIL:-cdia-arbitrator-audit@traveltrust.test}"
export CDIA_ARBITRATOR_EMAIL="$ARB_EMAIL"

# 裁决员角色：重启 API 并注入 P3_SEED_ARBITRATOR_EMAIL（复用既有 release 二进制）
if [[ "${CDIA_SKIP_API_RESTART:-0}" != "1" ]]; then
  netstat -ano 2>/dev/null | grep ":8080" | grep LISTENING | awk '{print $5}' | head -1 | xargs -I{} taskkill //F //PID {} 2>/dev/null || true
  sleep 2
  set -a
  [[ -f .env ]] && source .env
  set +a
  export P3_CHAIN_OFF=1
  export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
  export P3_SEED_ARBITRATOR_EMAIL="$ARB_EMAIL"
  nohup bash scripts/dev/start-api-for-playwright.sh > /tmp/cdia-api.log 2>&1 &
  for _ in $(seq 1 60); do
    health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 "${CDIA_API_BASE}/health" 2>/dev/null || echo 000)"
    [[ "$health" == "200" ]] && break
    sleep 3
  done
fi

health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 8 "${CDIA_API_BASE}/health" || echo 000)"
if [[ "$health" != "200" ]]; then
  echo "WARN: API ${CDIA_API_BASE} /health=${health} — 探针可能 FAIL" >&2
fi

set +e
"$PY" "$ROOT/scripts/dev/cross-domain-integration-audit.py" 2>&1 | tee "$OUT/cdia-probe.log"
PROBE_RC=$?
set -e

set +e
"$PY" "$ROOT/scripts/dev/cdia-phase2-pg-consistency-audit.py" 2>&1 | tee "$OUT/cdia-phase2-pg.log"
PG_RC=$?
set -e

set +e
"$PY" "$ROOT/scripts/dev/cdia-merge-phase2-findings.py"
MERGE_RC=$?
set -e

"$PY" "$ROOT/scripts/dev/generate-cdia-report.py" \
  --findings "$OUT/cdia-findings.json" \
  --out "$ROOT/docs/runbook/CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT.md"

ln -sfn "$(basename "$OUT")" "$ROOT/evidence/cross-domain-integration-audit/latest" 2>/dev/null || true

VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['verdict'])" "$OUT/cdia-findings.json")"
echo "CDIA: $VERDICT"
echo "Report: docs/runbook/CROSS-DOMAIN-INTEGRATION-AUDIT-REPORT.md"
echo "Evidence: $OUT"

[[ "$PROBE_RC" -ne 0 || "$PG_RC" -ne 0 || "$MERGE_RC" -ne 0 ]] && exit 1
exit 0
