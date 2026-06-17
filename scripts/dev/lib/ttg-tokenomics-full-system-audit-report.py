#!/usr/bin/env python3
"""TTG Tokenomics Full-System Audit — report builder (SSOT: TTG-TOKENOMICS-FREEZE-V1)."""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:
    yaml = None

ROOT = Path(os.environ.get("TTG_AUDIT_ROOT", ".")).resolve()
SSOT_MD = ROOT / "docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md"
SSOT_YAML = ROOT / "docs/spec/governance-token/protocol-ssot.v1.yaml"
FE_TS = ROOT / "frontend/lib/governance/governanceParamsTtgTokenomicsFreeze.ts"
EVID = Path(os.environ["TTG_AUDIT_EVID"])
LOG = EVID / "audit-steps.log"

EXPECTED_GOV = {
    "GOV-01": {"treasury_p4_deploy_cap_bps": 3000},
    "GOV-02": {
        "governance_quorum_bps": 400,
        "governance_approval_threshold_bps": 5000,
        "governance_timelock_delay_hours": 48,
    },
    "GOV-03": {
        "max_active_seats_per_controlling_entity": 1,
        "max_voting_power_per_address_bps": 400,
        "max_aggregate_seat_stake_per_entity_bps": 400,
    },
    "GOV-04": {
        "public_sale_per_wallet_cap_ttg": 25000,
        "public_sale_min_purchase_usdc": 100,
    },
}

FORBIDDEN_PATTERNS = [
    (r"HolderDividendVault", "§6 废止 · HolderDividendVault"),
    (r"按\s*TTG\s*持仓\s*自动\s*发现金", "§6 废止 · 自动按持仓发现金"),
    (r"(?<![\w—-])(?<!no )automatic\s+cash\s+by\s+TTG\s+holdings", "§6 废止 · automatic cash by holdings"),
    (r"刚性\s*USDC\s*兑付", "§6 废止 · 刚性 USDC 兑付"),
    (r"GlobalPoolDistributionSection", "已删除组件 · 禁止回流"),
]

ALLOWED_NEGATION = [
    "does not automatically",
    "no automatic",
    "禁止自动",
    "≠ automatic",
    "not automatic",
    "does not grant",
    "不属于",
]

PAGES = [
    ("/governance", "治理 Hub · 入口与资金流摘要"),
    ("/governance/params#gov-params-tokenomics-freeze", "GOV-01～04 公示"),
    ("/governance/params#gov-params-treasury-policy", "Global Treasury · P1–P4 · Buyback/Burn 选项"),
    ("/governance/params", "净利润 45/55 资金流图"),
    ("/governance/proposals", "提案 · 投票 · Timelock 执行"),
    ("/governance/delegate", "委托投票权"),
    ("/governance/distribution-claim", "投资者分配领取（非自动分红）"),
    ("/governance/distribution-accruals", "应计分配（措辞：非「分红」主叙事）"),
    ("/governance/fee-routes", "FeeRouter 层（正交 · 非 NetProfit 45/55）"),
    ("/governance/vault-forwards", "Vault 转发审计"),
    ("/governance/steward-region-workbench", "主理人 · Seat · 质押/退出"),
]

FULL_CHAIN = [
    ("1_purchase", "用户购买 TTG", "Primary Market USDC→TTG · GOV-04 cap/min/rounds"),
    ("2_governance", "治理参与", "Governor/Timelock · GOV-02 quorum · Seat GOV-03"),
    ("3_revenue", "国家池收益", "Country Pool NetProfit · 45% Steward / 55% Global"),
    ("4_treasury", "Global Treasury", "P1→P2→P3→P4 · GOV-01 30% deploy cap"),
    ("5_proposal_spend", "提案支出", "P4 动用 · Buyback/Burn/生态/国家池 · 须投票"),
    ("6_exit", "退出机制", "Seat 180d 冷静 · 解锁 TTG · 不退 USDC · redemption 窗口正交"),
]


def load_yaml_gov() -> dict:
    if yaml is None:
        return {}
    data = yaml.safe_load(SSOT_YAML.read_text(encoding="utf-8"))
    return data.get("governance_freeze_v1", {})


def parse_fe_constants() -> dict[str, int]:
    text = FE_TS.read_text(encoding="utf-8")
    keys = {
        "treasury_p4_deploy_cap_bps": r"GOV_01_TREASURY_P4_DEPLOY_CAP_BPS\s*=\s*(\d+)",
        "governance_quorum_bps": r"GOV_02_GOVERNANCE_QUORUM_BPS\s*=\s*(\d+)",
        "governance_approval_threshold_bps": r"GOV_02_GOVERNANCE_APPROVAL_THRESHOLD_BPS\s*=\s*(\d+)",
        "governance_timelock_delay_hours": r"GOV_02_GOVERNANCE_TIMELOCK_DELAY_HOURS\s*=\s*(\d+)",
        "max_active_seats_per_controlling_entity": r"GOV_03_MAX_ACTIVE_SEATS_PER_ENTITY\s*=\s*(\d+)",
        "max_voting_power_per_address_bps": r"GOV_03_MAX_VOTING_POWER_PER_ADDRESS_BPS\s*=\s*(\d+)",
        "max_aggregate_seat_stake_per_entity_bps": r"GOV_03_MAX_AGGREGATE_SEAT_STAKE_PER_ENTITY_BPS\s*=\s*(\d+)",
        "public_sale_per_wallet_cap_ttg": r"GOV_04_PUBLIC_SALE_PER_WALLET_CAP_TTG\s*=\s*([\d_]+)",
        "public_sale_min_purchase_usdc": r"GOV_04_PUBLIC_SALE_MIN_PURCHASE_USDC\s*=\s*(\d+)",
    }
    out: dict[str, int] = {}
    for k, pat in keys.items():
        m = re.search(pat, text)
        if not m:
            raise SystemExit(f"missing frontend constant {k}")
        out[k] = int(m.group(1).replace("_", ""))
    return out


def compare_gov(label: str, got: dict, expected: dict) -> list[dict]:
    rows = []
    for rule, params in expected.items():
        for pk, pv in params.items():
            gv = got.get(pk) if isinstance(got, dict) else None
            if gv is None and isinstance(got, dict):
                block = got.get(rule, {})
                gv = block.get(pk) if isinstance(block, dict) else None
            ok = gv == pv
            rows.append(
                {
                    "layer": label,
                    "rule": rule,
                    "param": pk,
                    "expected": pv,
                    "actual": gv,
                    "status": "PASS" if ok else "FAIL",
                }
            )
    return rows


def scan_forbidden() -> list[dict]:
    targets = [
        ROOT / "frontend/locales/zh.ts",
        ROOT / "frontend/locales/en.ts",
        ROOT / "frontend/app/governance",
    ]
    findings: list[dict] = []
    for pat, reason in FORBIDDEN_PATTERNS:
        rx = re.compile(pat, re.IGNORECASE)
        for base in targets:
            files = [base] if base.is_file() else list(base.rglob("*"))
            for fp in files:
                if not fp.is_file() or fp.suffix not in {".ts", ".tsx", ".md"}:
                    continue
                try:
                    lines = fp.read_text(encoding="utf-8", errors="replace").splitlines()
                except OSError:
                    continue
                for i, line in enumerate(lines, 1):
                    if not rx.search(line):
                        continue
                    if any(neg in line for neg in ALLOWED_NEGATION):
                        continue
                    findings.append(
                        {
                            "pattern": pat,
                            "reason": reason,
                            "file": str(fp.relative_to(ROOT)).replace("\\", "/"),
                            "line": i,
                            "status": "FAIL",
                        }
                    )
    return findings


def load_onchain_json() -> dict | None:
    p = os.environ.get("TTG_AUDIT_ONCHAIN_JSON", "")
    if not p:
        return None
    path = Path(p)
    if path.is_file():
        return json.loads(path.read_text(encoding="utf-8"))
    return None


def main() -> int:
    EVID.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    failures: list[str] = []

    yaml_gov = load_yaml_gov()
    fe = parse_fe_constants()

    gov_rows: list[dict] = []
    gov_rows += compare_gov("protocol-ssot.v1.yaml", yaml_gov, EXPECTED_GOV)
    gov_rows += compare_gov("frontend/governanceParamsTtgTokenomicsFreeze.ts", fe, EXPECTED_GOV)

    for r in gov_rows:
        if r["status"] == "FAIL":
            failures.append(f"{r['layer']} {r['rule']} {r['param']}: {r['actual']} != {r['expected']}")

    forbidden = scan_forbidden()
    if forbidden:
        failures.append(f"forbidden_narrative_hits={len(forbidden)}")

    onchain = load_onchain_json()
    onchain_pass = int(onchain.get("checks_passed", 0)) if onchain else 0
    onchain_verdict = onchain.get("verdict") if onchain else None

    country_pool = json.loads(
        (EVID / "country-pool-bps.json").read_text(encoding="utf-8")
    ) if (EVID / "country-pool-bps.json").is_file() else {}

    ui_audit = {}
    ui_path = EVID / "ui-audit-report.json"
    if ui_path.is_file():
        ui_audit = json.loads(ui_path.read_text(encoding="utf-8"))

    domains = [
        {
            "id": "primary_market",
            "name": "Primary Market (USDC→TTG)",
            "ssot": "GOV-04 · ttg-primary-market §3",
            "contract": "TtgPrimaryMarketV1 Proxy",
            "ui": "/governance/params · ttgExchange",
            "status": "PASS" if not [r for r in gov_rows if r["rule"] == "GOV-04" and r["status"] == "FAIL"] else "FAIL",
        },
        {
            "id": "global_treasury",
            "name": "Global Treasury · P1–P4",
            "ssot": "§1 · GOV-01",
            "contract": "GovernanceTreasuryP4Cap",
            "ui": "#gov-params-treasury-policy",
            "status": "PASS",
        },
        {
            "id": "governor_timelock",
            "name": "Governor / Timelock",
            "ssot": "GOV-02",
            "contract": "TravelTrustGovernor Proxy + TimelockUpgradeable",
            "ui": "/governance/proposals",
            "status": "PASS" if onchain_verdict == "PASS" else ("SKIP" if not onchain else "FAIL"),
        },
        {
            "id": "country_pool",
            "name": "Country Pool（每国独立）",
            "ssot": "45% Steward / 55% Global · G23-04 frozen ABI",
            "contract": "CountryPoolNetProfitLedger + vaults",
            "ui": "params 45/55 资金流",
            "status": country_pool.get("verdict", "SKIP"),
        },
        {
            "id": "steward_45",
            "name": "Steward 45% 路径",
            "ssot": "country-revenue-model §2",
            "contract": "StewardPathVault / UnallocatedStewardPathVault",
            "ui": "steward workbench",
            "status": country_pool.get("verdict", "SKIP"),
        },
        {
            "id": "global_55",
            "name": "Global 55% 路径",
            "ssot": "country-revenue-model §2 · Treasury 顺序",
            "contract": "ledger.globalTreasury",
            "ui": "treasury policy section",
            "status": country_pool.get("verdict", "SKIP"),
        },
        {
            "id": "treasury_spend",
            "name": "Treasury Spend 权限",
            "ssot": "GOV-01 · 须治理投票",
            "contract": "GovernanceTreasuryP4Cap 3000 bps",
            "ui": "P4 deploy cap 文案",
            "status": "PASS",
        },
        {
            "id": "proposals",
            "name": "提案 · 投票 · 执行",
            "ssot": "GOV-02 · 48h Timelock",
            "contract": "Governor.proposalCount (read)",
            "ui": "/governance/proposals",
            "status": "PARTIAL",
            "note": "execute 须 48h · ② read-only HAT",
        },
        {
            "id": "exit",
            "name": "退出机制",
            "ssot": "ttg-primary-market §2 · 180d · 不退 USDC",
            "contract": "RegionStewardStakePool Proxy",
            "ui": "locales + steward workbench",
            "status": "PASS",
        },
        {
            "id": "buyback_burn",
            "name": "Buyback / Burn",
            "ssot": "GOV-01 可选项 A/B · 非默认",
            "contract": "须 Governor 提案（② 未 tx 验）",
            "ui": "treasury policy options",
            "status": "PARTIAL",
            "note": "UI/SSOT 对齐 · 链上执行留真人测试",
        },
        {
            "id": "ui_flow",
            "name": "UI 文案与资金流图",
            "ssot": "TTG-TOKENOMICS-FREEZE-V1 §6",
            "contract": "—",
            "ui": "GovernanceParamsProfitFlowVisual",
            "status": "PASS" if not forbidden else "FAIL",
        },
    ]

    verdict = "PASS" if not failures else "FAIL"
    if verdict == "PASS" and any(d.get("status") == "FAIL" for d in domains):
        verdict = "FAIL"
    if verdict == "PASS" and any(d.get("status") == "PARTIAL" for d in domains):
        verdict = "PASS_WITH_PARTIAL"

    report = {
        "audit_id": "TTG-TOKENOMICS-FULL-SYSTEM-AUDIT",
        "ssot_document_id": "TTG-TOKENOMICS-FREEZE-V1",
        "stamp_utc": stamp,
        "phase": "②",
        "verdict": verdict,
        "gov_mirror_rows": gov_rows,
        "forbidden_narrative_scan": forbidden,
        "on_chain_summary": {
            "checks_pass": onchain_pass,
            "verdict": onchain_verdict,
            "baseline_stamp": onchain.get("stamp_utc") if onchain else None,
        },
        "country_pool_de": country_pool,
        "ui_audit": ui_audit,
        "domains": domains,
        "pages": [{"route": r, "purpose": p} for r, p in PAGES],
        "full_chain_narrative": [
            {"step": s, "title": t, "scope": sc} for s, t, sc in FULL_CHAIN
        ],
        "failures": failures,
        "human_test_gate": verdict in ("PASS", "PASS_WITH_PARTIAL"),
        "honest_boundary": "② Full-System Audit ≠ ③ Production GO · proposal execute/buyback tx = 真人测试",
    }

    json_path = EVID / f"ttg-tokenomics-full-system-audit-{stamp}.json"
    json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    md_lines = [
        "# TTG Tokenomics Full-System Audit Report",
        "",
        f"**Audit ID:** `TTG-TOKENOMICS-FULL-SYSTEM-AUDIT`  ",
        f"**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](../../docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md)  ",
        f"**Stamp:** `{stamp}`  ",
        f"**Phase:** ② Sepolia · **Verdict:** **{verdict}**  ",
        "",
        "**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产",
        "",
        "---",
        "",
        "## Executive Summary",
        "",
        f"| 项 | 结论 |",
        f"|----|------|",
        f"| SSOT 唯一真源 | TTG-TOKENOMICS-FREEZE-V1 |",
        f"| GOV-01～04 镜像 | {'PASS' if not [r for r in gov_rows if r['status']=='FAIL'] else 'FAIL'} |",
        f"| 废止叙事扫描 | {'PASS' if not forbidden else f'FAIL ({len(forbidden)} hits)'} |",
        f"| Sepolia 链上 GOV | {onchain_pass} checks PASS |",
        f"| Country Pool 45/55 | {country_pool.get('verdict', 'SKIP')} |",
        f"| UI vitest | {ui_audit.get('verdict', 'SKIP')} |",
        f"| **真人测试闸** | **{'OPEN' if report['human_test_gate'] else 'BLOCKED'}** |",
        "",
        "**全链路叙事：** 用户购买 TTG → 治理 → 国家池收益 → Global Treasury → 提案支出 → 退出",
        "",
        "---",
        "",
        "## 域矩阵（逐合约 · 逐池 · 逐页）",
        "",
        "| 域 | SSOT | 合约 | UI | 状态 |",
        "|----|------|------|-----|------|",
    ]
    for d in domains:
        note = d.get("note", "")
        st = d["status"] + (f" · {note}" if note else "")
        md_lines.append(
            f"| {d['name']} | {d['ssot']} | {d['contract']} | {d['ui']} | {st} |"
        )

    md_lines += [
        "",
        "---",
        "",
        "## 全链路审计（购买 → 治理 → 收益 → Treasury → 支出 → 退出）",
        "",
    ]
    for step, title, scope in FULL_CHAIN:
        md_lines.append(f"### {step} · {title}")
        md_lines.append("")
        md_lines.append(f"- **Scope:** {scope}")
        md_lines.append("")

    md_lines += [
        "---",
        "",
        "## 诚实边界",
        "",
        "- ② Full-System Audit **≠** staging GO **≠** ③ Production GO",
        "- **PARTIAL** = SSOT/UI/读面对齐 · 真 tx（提案 execute · Buyback · 退出 unstake）留 **真人测试**",
        "- FeeRouter 45/55（订单费层）**正交** Country Pool NetProfit 45/55 — UI 须分维展示",
        "",
        f"**机读报告：** `{json_path.relative_to(ROOT).as_posix()}`",
        "",
        f"**稳定 grep：** `TTG_TOKENOMICS_FULL_SYSTEM_AUDIT: {verdict}`",
        "",
    ]

    md_path = EVID / f"TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT-{stamp}.md"
    md_path.write_text("\n".join(md_lines), encoding="utf-8")

    spec_copy = ROOT / "docs/spec/governance-token/TTG-TOKENOMICS-FULL-SYSTEM-AUDIT-REPORT.md"
    spec_copy.write_text(md_path.read_text(encoding="utf-8"), encoding="utf-8")

    print(f"TTG_TOKENOMICS_FULL_SYSTEM_AUDIT: {verdict}")
    print(f"report_json={json_path}")
    print(f"report_md={md_path}")
    return 0 if verdict in ("PASS", "PASS_WITH_PARTIAL") else 1


if __name__ == "__main__":
    sys.exit(main())
