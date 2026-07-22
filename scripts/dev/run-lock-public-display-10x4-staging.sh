#!/usr/bin/env bash
# Lock Staging public display to OCS 10×4 (guides / provider / acquisition / community).
# No governance/ops mutation · no showcase re-seed · default NO fly redeploy.
#
# SSOT:
#   registry/official-cold-start-dataset.v1.yaml
#   registry/single-official-public-catalog-policy.v1.yaml
#   registry/staging-rc-ssot-alignment.v1.yaml
#   docs/runbook/TT-PSG-PUBLIC-DISPLAY-10X4-LOCK-LATEST.md
#
#   STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh
#   DRY_RUN=1 STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh
set -euo pipefail

export STAGING_RC_BASELINE_ALIGNING="${STAGING_RC_BASELINE_ALIGNING:-1}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_public_display_10x4_lock/$STAMP"
API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
DRY_RUN="${DRY_RUN:-0}"

mkdir -p "$EVID"
echo "api=$API_BASE dry_run=$DRY_RUN" | tee "$EVID/meta.txt"

fail() { echo "LOCK_10X4: FAIL $*" | tee -a "$EVID/STATUS.txt"; exit 1; }

STATE="${OCS_STATE:-$ROOT/evidence/GO_official_cold_start_dataset/20260708T121151Z/state.json}"
[[ -f "$STATE" ]] || STATE="$ROOT/evidence/GO_staging_rc_ssot_alignment/20260704T091605Z/ocs-asset-baseline/state.json"
[[ -f "$STATE" ]] || fail "missing OCS state.json (set OCS_STATE=…)"
g_count="$(node -e "const s=require(process.argv[1]);process.stdout.write(String(Object.keys(s.guides||{}).length))" "$STATE")"
p_count="$(node -e "const s=require(process.argv[1]);process.stdout.write(String(Object.keys(s.community_posts||{}).length))" "$STATE")"
[[ "$g_count" == "10" && "$p_count" == "10" ]] || fail "OCS state must have 10 guides + 10 community_posts (got guides=$g_count posts=$p_count)"
cp "$STATE" "$EVID/ocs-state.json"
echo "ocs_state=$STATE guides=$g_count posts=$p_count" | tee -a "$EVID/meta.txt"

# Staging PG for elevate-to-super_admin (publish permission)
# shellcheck source=scripts/dev/lib/staging-adm-u01-env.sh
source "$ROOT/scripts/dev/lib/staging-adm-u01-env.sh"
REPO_ROOT="$ROOT" staging_adm_u01_prepare_dsn || echo "WARN: STAGING_DATABASE_URL unavailable — elevate may fail"
export DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"
export STAGING_DATABASE_URL="${STAGING_DATABASE_URL:-${DATABASE_URL:-}}"

echo "== [1/6] Purge smoke display labels =="
API_BASE="$API_BASE" PURGE_EVIDENCE_JSON="$EVID/purge.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/purge-staging-smoke-display-data.cjs" 2>&1 | tee "$EVID/purge.log"

echo "== [2/6] Align guides → OCS 10 (SQL archive+repair · then Admin HTTP best-effort) =="
if [[ -n "${STAGING_DATABASE_URL:-}${DATABASE_URL:-}" ]]; then
  STATE="$STATE" OUT="$EVID/archive-repair-guides.json" DRY_RUN="$DRY_RUN" API_BASE="$API_BASE" \
    node "$ROOT/scripts/dev/archive-and-repair-staging-ocs-guides.cjs" 2>&1 | tee "$EVID/archive-repair-guides.log" \
    || fail "SQL archive-and-repair guides"
else
  echo "WARN: no DATABASE_URL — skip SQL guides repair" | tee "$EVID/archive-repair-guides.log"
fi
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-guides.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-guides-public-catalog.cjs" 2>&1 | tee "$EVID/align-guides.log" \
  || echo "WARN align-guides HTTP exit=$? — SQL repair + API restart may still lock counts" | tee -a "$EVID/align-guides.log"

echo "== [3/7] Align market (provider+acquisition) → OCS 10+10 =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-market.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-market-catalog.cjs" 2>&1 | tee "$EVID/align-market.log" \
  || echo "WARN align-market exit=$? — archive step will enforce status=archived" | tee -a "$EVID/align-market.log"

echo "== [4/7] Archive non-OCS market_listings (status=archived · current API read path) =="
if [[ -n "${STAGING_DATABASE_URL:-}${DATABASE_URL:-}" ]]; then
  STATE="$STATE" OUT="$EVID/archive-market.json" DRY_RUN="$DRY_RUN" \
    node "$ROOT/scripts/dev/archive-staging-non-ocs-market-listings.cjs" 2>&1 | tee "$EVID/archive-market.log"
else
  echo "SKIP archive market — no DATABASE_URL" | tee "$EVID/archive-market.log"
fi

echo "== [5/7] Align community feed → OCS 10 =="
API_BASE="$API_BASE" STATE="$STATE" ALIGN_EVIDENCE_JSON="$EVID/align-community.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-ocs-staging-community-feed.cjs" 2>&1 | tee "$EVID/align-community.log" \
  || echo "WARN align-community — continuing to SQL purge" | tee -a "$EVID/align-community.log"

if [[ -n "${STAGING_DATABASE_URL:-}${DATABASE_URL:-}" ]]; then
  echo "== [5b/7] SQL purge non-OCS community posts =="
  DATABASE_URL="${STAGING_DATABASE_URL:-$DATABASE_URL}" STATE="$STATE" PURGE_SQL_EVIDENCE_JSON="$EVID/purge-community-sql.json" DRY_RUN="$DRY_RUN" \
    node "$ROOT/scripts/dev/purge-staging-community-feed-sql.cjs" 2>&1 | tee "$EVID/purge-community-sql.log" || echo "WARN sql purge" | tee -a "$EVID/purge-community-sql.log"
fi

echo "== [6/7] SOPCP unpublish extras (guides + listings) =="
API_BASE="$API_BASE" STATE="$STATE" OUT="$EVID/sopcp-align.json" DRY_RUN="$DRY_RUN" \
  node "$ROOT/scripts/dev/align-single-official-baseline-staging.cjs" 2>&1 | tee "$EVID/sopcp-align.log" \
  || echo "WARN sopcp align" | tee -a "$EVID/sopcp-align.log"

echo "== [7/7] Count gate (must be 10/10/10/10) =="
API_BASE="$API_BASE" python "$ROOT/scripts/dev/check-public-display-10x4-counts.py" \
  --out "$EVID/counts.json" 2>&1 | tee "$EVID/counts.log"
COUNT_RC=${PIPESTATUS[0]}
[[ "${COUNT_RC:-1}" -eq 0 ]] || fail "count gate DRIFT (need 10/10/10/10)"

cat >"$EVID/STATUS.txt" <<EOF
TT_PUBLIC_DISPLAY_10X4_LOCK: LOCKED
stamp=$STAMP
api=$API_BASE
ocs_state=${STATE#$ROOT/}
forbidden: showcase_reseed, governance_mutation, random_generation
honest_boundary: Staging public catalog locked ≠ Production GO ≠ PSG Archive mutate
EOF

echo "Evidence: $EVID"
echo "TT_PUBLIC_DISPLAY_10X4_LOCK: LOCKED"
