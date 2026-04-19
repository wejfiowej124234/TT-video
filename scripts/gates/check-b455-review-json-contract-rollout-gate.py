#!/usr/bin/env python3
"""B-455: gray rollout + auto-rollback strategy (thresholds JSON + eval + Runbook + 04/14 anchors)."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ANCHOR = "B455-REVIEW-JSON-CONTRACT-ROLLOUT-GATE-V1"


def _read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="replace")


def main() -> int:
    root = Path(__file__).resolve().parent.parent.parent
    four = root / "docs" / "spec" / "04-后端与API.md"
    fourteen = root / "docs" / "spec" / "14-合约-API-ABI-前后端对齐.md"
    runbook = root / "docs" / "runbook" / "TT-B455-REVIEW-JSON-CONTRACT-GRAY-ROLLBACK-STRATEGY-001.md"
    cfg = root / "config" / "b455_review_json_contract_rollout_thresholds.json"
    eval_py = root / "scripts" / "gates" / "eval-b455-review-json-contract-rollout-decision.py"
    green = root / "evidence" / "b455_review_json_contract_rollout" / "fixtures" / "replay_summary.green.json"
    red = root / "evidence" / "b455_review_json_contract_rollout" / "fixtures" / "replay_summary.red.json"
    for p in (four, fourteen, runbook, cfg, eval_py, green, red):
        if not p.is_file():
            print(f"check-b455: missing {p.relative_to(root)}", file=sys.stderr)
            return 1

    t4 = _read(four)
    t14 = _read(fourteen)
    trb = _read(runbook)

    need_04 = (
        "B-455",
        "b455_",
        "eval-b455-review-json-contract-rollout-decision.py",
        "b455_review_json_contract_rollout_thresholds.json",
        "check-b455-review-json-contract-rollout-gate.py",
        "TT-B455",
    )
    for s in need_04:
        if s not in t4:
            print(f"check-b455: 04 missing anchor {s!r}", file=sys.stderr)
            return 1

    if "B-455" not in t14 or "eval-b455" not in t14:
        print("check-b455: 14 missing B-455 or eval-b455", file=sys.stderr)
        return 1

    for s in ("§1", "§2", "§3", "自动回滚", "replay_summary.json", "b455_review_json_contract_rollout_thresholds.json"):
        if s not in trb:
            print(f"check-b455: runbook missing {s!r}", file=sys.stderr)
            return 1

    try:
        obj = json.loads(cfg.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"check-b455: invalid JSON in config: {e}", file=sys.stderr)
        return 1
    if obj.get("threshold_schema") != "b455_review_json_contract_rollout_v1":
        print("check-b455: config.threshold_schema must be b455_review_json_contract_rollout_v1", file=sys.stderr)
        return 1
    lim = obj.get("limits") or {}
    for k in ("missing_meta", "malformed_meta", "unknown_future_schema"):
        if k not in lim or "yellow_abs" not in lim[k] or "red_abs" not in lim[k]:
            print(f"check-b455: config.limits[{k!r}] must have yellow_abs and red_abs", file=sys.stderr)
            return 1
    gr = obj.get("gray_release") or {}
    if "traffic_percent_steps" not in gr or "on_verdict" not in gr:
        print("check-b455: gray_release must include traffic_percent_steps and on_verdict", file=sys.stderr)
        return 1

    for name, path, want in (("green", green, 0), ("red", red, 2)):
        r = subprocess.run(
            [sys.executable, str(eval_py), str(path), "--thresholds", str(cfg)],
            cwd=str(root),
            capture_output=True,
            text=True,
            check=False,
        )
        if r.returncode != want:
            print(
                f"check-b455: eval {name} expected exit {want}, got {r.returncode}: {r.stderr or r.stdout}",
                file=sys.stderr,
            )
            return 1
        if want == 2 and '"verdict": "RED"' not in r.stdout:
            print("check-b455: red fixture stdout missing verdict RED", file=sys.stderr)
            return 1
        if want == 0 and '"verdict": "GREEN"' not in r.stdout:
            print("check-b455: green fixture stdout missing verdict GREEN", file=sys.stderr)
            return 1

    print(f"check-b455: OK ({ANCHOR})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
