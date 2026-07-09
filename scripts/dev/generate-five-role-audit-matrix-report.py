#!/usr/bin/env python3
"""Generate docs/runbook/FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md from frca-findings.json."""
from __future__ import annotations

import argparse
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--findings", required=True)
    ap.add_argument("--browser-gaps", default="")
    ap.add_argument("--out", default="docs/runbook/FIVE-ROLE-FULL-CHAIN-AUDIT-REPORT.md")
    args = ap.parse_args()

    data = json.loads(Path(args.findings).read_text(encoding="utf-8"))
    gaps = data.get("gaps", [])
    chains = data.get("role_chains", [])
    verdict = data.get("verdict", "UNKNOWN")
    web = data.get("targets", {}).get("web", "")
    api = data.get("targets", {}).get("api", "")
    sha = data.get("meta_git_sha", "unknown")
    recorded = data.get("recorded_at", datetime.now(timezone.utc).isoformat())

    by_cat: dict[str, list] = defaultdict(list)
    for g in gaps:
        by_cat[g.get("category", "其他")].append(g)

    lines = [
        "# 五角色全链路真人审计报告",
        "",
        f"**记录时间：** {recorded}  ",
        f"**Web：** [{web}]({web})  ",
        f"**API：** [{api}]({api})  ",
        f"**git_sha：** `{sha}`  ",
        f"**证据：** `{args.findings}`  ",
        "",
        "> 注册 → 登录 → 角色核心路径 → 退出 · **≠ Production GO**",
        "",
        "## Executive verdict",
        "",
        "| 项 | 结果 |",
        "|----|------|",
        f"| **FRCA overall** | **{verdict}** |",
        f"| **P0** | **{data.get('summary', {}).get('p0', 0)}** |",
        f"| **P1** | **{data.get('summary', {}).get('p1', 0)}** |",
        f"| **P2** | **{data.get('summary', {}).get('p2', 0)}** |",
        "",
        "```text",
        f"FRCA_FIVE_ROLE_FULL_CHAIN: {verdict}",
        "```",
        "",
        "## 1 · 五角色全链路矩阵",
        "",
        "| 角色 | 注册 | 登录 | 核心路径 | 退出 |",
        "|------|------|------|----------|------|",
    ]
    for c in chains:
        lines.append(
            f"| **{c.get('role')}** | {c.get('register','—')} | {c.get('login','—')} | "
            f"{c.get('core','—')} | {c.get('logout','—')} |"
        )

    lines.extend(["", "## 2 · 问题矩阵（按类别）", ""])
    for cat, items in sorted(by_cat.items()):
        lines.append(f"### {cat}（{len(items)}）")
        lines.append("")
        if not items:
            lines.append("_无记录。_")
        else:
            for g in items:
                lines.append(f"- **{g.get('id')}** [{g.get('priority')}] {g.get('role')}: {g.get('title')}")
        lines.append("")

    lines.extend(
        [
            "**复跑：** `bash scripts/dev/run-five-role-full-chain-audit.sh`",
            "",
            f"*Generated {datetime.now(timezone.utc).date()} · FRCA v1*",
            "",
        ]
    )
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"report: {out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
