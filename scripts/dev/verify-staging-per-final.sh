#!/usr/bin/env bash
# PER Final · ② staging verify (registry + deployment_profile).
set -euo pipefail
APP="${FLY_STAGING_API_APP:-tt-api-staging}"
API_BASE="https://${APP}.fly.dev"

bash "$(dirname "$0")/verify-staging-registry-meta.sh"

profile=""
for i in 1 2 3 4 5 6; do
  profile="$(curl -sf --max-time 45 "${API_BASE}/meta/build" 2>/dev/null | python -c "import json,sys; print(json.load(sys.stdin).get('deployment_profile') or '')" 2>/dev/null || true)"
  if [[ "$profile" == "staging" ]]; then
    echo "OK   staging meta/build.deployment_profile=staging (attempt $i)"
    echo "TT_PER_STAGING_FINAL: PASS"
    exit 0
  fi
  echo "WARN deployment_profile attempt $i: got=${profile:-null} (retry in 10s)"
  sleep 10
done

echo "FAIL staging deployment_profile got=${profile:-null} expected=staging"
echo "hint: fly deploy tt-api-staging with TRAVELTRUST_DEPLOYMENT_PROFILE=staging secret + current API image"
exit 1
