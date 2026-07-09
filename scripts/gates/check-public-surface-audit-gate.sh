#!/usr/bin/env bash
# Gate: Full-site public surface disclosure audit (Phase③ Entry · ① local).
#
#   bash scripts/gates/check-public-surface-audit-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REG="$ROOT/registry/traveltrust-public-surface-audit.v1.yaml"
DISC="$ROOT/registry/traveltrust-public-disclosure.v1.yaml"
CLOSEOUT="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/PUBLIC-SURFACE-AUDIT-CLOSEOUT.md"

fail() {
  echo "check-public-surface-audit-gate: FAIL $*" >&2
  exit 2
}

[[ -f "$REG" ]] || fail "missing traveltrust-public-surface-audit.v1.yaml"
[[ -f "$DISC" ]] || fail "missing traveltrust-public-disclosure.v1.yaml"
[[ -f "$CLOSEOUT" ]] || fail "missing PUBLIC-SURFACE-AUDIT-CLOSEOUT.md"

PY=python
command -v python >/dev/null 2>&1 || PY=python3
command -v "$PY" >/dev/null 2>&1 || fail "python required"

"$PY" - "$REG" "$DISC" "$ROOT" <<'PY' || fail "registry validation error"
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required", file=sys.stderr)
    sys.exit(1)

reg = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8"))
disc = yaml.safe_load(Path(sys.argv[2]).read_text(encoding="utf-8"))
root = Path(sys.argv[3])

if reg.get("verdict") != "PUBLIC_SURFACE_AUDIT_PASS":
    print("verdict must be PUBLIC_SURFACE_AUDIT_PASS", file=sys.stderr)
    sys.exit(1)

if disc.get("verdict") != "HOME_PUBLIC_DISCLOSURE_ALIGNED":
    print("home disclosure registry must remain HOME_PUBLIC_DISCLOSURE_ALIGNED", file=sys.stderr)
    sys.exit(1)

surfaces = reg.get("surfaces") or []
if len(surfaces) < 10:
    print("expected >= 10 audited surfaces", file=sys.stderr)
    sys.exit(1)

for item in surfaces:
    if item.get("status") != "ALIGNED":
        print(f"surface not ALIGNED: {item.get('route')}", file=sys.stderr)
        sys.exit(1)

roadmap = (root / "frontend/lib/traveltrustRoadmap2026.ts").read_text(encoding="utf-8")
cms_types = (root / "frontend/lib/cmsRoadmapTypes.ts").read_text(encoding="utf-8")
if "milestone-app-launch" not in roadmap or "milestone-china-guides" not in roadmap:
    print("roadmap static fallback must keep two 2026 product milestones", file=sys.stderr)
    sys.exit(1)
if "product-roadmap" not in cms_types:
    print("cmsRoadmapTypes must anchor product-roadmap", file=sys.stderr)
    sys.exit(1)
announcements_ssot = (root / "frontend/lib/traveltrustCmsAnnouncements.ts").read_text(encoding="utf-8")
if "CmsPublicAnnouncementRow" not in announcements_ssot or "cmsSource" not in announcements_ssot:
    print("CMS announcements consumer must exist", file=sys.stderr)
    sys.exit(1)

print("registry-validate: OK")
PY

cd "$ROOT/frontend" && npx vitest run \
  lib/publicSurfaceAudit.contract.test.ts \
  lib/traveltrustNetworkAnnouncements.test.ts \
  lib/traveltrustAnnouncementLaneGovernance.contract.test.ts \
  lib/homePublicDisclosureAlignment.contract.test.ts \
  lib/traveltrustCmsAnnouncements.test.ts \
  lib/traveltrustCmsRoadmap.test.ts \
  app/\(home\)/homeMarketing.contract.test.ts \
  app/traveltrust/traveltrustNetworkPage.contract.test.ts \
  app/governance/governanceHubPage.contract.test.ts \
  app/governance/proposals/governanceProposalsPage.contract.test.ts \
  app/governance/params/governanceParamsPageL5FullClosure.contract.test.ts \
  app/staking/stakingPageL5.contract.test.ts \
  components/trust/trustTransparencyHub.contract.test.ts \
  --reporter=dot >/dev/null || fail "frontend public surface contract tests failed"

bash "$ROOT/scripts/gates/check-announcement-lane-governance-gate.sh" || fail "announcement lane governance gate failed"

echo "check-public-surface-audit-gate: PASS PUBLIC_SURFACE_AUDIT_PASS"
