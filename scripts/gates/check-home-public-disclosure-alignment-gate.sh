#!/usr/bin/env bash
# Gate: Home / Pulse / Roadmap public disclosure aligned with Phase③ Entry.
#
#   bash scripts/gates/check-home-public-disclosure-alignment-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
REG="$ROOT/registry/traveltrust-public-disclosure.v1.yaml"
CLOSEOUT="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline/HOME-PUBLIC-DISCLOSURE-ALIGNMENT-CLOSEOUT.md"

fail() {
  echo "check-home-public-disclosure-alignment-gate: FAIL $*" >&2
  exit 2
}

[[ -f "$REG" ]] || fail "missing traveltrust-public-disclosure.v1.yaml"
[[ -f "$CLOSEOUT" ]] || fail "missing HOME-PUBLIC-DISCLOSURE-ALIGNMENT-CLOSEOUT.md"

PY=python
command -v python >/dev/null 2>&1 || PY=python3
command -v "$PY" >/dev/null 2>&1 || fail "python required"

"$PY" - "$REG" "$ROOT" <<'PY' || fail "registry validation error"
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("PyYAML required", file=sys.stderr)
    sys.exit(1)

reg = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8"))
root = Path(sys.argv[2])

if reg.get("verdict") != "HOME_PUBLIC_DISCLOSURE_ALIGNED":
    print("verdict must be HOME_PUBLIC_DISCLOSURE_ALIGNED", file=sys.stderr)
    sys.exit(1)

ann = (root / "frontend/lib/traveltrustNetworkAnnouncements.ts").read_text(encoding="utf-8")
catalog = (root / "frontend/lib/traveltrustAnnouncementCatalog.ts").read_text(encoding="utf-8")
ann_src = ann + "\n" + catalog
pulse = reg.get("pulse_announcements") or {}
pulse_items = pulse.get("items") if isinstance(pulse, dict) else pulse
for item in pulse_items or []:
    iid = item.get("id")
    if iid not in ann_src:
        print(f"missing pulse id in TS SSOT: {iid}", file=sys.stderr)
        sys.exit(1)
    if f'id: "{iid}"' not in ann_src:
        print(f"pulse id not registered: {iid}", file=sys.stderr)
        sys.exit(1)

for item in reg.get("protocol_status_archive") or []:
    iid = item.get("id")
    if f'id: "{iid}"' not in ann_src:
        print(f"protocol_status id not registered: {iid}", file=sys.stderr)
        sys.exit(1)

if "lane: \"product\"" not in ann_src and "lane: 'product'" not in ann_src:
    print("announcements must declare product lane", file=sys.stderr)
    sys.exit(1)

if "sepolia_preview" in ann_src:
    print("forbidden sepolia_preview key in announcements module", file=sys.stderr)
    sys.exit(1)

for loc in ["frontend/locales/en.ts", "frontend/locales/zh.ts"]:
    text = (root / loc).read_text(encoding="utf-8")
    if "traveltrust_announcements_detail_status_sepolia_preview" in text:
        print(f"stale preview status key still in {loc}", file=sys.stderr)
        sys.exit(1)
    if "traveltrust_announcements_detail_status_sepolia_active" not in text:
        print(f"missing sepolia_active status in {loc}", file=sys.stderr)
        sys.exit(1)

print("registry-validate: OK")
PY

cd "$ROOT/frontend" && npx vitest run \
  lib/traveltrustNetworkAnnouncements.test.ts \
  lib/homePublicDisclosureAlignment.contract.test.ts \
  app/\(home\)/homeMarketing.contract.test.ts \
  --reporter=dot >/dev/null || fail "frontend disclosure contract tests failed"

echo "check-home-public-disclosure-alignment-gate: PASS HOME_PUBLIC_DISCLOSURE_ALIGNED"
