#!/usr/bin/env python3
"""Generate LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md from audit evidence."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def load_json(path: Path) -> dict | list | None:
    if not path.is_file():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def machine_rows(out_dir: Path) -> list[tuple[str, str]]:
    tsv = out_dir / "machine-summary.tsv"
    if not tsv.is_file():
        return []
    rows: list[tuple[str, str]] = []
    for line in tsv.read_text(encoding="utf-8").splitlines():
        if "|" in line:
            v, k = line.split("|", 1)
            rows.append((k.strip(), v.strip()))
    return rows


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out-dir", required=True)
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--api-base", default="http://127.0.0.1:8080")
    ap.add_argument("--fe-base", default="http://127.0.0.1:3012")
    ap.add_argument("--playwright-rc", type=int, default=0)
    args = ap.parse_args()

    out_dir = Path(args.out_dir)
    findings = load_json(out_dir / "browser-matrix-findings.json") or {"rows": [], "counts": {}}
    browser_rows = findings.get("rows") or []
    counts = findings.get("counts") or {}

    fixes: list[str] = []
    for r in browser_rows:
        if r.get("verdict") == "FAIL":
            fixes.append(f"- **FAIL** `{r.get('account_id')}` · `{r.get('path')}` · {r.get('note')}")
        elif r.get("verdict") == "WARN":
            fixes.append(f"- **WARN** `{r.get('account_id')}` · `{r.get('path')}` · {r.get('note')}")

    for probe, verdict in machine_rows(out_dir):
        if verdict == "FAIL":
            rc_path = out_dir / "machine" / f"{probe}.rc"
            log_path = out_dir / "machine" / f"{probe}.log"
            tail = ""
            if log_path.is_file():
                lines = log_path.read_text(encoding="utf-8", errors="replace").splitlines()
                tail = lines[-1] if lines else ""
            fixes.append(f"- **FAIL** machine `{probe}` · {tail or rc_path}")

    now = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    report_path = Path(__file__).resolve().parents[2] / "docs" / "runbook" / "LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT.md"

    lines = [
        "# LOCAL-SIX-ACCOUNT-UI-L5-AUDIT-REPORT",
        "",
        f"**Generated:** {now} · **Stamp:** `{args.stamp}`",
        "",
        "**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产",
        "",
        "> **诚实边界：** 本报告 **仅** 覆盖 **① 本地** 固定六账号浏览器 + L3 机读旁证。**不得** 冒充 **② Graduation GO** / staging 全矩阵 GO / **③ Production GO**。",
        "",
        f"- **API:** `{args.api_base}`",
        f"- **Frontend:** `{args.fe_base}`",
        f"- **Evidence:** `evidence/local-six-account-ui-l5-audit/{args.stamp}/`",
        "",
        "## 总表",
        "",
        "| 项 | 结论 |",
        "|----|------|",
        f"| **浏览器六账号矩阵** | PASS {counts.get('pass', 0)} · WARN {counts.get('warn', 0)} · FAIL {counts.get('fail', 0)} |",
        f"| **Playwright matrix exit** | {'✅ 0' if args.playwright_rc == 0 else f'❌ {args.playwright_rc}'} |",
        "| **② Graduation GO** | **否**（① 本地旁证） |",
        "",
        "## 1 · 浏览器 · 账号 × 路径",
        "",
        "| 账号 | 邮箱 | 路径 | 标签 |  verdict | 备注 | 截图 |",
        "|------|------|------|------|---------|------|------|",
    ]

    for r in browser_rows:
        shot = r.get("screenshot") or ""
        if shot:
            try:
                rel = Path(shot).relative_to(out_dir.parents[1])
                shot = f"`{rel.as_posix()}`"
            except ValueError:
                shot = f"`{shot}`"
        lines.append(
            f"| {r.get('account_id','')} | `{r.get('email','')}` | `{r.get('path','')}` | {r.get('label','')} | **{r.get('verdict','')}** | {r.get('note','')} | {shot} |"
        )

    lines.extend(
        [
            "",
            "## 2 · 机读旁证（P0 + 域）",
            "",
            "| 探针 |  verdict |",
            "|------|---------|",
        ]
    )
    for probe, verdict in machine_rows(out_dir):
        icon = "✅" if verdict == "PASS" else "❌"
        lines.append(f"| `{probe}` | {icon} {verdict} |")

    lines.extend(
        [
            "",
            "## 3 · 修复清单（FAIL/WARN）",
            "",
        ]
    )
    if fixes:
        lines.extend(fixes)
    else:
        lines.append("- （无 FAIL · 见 WARN 行是否需手测补证）")

    lines.extend(
        [
            "",
            "## 4 · 复跑命令",
            "",
            "```bash",
            "bash scripts/dev/run-local-six-account-ui-l5-audit.sh",
            "```",
            "",
            "**① ≠ ②：** TN-P1 / Graduation / staging RBAC 全矩阵须 **G-1/G-2** 后另闸。",
            "",
        ]
    )

    report_path.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {report_path}")


if __name__ == "__main__":
    main()
