#!/usr/bin/env bash
# Gate: CMS announcements enterprise hardening (Rust public DTO, no Next shim routes, cta validator).
#
#   bash scripts/gates/check-cms-announcements-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

fail() {
  echo "check-cms-announcements-gate: FAIL $*" >&2
  exit 2
}

DB_RS="$ROOT/crates/api/src/db/cms_announcements.rs"
PUBLIC_RS="$ROOT/crates/api/src/routes/public_announcements.rs"
SAFE_TS="$ROOT/frontend/lib/traveltrustSafeHref.ts"
CMS_TS="$ROOT/frontend/lib/traveltrustCmsAnnouncements.ts"
ROUTES_TS="$ROOT/frontend/lib/api/routes.ts"

[[ -f "$DB_RS" ]] || fail "missing cms_announcements.rs"
[[ -f "$PUBLIC_RS" ]] || fail "missing public_announcements.rs"
[[ -f "$SAFE_TS" ]] || fail "missing traveltrustSafeHref.ts"
[[ -f "$CMS_TS" ]] || fail "missing traveltrustCmsAnnouncements.ts"

if rg "FROM governed_public_announcements_v1" "$DB_RS" | rg -q "publish_status|version"; then
  fail "public SELECT must not include publish_status/version from governed view"
fi

rg -q "struct PublicCmsAnnouncementRow" "$DB_RS" || fail "missing PublicCmsAnnouncementRow"
rg -q "published_immutable" "$DB_RS" || fail "missing published_immutable guard on patch"
rg -q "validate_cms_cta_href" "$DB_RS" || fail "missing validate_cms_cta_href"
rg -q "invalid_publish_transition" "$DB_RS" || fail "missing publish transition guard"

for f in \
  "$ROOT/frontend/app/api/v1/admin/content/announcements/route.ts" \
  "$ROOT/frontend/app/api/v1/public/announcements/route.ts"; do
  [[ ! -f "$f" ]] || fail "Next shim must be removed: $f"
done

rg -q "publicAnnouncements:" "$ROUTES_TS" || fail "missing publicAnnouncements route constant"
rg -q "apiUrl" "$CMS_TS" || fail "CMS client must use apiUrl (Rust SSOT)"
rg -q "traveltrustSafeAnnouncementHref" "$SAFE_TS" || fail "missing traveltrustSafeAnnouncementHref"
rg -q "mergeTraveltrustPulseAnnouncements" "$CMS_TS" || fail "missing pulse merge helper"

rg -q "admin.content.announcement.publish" "$ROOT/crates/api/src/routes/admin/mod.rs" || fail "audit action publish missing"

RBAC_RS="$ROOT/crates/api/src/routes/admin/cms_announcement_lane_rbac.rs"
[[ -f "$RBAC_RS" ]] || fail "missing cms_announcement_lane_rbac.rs"
rg -q "cms_announcement_lane_permission" "$RBAC_RS" || fail "missing lane permission mapper"
rg -q "PERM_ANNOUNCEMENT_AUDIENCE_PUBLIC_USER" "$ROOT/crates/api/src/routes/admin/admin_rbac.rs" || fail "missing audience public_user perm"
rg -q 'public/announcements' "$ROOT/crates/api/src/middleware/auth_pause_metrics/mod.rs" || fail "public announcements must be auth-whitelisted"

echo "check-cms-announcements-gate: PASS"
