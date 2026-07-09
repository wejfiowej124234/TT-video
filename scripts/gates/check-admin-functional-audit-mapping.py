#!/usr/bin/env python3
"""Machine-check: Functional Audit ↔ Feature SSOT ↔ Checklist ↔ Registry (40/40)."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
AUDIT = ROOT / "docs/runbook/TT-ADMIN-FUNCTIONAL-USABILITY-AUDIT-20260701.md"
SSOT = ROOT / "docs/runbook/TT-ADMIN-FEATURE-SSOT.md"
CHECKLIST = ROOT / "docs/runbook/TT-ADMIN-CHECKLIST.md"
REGISTRY = ROOT / "registry/admin-functional-usability-audit.v1.yaml"

FEATURE_ID_RE = re.compile(r"\b(F-(?:UM|CC|OO|PC)-\d{2})\b")


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    sys.exit(1)


def read(p: Path) -> str:
    if not p.is_file():
        fail(f"missing {p}")
    return p.read_text(encoding="utf-8")


def audit_statuses(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        m = re.match(r"\|\s*(F-[A-Z]+-\d+)\s*\|[^|]+\|[^|]+\|\s\*\*(Complete|Partial|Missing)\*\*", line)
        if m:
            out[m.group(1)] = m.group(2)
    return out


def ssot_statuses(text: str) -> dict[str, str]:
    out: dict[str, str] = {}
    for line in text.splitlines():
        m = re.match(
            r"\|\s*(F-[A-Z]+-\d+)\s*\|[^|]+\|\s\*?\*?(Complete|Partial|Missing)\*?\*?",
            line,
        )
        if m:
            out[m.group(1)] = m.group(2)
    return out


def expand_id_range(prefix: str, start: int, end: int) -> list[str]:
    return [f"{prefix}-{i:02d}" for i in range(start, end + 1)]


def parse_checklist_item(raw: str) -> list[str]:
    m = re.match(r"(F-(?:UM|CC|OO|PC))-(\d{2})(?:[～~](\d{2}))?", raw)
    if not m:
        return [raw] if raw.startswith("F-") else []
    prefix, start_s, end_s = m.group(1), int(m.group(2)), m.group(3)
    if end_s:
        return expand_id_range(prefix, int(start_s), int(end_s))
    return [f"{prefix}-{start_s:02d}"]


def checklist_open(text: str) -> set[str]:
    open_ids: set[str] = set()
    for line in text.splitlines():
        m = re.match(r"-\s*☐\s\*\*([^*]+)\*\*", line)
        if m:
            for fid in parse_checklist_item(m.group(1).strip()):
                open_ids.add(fid)
    return open_ids


def checklist_done(text: str) -> set[str]:
    done: set[str] = set()
    for line in text.splitlines():
        m = re.match(r"-\s*☑\s\*\*([^*]+)\*\*", line)
        if m:
            for fid in parse_checklist_item(m.group(1).strip()):
                done.add(fid)
    return done


def registry_features(text: str) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    for line in text.splitlines():
        m = re.search(
            r"id:\s*(F-[A-Z]+-\d+).*status:\s*(\w+).*checklist:\s*(\w+)",
            line,
        )
        if m:
            out[m.group(1)] = {"status": m.group(2), "checklist": m.group(3)}
    return out


def main() -> None:
    audit_t = read(AUDIT)
    ssot_t = read(SSOT)
    checklist_t = read(CHECKLIST)
    registry_t = read(REGISTRY)

    audit = audit_statuses(audit_t)
    ssot = ssot_statuses(ssot_t)
    reg = registry_features(registry_t)
    open_ck = checklist_open(checklist_t)
    done_ck = checklist_done(checklist_t)

    expected_ids = sorted(reg.keys())
    if len(expected_ids) != 40:
        fail(f"registry feature count={len(expected_ids)} expected 40")

    for src, name, data in [
        (audit, "audit", audit),
        (ssot, "ssot", ssot),
    ]:
        missing = set(expected_ids) - set(data)
        extra = set(data) - set(expected_ids)
        if missing:
            fail(f"{name} missing IDs: {sorted(missing)}")
        if extra:
            fail(f"{name} extra IDs: {sorted(extra)}")

    for fid in expected_ids:
        if audit[fid] != "Complete":
            fail(f"audit {fid}={audit[fid]} expected Complete")
        if ssot[fid] != "Complete":
            fail(f"ssot {fid}={ssot[fid]} expected Complete")
        if reg[fid]["status"] != "COMPLETE":
            fail(f"registry {fid} status={reg[fid]['status']} expected COMPLETE")
        if reg[fid]["checklist"] != "done":
            fail(f"registry {fid} checklist={reg[fid]['checklist']} expected done")
        if fid in open_ck:
            fail(f"checklist still open: {fid}")
        if fid not in done_ck:
            fail(f"checklist missing done mark: {fid}")

    if open_ck:
        fail(f"checklist open items: {sorted(open_ck)}")

    if "Complete **40**" not in audit_t and "Complete **40** ·" not in audit_t:
        if not re.search(r"Complete \*\*40\*\*", audit_t):
            fail("audit summary missing Complete 40")

    if "Missing **0**" not in audit_t:
        fail("audit summary missing Missing 0")

    if "capability_complete: true" not in registry_t:
        fail("registry capability_complete not true")

    if "Capability Complete = true" not in audit_t and "Capability Complete = true" not in ssot_t:
        fail("audit/ssot missing Capability Complete = true")

    # Code anchor spot-checks (Official Ops Campaign + Public Ops)
    anchors = [
        ("routes", ROOT / "frontend/lib/api/routes.ts", "adminOfficialPublicOperationsCampaigns"),
        ("campaign panel", ROOT / "frontend/app/admin/official/public-operations/AdminOfficialPublicOperationsCampaignPanel.tsx", "data-tt-admin-public-operations-campaign"),
        ("campaign HTTP", ROOT / "crates/api/src/routes/admin/admin_official_public_operations_campaigns_http.rs", "get_public_ops_campaigns"),
        ("campaign kinds SSOT", ROOT / "frontend/lib/admin/officialOpsCampaign.ts", "F-OO-14"),
        ("pub ops gate", ROOT / "scripts/gates/check-official-ops-public-operations-ssot.sh", "campaign_kind"),
    ]
    for label, path, needle in anchors:
        if not path.is_file() or needle not in path.read_text(encoding="utf-8", errors="replace"):
            fail(f"code anchor missing: {label} ({path.name} · {needle})")

    print("OK: admin functional audit mapping — 40/40 Complete · Audit/SSOT/Checklist/Registry aligned · anchors present")


if __name__ == "__main__":
    main()
