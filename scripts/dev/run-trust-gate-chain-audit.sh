#!/usr/bin/env bash
# Trust Gate Chain Audit · CDIA-2-001 收口
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${TGCA_OUT:-$ROOT/evidence/trust-gate-chain-audit/${STAMP}}"
mkdir -p "$OUT"

export TGCA_API_BASE="${TGCA_API_BASE:-http://127.0.0.1:8080}"
export TGCA_OUT="$OUT"
export P3_CHAIN_OFF=1
export SEED_TEST_ACCOUNTS=1

PY="${PYTHON:-}"
[[ -z "$PY" ]] && { command -v python >/dev/null 2>&1 && PY=python || PY=python3; }

if [[ "${TGCA_SKIP_API_RESTART:-0}" != "1" ]]; then
  netstat -ano 2>/dev/null | grep ":8080" | grep LISTENING | awk '{print $5}' | head -1 | xargs -I{} taskkill //F //PID {} 2>/dev/null || true
  sleep 2
  set -a; [[ -f .env ]] && source .env; set +a
  export P3_CHAIN_OFF=1 SEED_TEST_ACCOUNTS=1
  nohup bash scripts/dev/start-api-for-playwright.sh > /tmp/tgca-api.log 2>&1 &
  for _ in $(seq 1 60); do
    health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 "${TGCA_API_BASE}/health" 2>/dev/null || echo 000)"
    [[ "$health" == "200" ]] && break
    sleep 3
  done
fi

echo "== Trust Gate Chain Audit · ${STAMP} =="
"$PY" "$ROOT/scripts/dev/trust-gate-chain-audit.py" 2>&1 | tee "$OUT/tgca-probe.log"
PROBE_RC=$?
"$PY" "$ROOT/scripts/dev/tgca-phase2-pg-audit.py" 2>&1 | tee "$OUT/tgca-pg.log"
ln -sfn "$(basename "$OUT")" "$ROOT/evidence/trust-gate-chain-audit/latest" 2>/dev/null || true
VERDICT="$("$PY" -c "import json,sys; print(json.load(open(sys.argv[1]))['verdict'])" "$OUT/tgca-findings.json")"
echo "TGCA: $VERDICT"
echo "Evidence: $OUT"
[[ "$PROBE_RC" -ne 0 ]] && exit 1
exit 0
