#!/usr/bin/env bash
# Official Asset Baseline V1 · Staging closure (② only)
#
#   bash scripts/dev/run-ocs-official-asset-baseline.sh
#   SKIP_FLY=1 bash scripts/dev/run-ocs-official-asset-baseline.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REPO_ROOT="$ROOT"
STAMP="${OCS_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
API_BASE="${API_BASE:-${API:-https://tt-api-staging.fly.dev}}"
EVID="${OCS_ASSET_EVIDENCE_DIR:-$ROOT/evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/$STAMP}"
export OCS_STRICT_LEGACY_MEDIA="${OCS_STRICT_LEGACY_MEDIA:-1}"

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"
echo "staging_api=$API_BASE" >"$EVID/staging-target.txt"
echo "stamp=$STAMP" >>"$EVID/staging-target.txt"
export API_BASE API="$API_BASE"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

echo "TT_OCS_OFFICIAL_ASSET_BASELINE_V1: IMPLEMENTING" >"$EVID/STATUS.txt"

echo "== Official Asset Baseline V1 · generate assets manifest + media =="
node "$ROOT/scripts/dev/generate-ocs-official-media-assets.cjs" 2>&1 | tee "$EVID/generate.log"

echo "== Official Asset Baseline V1 · bootstrap upload (local + Fly) =="
export OCS_ASSETS_SKIP_FLY="${SKIP_FLY:-0}"
export FLY_APP="${FLY_APP:-tt-api-staging}"
export OUT="$EVID/asset-bootstrap.json"
BOOT_RC=0
node "$ROOT/scripts/dev/bootstrap-ocs-official-assets.cjs" 2>&1 | tee "$EVID/bootstrap.log" || BOOT_RC=$?
if [[ "$BOOT_RC" -ne 0 && "${SKIP_STAGING_DEPLOY:-0}" != "1" ]]; then
  echo "== Official Asset Baseline V1 · fallback fly deploy (bundle media in API image) =="
  export DEPLOYMENT_STATE=sync
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/lift-testnet-staging-freeze.sh" \
    --reason "OCS Official Asset Baseline V1 @ $(git rev-parse HEAD)" 2>&1 | tee "$EVID/lift-freeze.log" || true
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/fly-api-deploy.log" || DEPLOY_RC=$?
  DEPLOY_RC=${DEPLOY_RC:-0}
  if [[ "$DEPLOY_RC" -eq 0 ]]; then
    echo "fly deploy OK — media bundled via Dockerfile COPY" | tee -a "$EVID/bootstrap.log"
    BOOT_RC=0
  fi
  n=0
  while [ "$n" -lt 60 ]; do
    if curl -sf "${API_BASE}/health/ready" >/dev/null 2>&1; then break; fi
    n=$((n + 1))
    sleep 3
  done
fi
if [[ "$BOOT_RC" -ne 0 ]]; then
  echo "FAIL: asset bootstrap (fly ssh + deploy fallback)" | tee -a "$EVID/bootstrap.log"
  exit 1
fi

STATE="${STATE:-${OCS_STATE:-}}"
if [[ -z "$STATE" ]]; then
  STATE="$(find "$ROOT/evidence" -name state.json 2>/dev/null | while read -r f; do
    c="$(node -e "try{process.stdout.write(String(Object.keys(require(process.argv[1]).community_posts||{}).length))}catch(e){process.stdout.write('0')}" "$f" 2>/dev/null || echo 0)"
    echo "$c $f"
  done | sort -rn | head -1 | awk '{print $2}')"
fi
if [[ -n "$STATE" && -f "$STATE" && ! -f "$EVID/state.json" ]]; then
  cp "$STATE" "$EVID/state.json"
  echo "state_seed=$STATE" >>"$EVID/staging-target.txt"
fi
STATE="${EVID}/state.json"

echo "== Staging DATABASE_URL (fly proxy for SQL media rebind) =="
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
staging_adm_u01_prepare_dsn || echo "WARN: STAGING_DATABASE_URL unavailable — SQL rebind may be pending"
export DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
export NODE_PATH="${ROOT}/frontend/node_modules${NODE_PATH:+:$NODE_PATH}"

if [[ -f "$STATE" ]]; then
  echo "== Official Asset Baseline V1 · rebind published entities =="
  BIND_RC=0
  STATE="$STATE" OUT="$EVID/media-bindings.json" DATABASE_URL="${DATABASE_URL:-}" \
    node "$ROOT/scripts/dev/remediate-ocs-official-media-bindings-staging.cjs" 2>&1 | tee "$EVID/bindings.log" || BIND_RC=$?
  if [[ "$BIND_RC" -ne 0 ]]; then
    echo "WARN: media bindings exited rc=$BIND_RC" | tee -a "$EVID/bindings.log"
  fi
fi

echo "== Official Asset Baseline V1 · asset verification (HEAD/MIME/decode) =="
VERIFY_RC=0
STATE="${STATE:-}" OUT="$EVID/asset-verification.json" \
  node "$ROOT/scripts/dev/verify-ocs-official-assets.cjs" 2>&1 | tee "$EVID/verify.log" || VERIFY_RC=$?

echo "== OCS Surface Expansion · 11-check + 5-dimension publish gate =="
VALIDATE_RC=0
STATE="${STATE:-}" OUT="$EVID/ocs-surface-expansion-signoff.json" \
  node "$ROOT/scripts/dev/validate-ocs-surface-expansion-staging.cjs" 2>&1 | tee "$EVID/ocs-surface-expansion-validate.log" || VALIDATE_RC=$?

echo "== Official Asset Baseline V1 · signoff =="
SIGNOFF_RC=0
node "$ROOT/scripts/dev/write-ocs-official-asset-baseline-signoff.cjs" "$EVID" "$STAMP" "$API_BASE" 2>&1 | tee "$EVID/signoff.log" || SIGNOFF_RC=$?

staging_adm_u01_cleanup_proxy 2>/dev/null || true

if [[ "$VERIFY_RC" -eq 0 && "$VALIDATE_RC" -eq 0 && "$SIGNOFF_RC" -eq 0 ]]; then
  echo "Evidence: $EVID"
  echo "TT_OCS_OFFICIAL_ASSET_BASELINE_V1: VERIFIED"
  exit 0
fi

echo "TT_OCS_OFFICIAL_ASSET_BASELINE_V1: FAIL (verify=$VERIFY_RC validate=$VALIDATE_RC signoff=$SIGNOFF_RC)" >"$EVID/STATUS.txt"
exit 1
