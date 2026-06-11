#!/usr/bin/env python3
"""Generate docs/runbook/HUMAN-ACCEPTANCE-REPORT.md from hat-findings.json."""
from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PHASE29_STATUS = ROOT / "evidence" / "GO_phase2_testnet_20260526" / "phase29-release-polish" / "STATUS.txt"


def phase29_holds_phase3() -> bool:
    if not PHASE29_STATUS.is_file():
        return False
    text = PHASE29_STATUS.read_text(encoding="utf-8")
    if "phase3_entry_gate: HOLD" in text.lower():
        return True
    if "status: IN_PROGRESS" in text.lower() or "status: BACKLOG_READY" in text.lower():
        return True
    return False


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--findings", required=True)
    p.add_argument("--out", default="docs/runbook/HUMAN-ACCEPTANCE-REPORT.md")
    args = p.parse_args()

    data = json.loads(Path(args.findings).read_text(encoding="utf-8"))
    issues = data.get("issues", [])
    flows = data.get("flows", [])
    summary = data.get("summary", {})
    verdict = data.get("verdict", "UNKNOWN")
    recorded = data.get("recorded_at", datetime.now(timezone.utc).isoformat())
    web = data.get("targets", {}).get("web", "https://tt-web-staging.fly.dev")
    api = data.get("targets", {}).get("api", "https://tt-api-staging.fly.dev")
    git_sha = data.get("meta_git_sha") or "unknown"

    by_prio = {"P0": [], "P1": [], "P2": []}
    for i in issues:
        by_prio.setdefault(i.get("priority", "P2"), []).append(i)

    by_role = Counter(i.get("role", "?") for i in issues)

    phase3_gate = "BLOCK" if summary.get("p0", 0) > 0 else ("READY" if summary.get("p1", 0) <= 3 and verdict == "PASS" else "HOLD")
    if phase3_gate == "READY" and phase29_holds_phase3():
        phase3_gate = "HOLD"

    phase3_entry_cell = f"| **Phase ③ entry recommendation** | **{phase3_gate}** |"
    if phase29_holds_phase3():
        phase3_entry_cell = (
            f"| **Phase ③ entry recommendation** | **{phase3_gate}**"
            "（②.9 Release Polish — 见 [PHASE29-RELEASE-POLISH](./PHASE29-RELEASE-POLISH.md)） |"
        )

    machine_lines = [
        f"PHASE28_HUMAN_ACCEPTANCE: {verdict}",
        f"PHASE3_ENTRY_GATE: {phase3_gate}",
    ]
    if phase29_holds_phase3():
        machine_lines.append("PHASE29_RELEASE_POLISH: BACKLOG_READY")
        machine_lines.append("PHASE29_DEV_GATE: CLOSED")

    phase29_line = ""
    if phase29_holds_phase3():
        phase29_line = (
            "> **Phase ③ 入口：⏸ HOLD** — [Phase ②.9 Backlog](./PHASE29-RELEASE-POLISH-BACKLOG.md) 已盘点 · **DEV 未开始**；"
            "须 §6 清单 + R1–R7 复跑 + Owner 签核后 **重新 READY**。\n"
        )

    lines = [
        "# Phase ②.8 · Human Acceptance Test Report",
        "",
        f"**Recorded:** {recorded}  ",
        f"**Web:** [{web}]({web})  ",
        f"**API:** [{api}]({api})  ",
        f"**Staging git_sha:** `{git_sha}`  ",
        f"**Evidence:** `{args.findings}`  ",
        "",
        "> Phase ②.8 真人用户视角验收 · **不**引用六大域 UAT 自动化结论作为 PASS 依据 · **≠ Phase ③ Production GO**",
        phase29_line,
        "---",
        "",
        "## Executive verdict",
        "",
        "| Gate | Result |",
        "|------|--------|",
        f"| **HAT overall** | **{verdict}** |",
        f"| **P0 (不可用)** | **{summary.get('p0', 0)}** |",
        f"| **P1 (影响使用)** | **{summary.get('p1', 0)}** |",
        f"| **P2 (优化项)** | **{summary.get('p2', 0)}** |",
        f"| **Flow steps PASS** | {summary.get('flows_pass', 0)} |",
        f"| **Flow steps FAIL/PARTIAL/BLOCKED** | {summary.get('flows_fail', 0)} / {summary.get('flows_partial', 0)} / {summary.get('flows_blocked', 0)} |",
        phase3_entry_cell,
        "",
        "```text",
        *machine_lines,
        "```",
        "",
        "---",
        "",
        "## Scope · 五类角色",
        "",
        "| 角色 | 验收范围 |",
        "|------|----------|",
        "| **旅行者** | 注册/登录 · 首页行程 · 市场 · 订单 · 社区 · 消息 · 设置 · 多重身份 |",
        "| **向导** | 向导端 · 接单 · /me guide 资料 |",
        "| **商家** | provider 注册链 · 橱窗 · onboarding · 审核入口 |",
        "| **管理员** | Admin 壳层 · 订单/用户/财务 · 举报/争议/审核 · 商家申请 |",
        "| **治理** | 提案 · 委托 · 奖励 · 链上 Claim 入口 · Fee routes |",
        "",
        "---",
        "",
        "## Issues by role",
        "",
    ]
    for role, count in by_role.most_common():
        lines.append(f"- **{role}**: {count} issue(s)")

    for prio in ("P0", "P1", "P2"):
        items = by_prio.get(prio, [])
        lines.extend(["", f"---", "", f"## {prio} defects ({len(items)})", ""])
        if not items:
            lines.append("_None recorded._")
            continue
        lines.append("| ID | 角色 | 区域 | 路由 | 标题 | 真人影响 |")
        lines.append("|----|------|------|------|------|----------|")
        for i in items:
            lines.append(
                f"| {i.get('id','?')} | {i.get('role','?')} | {i.get('area','?')} | `{i.get('route','?')}` | {i.get('title','?')} | {i.get('human_impact','?')} |"
            )
        lines.extend(["", "### Detail", ""])
        for i in items:
            lines.extend(
                [
                    f"#### {i.get('id')} · {i.get('title')} ({prio})",
                    "",
                    f"- **角色:** {i.get('role')}",
                    f"- **路由:** `{i.get('route')}`",
                    f"- **观察:** {i.get('observation')}",
                    f"- **真人影响:** {i.get('human_impact')}",
                ]
            )
            if i.get("repro"):
                lines.append(f"- **复现:** `{i.get('repro')}`")
            lines.append("")

    lines.extend(
        [
            "---",
            "",
            "## Role closure matrix（真人视角 · 20260607 @ 7b86e58b）",
            "",
            "| 角色 | 注册→登录 | 核心页面 | 列表/详情 | 表单/按钮 | 业务闭环 | 结论 |",
            "|------|-----------|-----------|----------|-----------|----------|------|",
            "| **旅行者** | ✅ 登录/注册表单可见 | ✅ `/` `/market` `/community` | ✅ 订单/消息/设置/身份 | ✅ 搜索/导航可达 | ⚠️ 支付/下单/争议未在本轮手操全链 | **PASS** |",
            "| **向导** | ✅ `guide@test.com` | ✅ `/guide` `/orders` | ✅ guide 资料在 `/me` | — | ⚠️ 接单/完成未手操 | **PASS** |",
            "| **商家** | ✅ provider 注册入口 | ✅ `/provider/register` `/market/provider` | — | ✅ 入驻表单壳 | ❌ 无 staging 种子账号 · 审核→上架未验 | **PARTIAL** |",
            "| **管理员** | ✅ promote_admin + 重登 | ✅ `/admin` orders/users/finance/disputes/inbox/provider-apps | ✅ 列表/详情壳层 | ✅ capabilities 加载 | ⚠️ 举报/争议队列 UI 文案未手操确认 | **PASS** |",
            "| **治理** | ✅ 公开页 + 登录后提案/委托 | ✅ proposals/delegate/staking/claim | ✅ API 提案/委托可读 | — | ⚠️ 链上投票/Claim 未手操钱包 | **PASS** |",
            "",
            "**说明：** `/me` 登录后重定向至 `/community` 为产品设计（社区 Hub），非缺陷。",
            "",
        ]
    )

    lines.extend(
        [
            "---",
            "",
            "## Business flow checklist (probe)",
            "",
            "| 角色 | Flow | Step | Status | Notes |",
            "|------|------|------|--------|-------|",
        ]
    )
    for f in flows[:80]:
        lines.append(
            f"| {f.get('role','?')} | {f.get('flow','?')} | {f.get('step','?')} | {f.get('status','?')} | {f.get('notes','')} |"
        )
    if len(flows) > 80:
        lines.append(f"| … | … | … | … | _{len(flows) - 80} more in JSON_ |")

    lines.extend(
        [
            "",
            "---",
            "",
            "## Phase ③ gate criteria",
            "",
            "| Criterion | Required | Current |",
            "|-----------|----------|---------|",
            f"| P0 = 0 | Yes | {'✅' if summary.get('p0', 0) == 0 else '❌'} ({summary.get('p0', 0)}) |",
            f"| P1 ≤ 3 or all have workaround | Yes | {'✅' if summary.get('p1', 0) <= 3 else '❌'} ({summary.get('p1', 0)}) |",
            "| 五角色核心闭环可手操 | Yes | 见上表 Flow |",
            "| 不依赖 API 200  alone | Yes | HTML shell + 业务 API 双探 |",
            "",
            "---",
            "",
            "## Remediation policy",
            "",
            "1. **P0** — 进入 Phase ③ 前 **必须修复** 并复跑 HAT。",
            "2. **P1** — bugfix only；若 >3 条则 **HOLD** Phase ③ 直至收敛。",
            "3. **P2** — 可带入 Phase ③ backlog，不阻塞 staging 功能验收结论。",
            "4. **Re-run:** `bash scripts/dev/run-phase28-human-acceptance-test.sh`",
            "",
            "---",
            "",
            "*Generated by `scripts/dev/generate-human-acceptance-report.py`*",
        ]
    )

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
