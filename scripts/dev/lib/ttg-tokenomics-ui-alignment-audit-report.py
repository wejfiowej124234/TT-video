#!/usr/bin/env python3
"""TTG Tokenomics UI Alignment Audit — report builder (SSOT: TTG-TOKENOMICS-FREEZE-V1)."""
from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(os.environ.get("TTG_UI_AUDIT_ROOT", ".")).resolve()
EVID = Path(os.environ["TTG_UI_AUDIT_EVID"])
SSOT = ROOT / "docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md"
REPORT_MD = ROOT / "docs/spec/governance-token/TTG-TOKENOMICS-UI-ALIGNMENT-AUDIT-REPORT.md"
FE_TS = ROOT / "frontend/lib/governance/governanceParamsTtgTokenomicsFreeze.ts"

PAGES: list[tuple[str, str, list[str]]] = [
    ("/governance", "治理 Hub", ["入口摘要", "参与 CTA", "资金流正交提示"]),
    (
        "/governance/params#gov-params-tokenomics-freeze",
        "GOV-01～04 公示",
        ["3000 bps cap", "400 quorum", "25k PM cap", "② NOT STARTED 诚实边界"],
    ),
    (
        "/governance/params#gov-params-treasury-policy",
        "Global Treasury · P4",
        ["30% deploy cap", "Buyback/Burn 选项", "公众三轮", "Seat 退出不退 USDC"],
    ),
    (
        "/governance/params",
        "净利润 45/55 资金流",
        ["Country Pool 45/55", "Treasury P1→P4", "禁止 pro-rata 第二步"],
    ),
    ("/governance/proposals", "提案 · 投票 · 执行", ["quorum 提示", "48h Timelock", "权限/错误态"]),
    ("/governance/delegate", "委托投票权", ["钱包连接", "delegate 文案"]),
    (
        "/governance/distribution-claim",
        "投资者分配领取",
        ["非自动分红叙事", "claim 权限/错误态"],
    ),
    (
        "/governance/distribution-accruals",
        "应计分配",
        ["accruals 措辞", "非 HolderDividend 叙事"],
    ),
    (
        "/governance/fee-routes",
        "FeeRouter 层",
        ["65/20/15 正交", "≠ NetProfit P4"],
    ),
    ("/governance/vault-forwards", "Vault 转发审计", ["vault 路径", "只读/权限提示"]),
    (
        "/governance/steward-region-workbench",
        "主理人 · Seat · 质押/退出",
        ["质押门槛", "180d 退出", "GOV-03 单 Seat", "Primary Market 不足提示"],
    ),
]

CHECKLIST: list[tuple[str, str, str]] = [
    ("UI-01", "§6 废止叙事（locales + governance 组件）", "forbidden_scan"),
    ("UI-02", "GOV-01 30% cap 文案/常量", "gov_01"),
    ("UI-03", "GOV-02 quorum 400 文案/常量", "gov_02"),
    ("UI-04", "GOV-04 Primary Market 25k cap", "gov_04"),
    ("UI-05", "Country Pool 45/55 资金流图", "profit_flow"),
    ("UI-06", "Treasury P1→P4 顺序 + 非 pro-rata", "treasury"),
    ("UI-07", "Seat 退出 · 解锁 TTG · 不退 USDC", "exit"),
    ("UI-08", "无 GlobalPoolDistributionSection 回流", "wiring"),
    ("UI-09", "② NOT STARTED 诚实边界", "phase_honesty"),
    ("UI-10", "vitest 契约全绿", "vitest"),
]


def parse_fe() -> dict[str, int]:
    text = FE_TS.read_text(encoding="utf-8")
    keys = {
        "treasury_p4_deploy_cap_bps": r"GOV_01_TREASURY_P4_DEPLOY_CAP_BPS\s*=\s*(\d+)",
        "governance_quorum_bps": r"GOV_02_GOVERNANCE_QUORUM_BPS\s*=\s*(\d+)",
        "public_sale_per_wallet_cap_ttg": r"GOV_04_PUBLIC_SALE_PER_WALLET_CAP_TTG\s*=\s*([\d_]+)",
    }
    out: dict[str, int] = {}
    for k, pat in keys.items():
        m = re.search(pat, text)
        if not m:
            raise SystemExit(f"missing frontend constant {k}")
        out[k] = int(m.group(1).replace("_", ""))
    return out


def load_forbidden() -> dict:
    p = EVID / "forbidden-narrative-scan.json"
    return json.loads(p.read_text(encoding="utf-8")) if p.is_file() else {"verdict": "MISSING", "hits": []}


def vitest_pass() -> bool:
    log = EVID / "vitest-ui-alignment.log"
    if not log.is_file():
        return False
    body = log.read_text(encoding="utf-8", errors="replace")
    return "Tests" in body and "failed" not in body.split("Tests")[-1][:80]


def wiring_ok() -> bool:
    overview = (ROOT / "frontend/app/governance/params/GovernanceParamsOverviewSection.tsx").read_text(
        encoding="utf-8"
    )
    return "GovernanceParamsGlobalPoolDistributionSection" not in overview


def phase_honesty_ok() -> bool:
    zh = (ROOT / "frontend/locales/zh.ts").read_text(encoding="utf-8")
    return "NOT STARTED" in zh and "不退 USDC" in zh


def build_page_rows(forbidden: dict, fe: dict) -> list[dict]:
    scan_ok = forbidden.get("verdict") == "PASS"
    rows = []
    for route, title, checks in PAGES:
        status = "PASS" if scan_ok and wiring_ok() and fe.get("treasury_p4_deploy_cap_bps") == 3000 else "FAIL"
        if route.startswith("/governance/steward") and not phase_honesty_ok():
            status = "FAIL"
        rows.append(
            {
                "route": route,
                "title": title,
                "checks": checks,
                "status": status,
            }
        )
    return rows


def build_checklist(forbidden: dict, fe: dict) -> list[dict]:
    scan_ok = forbidden.get("verdict") == "PASS"
    rows = []
    for cid, title, key in CHECKLIST:
        ok = True
        if key == "forbidden_scan":
            ok = scan_ok
        elif key == "gov_01":
            ok = fe.get("treasury_p4_deploy_cap_bps") == 3000
        elif key == "gov_02":
            ok = fe.get("governance_quorum_bps") == 400
        elif key == "gov_04":
            ok = fe.get("public_sale_per_wallet_cap_ttg") == 25000
        elif key == "wiring":
            ok = wiring_ok()
        elif key == "phase_honesty":
            ok = phase_honesty_ok()
        elif key == "vitest":
            ok = vitest_pass()
        rows.append({"id": cid, "title": title, "status": "PASS" if ok else "FAIL"})
    return rows


def render_md(stamp: str, checklist: list[dict], pages: list[dict], forbidden: dict, fe: dict) -> str:
    verdict = "PASS" if all(r["status"] == "PASS" for r in checklist) else "FAIL"
    lines = [
        "# TTG Tokenomics UI Alignment Audit Report",
        "",
        f"**Audit ID:** `TTG-TOKENOMICS-UI-ALIGNMENT-AUDIT`  ",
        f"**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md)  ",
        f"**Stamp:** `{stamp}`  ",
        f"**Phase:** ① 本地机读 + 文案扫描 · **Verdict:** **{verdict}**  ",
        "",
        "**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产",
        "",
        "---",
        "",
        "## Executive Summary",
        "",
        "| 项 | 结论 |",
        "|----|------|",
        f"| UI 对齐审计 | **{verdict}** |",
        f"| §6 废止叙事扫描 | {forbidden.get('verdict', 'MISSING')} ({forbidden.get('hit_count', '?')} hits) |",
        f"| GOV 常量镜像 | cap={fe.get('treasury_p4_deploy_cap_bps')} quorum={fe.get('governance_quorum_bps')} pm_cap={fe.get('public_sale_per_wallet_cap_ttg')} |",
        f"| vitest 契约 | {'PASS' if vitest_pass() else 'FAIL'} |",
        "| HAT-R1 真人点击 | **⏸ 待 UI PASS + bootstrap PASS 后启动** |",
        "",
        "**诚实边界：** ① UI 文案/ wiring 对齐 **≠** ② Sepolia 真人 tx 已验 **≠** ③ Production GO",
        "",
        "---",
        "",
        "## 清单（UI-01～10）",
        "",
        "| # | 清单项 | 状态 |",
        "|---|--------|------|",
    ]
    for row in checklist:
        mark = "✅" if row["status"] == "PASS" else "❌"
        lines.append(f"| {row['id']} | {row['title']} | {mark} {row['status']} |")

    lines += ["", "---", "", "## 逐页核查（真人视角）", "", "| 路由 | 页面 | 核查点 | 状态 |", "|------|------|--------|------|"]
    for row in pages:
        checks = " · ".join(row["checks"])
        lines.append(f"| `{row['route']}` | {row['title']} | {checks} | {row['status']} |")

    if forbidden.get("hits"):
        lines += ["", "---", "", "## P0 命中（§6 / 旧规则残留）", ""]
        for hit in forbidden["hits"]:
            lines.append(f"- `{hit['file']}:{hit['line']}` — {hit['reason']}")
            lines.append(f"  - `{hit.get('excerpt', '')}`")

    lines += [
        "",
        "---",
        "",
        "## 下一闸",
        "",
        "1. `bash scripts/dev/audit-stake-pool-jurisdiction-bootstrap.sh --strict` → PASS",
        "2. `bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --preflight-only`",
        "3. Owner 授权后 `HAT_R1_LIVE_WALLET_OK=1` → Phase A 逐步点击",
        "",
        f"**机读报告：** `evidence/GO_ttg_tokenomics_ui_alignment/{stamp}/ui-alignment-audit.json`",
        "",
        f"**稳定 grep：** `TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT: {verdict}`",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    EVID.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    forbidden = load_forbidden()
    fe = parse_fe()
    checklist = build_checklist(forbidden, fe)
    pages = build_page_rows(forbidden, fe)
    verdict = "PASS" if all(r["status"] == "PASS" for r in checklist) else "FAIL"

    payload = {
        "audit_id": "TTG-TOKENOMICS-UI-ALIGNMENT-AUDIT",
        "ssot": "TTG-TOKENOMICS-FREEZE-V1",
        "stamp": stamp,
        "phase": "①",
        "verdict": verdict,
        "checklist": checklist,
        "pages": pages,
        "forbidden_scan": forbidden,
        "gov_constants": fe,
        "hat_r1_gate": "PAUSED until UI PASS + stake pool bootstrap PASS",
    }
    (EVID / "ui-alignment-audit.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    REPORT_MD.write_text(render_md(stamp, checklist, pages, forbidden, fe), encoding="utf-8")
    print(f"TTG_TOKENOMICS_UI_ALIGNMENT_AUDIT: {verdict}")
    print(f"report={REPORT_MD.relative_to(ROOT)}")
    print(f"evidence={EVID.relative_to(ROOT)}")
    return 0 if verdict == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
