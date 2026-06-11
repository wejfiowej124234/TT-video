#!/usr/bin/env python3
"""
TT-B432 / B-432: minimal regression shell for governance closeloop UI surface (B-428 path).

- Required Next.js pages / components under frontend/app + frontend/components/governance
- i18n keys for B-428 doc pointer (zh + en)
- governance/page.tsx must reference GovernanceTargetNotice + B-428 pointer key

Does not replace scripts/gates/check-04-frontend-routes-vs-app.py (04 §3.4 SSOT); complements it.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

REQUIRED_FILES: list[Path] = [
    ROOT / "frontend/app/governance/page.tsx",
    ROOT / "frontend/app/governance/delegate/page.tsx",
    ROOT / "frontend/app/governance/proposals/page.tsx",
    ROOT / "frontend/app/governance/proposals/[id]/page.tsx",
    ROOT / "frontend/app/governance/fee-routes/page.tsx",
    ROOT / "frontend/app/staking/page.tsx",
    ROOT / "frontend/components/governance/GovernanceTargetNotice.tsx",
    ROOT / "frontend/components/governance/GovernanceProposalImpactPanel.tsx",
]

I18N_FILES = [ROOT / "frontend/locales/zh.ts", ROOT / "frontend/locales/en.ts"]
I18N_KEY = "governance_b428_closeloop_doc_pointer"


def main() -> int:
    errors: list[str] = []
    for p in REQUIRED_FILES:
        if not p.is_file():
            errors.append(f"missing required file: {p.relative_to(ROOT)}")

    for p in I18N_FILES:
        if not p.is_file():
            errors.append(f"missing locale file: {p.relative_to(ROOT)}")
            continue
        text = p.read_text(encoding="utf-8")
        if I18N_KEY not in text:
            errors.append(f"{p.relative_to(ROOT)} must contain key {I18N_KEY!r}")

    # Hub may re-export GovernanceHubPageMain from a thin page.tsx shell.
    gov_hub_sources = [
        ROOT / "frontend/app/governance/page.tsx",
        ROOT / "frontend/app/governance/GovernanceHubPageMain.tsx",
    ]
    hub_text = ""
    for p in gov_hub_sources:
        if p.is_file():
            hub_text += p.read_text(encoding="utf-8") + "\n"
    if hub_text:
        if "GovernanceTargetNotice" not in hub_text:
            errors.append(
                "governance hub must import/render GovernanceTargetNotice "
                "(frontend/app/governance/page.tsx or GovernanceHubPageMain.tsx)"
            )
        if I18N_KEY not in hub_text:
            errors.append(
                f"governance hub must reference i18n key {I18N_KEY!r} "
                "(frontend/app/governance/page.tsx or GovernanceHubPageMain.tsx)"
            )
    else:
        errors.append("missing governance hub: frontend/app/governance/page.tsx")

    if errors:
        print("check-b432-governance-ui-ssot-surface FAIL:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        return 1

    print(
        "check-b432-governance-ui-ssot-surface OK: B-428/B-432 governance closeloop surface pinned."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
