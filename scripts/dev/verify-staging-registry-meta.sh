#!/usr/bin/env bash
# PER-S-01 verify · staging GET /meta registry_address (②).
set -euo pipefail
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="https://${APP}.fly.dev"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EXAMPLE="$ROOT/deploy/fly/tt-web-staging/build.env.example"
EXP="$(grep -E '^NEXT_PUBLIC_REGISTRY_ADDRESS=' "$EXAMPLE" 2>/dev/null | head -1 | cut -d= -f2- | tr '[:upper:]' '[:lower:]' | tr -d '\r' || true)"

fetch_registry() {
  local meta got
  meta="$(curl -sf --max-time 45 "${API_BASE}/meta" 2>/dev/null || true)"
  [[ -n "$meta" ]] || return 1
  got="$(echo "$meta" | python -c "import json,sys; d=json.load(sys.stdin); print(((d.get('chain') or {}).get('contracts') or {}).get('registry_address') or '')" 2>/dev/null || true)"
  echo "$got" | tr '[:upper:]' '[:lower:]'
}

got_l=""
for i in 1 2 3 4 5 6; do
  got_l="$(fetch_registry || true)"
  if [[ -n "$got_l" && "$got_l" == "$EXP" ]]; then
    echo "OK   staging meta.registry_address == build.env.example (attempt $i)"
    echo "TT_PER_S01_STAGING_REGISTRY: PASS"
    exit 0
  fi
  echo "WARN staging registry attempt $i: got=${got_l:-null} (retry in 10s)"
  sleep 10
done

echo "FAIL staging registry_address got=${got_l:-null} expected=${EXP}"
exit 1
