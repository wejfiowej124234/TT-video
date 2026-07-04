#!/usr/bin/env python3
"""Initialize Manual UAT session artifacts (C1–E2 · 27 items)."""
from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

CHECKLIST = [
    ("C1-1", "C1", "登录成功", "/auth/login"),
    ("C1-2", "C1", "多身份 Hub", "/me/identities"),
    ("C1-3", "C1", "Publish Hub", "/me/publish"),
    ("C1-4", "C1", "主理人工作台", "/governance?view=region"),
    ("C1-5", "C1", "收购子站", "/market/acquisition"),
    ("C1-6", "C1", "本账号通用", "§0"),
    ("C2-1", "C2", "登录成功", "/auth/login"),
    ("C2-2", "C2", "首页 Landing", "/"),
    ("C2-3", "C2", "市场主站", "/market"),
    ("C2-4", "C2", "社区 Feed", "/community"),
    ("C2-5", "C2", "订单列表", "/orders"),
    ("C2-6", "C2", "Admin 入口", "/admin"),
    ("C2-7", "C2", "本账号通用", "§0"),
    ("C3-1", "C3", "登录成功", "/auth/login"),
    ("C3-2", "C3", "向导工作台", "/guide"),
    ("C3-3", "C3", "市场选向导", "/market?view=guides"),
    ("C3-4", "C3", "本账号通用", "§0"),
    ("C4-1", "C4", "登录成功", "/auth/login"),
    ("C4-2", "C4", "商家工作台", "/provider"),
    ("C4-3", "C4", "商家身份设置", "/me/identities/merchant/settings"),
    ("C4-4", "C4", "本账号通用", "§0"),
    ("E1-1", "E1", "旅行者订单入口", "/orders"),
    ("E1-2", "E1", "链 A 向导工作台", "/guide"),
    ("E1-3", "E1", "本走廊通用", "§0"),
    ("E2-1", "E2", "DID 榜主页", "/did-rank"),
    ("E2-2", "E2", "收购副榜", "/did-rank?board=acquisition"),
    ("E2-3", "E2", "本账号通用", "§0"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--stamp", required=True)
    ap.add_argument("--commit", required=True)
    ap.add_argument("--session-dir", required=True)
    ap.add_argument("--wave", default="")
    ap.add_argument("--runtime-truth-baseline", default="")
    args = ap.parse_args()
    sess = Path(args.session_dir)
    sess.mkdir(parents=True, exist_ok=True)
    utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    probes: dict[str, str] = {}
    probe_file = sess / "checklist-probes.jsonl"
    if probe_file.is_file():
        for line in probe_file.read_text(encoding="utf-8").splitlines():
            if not line.strip():
                continue
            row = json.loads(line)
            probes[row["id"]] = row.get("status", "")

    items = []
    api_pass = 0
    for cid, persona, title, path in CHECKLIST:
        probe = probes.get(cid, "")
        # Route/login probe PASS = api_prep only; UI still needs human for §0 and full sign-off
        if probe == "PASS" and cid.endswith("-1") or (probe == "PASS" and path.startswith("/")):
            prep = "API_ROUTE_PREP_PASS" if path != "§0" else "PENDING_HUMAN"
        elif path == "§0":
            prep = "PENDING_HUMAN"
        else:
            prep = probes.get(cid, "PENDING_HUMAN")
        if prep == "API_ROUTE_PREP_PASS":
            api_pass += 1
        items.append(
            {
                "id": cid,
                "persona": persona,
                "title": title,
                "path": path,
                "ui_status": "PENDING",
                "api_prep": prep,
            }
        )

    ui_lines = [
        "# UI-CHECKLIST · Manual UAT C1–E2",
        "",
        f"**Session:** `{args.stamp}` · **Commit:** `{args.commit}` · **Phase:** ① local",
        "",
        "| ID | Persona | 检查项 | 路径 | API预检 | UI □ |",
        "|----|---------|--------|------|---------|------|",
    ]
    for it in items:
        ui_lines.append(
            f"| {it['id']} | {it['persona']} | {it['title']} | `{it['path']}` | {it['api_prep']} | □ |"
        )
    (sess / "UI-CHECKLIST.md").write_text("\n".join(ui_lines) + "\n", encoding="utf-8")

    (sess / "SESSION-LOG.md").write_text(
        f"""# SESSION-LOG · {args.stamp}

| 字段 | 值 |
|------|-----|
| **Session** | {args.stamp} |
| **Phase** | ① local |
| **Track** | Manual UAT C1–E2 (product validation) |
| **Commit** | {args.commit} |
| **Started UTC** | {utc} |
| **Checklist SSOT** | docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md |
| **Config** | FROZEN — no Configuration Sprint |

## 纪律

- **API/路由预检 PASS** ≠ **UI 勾选 PASS**（须浏览器 + §0 人工须看）
- Business Bug → `evidence/manual-uat/defects/DEFECT-NNN.md` + registry

## 本轮进度

- Kickoff: `bash scripts/dev/run-manual-uat-c1e2-kickoff.sh`
- API/route prep pass count: {api_pass} (non-§0 items with route probe)
- UI PASS: 0 / 27 (awaiting human browser)
""",
        encoding="utf-8",
    )

    summary = {
        "session_id": f"S-{args.stamp}",
        "session_stamp": args.stamp,
        "phase": "①-local",
        "track": "manual-uat-c1e2",
        "commit": args.commit,
        "started_utc": utc,
        "manual_test": {"pass": 0, "fail": 0, "blocked": 0, "total": 27},
        "api_prep_pass": api_pass,
        "checklist_items": items,
    }
    if args.wave:
        summary["wave"] = args.wave
    if args.runtime_truth_baseline:
        summary["runtime_truth_p0_baseline"] = args.runtime_truth_baseline
    (sess / "SUMMARY.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")

    signoff = Path("evidence/manual-uat/signoff") / f"MANUAL-UAT-KICKOFF-{args.stamp[:8]}.md"
    signoff.parent.mkdir(parents=True, exist_ok=True)
    signoff.write_text(
        f"""# Manual UAT Kickoff — {args.stamp}

**Status:** IN_PROGRESS · **Phase:** ① local · **Commit:** `{args.commit}`

| Gate | Result |
|------|--------|
| verify-cfg-drift-closure | PASS (maintenance) |
| Step 6b5 seed login | PASS |
| Route probe | see `{args.stamp}/checklist-probes.jsonl` |

**UI:** 0/27 PASS — browser hand test required per TT-LOCAL-UI-MANUAL-UAT-CHECKLIST §1.
""",
        encoding="utf-8",
    )
    print(f"init-manual-uat-session: {sess}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
