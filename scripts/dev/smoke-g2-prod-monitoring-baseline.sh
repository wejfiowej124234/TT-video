#!/usr/bin/env bash
# G2 · PRM-MON-B001 — prod synthetic monitoring baseline (read-only).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
API="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
API="${API%/}"
OUT="${1:-$ROOT/evidence/GO_production_readiness/g2-reality-fix/_tmp/monitoring}"
mkdir -p "$OUT"

fail=0
check_get() {
  local name="$1" url="$2"
  local code
  code="$(curl -sS -o "${OUT}/${name}.json" -w '%{http_code}' --max-time 20 "$url" 2>/dev/null || echo 000)"
  echo "${name}_http=${code}" | tee -a "$OUT/probes.txt"
  [[ "$code" == "200" ]] || fail=1
}

# RuntimeIdentity.current() · require('./lib/runtime-identity.cjs') · PRM-MON-B001
if node "$ROOT/scripts/dev/lib/runtime-identity-cli.cjs" assert-meta-profile "${API}/meta/build" production 2>/dev/null; then
  echo "runtime_identity_meta=PASS" | tee -a "$OUT/probes.txt"
else
  echo "runtime_identity_meta=FAIL" | tee -a "$OUT/probes.txt"
  fail=1
fi

check_get health "${API}/health"
check_get meta "${API}/meta"
check_get community_feed "${API}/api/v1/community/feed?limit=5"
check_get media_capabilities "${API}/api/v1/community/media/capabilities"

if bash "$ROOT/scripts/gates/check-ops-monitoring-prometheus-examples.sh" 2>&1 | tee "$OUT/prometheus-rules.log"; then
  echo "prometheus_rules=PASS" | tee -a "$OUT/probes.txt"
else
  echo "prometheus_rules=WARN" | tee -a "$OUT/probes.txt"
fi

cat >"$OUT/on-call-path.json" <<EOF
{
  "on_call_runbook": "docs/runbook/PRODUCTION-INCIDENT-RESPONSE.md",
  "ops_runbook": "docs/runbook/PRODUCTION-OPS-RUNBOOK.md",
  "synthetic_probes": ["GET /health", "GET /meta", "GET /api/v1/community/feed", "GET /api/v1/community/media/capabilities"],
  "alert_rules_script": "scripts/gates/check-ops-monitoring-prometheus-examples.sh",
  "attestation": "Owner confirms on-call path reachable before G2 Formal Acceptance",
  "prod_api_base": "${API}"
}
EOF

if [[ "$fail" -eq 0 ]]; then
  echo "G2 prod monitoring baseline: PASS"
else
  echo "G2 prod monitoring baseline: FAIL"
  exit 1
fi
