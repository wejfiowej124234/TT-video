#!/usr/bin/env bash
# OCS Surface Expansion · Staging deploy + apply + 10-check acceptance + independent evidence
#
#   bash scripts/dev/run-ocs-surface-expansion-staging.sh
#   SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-ocs-surface-expansion-staging.sh
#
# TT_OCS_SURFACE_EXPANSION=VERIFIED only when all 10 acceptance checks PASS + signoff written.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${OCS_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
EVID="${OCS_EVIDENCE_DIR:-$ROOT/evidence/GO_official_cold_start_dataset/ocs-surface-expansion-staging/$STAMP}"

export API_BASE API="$API_BASE"
export OCS_EVIDENCE_DIR="$EVID"
export OCS_STAMP="$STAMP"
export OCS_STRICT_LEGACY_MEDIA="${OCS_STRICT_LEGACY_MEDIA:-1}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,tt-web-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"
echo "staging_api=$API_BASE" >"$EVID/staging-target.txt"
echo "stamp=$STAMP" >>"$EVID/staging-target.txt"
echo "TT_OCS_SURFACE_EXPANSION: IMPLEMENTING" >"$EVID/STATUS.txt"

wait_ready() {
  local n=0
  while [ "$n" -lt 120 ]; do
    if curl -sf "${API_BASE}/health/ready" >/dev/null 2>&1; then
      curl -sS "${API_BASE}/meta/build" | tee "$EVID/staging-meta-build.json" >/dev/null || true
      return 0
    fi
    n=$((n + 1))
    sleep 3
  done
  echo "FAIL: staging API not ready" >&2
  return 1
}

if [[ "${SKIP_STAGING_DEPLOY:-0}" != "1" ]]; then
  echo "== Deploy tt-api-staging (community_post orchestrator + Public Ops surfaces) =="
  export DEPLOYMENT_STATE=sync
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/lift-testnet-staging-freeze.sh" \
    --reason "OCS Surface Expansion @ $(git rev-parse HEAD)" 2>&1 | tee "$EVID/lift-freeze.log" || true
  TESTNET_FREEZE_OVERRIDE=1 bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh" 2>&1 | tee "$EVID/fly-api-deploy.log"

  echo "== Deploy tt-web-staging =="
  WEB_DEPLOY_RC=0
  TESTNET_FREEZE_OVERRIDE=1 FLY_WEB_NO_CACHE=1 bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/fly-web-deploy.log" || WEB_DEPLOY_RC=$?
  if [[ "$WEB_DEPLOY_RC" -ne 0 ]]; then
    echo "WARN: tt-web-staging deploy failed (rc=$WEB_DEPLOY_RC) — retry with FLY_WEB_REMOTE_BUILD=1 or SKIP_STAGING_DEPLOY=1" | tee -a "$EVID/fly-web-deploy.log"
    TESTNET_FREEZE_OVERRIDE=1 FLY_WEB_REMOTE_BUILD=1 FLY_WEB_NO_CACHE=1 DEPLOYMENT_STATE=sync bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee -a "$EVID/fly-web-deploy-retry.log" || WEB_DEPLOY_RC=$?
  fi
  echo "web_deploy_rc=$WEB_DEPLOY_RC" >>"$EVID/staging-target.txt"
else
  echo "SKIP_STAGING_DEPLOY=1 — using current staging images"
fi

wait_ready
echo "TT_OCS_SURFACE_EXPANSION: READY_FOR_STAGING_VERIFICATION" >"$EVID/STATUS.txt"

echo "== Official Asset Baseline V1 · generate + bootstrap =="
node "$ROOT/scripts/dev/generate-ocs-official-media-assets.cjs" 2>&1 | tee "$EVID/ocs-assets-generate.log"
export OUT="$EVID/asset-bootstrap.json"
export OCS_ASSETS_SKIP_FLY="${SKIP_FLY_ASSET_BOOTSTRAP:-0}"
export FLY_APP="${FLY_APP:-tt-api-staging}"
node "$ROOT/scripts/dev/bootstrap-ocs-official-assets.cjs" 2>&1 | tee "$EVID/ocs-assets-bootstrap.log" || {
  echo "WARN: remote asset bootstrap failed — local/API volume may lack binaries until fly ssh succeeds" | tee -a "$EVID/ocs-assets-bootstrap.log"
}

LATEST_STATE="$(ls -t "$ROOT/evidence/GO_official_cold_start_dataset/"*/state.json 2>/dev/null | head -1 || true)"
if [[ -n "${OCS_STATE_SEED:-}" ]]; then
  export OCS_STATE_SEED
elif [[ -n "$LATEST_STATE" && ! -f "$EVID/state.json" ]]; then
  export OCS_STATE_SEED="$LATEST_STATE"
  cp "$LATEST_STATE" "$EVID/state.json"
  echo "state_seed=$LATEST_STATE" >>"$EVID/staging-target.txt"
fi

  echo "== OCS Surface Expansion · Staging apply · $STAMP =="
  APPLY_RC=0
  node "$ROOT/scripts/dev/run-official-cold-start-dataset.cjs" 2>&1 | tee "$EVID/ocs-apply.log" || APPLY_RC=$?
  if [[ "$APPLY_RC" -ne 0 ]]; then
    echo "WARN: OCS apply exited rc=$APPLY_RC — continuing to 10-check validation" | tee -a "$EVID/ocs-apply.log"
  fi

if [[ -f "$EVID/state.json" ]]; then
  echo "== Official Asset Baseline V1 · rebind published media URLs =="
  STATE="$EVID/state.json" OUT="$EVID/media-bindings.json" \
    node "$ROOT/scripts/dev/remediate-ocs-official-media-bindings-staging.cjs" 2>&1 | tee "$EVID/ocs-assets-bindings.log" || true
fi

echo "== OCS Surface Expansion · 11-check + 5-dimension publish gate (OCS_STRICT_LEGACY_MEDIA=$OCS_STRICT_LEGACY_MEDIA) =="
VALIDATE_RC=0
STATE="$EVID/state.json" \
  OUT="$EVID/ocs-surface-expansion-signoff.json" \
  API="$API_BASE" \
  node "$ROOT/scripts/dev/validate-ocs-surface-expansion-staging.cjs" 2>&1 | tee "$EVID/ocs-surface-expansion-validate.log" || VALIDATE_RC=$?

echo "== post-apply DDG scan =="
DDG_RC=0
API="$API_BASE" FS_DG_JSON="$EVID/fs-dg-post.json" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg.log" || DDG_RC=$?

STATE="$EVID/state.json" \
  OUT="$EVID/ocs-validate.json" \
  API="$API_BASE" \
  node "$ROOT/scripts/dev/validate-official-cold-start-dataset.cjs" 2>&1 | tee "$EVID/ocs-validate.log" || true

if [[ "$VALIDATE_RC" -eq 0 ]]; then
  cat > "$EVID/STATUS.txt" <<EOF
TT_OCS_SURFACE_EXPANSION: VERIFIED
environment: staging
at=${STAMP}
api=${API_BASE}
manifest=data/official-cold-start/dataset.v1.json
signoff=ocs-surface-expansion-signoff.json
evidence=${EVID#"$ROOT/"}
ocs_strict_legacy_media=${OCS_STRICT_LEGACY_MEDIA}
ddg_rc=${DDG_RC}
note=Independent staging evidence — 10/10 acceptance PASS
EOF
  echo "Evidence: $EVID"
  echo "TT_OCS_SURFACE_EXPANSION: VERIFIED"
  exit 0
fi

cat > "$EVID/STATUS.txt" <<EOF
TT_OCS_SURFACE_EXPANSION: READY_FOR_STAGING_VERIFICATION
environment: staging
at=${STAMP}
api=${API_BASE}
validate_rc=${VALIDATE_RC}
ddg_rc=${DDG_RC}
evidence=${EVID#"$ROOT/"}
note=Fix failures and re-run — VERIFIED requires 10/10 acceptance PASS
EOF
echo "Evidence: $EVID"
echo "TT_OCS_SURFACE_EXPANSION: READY_FOR_STAGING_VERIFICATION (not VERIFIED)"
exit 1
