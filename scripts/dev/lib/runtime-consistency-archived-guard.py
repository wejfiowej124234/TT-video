#!/usr/bin/env python3
"""Block Runtime Consistency re-audit unless post-deploy revalidation.

SSOT:
  evidence/GO_phase3_production_entry_review/FROZEN-RUNTIME-BASELINE.v1.json
  evidence/GO_phase3_production_entry_review/LOCAL-STAGING-RUNTIME-CONSISTENCY-ARCHIVED.v1.json

Baseline mutation only: runtime change → S5 → S6 → baseline record update.

Allow when:
  RUNTIME_CONSISTENCY_POST_DEPLOY_REAUDIT=1
  --allow-post-deploy-reaudit
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
ARCHIVED = ROOT / "evidence/GO_phase3_production_entry_review/LOCAL-STAGING-RUNTIME-CONSISTENCY-ARCHIVED.v1.json"


def assert_reaudit_allowed(argv: list[str] | None = None) -> None:
    if os.environ.get("RUNTIME_CONSISTENCY_POST_DEPLOY_REAUDIT") == "1":
        return
    if argv and "--allow-post-deploy-reaudit" in argv:
        return
    if not ARCHIVED.is_file():
        return
    data = json.loads(ARCHIVED.read_text(encoding="utf-8"))
    if data.get("verdict") not in ("ARCHIVED", "CLOSED", "COMPLETE"):
        return
    print(
        "runtime-consistency-archived: BLOCKED — Runtime Consistency ARCHIVED; "
        "Runtime Baseline is a FROZEN ASSET @ d5aa447f.\n"
        "  Fixed answer: Runtime Consistency completed & archived. "
        "No re-audit unless new runtime deploy + S5→S6→baseline update.\n"
        "  Do NOT regenerate Phase①/②/Runtime Consistency audits.\n"
        "  SSOT: evidence/GO_phase3_production_entry_review/PHASE12-AUDIT-CLOSURE-POLICY.v1.json\n"
        "  Escape: RUNTIME_CONSISTENCY_POST_DEPLOY_REAUDIT=1 or --allow-post-deploy-reaudit",
        file=sys.stderr,
    )
    raise SystemExit(2)


if __name__ == "__main__":
    assert_reaudit_allowed(sys.argv[1:])
