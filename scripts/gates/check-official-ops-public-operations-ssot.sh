#!/usr/bin/env bash
# Official Ops 1.0 domain freeze + Public Operations Phase 0+1 gate
# Charter: docs/runbook/TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md
# SSOT: docs/runbook/TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

SSOT="docs/runbook/TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md"
MATRIX="docs/runbook/TT-OFFICIAL-OPS-CAPABILITY-MATRIX.md"
RUNBOOK="docs/runbook/TT-MARKET-DISPLAY-DATA-MANUAL-UAT.md"
EVIDENCE_ROOT="evidence/GO_official_ops_public_operations"

DOMAIN_REGISTRY="registry/official-ops-domain.v1.yaml"

[[ -f "$SSOT" ]] || fail "missing SSOT: $SSOT"
[[ -f "$MATRIX" ]] || fail "missing capability matrix: $MATRIX"
[[ -f "$DOMAIN_REGISTRY" ]] || fail "missing domain registry: $DOMAIN_REGISTRY"
[[ -f "$RUNBOOK" ]] || fail "missing runbook: $RUNBOOK"
[[ -d "$EVIDENCE_ROOT" ]] || fail "missing evidence root: $EVIDENCE_ROOT"

grep -q 'TT_PUBLIC_DISPLAY_PHASE0_1: PASS' "$SSOT" || fail "SSOT machine key TT_PUBLIC_DISPLAY_PHASE0_1 not PASS"
grep -q 'TT_PUBLIC_DISPLAY_STATUS: MVP_COMPLETE' "$SSOT" || fail "SSOT machine key TT_PUBLIC_DISPLAY_STATUS not MVP_COMPLETE"
grep -q 'TT_PUBLIC_DISPLAY_VERSION: v1.0' "$SSOT" || fail "SSOT machine key TT_PUBLIC_DISPLAY_VERSION not v1.0"
grep -q 'TT_PUBLIC_DISPLAY_FROZEN: true' "$SSOT" || fail "SSOT machine key TT_PUBLIC_DISPLAY_FROZEN not true"
grep -q 'TT_PUBLIC_DISPLAY_FEATURE_LEVEL: MVP' "$SSOT" || fail "SSOT FEATURE_LEVEL MVP missing"
grep -q 'TT_PUBLIC_DISPLAY_FEATURE_LEVEL_NEXT: STANDARD' "$SSOT" || fail "SSOT FEATURE_LEVEL_NEXT STANDARD missing"
grep -q 'TT_THREE_DIMENSION_STATUS_SSOT: ACTIVE' "$SSOT" || fail "three-dimension status SSOT not linked"
grep -q 'feature_level: MVP' registry/public-operations-mvp.v1.yaml || fail "registry feature_level MVP missing"
[[ -f registry/traveltrust-three-dimension-status.v1.yaml ]] || fail "missing three-dimension status registry"
grep -q 'TT_PUBLIC_DISPLAY_DEV_FROZEN: true' "$SSOT" || fail "SSOT DEV_FROZEN not true — Public Operations must stay frozen pre-GO"
grep -q 'TT_PUBLIC_DISPLAY_DEFER_UNTIL: PRODUCTION_GO' "$SSOT" || fail "SSOT defer-until PRODUCTION_GO missing"
grep -q 'dev_frozen: true' registry/public-operations-mvp.v1.yaml || fail "registry dev_frozen not true"
[[ -f registry/official-ops-capability-matrix.v1.yaml ]] || fail "missing registry/official-ops-capability-matrix.v1.yaml"
grep -q 'TT_OFFICIAL_OPS_CAPABILITY_MATRIX: ACTIVE' "$MATRIX" || fail "capability matrix machine key missing"
grep -q 'TT_OFFICIAL_OPS_STATUS: STABLE' "$MATRIX" || fail "Official Ops domain not STABLE"
grep -q 'TT_OFFICIAL_OPS_VERSION: 1.0' "$MATRIX" || fail "Official Ops version not 1.0"
grep -q 'TT_OFFICIAL_OPS_ARCHITECTURE: FROZEN' "$MATRIX" || fail "Official Ops architecture not FROZEN"
grep -q 'status: STABLE' "$DOMAIN_REGISTRY" || fail "domain registry status not STABLE"
grep -q 'architecture: FROZEN' "$DOMAIN_REGISTRY" || fail "domain registry architecture not FROZEN"
grep -q 'TT_PUBLIC_DISPLAY_ADMIN_ROUTE: /admin/official/public-operations' "$SSOT" || fail "SSOT admin route missing"

grep -q 'restored canonical C3 bio' scripts/dev/smoke-identity-p2-settings-staging.sh \
  || fail "smoke script must restore canonical C3 bio"

grep -q 'marketPublicShowcaseFallbackEnabled' frontend/components/market/MarketContentGuidesSection.tsx \
  || fail "guides section must gate showcase fallback"
grep -q 'marketPublicShowcaseFallbackEnabled' frontend/components/market/MarketContentOrdersSection.tsx \
  || fail "orders section must gate showcase fallback"

grep -q 'MarketDisplayTestBadge' frontend/components/market/GuideCard.tsx \
  || fail "GuideCard must show TEST badge"
grep -q 'adminOfficialPublicOperationsStats' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations stats"
grep -q 'adminOfficialPublicOperationsPublishQueue' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations publish-queue"
grep -q 'adminOfficialPublicOperationsEntityFeatured' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations featured"
grep -q 'adminOfficialPublicOperationsEntityPriority' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations priority"

grep -q 'patch_admin_public_operations_featured' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing featured patch"
grep -q 'patch_admin_public_operations_priority' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing priority patch"
grep -q 'featured BOOLEAN' crates/api/migrations/20260702130000_public_operations_featured_priority.sql \
  || fail "migration missing featured column"
grep -q 'display_priority INT' crates/api/migrations/20260702130000_public_operations_featured_priority.sql \
  || fail "migration missing display_priority column"
grep -q 'cmp_public_display_sort' crates/api/src/chain_off/market_public_surface.rs \
  || fail "public surface missing featured/priority sort helper"
grep -q 'adminOfficialPublicOperationsEntitySurfaces' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations surfaces"
grep -q 'patch_admin_public_operations_surfaces' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing surfaces patch"
grep -q 'display_surfaces TEXT' crates/api/migrations/20260702140000_public_operations_display_surfaces.sql \
  || fail "migration missing display_surfaces column"
grep -q 'entity_visible_on_public_surface' crates/api/src/db/public_operations_display_admin.rs \
  || fail "DB missing entity_visible_on_public_surface helper"
grep -q 'PUBLIC_OPS_ENTITY_SURFACE_OPTIONS' frontend/lib/admin/officialOpsL5.ts \
  || fail "frontend missing PUBLIC_OPS_ENTITY_SURFACE_OPTIONS SSOT"
grep -q 'adminOfficialPublicOperationsEntitySchedule' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations schedule"
grep -q 'patch_admin_public_operations_schedule' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing schedule patch"
grep -q 'display_start_at TIMESTAMPTZ' crates/api/migrations/20260702150000_public_operations_display_schedule.sql \
  || fail "migration missing display_start_at column"
grep -q 'entity_visible_in_public_schedule' crates/api/src/db/public_operations_display_admin.rs \
  || fail "DB missing entity_visible_in_public_schedule helper"
grep -q 'adminOfficialPublicOperationsEntityPreview' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations preview"
grep -q 'get_admin_public_operations_preview' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing preview GET"
grep -q 'evaluate_public_ops_preview' crates/api/src/db/public_operations_display_admin.rs \
  || fail "DB missing evaluate_public_ops_preview helper"
grep -q 'guide_list_card_json_for_preview' crates/api/src/chain_off/guides.rs \
  || fail "guides missing preview card helper"
grep -q 'adminOfficialPublicOperationsHistory' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations history"
grep -q 'get_admin_public_operations_history' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing history GET"
grep -q 'insert_public_ops_display_history' crates/api/src/db/public_operations_display_history.rs \
  || fail "DB missing insert_public_ops_display_history"
grep -q 'ops_public_operations_display_history' crates/api/migrations/20260702160000_public_operations_display_history.sql \
  || fail "migration missing display history table"
grep -q 'append_public_ops_history' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "HTTP missing append_public_ops_history wiring"
grep -q 'adminOfficialPublicOperationsPolicy' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations policy"
grep -q 'get_admin_public_operations_policy' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing policy GET"
grep -q 'patch_admin_public_operations_policy' crates/api/src/routes/admin/admin_official_public_operations_http.rs \
  || fail "admin HTTP missing policy PATCH"
grep -q 'ops_public_operations_policy' crates/api/migrations/20260702170000_public_operations_policy.sql \
  || fail "migration missing public operations policy table"
grep -q 'entity_visible_by_display_origin_policy' crates/api/src/db/public_operations_policy.rs \
  || fail "DB missing entity_visible_by_display_origin_policy"
grep -q 'public_ops_policy' crates/api/src/chain_off/mod.rs \
  || fail "chain_off store missing public_ops_policy"
grep -q 'campaign_kind' crates/api/migrations/20260702180000_public_operations_campaign_center.sql \
  || fail "migration missing campaign_kind"
grep -q 'adminOfficialPublicOperationsCampaigns' frontend/lib/api/routes.ts \
  || fail "frontend routes missing public-operations campaigns"
grep -q 'get_public_ops_campaigns' crates/api/src/routes/admin/admin_official_public_operations_campaigns_http.rs \
  || fail "admin HTTP missing public-operations campaigns GET"
grep -q 'PUBLIC_OPS_CAMPAIGN_KINDS' frontend/lib/admin/officialOpsCampaign.ts \
  || fail "frontend missing campaign kinds SSOT"
grep -q 'get_deployed_campaign_for_surface' crates/api/src/db/ops_cold_start_campaigns_consumer.rs \
  || fail "consumer missing campaign_kind surface read"
grep -q 'preview_public_ops_campaign' crates/api/src/db/public_operations_campaigns.rs \
  || fail "DB missing campaign preview helper"

grep -q 'admin_official_public_operations_http' crates/api/src/routes/admin/mod.rs \
  || fail "admin public-operations HTTP router not merged"

cd "$ROOT/frontend"
npx vitest run \
  lib/marketPublicDisplayGate.contract.test.ts \
  lib/marketDisplayTestLabel.contract.test.ts \
  app/admin/official/public-operations/adminOfficialPublicOperations.contract.test.ts

echo "OK: Official Ops 1.0 domain freeze + public-operations Phase 0+1 gate"
