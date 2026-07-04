#!/usr/bin/env bash
# PER Final · ② staging verify (registry + RuntimeIdentity meta profile).
# RuntimeIdentity.current() · require('./lib/runtime-identity.cjs')
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="https://${APP}.fly.dev"

bash "$(dirname "$0")/verify-staging-registry-meta.sh"

for i in 1 2 3 4 5 6; do
  if node "$ROOT/scripts/dev/lib/runtime-identity-cli.cjs" assert-meta-profile "${API_BASE}/meta/build" staging 2>/dev/null; then
    echo "OK   staging meta/build profile=staging (attempt $i)"
    echo "TT_PER_STAGING_FINAL: PASS"
    exit 0
  fi
  echo "WARN meta profile attempt $i: retry in 10s"
  sleep 10
done

echo "FAIL staging meta profile expected=staging (RuntimeIdentity)"
echo "hint: fly deploy tt-api-staging with profile secret staging + current API image"
exit 1
