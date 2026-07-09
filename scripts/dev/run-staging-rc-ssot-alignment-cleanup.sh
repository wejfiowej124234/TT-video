#!/usr/bin/env bash
# Staging ↔ Release Candidate SSOT alignment cleanup (② only · no new business features).
#
# SSOT:
#   data/official-cold-start/dataset.v1.json
#   registry/official-cold-start-dataset.v1.yaml
#   evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md
#
#   bash scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh
#   DRY_RUN=1 bash scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh
#   SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh
set -euo pipefail

export STAGING_RC_BASELINE_ALIGNING=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${SSOT_CLEANUP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_staging_rc_ssot_alignment/$STAMP"
API_BASE="${API_BASE:-${API:-https://tt-api-staging.fly.dev}}"
WEB_BASE="${WEB_BASE:-https://tt-web-staging.fly.dev}"
DRY_RUN="${DRY_RUN:-0}"
SKIP_DEPLOY="${SKIP_STAGING_DEPLOY:-0}"

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"
echo "api=$API_BASE" >"$EVID/target.txt"
echo "web=$WEB_BASE" >>"$EVID/target.txt"
echo "dry_run=$DRY_RUN" >>"$EVID/target.txt"
echo "rc_signoff=evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md" >>"$EVID/target.txt"

fail() { echo "SSOT_CLEANUP: FAIL $*" | tee -a "$EVID/STATUS.txt"; exit 1; }

STATE="$(find "$ROOT/evidence" -name state.json 2>/dev/null | while read -r f; do
  c="$(node -e "try{process.stdout.write(String(Object.keys(require(process.argv[1]).community_posts||{}).length))}catch(e){process.stdout.write('0')}" "$f" 2>/dev/null || echo 0)"
  echo "$c $f"
done | sort -rn | head -1 | awk '{print $2}')"
[[ -n "$STATE" && -f "$STATE" ]] || fail "missing OCS state.json with 10 community_posts"
cp "$STATE" "$EVID/ocs-state.json"
export OCS_STATE="$STATE" STATE="$STATE"
echo "ocs_state=$STATE" >>"$EVID/target.txt"

# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
staging_adm_u01_prepare_dsn || echo "WARN: STAGING_DATABASE_URL unavailable — SQL purge skipped"
export DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"

echo "== [1/14] SSOT media regenerate (640×480 · force) =="
OCS_ASSETS_FORCE_MEDIA=1 node "$ROOT/scripts/dev/generate-ocs-official-media-assets.cjs" 2>&1 | tee "$EVID/generate-media.log"

echo "== [2/14] Purge smoke display data (Admin Public Ops · all entity types) =="
export OCS_STATE="$STATE"
API_BASE="$API_BASE" PURGE_EVIDENCE_JSON="$EVID/purge-display.json" \
  DRY_RUN="$DRY_RUN" node "$ROOT/scripts/dev/purge-staging-smoke-display-data.cjs" 2>&1 | tee "$EVID/purge-display.log"

echo "== [3/14] Align public guides → OCS only =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-guides.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-guides-public-catalog.cjs" 2>&1 | tee "$EVID/align-guides.log" || true

echo "== [4/14] Align community feed → OCS only (Admin unpublish) =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-community-feed.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-community-feed.cjs" 2>&1 | tee "$EVID/align-community-feed.log" || true

echo "== [5/14] Align market catalog → OCS only (provider + acquisition) =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-market.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-market-catalog.cjs" 2>&1 | tee "$EVID/align-market.log" || echo "WARN align market" | tee -a "$EVID/align-market.log"

echo "== [6/14] Align official guides → OCS only =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-official-guides.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-official-guides.cjs" 2>&1 | tee "$EVID/align-official-guides.log" || echo "WARN align official guides" | tee -a "$EVID/align-official-guides.log"

echo "== [7/14] Align campaigns → OCS only =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-campaigns.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-campaigns.cjs" 2>&1 | tee "$EVID/align-campaigns.log" || echo "WARN align campaigns" | tee -a "$EVID/align-campaigns.log"

echo "== [8/14] Align discover orders → smoke=0 =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-discover-orders.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-discover-orders.cjs" 2>&1 | tee "$EVID/align-discover-orders.log" || echo "WARN align discover" | tee -a "$EVID/align-discover-orders.log"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "== [9/14] Remediate OCS official media bindings (guides · community · listings) =="
  DATABASE_URL="$DATABASE_URL" STATE="$STATE" OUT="$EVID/remediate-media-bindings.json" \
    node "$ROOT/scripts/dev/remediate-ocs-official-media-bindings-staging.cjs" 2>&1 | tee "$EVID/remediate-media-bindings.log" || fail "media bindings"
else
  echo "SKIP [9/14] media bindings — no DATABASE_URL" | tee "$EVID/remediate-media-bindings.log"
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "== [10/14] SQL purge non-OCS / corridor-smoke community posts =="
  DATABASE_URL="$DATABASE_URL" STATE="$STATE" PURGE_SQL_EVIDENCE_JSON="$EVID/purge-community-sql.json" DRY_RUN="$DRY_RUN" \
    node "$ROOT/scripts/dev/purge-staging-community-feed-sql.cjs" 2>&1 | tee "$EVID/purge-community-sql.log" || echo "WARN sql purge — continuing" | tee -a "$EVID/purge-community-sql.log"
else
  echo "SKIP [10/14] SQL purge — no DATABASE_URL" | tee "$EVID/purge-community-sql.log"
fi

if [[ "$SKIP_DEPLOY" == "1" || "$DRY_RUN" == "1" ]]; then
  echo "SKIP [11/14] fly deploy — SKIP_STAGING_DEPLOY or DRY_RUN" | tee "$EVID/deploy.log"
else
  echo "== [11/14] Official Asset Baseline + API deploy (bundle media · no SSH) =="
  API_BASE="$API_BASE" OCS_STATE="$STATE" OCS_ASSET_EVIDENCE_DIR="$EVID/ocs-asset-baseline" \
    bash "$ROOT/scripts/dev/run-ocs-official-asset-baseline.sh" 2>&1 | tee "$EVID/ocs-asset-baseline.log" || fail "asset baseline"

  echo "== [12/14] tt-web-staging deploy (rewrite + production profile) =="
  DEPLOYMENT_STATE="${DEPLOYMENT_STATE:-sync}" \
    bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh" 2>&1 | tee "$EVID/web-deploy.log" || echo "WARN web deploy" | tee -a "$EVID/web-deploy.log"

  echo "== [13/14] Fly restart (edge/process cache flush) =="
  if command -v fly >/dev/null 2>&1; then
    fly apps restart tt-api-staging 2>&1 | tee "$EVID/fly-restart-api.log" || true
    fly apps restart tt-web-staging 2>&1 | tee "$EVID/fly-restart-web.log" || true
  else
    echo "SKIP fly restart — CLI missing" | tee "$EVID/fly-restart-api.log"
  fi
fi

echo "== [14/14] Staging ↔ RC SSOT parity validate =="
SSOT_EVIDENCE_DIR="$EVID" API_BASE="$API_BASE" WEB_BASE="$WEB_BASE" OCS_STATE="$STATE" \
  node "$ROOT/scripts/dev/validate-staging-rc-ssot-parity.cjs" "$EVID" 2>&1 | tee "$EVID/parity-validate.log" || VALID_RC=$?
VALID_RC=${VALID_RC:-0}

cat >"$EVID/staging-rc-ssot-alignment-signoff.json" <<EOF
{
  "schema": "traveltrust.staging_rc_ssot_alignment.signoff.v1",
  "stamp": "${STAMP}",
  "environment": "staging",
  "recorded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verdict": "$([ "$VALID_RC" -eq 0 ] && echo ALIGNED || echo FAIL)",
  "machine_keys": {
    "TT_STAGING_RC_SSOT_PARITY": "$([ "$VALID_RC" -eq 0 ] && echo ALIGNED || echo FAIL)",
    "TT_PRODUCTION_GO": "NO_GO",
    "TT_G3_PRODUCTION_CDN_VERIFIED": "PLANNED"
  },
  "ssot": {
    "dataset": "data/official-cold-start/dataset.v1.json",
    "assets": "data/official-cold-start/assets.v1.json",
    "registry": "registry/official-cold-start-dataset.v1.yaml",
    "release_candidate": "evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md",
    "ocs_state": "${STATE#$ROOT/}"
  },
  "steps": [
    "purge_smoke_display_data",
    "align_guides_ocs_only",
    "align_community_feed_ocs_only",
    "align_market_ocs_only",
    "align_official_guides_ocs_only",
    "align_campaigns_ocs_only",
    "align_discover_orders_smoke_zero",
    "remediate_ocs_media_bindings",
    "sql_purge_non_ocs_posts",
    "regenerate_640x480_media",
    "ocs_asset_baseline_bootstrap",
    "optional_fly_deploy_restart",
    "parity_validate"
  ],
  "honest_boundary": "Staging scrubbed to OCS SSOT + RC boundaries — not Production GO — not publish",
  "forbidden_claims": ["Production GO", "Release published", "G3 CDN VERIFIED"]
}
EOF

if [[ "$VALID_RC" -ne 0 ]]; then
  echo "TT_STAGING_RC_SSOT_PARITY: FAIL" >"$EVID/STATUS.txt"
  fail "parity validate"
fi

echo "TT_STAGING_RC_SSOT_PARITY: ALIGNED" >"$EVID/STATUS.txt"
echo "evidence=$EVID"
echo "SSOT_CLEANUP: OK"
