#!/usr/bin/env python3
"""B-457: adapter config + release-adapter-layer script + receipt schema + Runbook + workflow anchors."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ANCHOR = "B457-REVIEW-JSON-CONTRACT-RELEASE-ADAPTER-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    runbook = root / "docs" / "runbook" / "TT-B457-REVIEW-JSON-CONTRACT-RELEASE-ADAPTER-EXECUTION-001.md"
    cfg = root / "config" / "b457_review_json_contract_release_adapters.json"
    adapter_py = root / "scripts" / "ops" / "release-adapter-layer-b457-review-json-contract.py"
    ev_readme = root / "evidence" / "b457_release_controller_executions" / "README.md"
    wf = root / ".github" / "workflows" / "review-json-contract-release-controller.yml"
    for p in (four, fourteen, runbook, cfg, adapter_py, ev_readme, wf):
        if not p.is_file():
            print(f"check-b457: missing {p.relative_to(root)}", file=sys.stderr)
            return 1

    t4 = _read(four)
    t14 = _read(fourteen)
    trb = _read(runbook)
    twf = _read(wf)

    need_04 = (
        "B-457",
        "b457_",
        "release-adapter-layer-b457-review-json-contract.py",
        "b457_review_json_contract_release_adapters.json",
        "execution_receipt.json",
        "check-b457-review-json-contract-release-adapter-gate.py",
        "TT-B457",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b457: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-457" not in t14 or "release-adapter-layer-b457" not in t14:
        print("check-b457: 14 missing B-457 or release-adapter-layer-b457", file=sys.stderr)
        return 1

    for s in ("§1", "§2", "§3", "TRAVELTRUST_CHATOPS_SLACK_WEBHOOK_URL", "execution_receipt"):
        if s not in trb:
            print(f"check-b457: runbook missing {s!r}", file=sys.stderr)
            return 1

    if "release-adapter-layer-b457" not in twf or "execution_receipt.json" not in twf:
        print("check-b457: workflow missing adapter or receipt anchor", file=sys.stderr)
        return 1

    try:
        obj = json.loads(cfg.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"check-b457: config JSON: {e}", file=sys.stderr)
        return 1
    if obj.get("adapters_schema") != "b457_review_json_contract_release_adapters_v1":
        print("check-b457: adapters_schema mismatch", file=sys.stderr)
        return 1

    with tempfile.TemporaryDirectory() as td:
        ev = Path(td) / "run_gate"
        r = subprocess.run(
            [
                sys.executable,
                str(adapter_py),
                "--verdict",
                "GREEN",
                "--evidence-dir",
                str(ev),
            ],
            cwd=str(root),
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode != 0:
            print(f"check-b457: adapter layer failed: {r.stderr}", file=sys.stderr)
            return 1
        rp = ev / "execution_receipt.json"
        if not rp.is_file():
            print("check-b457: execution_receipt.json missing", file=sys.stderr)
            return 1
        rec = json.loads(rp.read_text(encoding="utf-8"))
        if rec.get("receipt_schema") != "b457_execution_receipt_v1":
            print("check-b457: receipt_schema mismatch", file=sys.stderr)
            return 1
        if not rec.get("invocations"):
            print("check-b457: empty invocations", file=sys.stderr)
            return 1

    print(f"check-b457: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
