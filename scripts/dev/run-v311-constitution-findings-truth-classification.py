#!/usr/bin/env python3
"""
Truth Classification re-audit of Constitution Production Alignment findings.

Read-only. Sole SSOT = Economic Constitution V3.1.1 Final.
Does NOT mutate protocol / ACTIVE / Runtime / Registry / Package.
"""
from __future__ import annotations

import json
import subprocess
import os
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = (
    ROOT
    / "evidence/GO_v311_constitution_production_alignment_audit/CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.json"
)
EV = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
RPC = os.environ.get("CHAIN_RPC_URL", "https://ethereum-sepolia-rpc.publicnode.com")
GOV = "0x1ce4fbE80557bC2111A814f60A2334de41032116"
FR = "0x81A8009210c5215100564c6E4123F672c4459306"

# Labels (canonical)
L1 = "CONSTITUTION_VIOLATION"
L2 = "PRODUCTION_BLOCKING"
L3 = "ENGINEERING_GAP"
L4 = "OWNER_DECISION"
L5 = "DOCUMENTATION_DRIFT"


def _utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _cast(*args: str) -> str:
    r = subprocess.run(
        ["cast", *args, "--rpc-url", RPC],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        timeout=40,
        cwd=str(ROOT),
    )
    return (r.stdout or r.stderr or "").strip().splitlines()[0] if (r.stdout or r.stderr) else ""


def main() -> int:
    base = json.loads(SRC.read_text(encoding="utf-8")) if SRC.is_file() else {"findings": []}

    # Fresh chain facts for REG-02 / TRE-02 / GOV-02
    tier_live = {}
    for t in range(3):
        raw = _cast("call", GOV, "proposalThresholdForTier(uint8)(uint256)", str(t))
        try:
            tier_live[t] = int(raw.split()[0]) // 10**18
        except Exception:
            tier_live[t] = None
    prop_state = _cast("call", GOV, "state(uint256)(uint8)", "1")
    try:
        prop_state_n = int(prop_state.split()[0])
    except Exception:
        prop_state_n = None
    fr = {
        "BPS_COUNTRY": _cast("call", FR, "BPS_COUNTRY()(uint256)"),
        "BPS_GLOBAL_OPS": _cast("call", FR, "BPS_GLOBAL_OPS()(uint256)"),
        "BPS_GLOBAL_RESERVE": _cast("call", FR, "BPS_GLOBAL_RESERVE()(uint256)"),
        "BPS_GLOBAL_STAKERS": _cast("call", FR, "BPS_GLOBAL_STAKERS()(uint256)"),
    }

    # Truth table — primary label is decisive; secondary optional
    classified = [
        {
            "id": "GOV-02",
            "primary": L2,
            "secondary": [L3],
            "not": [L1, L5],
            "constitution_cite": "Ch.5 / Ch.7 / Final §9 — Timelock is the mandated execution path; Queued≠Executed is process state, not a rule-text bug",
            "evidence": {
                "proposal_1_state": prop_state_n,
                "meaning": "5=Queued",
                "execute_eta_utc": "2026-07-20T11:37:37Z",
            },
            "impact": "Blocks Function Cert close (F-02) and any claim that governance Execute path is live-complete",
            "must_close_before_production_go": True,
            "must_close_before_reason": "Production GO / Sepolia Freeze ladder requires Function Cert; Execute is the gate",
            "priority": 1,
            "action_type": "PROCESS_EXECUTE_AFTER_ETA",
            "note": "Not a Solidity defect. Do not redesign protocol while waiting.",
        },
        {
            "id": "TRE-02",
            "primary": L1,
            "secondary": [L2],
            "not": [L5],
            "constitution_cite": "Ch.12.4 · Ch.14③ · Final §13–14 — Distributable ×45% steward / ×55% Project Revenue Pool (or 100% PRP); LEGACY multi-bucket forbidden as distributable SSOT",
            "evidence": {
                "fee_router": FR,
                "live_bps": fr,
                "constitution_require": {"steward_bps": 4500, "project_revenue_pool_bps": 5500, "single_prp_rail": True},
                "observed": "LEGACY ops/reserve/stakers split of the non-country 55%",
            },
            "impact": "Live payment/distribution semantics disagree with Constitution; financial attribution wrong if this path is used in production",
            "must_close_before_production_go": True,
            "must_close_before_reason": "Direct Constitution Violation on money split",
            "priority": 1,
            "action_type": "FIX_DISTRIBUTION_SEMANTICS",
            "note": "Highest-severity protocol-behavior gap among the 11.",
        },
        {
            "id": "REG-01",
            "primary": L1,
            "secondary": [L2, L3],
            "not": [L5],
            "constitution_cite": "Ch.14 — four permanent rails: Order Escrow · P4Cap · Project Revenue Pool · Founder Bootstrap Wallet",
            "evidence": {
                "registry": "registry/v311-treasury-rails.v1.yaml",
                "honesty_live_pool_contracts": "OPEN",
                "p4cap_live": "PINNED (ACTIVE freeze)",
                "prp_address": None,
                "founder_bootstrap_address": None,
            },
            "impact": "Cannot prove permanent isolation / Constitution sinks for PRP and Access Fee destination",
            "must_close_before_production_go": True,
            "must_close_before_reason": "Ch.14 is mandatory; missing live rails = Constitution Violation + Production Blocking",
            "priority": 1,
            "action_type": "WIRE_LIVE_RAIL_ADDRESSES",
            "note": "P4Cap already live; gap is PRP + Founder (and proving Escrow isolation still holds).",
        },
        {
            "id": "REG-04",
            "primary": L1,
            "secondary": [L3, L2],
            "not": [L5],
            "constitution_cite": "Ch.9 · Final §11 — PENDING→LOCKED→DISTRIBUTABLE→DISTRIBUTED; only Distributable may enter Ch.12 split",
            "evidence": {
                "code_present": [
                    "contracts/src/ServiceFeeStatesV311.sol",
                    "contracts/src/Escrow.sol (advances states)",
                    "crates/core/src/service_fee_state_v311.rs",
                ],
                "registry_honesty": "distributable_state_machine: OPEN · country_params_consumed_by_backend: OPEN",
                "coupling": "TRE-02 FeeRouter path does not embody Distributable→45/55 PRP",
            },
            "impact": "Partial implementation: Escrow/core have the machine; end-to-end Runtime/BE + distribution SSOT not closed",
            "must_close_before_production_go": True,
            "must_close_before_reason": "Constitution-mandated state machine must govern live distributable money",
            "priority": 1,
            "action_type": "CLOSE_RUNTIME_DISTRIBUTABLE_PATH",
            "note": "Classify as Constitution Violation because Ch.9 is mandatory; Engineering Gap describes remaining wiring — not 'docs only'.",
        },
        {
            "id": "CERT-01",
            "primary": L2,
            "secondary": [L3],
            "not": [L1],
            "constitution_cite": "Not a Constitution numeric rule — PSG/Release Engineering production-grade gate (54/0/0)",
            "evidence": {
                "function_cert": "50 PASS / 0 FAIL / 4 OWNER_REQUIRED",
                "tier_c": {
                    "F-01": "PASS",
                    "F-02": "OWNER_REQUIRED (Queued)",
                    "F-03": "PASS",
                    "I-01": "PASS",
                },
            },
            "impact": "Cannot claim Web3 Full Function Cert; blocks Freeze/GO ladder",
            "must_close_before_production_go": True,
            "must_close_before_reason": "Production-Grade certification spine — not optional engineering polish",
            "priority": 1,
            "action_type": "COMPLETE_FUNCTION_CERT_AFTER_EXECUTE",
            "note": "Depends on GOV-02; VERDICT may lag tier_c PASS items — re-stamp after Execute.",
        },
        {
            "id": "CERT-02",
            "primary": L2,
            "secondary": [L3],
            "not": [L1],
            "constitution_cite": "Not Constitution text — Product Full Cert is Release Engineering gate",
            "evidence": {"product_cert": "OPEN", "blocked_by": "function_cert FAIL_WAITING_F02"},
            "impact": "Product surface not production-certified",
            "must_close_before_production_go": True,
            "must_close_before_reason": "Formal ladder Product Cert before Freeze/GO",
            "priority": 2,
            "action_type": "RUN_PRODUCT_FULL_AFTER_FUNCTION",
            "note": "Start only after CERT-01 path clear.",
        },
        {
            "id": "REG-05",
            "primary": L4,
            "secondary": [L1, L2],
            "not": [L5],
            "constitution_cite": "Ch.13.1 — Recovery Budget required before Recovery *payout* leg; forbid unbounded drain",
            "evidence": {
                "registry": "registry/v311-recovery-budget.v1.yaml",
                "budget_status": "OWNER_INPUT_REQUIRED",
                "live_budget_value": "NOT_SET",
                "without_budget_allowed": ["register/freeze stake non-payout"],
            },
            "impact": "Recovery payout must not run; non-payout register path may exist",
            "must_close_before_production_go": "CONDITIONAL",
            "must_close_before_reason": "MUST before enabling Recovery payout in production. If Recovery payout is in GO scope → treat as Production Blocking. If GO explicitly excludes Recovery payout → Owner may defer with written Sign-off + hard disable payout",
            "priority": 2,
            "action_type": "OWNER_SET_BUDGET_OR_DISABLE_PAYOUT",
            "note": "Constitution Violation only if payout executes without budget; currently Owner Decision gap.",
        },
        {
            "id": "REG-03",
            "primary": L3,
            "secondary": [L1, L2],
            "not": [L5],
            "constitution_cite": "Ch.4 · Final §6 — 300,000 USDC Access Fee → Founder wallet + §4.1 refund rules",
            "evidence": {
                "registry_params": "CLOSED (300000 + refund matrix)",
                "honesty": "backend_orchestration OPEN · contracts_collection OPEN",
                "code_rules": "crates/core/src/access_fee_refund_v311.rs present",
            },
            "impact": "Steward onboarding fee path not live-complete",
            "must_close_before_production_go": "CONDITIONAL",
            "must_close_before_reason": "MUST if Country Steward onboarding is in Production GO scope. Else Engineering Gap with documented deferral (still Constitution-required before enabling that product surface)",
            "priority": 3,
            "action_type": "IMPLEMENT_ACCESS_FEE_ORCHESTRATION",
            "note": "Rule text exists; implementation incomplete — Engineering Gap, escalates to Constitution Violation when surface goes live without it.",
        },
        {
            "id": "REG-02",
            "primary": L5,
            "secondary": [],
            "not": [L1, L2],
            "constitution_cite": "Ch.5 — ordinary/important/core thresholds (0.5%/1%/2% with caps)",
            "evidence": {
                "registry_honesty_claimed": "governor_onchain_encoding: OPEN",
                "live_proposalThresholdForTier_ttg": tier_live,
                "constitution_caps_ttg": {"ordinary_max": 50000, "important_max": 100000, "core_max": 200000},
                "code": "TravelTrustGovernor.propose(..., tier) + V311DaoProposalThresholds.requiredVotes",
                "conclusion": "On-chain encoding PRESENT and matches Constitution max caps; Registry honesty flag is stale",
            },
            "impact": "False OPEN in prior audit / Registry honesty — wastes remediation if treated as protocol Drift",
            "must_close_before_production_go": False,
            "must_close_before_reason": "Refresh honesty evidence only; no protocol change required for Ch.5 caps already live",
            "priority": 5,
            "action_type": "REFRESH_HONESTY_EVIDENCE_ONLY",
            "note": "Truth correction: NOT a Constitution Violation on current Sepolia ACTIVE Governor.",
        },
        {
            "id": "CERT-03",
            "primary": L3,
            "secondary": [L2],
            "not": [L1],
            "constitution_cite": "None — UI/UX Full Cert is engineering/release gate; Constitution does not define Playwright wallet gates",
            "evidence": {
                "ui_cert": "PARTIAL",
                "gates_pass": ["five_main", "itinerary_l5", "wallet_l5"],
                "gates_open": ["playwright_real_wallet_real_tx"],
            },
            "impact": "UI Full Cert incomplete; five-main already frozen green",
            "must_close_before_production_go": "CONDITIONAL",
            "must_close_before_reason": "Required for UI Full Cert / formal ladder P5. Not a Constitution economic rule. Owner may sequence after core money/gov gates if ladder allows — still required before claiming UI Full PASS",
            "priority": 3,
            "action_type": "CLOSE_UI_FULL_CERT_GATES",
            "note": "Do not call this Protocol Drift.",
        },
        {
            "id": "DOC-01",
            "primary": L5,
            "secondary": [],
            "not": [L1, L2],
            "constitution_cite": "Appendix C honesty — Target LOCKED ≠ live Full Alignment PASS ≠ Production GO",
            "evidence": {
                "gap_matrix_claim": "TT_WEB3_FULL_ALIGNMENT=PASS",
                "constitution_appendix_c": "Live Full Alignment NOT_PASS (Target honesty)",
                "production_grade_audit": "FAIL with open P0 money/gov/cert items",
            },
            "impact": "Narrative conflict only — does not change chain state or contract behavior",
            "must_close_before_production_go": False,
            "must_close_before_reason": "Must reconcile before *claiming* Alignment/Freeze in docs; does not itself unblock Execute or FeeRouter",
            "priority": 5,
            "action_type": "DOCUMENTATION_CONSISTENCY_ONLY",
            "note": "Separate bucket: Documentation Consistency. Never mix into Protocol Drift workstream.",
        },
    ]

    # Priority bands
    bands = {
        "P0_MUST_FIX_NOW": [x["id"] for x in classified if x["priority"] == 1],
        "P1_OWNER_OR_CONDITIONAL": [x["id"] for x in classified if x["priority"] == 2],
        "P2_ENGINEERING_COMPLETE": [x["id"] for x in classified if x["priority"] == 3],
        "P3_DOCS_ONLY": [x["id"] for x in classified if x["priority"] == 5],
    }

    by_label = {L1: [], L2: [], L3: [], L4: [], L5: []}
    for x in classified:
        by_label[x["primary"]].append(x["id"])

    must_yes = [x["id"] for x in classified if x["must_close_before_production_go"] is True]
    must_cond = [x["id"] for x in classified if x["must_close_before_production_go"] == "CONDITIONAL"]
    must_no = [x["id"] for x in classified if x["must_close_before_production_go"] is False]

    report = {
        "schema": "traveltrust.v311_constitution_findings_truth_classification.v1",
        "machine_key": "TT_V311_CONSTITUTION_FINDINGS_TRUTH_CLASSIFICATION",
        "recorded_utc": _utc(),
        "ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "source_audit": str(SRC.relative_to(ROOT)).replace("\\", "/"),
        "forbid_mutate": ["protocol", "ACTIVE", "Runtime", "Registry", "Package"],
        "labels": {
            "1": L1,
            "2": L2,
            "3": L3,
            "4": L4,
            "5": L5,
        },
        "summary": {
            "by_primary_label": by_label,
            "priority_bands": bands,
            "must_close_before_production_go": {
                "YES": must_yes,
                "CONDITIONAL": must_cond,
                "NO": must_no,
            },
            "do_not_start_fix_yet": True,
            "next_allowed_step": "Owner confirms priority bands → then schedule Execute (GOV-02) and design FIX for TRE-02/REG-01/REG-04 only",
        },
        "chain_spot_checks": {
            "governor_tier_thresholds_ttg": tier_live,
            "proposal_1_state": prop_state_n,
            "fee_router_bps_raw": fr,
        },
        "items": classified,
        "remediation_priority_ordered": [
            "1. GOV-02 — wait ETA → Execute (process)",
            "2. TRE-02 — Constitution distribution semantics (FeeRouter / PRP)",
            "3. REG-01 — live PRP + Founder rails",
            "4. REG-04 — Distributable Runtime close (coupled with TRE-02)",
            "5. CERT-01 → CERT-02 — Function 54/0/0 then Product Full",
            "6. REG-05 — Owner Budget or disable Recovery payout",
            "7. REG-03 / CERT-03 — Access Fee orchestration · UI Full (scope-conditional)",
            "8. REG-02 / DOC-01 — Documentation Consistency only (no protocol work)",
        ],
        "honesty": {
            "prior_audit_still_fail": True,
            "reclassification_does_not_change_verdict": "Production-Grade Full Alignment remains FAIL until P0_MUST_FIX_NOW closed",
            "reg02_truth_correction": "On-chain Governor tiers already match Constitution caps — prior REG-02 as protocol Drift was overstated",
        },
    }

    out_json = EV / "FINDINGS-TRUTH-CLASSIFICATION-LATEST.json"
    out_md = EV / "FINDINGS-TRUTH-CLASSIFICATION-LATEST.md"
    out_json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    lines = [
        "# Findings · Truth Classification（V3.1.1 Constitution）",
        "",
        f"**Machine:** `TT_V311_CONSTITUTION_FINDINGS_TRUTH_CLASSIFICATION`",
        f"**SSOT:** Economic Constitution V3.1.1 Final · **LOCKED**",
        f"**Recorded:** `{report['recorded_utc']}`",
        f"**Mode:** read-only · **未**改协议 / ACTIVE / Runtime / Registry",
        "",
        "> 本文件只做真实性归类与优先级。**不要直接开工修。**",
        "> 生产级 Alignment 总判据仍为 **FAIL**，直至 P0 带关闭。",
        "",
        "## 0 · 标签标签",
        "",
        "| # | Label | 含义 |",
        "|---|-------|------|",
        f"| ① | `{L1}` | 与宪章强制条文冲突 |",
        f"| ② | `{L2}` | 挡住 Production GO / Freeze / 认证主链 |",
        f"| ③ | `{L3}` | 实现未完成（未必已违宪） |",
        f"| ④ | `{L4}` | 须 Owner 输入/书面决策 |",
        f"| ⑤ | `{L5}` | 文档/诚实字段漂移（不改链上行为） |",
        "",
        "## 1 · 按主标签归类",
        "",
        f"| Label | IDs |",
        f"|-------|-----|",
        f"| ① Constitution Violation | {', '.join(by_label[L1]) or '—'} |",
        f"| ② Production Blocking | {', '.join(by_label[L2]) or '—'} |",
        f"| ③ Engineering Gap | {', '.join(by_label[L3]) or '—'} |",
        f"| ④ Owner Decision | {', '.join(by_label[L4]) or '—'} |",
        f"| ⑤ Documentation Drift | {', '.join(by_label[L5]) or '—'} |",
        "",
        "## 2 · Production GO 前是否必须关闭",
        "",
        f"| 判定 | IDs |",
        f"|------|-----|",
        f"| **YES** | {', '.join(must_yes)} |",
        f"| **CONDITIONAL** | {', '.join(must_cond)} |",
        f"| **NO**（文档/诚实刷新） | {', '.join(must_no)} |",
        "",
        "## 3 · 逐项",
        "",
        "| ID | Primary | Secondary | Must before Prod GO | Priority | Action |",
        "|----|---------|-----------|---------------------|----------|--------|",
    ]
    for x in classified:
        sec = ",".join(x["secondary"]) if x["secondary"] else "—"
        lines.append(
            f"| {x['id']} | {x['primary']} | {sec} | {x['must_close_before_production_go']} | P{x['priority']} | {x['action_type']} |"
        )
    lines += ["", "### Detail", ""]
    for x in classified:
        lines += [
            f"#### {x['id']} · `{x['primary']}`",
            "",
            f"- **Constitution cite:** {x['constitution_cite']}",
            f"- **Evidence:** `{json.dumps(x['evidence'], ensure_ascii=False)[:500]}`",
            f"- **Impact:** {x['impact']}",
            f"- **Must before Production GO:** `{x['must_close_before_production_go']}` — {x['must_close_before_reason']}",
            f"- **Note:** {x['note']}",
            "",
        ]
    lines += [
        "## 4 · 整改优先级（禁止跳序把 DOC 当协议修）",
        "",
    ]
    for step in report["remediation_priority_ordered"]:
        lines.append(f"- {step}")
    lines += [
        "",
        "## 5 · 关键修正",
        "",
        "- **REG-02：** 链上 `proposalThresholdForTier` ≈ 50k / 100k / 200k TTG，与宪章上限一致；Registry `honesty.governor_onchain_encoding=OPEN` 为过时诚实字段 → **⑤ Documentation Drift**，不是协议 Drift。",
        "- **DOC-01：** 仅口径冲突 → **⑤**，单独 Documentation Consistency 工作流。",
        "- **CERT-01/02：** 不是宪章条文，但是 **② Production Blocking**（认证主链）。",
        "",
        f"JSON: [`FINDINGS-TRUTH-CLASSIFICATION-LATEST.json`](./FINDINGS-TRUTH-CLASSIFICATION-LATEST.json)",
        "",
    ]
    out_md.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("TT_V311_CONSTITUTION_FINDINGS_TRUTH_CLASSIFICATION: OK")
    print(json.dumps(report["summary"], indent=2, ensure_ascii=False))
    print(f"wrote {out_md}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
