#!/usr/bin/env bash
# L4 · Testnet Sync Validator — 仅验证一致性（Deployment 三态 Sync/Fix）
#
#   DEPLOYMENT_STATE=sync bash scripts/ops/cloud-local-healing/testnet-sync-validator.sh
#   DEPLOYMENT_STATE=fix FIX_DEPLOY_LEDGER_ID=BOOK-P0-04 bash scripts/ops/cloud-local-healing/testnet-sync-validator.sh --with-parity
#
# 末行: TT_TESTNET_SYNC_VALIDATOR: PASS|PARTIAL|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/CLOUD_LOCAL_HEALING_CI/validations/$STAMP"
WITH_PARITY=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --with-parity) WITH_PARITY=1; shift ;;
    -h|--help)
      sed -n '2,7p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$EVID"
export DEPLOYMENT_STATE="${DEPLOYMENT_STATE:-sync}"

if [[ "$WITH_PARITY" == "1" ]]; then
  bash "$ROOT/scripts/ops/run-deployment-three-state.sh" "${DEPLOYMENT_STATE}" --parity 2>&1 | tee "$EVID/parity.log"
  if grep -q "TT_TESTNET_SYNC_PACKAGE_PARITY: PASS zero_drift=YES" "$EVID/parity.log"; then
    verdict=PASS
  elif grep -q "TT_TESTNET_SYNC_PACKAGE_PARITY: PARTIAL" "$EVID/parity.log"; then
    verdict=PARTIAL
  else
    verdict=FAIL
  fi
else
  bash "$ROOT/scripts/ops/run-deployment-three-state.sh" "${DEPLOYMENT_STATE}" --preflight 2>&1 | tee "$EVID/preflight.log"
  verdict=PASS
  grep -q "TT_TESTNET_SYNC_PACKAGE: PREFLIGHT_OK" "$EVID/preflight.log" || verdict=FAIL
fi

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.testnet_sync_validation_result.v1',
  validated_at_utc:new Date().toISOString(),
  deployment_state:process.argv[2],
  verdict:process.argv[3],
  policy:'testnet_validate_only_no_feature_dev'
},null,2)+'\n');
" "$EVID/VALIDATION-RESULT.json" "$DEPLOYMENT_STATE" "$verdict"

echo "TT_TESTNET_SYNC_VALIDATOR: $verdict evidence=$EVID"
[[ "$verdict" == "PASS" ]] && exit 0
[[ "$verdict" == "PARTIAL" ]] && exit 2
exit 2
