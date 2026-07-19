#!/usr/bin/env python3
"""Generate Production Exit Criteria v1 SSOT (registry + runbook + audit map).

Additive only. Does not mutate ACTIVE address matrix / protocol / Runtime / Package.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def main() -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    yaml_path = ROOT / "registry" / "v311-production-exit-criteria.v1.yaml"
    text = _YAML.replace("2026-07-18T12:40:00Z", now).replace("20260718T124000Z", stamp)
    yaml_path.write_text(text, encoding="utf-8")

    md_path = ROOT / "docs" / "runbook" / "TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md"
    md_path.write_text(_MD.format(now=now), encoding="utf-8")

    ev = ROOT / "evidence" / "GO_v311_constitution_production_alignment_audit"
    ev.mkdir(parents=True, exist_ok=True)
    amap = {
        "schema": "traveltrust.v311_production_exit_criteria_v1_audit_map.v1",
        "machine_key": "TT_V311_PRODUCTION_EXIT_CRITERIA_V1_AUDIT_MAP",
        "recorded_utc": now,
        "ssot_registry": "registry/v311-production-exit-criteria.v1.yaml",
        "ssot_human": "docs/runbook/TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md",
        "economic_ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "forbid_mutate": [
            "protocol",
            "ACTIVE_address_matrix",
            "Runtime",
            "Package",
        ],
        "note": (
            "New Exit Criteria registry file is additive SSOT; "
            "ACTIVE deploy registries untouched"
        ),
        "gates_ordered": [
            "G-RC-01",
            "G-RC-02",
            "G-RC-03",
            "G-RC-04",
            "G-RC-05",
            "M-RC-00",
            "M-RC-01",
            "M-RC-02",
            "M-RC-03",
            "M-RC-04",
            "X-FREEZE",
            "X-GO",
        ],
        "findings_to_gate": {
            "GOV-02": "G-RC-01",
            "CERT-01": "G-RC-02",
            "CERT-02": "G-RC-03",
            "CERT-03": "G-RC-04",
            "TRE-02": "M-RC-01",
            "REG-01": "M-RC-02",
            "REG-04": "M-RC-03",
            "REG-05": "X-GO_CONDITIONAL",
            "REG-03": "X-GO_CONDITIONAL",
            "REG-02": "DOC_CONSISTENCY",
            "DOC-01": "DOC_CONSISTENCY",
            "GOV-01": "G-RC-01_VERIFY_LIVE",
        },
        "defer_to_money_path_required": ["TRE-02", "REG-01", "REG-04"],
        "never_defer_past_production_go": [
            "TRE-02",
            "REG-01",
            "REG-04",
            "GOV-02",
            "CERT-01",
            "CERT-02",
        ],
        "current_snapshot": {
            "governance_mode": "FROZEN_WAITING_EXECUTE",
            "money_path": "REGISTERED_NOT_STARTED",
            "production_go": "NOT_CLAIMED",
            "release_decision": "CONTINUE_CURRENT_RC",
        },
        "tt_v311_production_exit_criteria_v1": "ACTIVE_SSOT",
    }
    (ev / "PRODUCTION-EXIT-CRITERIA-V1-AUDIT-MAP-LATEST.json").write_text(
        json.dumps(amap, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    (ev / "PRODUCTION-EXIT-CRITERIA-V1-AUDIT-MAP-LATEST.md").write_text(
        _AUDIT_MD.format(now=now), encoding="utf-8"
    )

    # pointer on dual board json if present
    dual_path = ev / "DUAL-RC-TRACK-BOARD-LATEST.json"
    if dual_path.exists():
        dual = json.loads(dual_path.read_text(encoding="utf-8"))
        dual["production_exit_criteria_v1"] = {
            "registry": "registry/v311-production-exit-criteria.v1.yaml",
            "human": "docs/runbook/TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md",
            "recorded_utc": now,
        }
        dual_path.write_text(
            json.dumps(dual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )
        fre = ROOT / "evidence/GO_phase2_v311_final_release/DUAL-RC-TRACK-BOARD-LATEST.json"
        if fre.exists():
            fre.write_text(
                json.dumps(dual, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
            )

    print(
        json.dumps(
            {
                "tt_v311_production_exit_criteria_v1": "ACTIVE_SSOT",
                "registry": str(yaml_path.relative_to(ROOT)).replace("\\", "/"),
                "human": str(md_path.relative_to(ROOT)).replace("\\", "/"),
                "audit_map": "evidence/GO_v311_constitution_production_alignment_audit/PRODUCTION-EXIT-CRITERIA-V1-AUDIT-MAP-LATEST.json",
            },
            indent=2,
        )
    )
    return 0


_YAML = r"""# schema: traveltrust.v311_production_exit_criteria.v1
# Production Exit Criteria v1 — Dual-RC (Governance RC || Money-Path RC)
# Additive Exit Criteria SSOT. Does NOT mutate ACTIVE address matrix /
# protocol-convergence ACTIVE cutover / Runtime first-wins / Package LOCK.
machine_key: TT_V311_PRODUCTION_EXIT_CRITERIA_V1
document_id: TT-V311-PRODUCTION-EXIT-CRITERIA-V1
version: "1.0.0"
status: ACTIVE_SSOT
immutable: true
recorded_utc: "2026-07-18T12:40:00Z"
stamp: "20260718T124000Z"

economic_ssot: docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md
human: docs/runbook/TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md
dual_rc_board: evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.md
money_path_charter: evidence/GO_v311_constitution_production_alignment_audit/MONEY-PATH-RC-CHARTER-LATEST.json
release_blocking_decision: evidence/GO_v311_constitution_production_alignment_audit/RELEASE-BLOCKING-DECISION-TRE-REG-LATEST.json
truth_classification: evidence/GO_v311_constitution_production_alignment_audit/FINDINGS-TRUTH-CLASSIFICATION-LATEST.json
alignment_policy: docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md
canonical_ladder: registry/traveltrust-release-engineering-ladder.v1.yaml

honesty:
  equals_production_go_auto: false
  mutates_active_address_matrix: false
  mutates_protocol: false
  mutates_runtime: false
  mutates_package_lock: false

dual_rc:
  release_decision: CONTINUE_CURRENT_RC
  governance_rc:
    id: GOVERNANCE_RC
    mode_now: FROZEN_WAITING_EXECUTE
    status: ACTIVE
  money_path_rc:
    id: MONEY_PATH_RC
    status: REGISTERED_NOT_STARTED
    start_gate: GOVERNANCE_RC_CLOSED
    sole_p0: [TRE-02, REG-01, REG-04]
  isolation:
    mix_money_path_into_governance_rc: FORBIDDEN
    implement_money_path_before_governance_closed: FORBIDDEN

exit_gates:
  - id: G-RC-01
    track: GOVERNANCE_RC
    name: Timelock Proposal #1 Execute
    immutable: true
    pass_requires: [proposal_1_state_Executed, execute_receipt_on_sepolia_11155111]
    fail_if: [proposal_still_Queued_past_owner_abandon, execute_reverted_without_remediation_plan]
    required_evidence:
      - evidence/GO_phase2_v311_web3_full_function_cert/tier_c_state/F-02-gov-timelock.json
      - execute_tx_hash
    blocks_next: [G-RC-02]
    findings_owned: [GOV-02]

  - id: G-RC-02
    track: GOVERNANCE_RC
    name: Function Cert 54/0/0
    immutable: true
    pass_requires:
      - function_cert_counts_PASS_54_FAIL_0_OWNER_REQUIRED_0
      - upgrade_architecture_pass
      - pure_sepolia_dataset
    fail_if: [OWNER_REQUIRED_gt_0, FAIL_gt_0, inventory_coverage_lt_100pct]
    required_evidence:
      - evidence/GO_phase2_v311_web3_full_function_cert/VERDICT-LATEST.json
    blocks_next: [G-RC-03]
    findings_owned: [CERT-01]

  - id: G-RC-03
    track: GOVERNANCE_RC
    name: Product Full Cert PASS
    immutable: true
    pass_requires: [tt_v311_web3_full_product_cert_PASS, function_cert_PASS]
    fail_if: [product_cert_OPEN_or_FAIL]
    required_evidence:
      - evidence/GO_phase2_v311_final_release/P6-PRODUCT-CERT-LATEST.json
    blocks_next: [G-RC-04]
    findings_owned: [CERT-02]

  - id: G-RC-04
    track: GOVERNANCE_RC
    name: UI Full Cert PASS
    immutable: true
    pass_requires: [tt_v311_web3_ui_ux_full_cert_PASS, five_main_wallet_itinerary_gates_green]
    fail_if: [ui_cert_PARTIAL_with_blocking_gate_open]
    required_evidence:
      - evidence/GO_phase2_v311_final_release/P5-UI-UX-CERT-LATEST.json
    blocks_next: [G-RC-05]
    findings_owned: [CERT-03]
    defer_policy: >
      OWNER_ACCEPT_PARTIAL only for non-Constitution UI polish if Product+Function PASS
      and residual recorded — default MUST PASS for Governance RC CLOSE.

  - id: G-RC-05
    track: GOVERNANCE_RC
    name: Governance RC CLOSED
    immutable: true
    pass_requires:
      - G-RC-01_PASS
      - G-RC-02_PASS
      - G-RC-03_PASS
      - G-RC-04_PASS_or_Owner_Accept_per_policy
      - deferred_money_path_explicitly_registered
      - no_claim_constitution_money_path_alignment
      - no_claim_production_go
    fail_if: [money_path_p0_mixed_into_governance_claims, fake_constitution_full_alignment]
    required_evidence:
      - evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.json
      - DEFERRED_TO_MONEY_PATH_RC=[TRE-02,REG-01,REG-04]
    unlocks: [M-RC-00]
    findings_owned: []

  - id: M-RC-00
    track: MONEY_PATH_RC
    name: Money-Path RC START
    immutable: true
    pass_requires: [GOVERNANCE_RC_CLOSED, Owner_opens_Money_Path_RC, design_option_OPT_A_or_OPT_B_locked]
    fail_if: [start_while_governance_rc_open, implement_without_design_lock]
    required_evidence:
      - evidence/GO_v311_constitution_production_alignment_audit/MONEY-PATH-RC-CHARTER-LATEST.json
      - evidence/GO_v311_constitution_production_alignment_audit/MONEY-PATH-RC-DESIGN-LATEST.json
    blocks_next: [M-RC-01, M-RC-02, M-RC-03]
    findings_owned: []

  - id: M-RC-01
    track: MONEY_PATH_RC
    name: TRE-02 Constitution distribution CLOSED
    immutable: true
    pass_requires:
      - live_split_4500_steward_5500_PRP_or_10000_PRP_without_steward
      - FeeRouter_LEGACY_not_constitution_distributable_ssot
      - constitution_recheck_TRE-02_PASS
    fail_if: [legacy_multi_bucket_still_ssot]
    required_evidence: [money_path_TRE-02_verify_pack, on_chain_or_runtime_split_proof]
    findings_owned: [TRE-02]
    constitution_chapters: ["12.4", "14"]

  - id: M-RC-02
    track: MONEY_PATH_RC
    name: REG-01 Four rails live CLOSED
    immutable: true
    pass_requires:
      - order_escrow_rail_live
      - p4cap_rail_live
      - project_revenue_pool_address_live_non_null
      - founder_bootstrap_wallet_live_non_null
      - rails_non_commingled
    fail_if: [prp_or_founder_null, rail_role_overlap]
    required_evidence: [money_path_REG-01_address_matrix, isolation_proof]
    findings_owned: [REG-01]
    constitution_chapters: ["14"]

  - id: M-RC-03
    track: MONEY_PATH_RC
    name: REG-04 Distributable Runtime CLOSED
    immutable: true
    pass_requires:
      - state_machine_PENDING_LOCKED_DISTRIBUTABLE_DISTRIBUTED_enforced
      - no_payout_before_DISTRIBUTABLE
      - registry_honesty_distributable_CLOSED_after_live_proof
    fail_if: [runtime_honesty_still_OPEN_after_claim_pass]
    required_evidence: [money_path_REG-04_runtime_proof, indexer_projection_proof]
    findings_owned: [REG-04]
    constitution_chapters: ["9"]
    bundle_with: [M-RC-01]

  - id: M-RC-04
    track: MONEY_PATH_RC
    name: Money-Path Full Alignment Re-Audit PASS
    immutable: true
    pass_requires: [M-RC-01_PASS, M-RC-02_PASS, M-RC-03_PASS, constitution_money_path_slice_PASS]
    fail_if: [open_constitution_violation_on_money_path]
    required_evidence:
      - evidence/GO_v311_constitution_production_alignment_audit/CONSTITUTION-PRODUCTION-ALIGNMENT-AUDIT-LATEST.json
    unlocks: [X-FREEZE, X-GO]
    findings_owned: []

  - id: X-FREEZE
    track: PSG_CONVERGENCE
    name: TT_PSG_SEPOLIA_FREEZE eligible
    immutable: true
    pass_requires: [GOVERNANCE_RC_CLOSED, RC_prep_RC01_to_RC06_PASS]
    money_path_policy:
      default: M-RC-04_PASS
      owner_deferral_allowed: true
      owner_deferral_requires:
        - written_Sign-off_DEFER_MONEY_PATH
        - no_claim_money_path_aligned
        - Production_GO_still_blocked_on_money_path
    fail_if: [claim_freeze_with_undeclared_open_p0]
    required_evidence:
      - registry/psg-sepolia-rc-preparation.v1.yaml
      - Owner_Sign-off_pack
    findings_owned: []

  - id: X-GO
    track: PRODUCTION_GO
    name: Production GO
    immutable: true
    pass_requires:
      - GOVERNANCE_RC_CLOSED
      - M-RC-04_PASS
      - OPEN_BLOCKING_RISKS_0
      - OPEN_P0_DEFECTS_0
      - OPEN_P1_DEFECTS_0
      - DRIFT_BLOCKERS_0
      - SSOT_CONFLICTS_0
      - TT_PSG_PRODUCTION_CERT_PASS
      - TT_PSG_SEPOLIA_FREEZE_or_equivalent_PASS
      - P10_5_PRODUCTION_READINESS_REVIEW_PASS
      - Owner_Sign-off_W5_time_separated
    fail_if:
      - any_constitution_money_path_p0_open
      - TRE-02_or_REG-01_or_REG-04_open
      - docs_claim_without_evidence
    required_evidence:
      - PSG_Production_Cert_pack
      - Constitution_money_path_re_audit_PASS
    findings_owned: [TRE-02, REG-01, REG-04]

findings_map:
  GOV-02:
    primary_gate: G-RC-01
    track: GOVERNANCE_RC
    must_close_before: [G-RC-02, GOVERNANCE_RC_CLOSED, X-GO]
    defer_to_money_path: false
    defer_allowed: false
    truth_label: PRODUCTION_BLOCKING
  CERT-01:
    primary_gate: G-RC-02
    track: GOVERNANCE_RC
    must_close_before: [G-RC-03, GOVERNANCE_RC_CLOSED, X-GO]
    defer_to_money_path: false
    defer_allowed: false
    truth_label: PRODUCTION_BLOCKING
  CERT-02:
    primary_gate: G-RC-03
    track: GOVERNANCE_RC
    must_close_before: [GOVERNANCE_RC_CLOSED, X-GO]
    defer_to_money_path: false
    defer_allowed: false
    truth_label: PRODUCTION_BLOCKING
  CERT-03:
    primary_gate: G-RC-04
    track: GOVERNANCE_RC
    must_close_before: [GOVERNANCE_RC_CLOSED]
    defer_to_money_path: false
    defer_allowed: CONDITIONAL_OWNER_ACCEPT_NON_BLOCKING_UI_ONLY
    truth_label: ENGINEERING_GAP
  TRE-02:
    primary_gate: M-RC-01
    track: MONEY_PATH_RC
    must_close_before: [M-RC-04, X-GO]
    defer_to_money_path: true
    defer_from_governance_rc: REQUIRED
    defer_allowed_past_X_GO: false
    truth_label: CONSTITUTION_VIOLATION
  REG-01:
    primary_gate: M-RC-02
    track: MONEY_PATH_RC
    must_close_before: [M-RC-04, X-GO]
    defer_to_money_path: true
    defer_from_governance_rc: REQUIRED
    defer_allowed_past_X_GO: false
    truth_label: CONSTITUTION_VIOLATION
  REG-04:
    primary_gate: M-RC-03
    track: MONEY_PATH_RC
    must_close_before: [M-RC-04, X-GO]
    defer_to_money_path: true
    defer_from_governance_rc: REQUIRED
    defer_allowed_past_X_GO: false
    bundle_with: TRE-02
    truth_label: CONSTITUTION_VIOLATION
  REG-05:
    primary_gate: X-GO
    track: CONDITIONAL
    must_close_before: [X-GO_if_Recovery_payout_in_scope]
    defer_allowed: true
    defer_requires: Owner_disable_Recovery_payout_or_set_Budget
    truth_label: OWNER_DECISION
  REG-03:
    primary_gate: X-GO
    track: CONDITIONAL
    must_close_before: [X-GO_if_Steward_onboarding_Access_Fee_in_scope]
    defer_allowed: true
    defer_requires: product_surface_not_enabled_or_Owner_deferral
    truth_label: ENGINEERING_GAP
  REG-02:
    primary_gate: DOC_CONSISTENCY
    track: DOCUMENTATION
    must_close_before: []
    defer_allowed: true
    truth_label: DOCUMENTATION_DRIFT
  DOC-01:
    primary_gate: DOC_CONSISTENCY
    track: DOCUMENTATION
    must_close_before: [claim_alignment_or_freeze_narrative]
    defer_allowed: true
    truth_label: DOCUMENTATION_DRIFT
  GOV-01:
    primary_gate: G-RC-01
    track: GOVERNANCE_RC
    must_close_before: [G-RC-02]
    defer_allowed: false
    note: Verify live Timelock delay/admin before treating as real Drift
    truth_label: VERIFY_LIVE_THEN_PASS_OR_FIX

pass_fail_rules:
  governance_rc_pass: G-RC-01..G-RC-05 all PASS (G-RC-04 per policy)
  money_path_rc_pass: M-RC-00 started + M-RC-01..M-RC-04 PASS
  production_go_pass: X-GO all pass_requires true AND TRE-02 REG-01 REG-04 CLOSED
  forbid:
    - claim_Production_GO_with_Money_Path_P0_open
    - mix_TRE-02_REG-01_REG-04_into_Governance_RC_exit
    - fake_PASS_with_docs_only
    - ACCEPT_Blocking_Risk_instead_of_FIX

audit_consumption:
  all_future_audits_must_cite: TT_V311_PRODUCTION_EXIT_CRITERIA_V1
  classify_findings_against: findings_map
  dual_rc_isolation: mandatory
"""

_MD = """# TT · Production Exit Criteria v1（Dual-RC）

**Machine:** `TT_V311_PRODUCTION_EXIT_CRITERIA_V1`  
**Version:** `1.0.0` · **Status:** `ACTIVE_SSOT` · **Immutable Exit Gates**  
**Registry:** [`registry/v311-production-exit-criteria.v1.yaml`](../../registry/v311-production-exit-criteria.v1.yaml)  
**Economic SSOT (sole):** [`TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md`](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md)  
**Dual-RC board:** [`DUAL-RC-TRACK-BOARD-LATEST.md`](../../evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.md)  
**Alignment policy:** [`TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md`](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)  
**Recorded:** `{now}`

> 后续所有审计、认证与发布 **必须** 引用本 Exit Criteria。  
> **本文件不**自动等于 Production GO。  
> **未**改协议 · ACTIVE 地址矩阵 · Runtime · Package LOCK。

---

## 0 · Dual-RC 与退出原则（写死）

| Track | 当前 | 退出产物 |
|-------|------|----------|
| **A Governance RC** | `CONTINUE_CURRENT_RC` · `FROZEN_WAITING_EXECUTE` | G-RC-01…05 → **Governance RC CLOSED** |
| **B Money-Path RC** | `REGISTERED_NOT_STARTED` | M-RC-00…04 → **Money-Path Alignment PASS** |
| **PSG 汇聚** | NOT_CLAIMED | X-FREEZE → **X-GO** |

```text
Constitution V3.1.1 (LOCK)
        │
        ├─ Governance RC (G-RC-*)
        │     Execute → Function 54/0/0 → Product → UI Full → CLOSED
        │     DEFER money-path P0 = TRE-02 · REG-01 · REG-04
        │
        ├─ Money-Path RC (M-RC-*)
        │     START only after Governance CLOSED
        │     TRE-02 · REG-01 · REG-04 → Re-Audit PASS
        │
        └─ X-FREEZE → X-GO (Production GO)
              X-GO HARD requires M-RC-04 PASS
```

**禁止：** 把 TRE-02/REG-01/REG-04 混入 Governance RC 退出宣称。  
**禁止：** 用 ACCEPT 替代 Constitution Violation / Blocking Risk 的 FIX。  
**禁止：** docs-only 假 PASS。

---

## 1 · Governance RC · 不可变 Exit Gates

| Gate | 名称 | PASS | Blocking / FAIL | Required Evidence | Findings |
|------|------|------|-----------------|-------------------|----------|
| **G-RC-01** | Proposal #1 Execute | Executed + 收据 | Queued 放弃 / revert 无方案 | F-02 + tx | **GOV-02** |
| **G-RC-02** | Function Cert **54/0/0** | 54/0/0 + Upgrade Arch | OWNER_REQUIRED>0 | `VERDICT-LATEST.json` | **CERT-01** |
| **G-RC-03** | Product Full Cert | Product=PASS | OPEN/FAIL | `P6-PRODUCT-CERT-LATEST.json` | **CERT-02** |
| **G-RC-04** | UI Full Cert | UI=PASS（默认） | 阻塞闸 OPEN | `P5-UI-UX-CERT-LATEST.json` | **CERT-03** |
| **G-RC-05** | Governance RC CLOSED | G-RC-01…04 + 延期登记 | 混入资金 P0 / 假 Alignment | Dual-RC board | — |

**G-RC-04：** 允许 Owner Accept PARTIAL（非宪章 UI 抛光），须 Function+Product PASS 且书面登记；默认必须 PASS。

**Governance RC PASS：** `G-RC-01 ∧ G-RC-02 ∧ G-RC-03 ∧ (G-RC-04 ∨ Accept) ∧ DEFERRED=[TRE-02,REG-01,REG-04]`

---

## 2 · Money-Path RC · 不可变 Exit Gates

| Gate | 名称 | PASS | Findings |
|------|------|------|----------|
| **M-RC-00** | START（Governance CLOSED + OPT-A/B 锁定） | — |
| **M-RC-01** | 45/55 或 100% PRP；LEGACY 非宪章 SSOT | **TRE-02** |
| **M-RC-02** | 四轨 live 非空且不混账 | **REG-01** |
| **M-RC-03** | Distributable 状态机端到端 | **REG-04** |
| **M-RC-04** | Money-Path Re-Audit PASS | — |

**Sole P0：** TRE-02 · REG-01 · REG-04。  
**Money-Path PASS：** `M-RC-00…M-RC-04` 全过。

---

## 3 · Production GO（X-GO）硬闸

| 条件 | 要求 |
|------|------|
| Governance | **CLOSED** |
| Money-Path | **M-RC-04 PASS**（**不可**延期过 GO） |
| Alignment | Blocking/P0/P1/Drift/Conflict = 0 |
| PSG | Production Cert PASS · Freeze PASS · P10.5 PASS · W5 Sign-off |

**X-FREEZE：** 可 Owner 书面延期 Money-Path，**仅当**不宣称资金对齐且 **X-GO 仍被 M-RC-04 阻塞**。

---

## 4 · Finding → Exit Gate

| Finding | Gate | Track | 必须关闭于 | 延期 |
|---------|------|-------|------------|------|
| GOV-02 | G-RC-01 | Governance | Function 前 | 否 |
| CERT-01 | G-RC-02 | Governance | Governance CLOSED / GO | 否 |
| CERT-02 | G-RC-03 | Governance | Governance CLOSED / GO | 否 |
| CERT-03 | G-RC-04 | Governance | Governance CLOSED | 有条件 |
| TRE-02 | M-RC-01 | Money-Path | M-RC-04 / **X-GO** | Governance 内必须延期；过 GO 否 |
| REG-01 | M-RC-02 | Money-Path | M-RC-04 / **X-GO** | 同上 |
| REG-04 | M-RC-03 | Money-Path | M-RC-04 / **X-GO** | 同上 |
| REG-05 | X-GO* | Conditional | Recovery 兑付入范围 | 是 |
| REG-03 | X-GO* | Conditional | Access Fee 面入范围 | 是 |
| REG-02 | DOC | Docs | honesty 刷新 | 是 |
| DOC-01 | DOC | Docs | 宣称叙事前 | 是 |
| GOV-01 | G-RC-01 | Governance | 先核实 live Timelock | 误报则忽略 |

---

## 5 · 审计消费纪律

1. 一切 Production-Grade / Constitution Audit **必须 cite** `TT_V311_PRODUCTION_EXIT_CRITERIA_V1`  
2. Finding 对照 `findings_map` + Truth Classification  
3. Dual-RC 隔离强制  
4. PASS/FAIL 只认 Gate `pass_requires` / `fail_if` + Required Evidence  

---

## 6 · 当前快照

| Gate | 状态 |
|------|------|
| G-RC-01 | OPEN（GOV-02 Queued） |
| G-RC-02…05 | OPEN |
| M-RC-* | NOT_STARTED（P0 已延期登记） |
| X-FREEZE / X-GO | NOT_CLAIMED |
"""

_AUDIT_MD = """# Production Exit Criteria v1 · Audit Map

**Machine:** `TT_V311_PRODUCTION_EXIT_CRITERIA_V1_AUDIT_MAP`  
**Recorded:** `{now}`  
**Registry SSOT:** `registry/v311-production-exit-criteria.v1.yaml`  
**Human SSOT:** `docs/runbook/TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md`

本文件将 Finding 钉到 Exit Gate，供后续审计/认证直接消费。  
**未**修改协议 / ACTIVE 地址矩阵 / Runtime / Package。

| Finding | Exit Gate | Defer to Money-Path |
|---------|-----------|---------------------|
| GOV-02 | G-RC-01 | No |
| CERT-01 | G-RC-02 | No |
| CERT-02 | G-RC-03 | No |
| CERT-03 | G-RC-04 | Conditional |
| TRE-02 | M-RC-01 | **Required** |
| REG-01 | M-RC-02 | **Required** |
| REG-04 | M-RC-03 | **Required** |
| REG-05 | X-GO conditional | Yes |
| REG-03 | X-GO conditional | Yes |
| REG-02 / DOC-01 | DOC_CONSISTENCY | Yes |

**Never defer past Production GO:** TRE-02 · REG-01 · REG-04 · GOV-02 · CERT-01 · CERT-02
"""


if __name__ == "__main__":
    raise SystemExit(main())
