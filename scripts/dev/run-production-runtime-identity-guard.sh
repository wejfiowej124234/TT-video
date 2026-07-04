#!/usr/bin/env bash
# Production Runtime Identity Guard — standalone probe + validate.
# SSOT: registry/production-runtime-identity-ssot.v1.json
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

PROFILE="${TT_RUNTIME_IDENTITY_PROFILE:-production}"
STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="${EVIDENCE_DIR:-evidence/GO_production_readiness/production-runtime-identity/${STAMP}}"

PROD_API_BASE="${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"

mkdir -p "$EVID"

# shellcheck source=scripts/dev/lib/g2-prod-probe.sh
source "$ROOT/scripts/dev/lib/g2-prod-probe.sh"

echo "=== Production Runtime Identity Guard · profile=${PROFILE} · ${STAMP} ==="
echo "PROD=${PROD_API_BASE} STAGING=${STAGING_API_BASE}"

mkdir -p "$EVID/staging" "$EVID/prod"

g2_probe_meta_build "$STAGING_API_BASE" staging "$EVID/staging"
g2_probe_meta_build "$PROD_API_BASE" prod "$EVID/prod"
cat "$EVID/staging/meta-summary.txt" "$EVID/prod/meta-summary.txt" >"$EVID/meta-summary.txt"
cp "$EVID/prod/meta-build.json" "$EVID/meta-build.json"
cp "$EVID/prod/meta.json" "$EVID/meta.json"
g2_compare_staging_prod_profiles "$EVID"
g2_probe_seed_endpoint "$PROD_API_BASE" prod "$EVID"
g2_probe_fly_secrets_inventory "$EVID"
g2_probe_fly_env_redacted "$EVID"
g2_compare_staging_prod_profiles "$EVID"
cat "$EVID/staging/meta-summary.txt" "$EVID/prod/meta-summary.txt" >"$EVID/meta-summary.txt"

node scripts/dev/validate-production-runtime-identity-guard.cjs \
  --evidence-dir "$EVID" \
  --profile "$PROFILE"

echo ""
echo "TT_PRODUCTION_RUNTIME_IDENTITY: see $EVID/production-runtime-identity.json"
