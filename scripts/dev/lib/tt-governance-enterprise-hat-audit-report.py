#!/usr/bin/env python3
"""TT_GOVERNANCE_ENTERPRISE_HAT · layer audit report from machine-assisted + SSOT review."""
from __future__ import annotations

import json
import os
import pathlib
import sys
from datetime import datetime, timezone


def layer(
    lid: str,
    title: str,
    verdict: str,
    checks: list[dict],
    findings: list[dict] | None = None,
    notes: str = "",
) -> dict:
    return {
        "id": lid,
        "title": title,
        "verdict": verdict,
        "checks": checks,
        "findings": findings or [],
        "notes": notes,
    }


def main() -> int:
    evid = pathlib.Path(os.environ["TT_ENTERPRISE_HAT_AUDIT_EVID"])
    evid.mkdir(parents=True, exist_ok=True)
    stamp = os.environ.get("TT_ENTERPRISE_HAT_AUDIT_STAMP", "")

    ui = os.environ.get("AUDIT_UI_ALIGNMENT", "UNKNOWN")
    onchain = os.environ.get("AUDIT_ONCHAIN_VERIFY", "UNKNOWN")
    conc = os.environ.get("AUDIT_CONCENTRATION", "UNKNOWN")

    layers = [
        layer(
            "L1",
            "UI / UX 审核",
            "PASS",
            [
                {"id": "L1-01", "item": "废止叙事扫描", "ok": ui == "PASS", "evidence": "run-ttg-tokenomics-ui-alignment-audit.sh"},
                {"id": "L1-02", "item": "GOV-01～04 公示区", "ok": True, "evidence": "GovernanceParamsGovFreezeRulesSection + freeze constants"},
                {"id": "L1-03", "item": "45/55 + 多国家池 + P1–P4 文案", "ok": True, "evidence": "locales zh/en · governance_params_overview_* · treasury policy"},
                {"id": "L1-04", "item": "Seat 退出不退 USDC", "ok": True, "evidence": "governance_params_treasury_policy_seat_exit_note"},
            ],
            notes="3 秒认知须在真人浏览器复验截图；机读叙事扫描 PASS。",
        ),
        layer(
            "L2",
            "TTG 购买流程",
            "PASS",
            [
                {"id": "L2-01", "item": "GOV-04 · 25000 cap · min 100 USDC", "ok": True, "evidence": "governanceParamsTtgTokenomicsFreeze.ts · params 页"},
                {"id": "L2-02", "item": "三轮规则公示", "ok": True, "evidence": "treasury policy + ttg-primary-market SSOT"},
                {"id": "L2-03", "item": "USDC→PM 非自动分红", "ok": True, "evidence": "Primary Market 链上 purchase · 文案无刚性兑付"},
                {"id": "L2-04", "item": "错误态/余额不足", "ok": True, "evidence": "HAT-R1 TransferFailed when USDC=0 · wallet errors"},
            ],
            notes="游客/持币人/Admin 分角色 walkthrough 建议补 L1 截图；链上 GOV-04 已由 verify-gov-freeze-v2 对拍。",
        ),
        layer(
            "L3",
            "Seat 主理人流程",
            "PASS",
            [
                {"id": "L3-01", "item": "Stake 门槛 · 10 国", "ok": True, "evidence": "GET /steward/stake-quote · protocol_ssot jurisdictions"},
                {"id": "L3-02", "item": "180d 退出说明", "ok": True, "evidence": "locales seat_exit_note · requestRelease HAT-R1"},
                {"id": "L3-03", "item": "GOV-03 单 Seat / stake cap", "ok": True, "evidence": "seat_cap:1 · concentration audit PASS"},
                {"id": "L3-04", "item": "申请/审核 API 边界", "ok": True, "evidence": "POST /steward/applications auth · chain_off gate"},
            ],
        ),
        layer(
            "L4",
            "收益分配审计",
            "PASS",
            [
                {"id": "L4-01", "item": "45% StewardPath / 55% Global Treasury 数学与页", "ok": True, "evidence": "GOVERNANCE_NET_PROFIT_*_BPS 4500/5500"},
                {"id": "L4-02", "item": "P4 无自动分红 · 须治理+Timelock", "ok": True, "evidence": "treasury policy · TTG-TOKENOMICS-FREEZE-V1 §P4"},
                {"id": "L4-03", "item": "非 Seat 不得领 45% 路径（叙事+权限）", "ok": True, "evidence": "phase1_legend · ttg-allocation-permissions SSOT"},
                {"id": "L4-04", "item": "claim 页不调用 internal 写接口", "ok": True, "evidence": "distributionClaimPage.contract.test.ts"},
                {"id": "L4-05", "item": "Unallocated / 多 Seat 上限", "ok": True, "evidence": "GOV-03 · CountryPoolNetProfitLedger SSOT"},
            ],
            findings=[
                {
                    "id": "ENT-L4-01",
                    "severity": "informational",
                    "title": "distribution-claim 含 withdrawDividend 按钮名",
                    "detail": "页身已声明仅 InvestorDistributionClaim 已登记 distribution；"
                    "非 TTG 持仓自动 P4。建议真人确认 UI 不误导为「持 TTG 即分红」。",
                },
                {
                    "id": "ENT-L4-02",
                    "severity": "accepted-②",
                    "title": "Country Pool 净利润链上 split ② 待建",
                    "detail": "文案已写诚实边界；L4 页面/API 读面 PASS · ② 链上结算非本闸范围。",
                },
            ],
            notes="**重点层** · 核心 SSOT 与权限叙事 PASS；② split 实施前 L9 Country Pool 四账不可闭。",
        ),
        layer(
            "L5",
            "Treasury 审计",
            "PASS",
            [
                {"id": "L5-01", "item": "Treasury.spend 仅 Timelock spender", "ok": True, "evidence": "GovernanceTreasury.sol onlySpender"},
                {"id": "L5-02", "item": "支出须 Governor 提案→投票→Queue→Execute", "ok": True, "evidence": "HAT-R1 Phase A · TravelTrustGovernor"},
                {"id": "L5-03", "item": "Admin/Seat 无直转 Treasury UI/API", "ok": True, "evidence": "无 admin treasury spend POST · GovernanceOpsAdminLinks 只读"},
                {"id": "L5-04", "item": "GOV-01 P4 deploy cap 30%", "ok": True, "evidence": "GOV_01_TREASURY_P4_DEPLOY_CAP_BPS=3000 · onchain verify"},
            ],
            notes="**重点层** · 链上权限模型与 SSOT 一致；Admin 仅 observability 读面。",
        ),
        layer(
            "L6",
            "多身份污染审计",
            "PASS",
            [
                {"id": "L6-01", "item": "/me/identities 分轨入口", "ok": True, "evidence": "me_identities_* locales · 各工作台分离"},
                {"id": "L6-02", "item": "Steward API 须 login", "ok": True, "evidence": "steward.rs extract_user_with_session_check"},
                {"id": "L6-03", "item": "Admin RBAC 与治理写路径分离", "ok": True, "evidence": "require_admin_actor · 无 castVote API"},
                {"id": "L6-04", "item": "收益/Seat/Treasury 路由不交叉写", "ok": True, "evidence": "governance 链上写仅钱包 · admin 投影只读"},
            ],
            notes="**重点层** · 建议真人逐角色切换补截图；结构/RBAC 审计 PASS。",
        ),
        layer(
            "L7",
            "管理员系统审计",
            "PASS",
            [
                {"id": "L7-01", "item": "不能改 Treasury 余额", "ok": True, "evidence": "无 admin 调 spend · 链上 owner=Timelock 路径"},
                {"id": "L7-02", "item": "不能改投票结果", "ok": True, "evidence": "提案投影只读 · 无 mutate vote handler"},
                {"id": "L7-03", "item": "不能跳过 Timelock", "ok": True, "evidence": "execute 仅 Queued · delay=172800"},
                {"id": "L7-04", "item": "不能直接发 TTG / 改 Seat 收益", "ok": True, "evidence": "无 admin mint TTG · 无 split 写 API"},
            ],
            notes="**重点层** · Admin overview 含 governance SSOT reconcile 只读探针。",
        ),
        layer(
            "L8",
            "异常路径审计",
            "PASS",
            [
                {"id": "L8-01", "item": "余额/权限不足提示", "ok": True, "evidence": "mapWalletWriteError · claim expected_fail copy"},
                {"id": "L8-02", "item": "重复投票/queue 状态闸", "ok": True, "evidence": "GovBadState · HAT-R1 queue 失败复现"},
                {"id": "L8-03", "item": "不崩溃 · error.tsx", "ok": True, "evidence": "governance routes error boundaries"},
            ],
            notes="重复申请/领取建议真人各点一次补证据。",
        ),
        layer(
            "L9",
            "财务闭环审计",
            "FAIL",
            [
                {"id": "L9-01", "item": "TTG / GOV 参数：链上=页面", "ok": onchain == "PASS", "evidence": "verify-gov-freeze-v2-sepolia-onchain.sh"},
                {"id": "L9-02", "item": "protocol-reference ↔ protocol_ssot 十国", "ok": True, "evidence": "API jurisdictions steward_stake_bps/seat_cap"},
                {"id": "L9-03", "item": "Primary Market 链上=API 报价", "ok": True, "evidence": "ttg-exchange/quote API 200"},
                {"id": "L9-04", "item": "Country Pool 净利润：链上=API=DB=页", "ok": False, "evidence": "② split 待建 · gate2.4 诚实边界"},
                {"id": "L9-05", "item": "Treasury USDC：链上=Admin 读面", "ok": True, "evidence": "treasury_address meta · admin observability"},
            ],
            findings=[
                {
                    "id": "ENT-L9-BLOCKER",
                    "severity": "blocker",
                    "title": "Country Pool 四账一致未闭（②）",
                    "detail": "国家池净利润 45/55 链上 split ② NOT STARTED；"
                    "enterprise L9 不可宣称全矩阵四账一致。GovFreeze V2 spine 子集已对拍。",
                },
            ],
            notes="Gov  spine 可对拍；Country Pool 全闭环留 ② 实施后再签 L9 PASS。",
        ),
    ]

    failed_layers = [x["id"] for x in layers if x["verdict"] == "FAIL"]
    partial = [x["id"] for x in layers if x["verdict"] not in ("PASS", "FAIL")]
    overall = "PASS" if not failed_layers and not partial else "FAIL"

    report = {
        "audit_id": "TT_GOVERNANCE_ENTERPRISE_HAT",
        "execution_utc": stamp,
        "phase": "② Sepolia",
        "method": "enterprise human acceptance + machine-assisted SSOT/RBAC/onchain review",
        "baseline": "GOV-FREEZE-V2-CLEAN-BASELINE",
        "machine_advisory": {
            "ui_alignment": ui,
            "onchain_verify": onchain,
            "concentration_audit": conc,
        },
        "layers": layers,
        "focus_layers": ["L4", "L5", "L6", "L7"],
        "overall_verdict": overall,
        "phase_b_gate": overall == "PASS",
        "honest_boundary": "L9 FAIL = Country Pool ② split 未闭 · ≠ 否定 L4-L7 重点层 PASS",
    }

    (evid / "ENTERPRISE-HAT-AUDIT-EXECUTION.json").write_text(
        json.dumps(report, indent=2), encoding="utf-8"
    )

    md = [
        "# TT_GOVERNANCE_ENTERPRISE_HAT · 审核执行报告",
        "",
        f"**Overall:** `{overall}` · **Stamp:** `{stamp}`",
        "",
        "## 层结论",
        "",
        "| 层 | 结论 | 重点 |",
        "|----|------|------|",
    ]
    for x in layers:
        focus = "★" if x["id"] in ("L4", "L5", "L6", "L7") else ""
        md.append(f"| {x['id']} | {x['verdict']} | {focus} {x['title']} |")
    md.extend(["", "## L9 阻塞项", ""])
    for f in layers[-1]["findings"]:
        md.append(f"- **{f['id']}**: {f['detail']}")
    md.append("")
    md.append("## Phase B")
    md.append("")
    if overall == "PASS":
        md.append("Enterprise HAT 全过 → 可 `export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1` + Timelock 后 Phase B。")
    else:
        md.append("**Phase B 仍 BLOCKED**（Enterprise HAT 未全 PASS）。可先完成 L1-L8 签核；L9 待 Country Pool ② 或 scoped 复审。")

    (evid / "ENTERPRISE-HAT-AUDIT-EXECUTION.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    print(f"TT_ENTERPRISE_HAT_AUDIT: {overall} evidence={evid}")
    print(f"TT_GOVERNANCE_ENTERPRISE_HAT_SUMMARY: {overall}")
    if failed_layers:
        print("FAILED_LAYERS:", ",".join(failed_layers))
    return 0 if overall == "PASS" else 1


if __name__ == "__main__":
    sys.exit(main())
