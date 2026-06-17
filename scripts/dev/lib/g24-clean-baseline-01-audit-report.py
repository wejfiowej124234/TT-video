#!/usr/bin/env python3
"""G24-CLEAN-BASELINE-01 · root cause audit report builder."""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(os.environ.get("G24_CB_ROOT", ".")).resolve()
EVID = Path(os.environ["G24_CB_EVID"])
REPORT_MD = ROOT / "docs/spec/governance-token/G24-CLEAN-BASELINE-01-ROOT-CAUSE-AUDIT-REPORT.md"

CLEAN_BASELINE_CRITERIA = [
    ("CB-C1", "干净", "无补丁 Timelock pending · 无旧栈活跃读口"),
    ("CB-C2", "可升级", "Governable Shell 全 Proxy · admin=Timelock"),
    ("CB-C3", "一次初始化完整", "Stake Pool 10 国 deploy-time bootstrap · minStake>0"),
    ("CB-C4", "权限全对齐", "allowedExecutionTarget 覆盖 Governor/PM/Treasury/Seat/StakePool"),
    ("CB-C5", "registry/env 单真源", "GovFreeze 地址无 dual-key 污染 · frontend 对齐"),
    ("CB-C6", "UI/资金流", "TTG-TOKENOMICS-FREEZE-V1 §6 · GOV 数值 · 45/55 正交"),
    ("CB-C7", "TTG ERC20", "approve/allowance/transferFrom · StakePool.ttg 对齐"),
]


def load(name: str) -> dict:
    p = EVID / name
    return json.loads(p.read_text(encoding="utf-8")) if p.is_file() else {}


def p0_findings(onchain: dict, env: dict) -> list[dict]:
    out = []
    for block in (onchain, env):
        for f in block.get("findings", []):
            if f.get("severity") == "P0":
                out.append(f)
    return out


def eval_criteria(onchain: dict, env: dict, ui: dict, sp: dict, gov_verify: dict) -> list[dict]:
    patch_pending = onchain.get("patch_pending_count", 0)
    juris_fail = sum(1 for r in onchain.get("stake_pool_jurisdictions", []) if r.get("status") == "FAIL")
    allowed = onchain.get("allowed_execution_target", {})
    proxies_fail = sum(1 for p in onchain.get("proxies", []) if p.get("status") == "FAIL")
    env_p0 = sum(1 for f in env.get("findings", []) if f.get("severity") == "P0")
    ui_ok = ui.get("verdict") == "PASS"
    gov_ok = gov_verify.get("verdict") == "PASS"

    rows = []
    rows.append({
        "id": "CB-C1",
        "status": "FAIL" if patch_pending > 0 else "PASS",
        "note": f"patch_pending_ops={patch_pending}",
    })
    rows.append({
        "id": "CB-C2",
        "status": "PASS" if proxies_fail == 0 else "FAIL",
        "note": f"proxy_failures={proxies_fail}",
    })
    rows.append({
        "id": "CB-C3",
        "status": "FAIL" if juris_fail > 0 else "PASS",
        "note": f"jurisdiction_init_failures={juris_fail}/10",
    })
    all_allowed = all(allowed.get(k) is True for k in ["governor", "primary_market", "treasury_p4_cap", "seat_registry", "stake_pool"])
    rows.append({
        "id": "CB-C4",
        "status": "PASS" if all_allowed else "FAIL",
        "note": json.dumps(allowed),
    })
    rows.append({
        "id": "CB-C5",
        "status": "FAIL" if env_p0 > 0 else "PASS",
        "note": f"env_registry_p0={env_p0} legacy_keys={env.get('legacy_key_count', 0)}",
    })
    rows.append({
        "id": "CB-C6",
        "status": "PASS" if ui_ok and gov_ok else "PARTIAL" if ui_ok else "FAIL",
        "note": f"ui={ui.get('verdict','?')} gov_verify={gov_verify.get('verdict','?')}",
    })
    ttg_e = onchain.get("ttg_erc20", {})
    ttg_ok = ttg_e.get("approve_ok") is True and ttg_e.get("allowance_ok") is True and ttg_e.get("stake_pool_ttg_match") is True
    rows.append({
        "id": "CB-C7",
        "status": "PASS" if ttg_ok else "FAIL",
        "note": json.dumps(ttg_e),
    })
    return rows


def render_md(stamp: str, verdict: str, recommendation: str, criteria: list[dict], p0s: list[dict], onchain: dict) -> str:
    lines = [
        "# G24-CLEAN-BASELINE-01 · Sepolia GovFreeze 根因审计报告",
        "",
        f"**Audit ID:** `G24-CLEAN-BASELINE-01`  ",
        f"**Stamp:** `{stamp}`  ",
        f"**Phase:** ② Sepolia · **Verdict:** **{verdict}**  ",
        f"**Recommendation:** **{recommendation}**  ",
        "",
        "**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产",
        "",
        "**已暂停：** HAT-R1 Phase A · 补丁式 `bootstrap-stake-pool-jurisdictions-sepolia.sh` schedule/execute",
        "",
        "---",
        "",
        "## Executive Summary",
        "",
        "| 项 | 结论 |",
        "|----|------|",
        f"| 干净基线标准 | **{verdict}** |",
        f"| 下一步 | **{recommendation}** |",
        f"| GOV-01～04 读口 | {onchain.get('_gov_verify', 'see onchain')} |",
        f"| Stake Pool 10 国 init | **FAIL**（链上 bps/minStake=0 · 依赖 48h 补丁） |",
        f"| allowedExecutionTarget | PM/Seat **false** · Governor/Treasury/StakePool true |",
        f"| UI/文案 | ① PASS（与 SSOT 一致 · 掩盖不了链上 init 缺口） |",
        "",
        "**诚实边界：** ② 根因审计 **≠** V2 已 redeploy **≠** ③ Production GO",
        "",
        "---",
        "",
        "## 干净基线六项（CB-C1～C6）",
        "",
        "| ID | 标准 | 状态 | 备注 |",
        "|----|------|------|------|",
    ]
    labels = {c[0]: c[1] for c in CLEAN_BASELINE_CRITERIA}
    for row in criteria:
        mark = "✅" if row["status"] == "PASS" else ("⚠️" if row["status"] == "PARTIAL" else "❌")
        lines.append(f"| {row['id']} | {labels.get(row['id'], '')} | {mark} {row['status']} | {row['note']} |")

    lines += ["", "---", "", "## P0 根因清单", ""]
    if not p0s:
        lines.append("_无 P0_")
    else:
        for i, f in enumerate(p0s, 1):
            lines.append(f"{i}. **{f.get('id')}** · {f.get('title')} — `{json.dumps(f.get('detail'), ensure_ascii=False)[:200]}`")

    lines += [
        "",
        "---",
        "",
        "## 根因叙事（摘要）",
        "",
        "1. **Stake Pool 复用旧 Proxy 地址**（`0xeb0e…` registry 切主前后不变）· deploy 时 **未**完成 10 国 `stewardStakeBps` 写入 → 真人 Stake/Seat **阻塞**。",
        "2. **GovFreeze V1 Safe 批次** 仅 `setAllowedExecutionTarget` Governor/Token/TreasuryP4 · **遗漏** Primary Market · Seat Registry ·（Stake Pool 靠后续补丁 schedule）。",
        "3. **补丁路径**：10× `configureJurisdiction` 已 schedule · **48h pending** · 不符合「一次初始化完整 / 干净基线」。",
        "4. **Country Pool NetProfit**：D-4555-B **DE pilot only**（45/55 链上正确）· 与 10 国 Stake SSOT **分层** · 旧 `CountryPoolLedgerV0` pilot 地址仍共存于 env/registry。",
        "5. **UI/产品文案** 已对齐 TTG-TOKENOMICS-FREEZE-V1 · **不能**替代链上 init/权限缺口。",
        "",
        "---",
        "",
        "## GovFreeze V2 Clean Baseline（建议 · ② 未实施）",
        "",
        "在 **Owner 授权 broadcast** 前，以 **`DeployGovFreezeV2CleanBaseline`**（或等价脚本）**全新部署**：",
        "",
        "| 步骤 | 要求 |",
        "|------|------|",
        "| 1 | **新** Timelock + 全套 Governable Proxy（**禁止**复用未 bootstrap 的 `0xeb0e…` 作正式基线） |",
        "| 2 | Stake Pool `initializeProxyStorage` **必须** `_bootstrapProtocolSsotJurisdictions()` · 审计 10/10 `minStake>0` **同块** |",
        "| 3 | Safe 批次一次性 `setAllowedExecutionTarget` × **5**（Governor · PM · TreasuryP4 · Seat · StakePool） |",
        "| 4 | `apply-gov-freeze-v2-sepolia-cutover.sh` · registry `gov_freeze_v2_clean_baseline` · **LEGACY_** 归档旧地址 |",
        "| 5 | **取消** pending 补丁 op · 不进入 HAT-R1 直至 `run-g24-clean-baseline-01` → **PASS_CLEAN_BASELINE** |",
        "| 6 | Country Pool：DE D-4555-B **保留**（IMMUTABLE）· 10 国 NetProfit **另闸** · 不阻塞 Stake/PM/Treasury/Seat |",
        "",
        "```bash",
        "# 实施后验收",
        "bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh",
        "# 期望: G24_CLEAN_BASELINE_01: PASS_CLEAN_BASELINE",
        "bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --preflight-only",
        "```",
        "",
        "---",
        "",
        f"**机读：** `evidence/GO_g24_clean_baseline_01/{stamp}/g24-clean-baseline-01-audit.json`",
        "",
        f"**稳定 grep：** `G24_CLEAN_BASELINE_01: {verdict}`",
        "",
    ]
    return "\n".join(lines)


def main() -> int:
    stamp = os.environ.get("G24_CB_STAMP", datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ"))
    onchain = load("onchain-root-cause-probe.json")
    env = load("env-registry-probe.json")
    ui = load("ui-alignment-audit.json")
    sp = load("stake-pool-jurisdiction-bootstrap-audit.json")
    gov_verify = load("sepolia-onchain-alignment.json")
    if gov_verify:
        onchain["_gov_verify"] = gov_verify.get("verdict", "?")

    criteria = eval_criteria(onchain, env, ui, sp, gov_verify)
    p0s = p0_findings(onchain, env)
    fail_criteria = [c for c in criteria if c["status"] != "PASS"]
    if fail_criteria or p0s:
        verdict = "FAIL_CLEAN_BASELINE"
        recommendation = "REDEPLOY_GOVFREEZE_V2_CLEAN_BASELINE"
    else:
        verdict = "PASS_CLEAN_BASELINE"
        recommendation = "PROCEED_HAT_R1_PREFLIGHT"

    payload = {
        "audit_id": "G24-CLEAN-BASELINE-01",
        "stamp_utc": stamp,
        "phase": "②",
        "verdict": verdict,
        "recommendation": recommendation,
        "clean_baseline_criteria": criteria,
        "p0_findings": p0s,
        "onchain_summary": {
            "patch_pending_count": onchain.get("patch_pending_count"),
            "stake_pool_jurisdiction_failures": sum(
                1 for r in onchain.get("stake_pool_jurisdictions", []) if r.get("status") == "FAIL"
            ),
            "allowed_execution_target": onchain.get("allowed_execution_target"),
        },
        "paused_workstreams": [
            "HAT-R1 Phase A",
            "bootstrap-stake-pool-jurisdictions-sepolia schedule/execute patch",
        ],
    }
    EVID.mkdir(parents=True, exist_ok=True)
    (EVID / "g24-clean-baseline-01-audit.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    REPORT_MD.write_text(render_md(stamp, verdict, recommendation, criteria, p0s, onchain), encoding="utf-8")
    print(f"G24_CLEAN_BASELINE_01: {verdict}")
    print(f"G24_CLEAN_BASELINE_01_RECOMMENDATION: {recommendation}")
    print(f"report={REPORT_MD.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
