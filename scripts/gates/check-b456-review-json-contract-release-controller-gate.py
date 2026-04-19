#!/usr/bin/env python3
"""B-456: release controller script + config + GHA workflow + Runbook + 04/14 anchors."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path

ANCHOR = "B456-REVIEW-JSON-CONTRACT-RELEASE-CONTROLLER-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    runbook = root / "docs" / "runbook" / "TT-B456-REVIEW-JSON-CONTRACT-RELEASE-CONTROLLER-001.md"
    cfg = root / "config" / "b456_review_json_contract_release_controller.json"
    rc = root / "scripts" / "ops" / "release-controller-b456-review-json-contract.py"
    wf = root / ".github" / "workflows" / "review-json-contract-release-controller.yml"
    green = root / "evidence" / "b455_review_json_contract_rollout" / "fixtures" / "replay_summary.green.json"
    red = root / "evidence" / "b455_review_json_contract_rollout" / "fixtures" / "replay_summary.red.json"
    for p in (four, fourteen, runbook, cfg, rc, wf, green, red):
        if not p.is_file():
            print(f"check-b456: missing {p.relative_to(root)}", file=sys.stderr)
            return 1

    t4 = _read(four)
    t14 = _read(fourteen)
    trb = _read(runbook)

    need_04 = (
        "B-456",
        "b456_",
        "release-controller-b456-review-json-contract.py",
        "b456_review_json_contract_release_controller.json",
        "check-b456-review-json-contract-release-controller-gate.py",
        "TT-B456",
        "review-json-contract-release-controller.yml",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b456: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-456" not in t14 or "release-controller-b456" not in t14:
        print("check-b456: 14 missing B-456 or release-controller-b456", file=sys.stderr)
        return 1

    for s in ("§1", "§2", "workflow_dispatch", "GITHUB_OUTPUT", "should_promote"):
        if s not in trb:
            print(f"check-b456: runbook missing {s!r}", file=sys.stderr)
            return 1

    try:
        obj = json.loads(cfg.read_text(encoding="utf-8"))
    except Exception as e:
        print(f"check-b456: config JSON: {e}", file=sys.stderr)
        return 1
    if obj.get("controller_schema") != "b456_review_json_contract_release_controller_v1":
        print("check-b456: config.controller_schema must be b456_review_json_contract_release_controller_v1", file=sys.stderr)
        return 1

    for name, path, want in (("green", green, 0), ("red", red, 2)):
        r = subprocess.run(
            [sys.executable, str(rc), str(path)],
            cwd=str(root),
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode != want:
            print(
                f"check-b456: controller {name} expected exit {want}, got {r.returncode}: {r.stderr}",
                file=sys.stderr,
            )
            return 1

    with tempfile.NamedTemporaryFile(mode="w", delete=False, suffix="_gh_out") as tmp:
        gh_path = Path(tmp.name)
    try:
        r = subprocess.run(
            [
                sys.executable,
                str(rc),
                str(green),
                "--ci",
                "--github-output",
                str(gh_path),
            ],
            cwd=str(root),
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode != 0:
            print(f"check-b456: --ci expected exit 0, got {r.returncode}", file=sys.stderr)
            return 1
        body = gh_path.read_text(encoding="utf-8")
        if "should_promote=true" not in body:
            print("check-b456: GITHUB_OUTPUT missing should_promote=true", file=sys.stderr)
            return 1
    finally:
        gh_path.unlink(missing_ok=True)

    print(f"check-b456: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
