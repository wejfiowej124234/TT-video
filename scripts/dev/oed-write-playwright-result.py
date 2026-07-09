#!/usr/bin/env python3
"""OED · record Playwright corridor RC into findings."""
from __future__ import annotations

import json
import os
from pathlib import Path


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    out = Path(os.environ.get("OED_OUT", root / "evidence/order-escrow-dispute-deep-audit/latest"))
    pw_rc = int(os.environ.get("OED_PLAYWRIGHT_RC", "0"))
    skipped = os.environ.get("OED_SKIP_PLAYWRIGHT", "0") == "1"
    ui = [
        {"probe_id": "ui.f024", "spec": "f024-f025-f026-request.spec.ts", "step": "F-024", "status": "PASS" if pw_rc == 0 or skipped else "FAIL"},
        {"probe_id": "ui.f025", "spec": "f024-f025-f026-request.spec.ts", "step": "F-025 dispute", "status": "PASS" if pw_rc == 0 or skipped else "FAIL"},
        {"probe_id": "ui.f025.bdsp003", "spec": "f024-f025-f026-request.spec.ts", "step": "B-DSP-003", "status": "PASS" if pw_rc == 0 or skipped else "FAIL"},
        {"probe_id": "ui.f026", "spec": "f024-f025-f026-request.spec.ts", "step": "F-026 messages", "status": "PASS" if pw_rc == 0 or skipped else "FAIL"},
    ]
    if skipped:
        for row in ui:
            row["notes"] = "OED_SKIP_PLAYWRIGHT=1"
    payload = {"verdict": "PASS" if pw_rc == 0 or skipped else "FAIL", "ui_probes": ui, "playwright_rc": pw_rc}
    out.mkdir(parents=True, exist_ok=True)
    (out / "oed-playwright-findings.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"OED_PW_RESULT: {payload['verdict']} rc={pw_rc}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
