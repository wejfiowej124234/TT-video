#!/usr/bin/env bash
# Gate: Announcement lane governance frozen (Production Entry · ① local).
#
#   bash scripts/gates/check-announcement-lane-governance-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REG="$ROOT/registry/traveltrust-announcement-lane-governance.v1.yaml"
CLOSEOUT="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/ANNOUNCEMENT-LANE-GOVERNANCE-CLOSEOUT.md"
GOV_TS="$ROOT/frontend/lib/traveltrustAnnouncementLaneGovernance.ts"

fail() {
  echo "check-announcement-lane-governance-gate: FAIL $*" >&2
  exit 2
}

[[ -f "$REG" ]] || fail "missing traveltrust-announcement-lane-governance.v1.yaml"
[[ -f "$CLOSEOUT" ]] || fail "missing ANNOUNCEMENT-LANE-GOVERNANCE-CLOSEOUT.md"
[[ -f "$GOV_TS" ]] || fail "missing traveltrustAnnouncementLaneGovernance.ts"

PY=python
command -v python >/dev/null 2>&1 || PY=python3
command -v "$PY" >/dev/null 2>&1 || fail "python required"

"$PY" - "$REG" "$GOV_TS" "$ROOT" <<'PY' || fail "registry/TS sync validation error"
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required", file=sys.stderr)
    sys.exit(1)

reg_path = Path(sys.argv[1])
gov_ts = Path(sys.argv[2]).read_text(encoding="utf-8")
root = Path(sys.argv[3])
reg = yaml.safe_load(reg_path.read_text(encoding="utf-8"))

if reg.get("verdict") != "ANNOUNCEMENT_LANE_GOVERNANCE_FROZEN":
    print("verdict must be ANNOUNCEMENT_LANE_GOVERNANCE_FROZEN", file=sys.stderr)
    sys.exit(1)

if not reg.get("frozen"):
    print("frozen must be true", file=sys.stderr)
    sys.exit(1)

lanes = reg.get("lanes") or {}
expected_lanes = ["product", "governance", "protocol_status", "ttg_round", "roadmap"]
for lane in expected_lanes:
    if lane not in lanes:
        print(f"missing lane: {lane}", file=sys.stderr)
        sys.exit(1)
    spec = lanes[lane]
    if not spec.get("immutable"):
        print(f"lane {lane} must be immutable", file=sys.stderr)
        sys.exit(1)
    aud = spec.get("audience")
    if not aud:
        print(f"lane {lane} missing audience", file=sys.stderr)
        sys.exit(1)
    if f'audience: "{aud}"' not in gov_ts and f"audience: '{aud}'" not in gov_ts:
        # TS uses audience: "public_user" inside lane block
        if f'audience: "{aud}"' not in gov_ts:
            print(f"TS missing audience {aud} for lane {lane}", file=sys.stderr)
            sys.exit(1)

product = lanes.get("product") or {}
if not product.get("pulse_default") or not product.get("homepage_pulse"):
    print("product lane must be pulse_default + homepage_pulse", file=sys.stderr)
    sys.exit(1)

ttg = lanes.get("ttg_round") or {}
sm = ttg.get("status_machine") or []
required_statuses = [
    "upcoming", "active", "paused", "closed", "cancelled", "governance_approval_required"
]
for st in required_statuses:
    if st not in sm:
        print(f"ttg_round status_machine missing {st}", file=sys.stderr)
        sys.exit(1)

ttg_ts = (root / "frontend/lib/traveltrustTtgPublicRounds.ts").read_text(encoding="utf-8")
if 'status: "governance_approval_required"' not in ttg_ts:
    print("round 2/3 must use governance_approval_required in TS", file=sys.stderr)
    sys.exit(1)
if "lockMonths" in ttg_ts:
    print("public TTG rounds must not declare lockMonths (steward stake only)", file=sys.stderr)
    sys.exit(1)
if "traveltrust_ttg_round_distribution" not in (root / "frontend/locales/en.ts").read_text(encoding="utf-8"):
    print("missing traveltrust_ttg_round_distribution in en locale", file=sys.stderr)
    sys.exit(1)

for loc in ["frontend/locales/en.ts", "frontend/locales/zh.ts"]:
    text = (root / loc).read_text(encoding="utf-8")
    if "traveltrust_announcements_protocol_section_disclaimer" not in text:
        print(f"missing protocol disclaimer in {loc}", file=sys.stderr)
        sys.exit(1)

page = (root / "frontend/components/traveltrust/cinematic/TravelTrustAnnouncementsPage.tsx").read_text(
    encoding="utf-8"
)
if "traveltrust_announcements_protocol_section_disclaimer" not in page:
    print("announcements page must render protocol disclaimer", file=sys.stderr)
    sys.exit(1)
if 'data-tt-traveltrust-protocol-disclaimer="1"' not in page:
    print("protocol disclaimer must be fixed in-page marker", file=sys.stderr)
    sys.exit(1)

print("registry-validate: OK")
PY

cd "$ROOT/frontend" || fail "frontend dir missing"
npm exec vitest run \
  lib/traveltrustAnnouncementLaneGovernance.contract.test.ts \
  lib/traveltrustTtgPublicRounds.test.ts \
  --reporter=dot >/dev/null || fail "lane governance contract tests failed"

echo "check-announcement-lane-governance-gate: PASS ANNOUNCEMENT_LANE_GOVERNANCE_FROZEN"
