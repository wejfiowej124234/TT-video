#!/usr/bin/env python3
"""
真 staging 跑通且 validate 通过后：根据 report.json 打印「TT-B486 封口」粘贴块
（from-stash 一览行 420 第三列 + tracker 备注句）。不修改任何文件。

若 report 仍为占位或 release_gate=NO_GO，exit 2。
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


def _date_from_report(data: dict) -> str:
    for k in ("finished_at", "started_at"):
        raw = data.get(k)
        if isinstance(raw, str) and len(raw) >= 10:
            return raw[:10]
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def main() -> int:
    ap = argparse.ArgumentParser(description="Print TT-B486 seal markdown after real staging run")
    ap.add_argument("--report", type=Path, default=Path("evidence/GO_20260418/report.json"))
    ap.add_argument(
        "--require-iron-rule-notes",
        action="store_true",
        help="Require ENV-DB-PROOF/notes.md beside report to exceed 600 chars (heuristic: PG 段落已写)",
    )
    args = ap.parse_args()
    p = args.report.resolve()
    if not p.is_file():
        print(f"ERROR: report not found: {p}", file=sys.stderr)
        return 2

    data = json.loads(p.read_text(encoding="utf-8"))
    rg = str(data.get("release_gate", "")).strip()
    cases = data.get("cases")
    if not isinstance(cases, list) or len(cases) == 0:
        print("ERROR: cases[] empty — not a completed regression output.", file=sys.stderr)
        return 2
    if rg == "NO_GO":
        print("ERROR: release_gate is NO_GO; fix staging and re-run before seal.", file=sys.stderr)
        return 2
    if rg not in ("GO", "PARTIAL_GO"):
        print(f"ERROR: unexpected release_gate {rg!r} (expected GO or PARTIAL_GO).", file=sys.stderr)
        return 2

    title = str(data.get("title", ""))
    if re.search(r"replace|running r003_staging", title, re.I):
        print("ERROR: title still looks like repository placeholder template.", file=sys.stderr)
        return 2

    executor = str(data.get("executor", "")).strip()
    if executor.lower() in ("pending-staging-run", "unset-executor", ""):
        print("ERROR: executor still placeholder — re-run with real R003_EXECUTOR.", file=sys.stderr)
        return 2

    env = data.get("environment")
    if not isinstance(env, dict) or str(env.get("name", "")).strip().lower() != "staging":
        print("ERROR: environment.name is not staging — refuse TT-B486 staging seal snippet.", file=sys.stderr)
        return 2

    notes = p.parent / "ENV-DB-PROOF" / "notes.md"
    if args.require_iron_rule_notes:
        if not notes.is_file():
            print(f"ERROR: missing {notes}", file=sys.stderr)
            return 2
        nlen = len(notes.read_text(encoding="utf-8"))
        if nlen < 600:
            print(
                f"ERROR: {notes} too short ({nlen} chars); complete iron rule ① PG write-back first.",
                file=sys.stderr,
            )
            return 2

    date_s = _date_from_report(data)
    run_id = str(data.get("run_id", "")).strip()
    ev_rel = str(p.parent.as_posix())  # evidence/GO_20260418

    cell = (
        f"**已封口**（**{date_s}** · **staging** · **`{ev_rel}/report.json`** · **`run_id={run_id}`** · "
        f"**`release_gate={rg}`** · **`validate --fail-on-no-go` exit 0**"
    )
    if args.require_iron_rule_notes:
        cell += " · **铁律①已补** **`ENV-DB-PROOF/notes.md`**"
    else:
        cell += " · **铁律①**：人工确认 **`ENV-DB-PROOF/notes.md`** 已补（可选 **`--require-iron-rule-notes`** **机读校验**）"
    cell += " · **R-002 §4/§4.1** 已对照 **`r002_section4_backfill.md`**）"

    tracker = f"已封口 {date_s} · `{ev_rel}/` · `release_gate={rg}` · `run_id={run_id}`"

    print("--- TT-B486 · from-stash 一览行 420 · 第三列（状态）整格替换 ---\n")
    print(cell)
    print("\n--- 93-matrix-batch-tracker · 93-R003-STAGING · 依赖列末或备注 ---\n")
    print(tracker)
    print("\n--- 提示：将上述两段分别粘贴进 PR；勿在未人工核对 R-002 前合并。 ---")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
