#!/usr/bin/env bash
# WEB3_ENV_CATALOG_GATE — treasury/env key SSOT validation (DEP-001)
# SSOT: registry/env-key-catalog-web3.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

CATALOG="registry/env-key-catalog-web3.v1.yaml"
PHASE2_ENV="scripts/dev/.env.phase2-chain-deploy.local"

[[ -f "$CATALOG" ]] || fail "missing $CATALOG"

echo "== Web3 Env Catalog Gate (DEP-001) =="

grep -q 'GOVERNANCE_TREASURY_P4CAP_ADDRESS' "$CATALOG" \
  || fail "catalog missing GOVERNANCE_TREASURY_P4CAP_ADDRESS"
grep -q 'LEGACY_TREASURY_ADDRESS' "$CATALOG" \
  || fail "catalog missing LEGACY_TREASURY_ADDRESS"
grep -q 'forbidden_in_new_env' "$CATALOG" \
  || fail "catalog missing deprecated key policy"
grep -q 'GOVERNANCE_TREASURY_ADDRESS' "$CATALOG" \
  || fail "catalog missing GOVERNANCE_TREASURY_ADDRESS deprecation"
echo "OK catalog schema present"

[[ -f "$PHASE2_ENV" ]] || fail "missing canonical phase2 env $PHASE2_ENV"

grep -qE '^GOVERNANCE_TREASURY_P4CAP_ADDRESS=0x' "$PHASE2_ENV" \
  || fail "phase2 env missing active GOVERNANCE_TREASURY_P4CAP_ADDRESS"
grep -qE '^LEGACY_TREASURY_ADDRESS=0x' "$PHASE2_ENV" \
  || fail "phase2 env missing active LEGACY_TREASURY_ADDRESS"

if grep -qE '^TREASURY_ADDRESS=0x' "$PHASE2_ENV"; then
  fail "active TREASURY_ADDRESS= in $PHASE2_ENV — use catalog keys only"
fi
if grep -qE '^GOVERNANCE_TREASURY_ADDRESS=0x' "$PHASE2_ENV"; then
  fail "active GOVERNANCE_TREASURY_ADDRESS= in $PHASE2_ENV — use GOVERNANCE_TREASURY_P4CAP_ADDRESS"
fi
echo "OK phase2 env treasury two-key model"

for op_env in \
  scripts/dev/.env.staging-onboarding.local \
  scripts/dev/.env.production.local; do
  [[ -f "$op_env" ]] || continue
  if grep -qE '^TREASURY_ADDRESS=0x' "$op_env"; then
    fail "forbidden active TREASURY_ADDRESS= in $op_env"
  fi
done
echo "OK operational env files pass forbidden-pattern scan"

if grep -q 'TREASURY_ADDRESS' scripts/dev/lib/anvil-local-env-lib.sh 2>/dev/null \
  && grep -q 'GOVERNANCE_TREASURY_P4CAP_ADDRESS' scripts/dev/lib/anvil-local-env-lib.sh 2>/dev/null \
  && grep -q 'LEGACY_TREASURY_ADDRESS' scripts/dev/lib/anvil-local-env-lib.sh 2>/dev/null; then
  echo "OK anvil env lib includes P4Cap + legacy keys"
else
  fail "anvil-local-env-lib.sh missing canonical treasury keys"
fi

echo "WEB3_ENV_CATALOG_GATE: PASS"
echo "SSOT: $CATALOG"
