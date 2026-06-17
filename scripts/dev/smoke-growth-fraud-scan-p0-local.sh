#!/usr/bin/env bash
# BE-FRD-01 · fraud-scan smoke (① local · API must be up for curl checks)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${TRAVELTRUST_API_BASE:-${API_BASE:-http://127.0.0.1:8080}}"

echo "== smoke-growth-fraud-scan-p0-local =="
for path in \
  "/api/v1/internal/growth/fraud-scan" \
  "/api/v1/admin/growth/anti-fraud/scan-runs"; do
  code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API$path" -H 'Content-Type: application/json' -d '{}' || echo 000)"
  if [[ "$code" != "401" && "$code" != "403" && "$code" != "503" ]]; then
    echo "FAIL $path unauth -> HTTP $code"
    exit 1
  fi
  echo "OK   $path probe -> HTTP $code"
done
bash "$ROOT/scripts/dev/run-sprint168-be-frd01-implementation-gate.sh"
echo "smoke-growth-fraud-scan-p0-local: exit 0"
