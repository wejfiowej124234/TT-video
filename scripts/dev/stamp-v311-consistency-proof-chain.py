#!/usr/bin/env python3
"""Lock Consistency Proof Chain under Dual-RC + Exit Criteria v1.

Does NOT mutate Governance RC / protocol / ACTIVE / Runtime / Package.
Does NOT start Money-Path implementation.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parents[2]
EV = ROOT / "evidence/GO_v311_constitution_production_alignment_audit"
FRE = ROOT / "evidence/GO_phase2_v311_final_release"


def main() -> int:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    EV.mkdir(parents=True, exist_ok=True)
    FRE.mkdir(parents=True, exist_ok=True)

    proof = {
        "schema": "traveltrust.v311_consistency_proof_chain.v1",
        "machine_key": "TT_V311_CONSISTENCY_PROOF_CHAIN",
        "recorded_utc": now,
        "economic_ssot": "docs/spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md",
        "exit_criteria_ssot": "registry/v311-production-exit-criteria.v1.yaml",
        "exit_criteria_machine": "TT_V311_PRODUCTION_EXIT_CRITERIA_V1",
        "governance_rc_touch": "FORBIDDEN_NOW",
        "money_path_implementation": "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED",
        "layers": [
            {
                "id": "engineering_consistency",
                "status": "PROVEN",
                "how": "Keep Drift Audit=0; ACTIVE/Runtime/Registry pins consistent",
            },
            {
                "id": "deployment_consistency",
                "status": "PROVEN",
                "how": "ACTIVE addresses + Upgrade Architecture + deploy baseline",
            },
            {
                "id": "governance_process_consistency",
                "status": "IN_PROGRESS",
                "how": "Complete Governance RC G-RC-01..05",
                "gate": "G-RC-05",
                "current": "FROZEN_WAITING_EXECUTE",
            },
            {
                "id": "money_path_consistency",
                "status": "NOT_PROVEN",
                "how": "Implement TRE-02/REG-01/REG-04 then Money-Path Re-Audit PASS",
                "gate": "M-RC-04",
                "sole_p0": ["TRE-02", "REG-01", "REG-04"],
                "note": "Missing implementation — audits alone cannot PASS",
            },
            {
                "id": "constitution_full_alignment",
                "status": "NOT_PROVEN",
                "how": "Re-run Constitution Production Alignment Audit after Money-Path CLOSED",
                "current_verdict": "FAIL",
            },
            {
                "id": "production_go",
                "status": "NOT_PROVEN",
                "how": "All Exit Criteria gates including X-GO",
                "gate": "X-GO",
            },
        ],
        "canonical_sequence": [
            "Governance_RC_CLOSED",
            "Money_Path_RC_IMPLEMENT_TRE02_REG01_REG04",
            "code_contracts_runtime_registry_wiring",
            "testnet_deploy",
            "onchain_money_flow_verify",
            "Function_Product_UI_regression",
            "Money_Path_Re_Audit_PASS",
            "Constitution_Production_Alignment_Audit_PASS",
            "Exit_Criteria_all_gates",
            "Production_GO",
        ],
        "honesty": {
            "money_path_is_implement_then_prove": True,
            "more_audits_without_fix_cannot_pass": True,
            "fee_router_distributable_changes_are_consistency_implementation": True,
        },
        "post_governance_closed_plan": {
            "ssot": [
                "TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL",
                "TT_V311_PRODUCTION_EXIT_CRITERIA_V1",
            ],
            "order": [
                "M-RC-00 START + OPT-A/B lock",
                "TRE-02 implement + verify (M-RC-01)",
                "REG-01 implement + verify (M-RC-02)",
                "REG-04 implement + verify (M-RC-03)",
                "Function/Product/UI regression (money-path slice)",
                "M-RC-04 Money-Path Re-Audit PASS",
                "Constitution Audit FAIL -> PASS (no new Blocking)",
                "P0/P1/Drift/Conflict = 0",
                "X-FREEZE then X-GO",
            ],
            "do_not_touch_governance_rc": True,
        },
        "tt_v311_consistency_proof_chain": "LOCKED",
    }

    for dest in (EV, FRE):
        (dest / "CONSISTENCY-PROOF-CHAIN-LATEST.json").write_text(
            json.dumps(proof, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    md = f"""# Consistency Proof Chain · Dual-RC + Exit Criteria v1

**Machine:** `TT_V311_CONSISTENCY_PROOF_CHAIN`  
**Recorded:** `{now}`  
**Economic SSOT:** Constitution V3.1.1 Final  
**Exit Criteria:** `TT_V311_PRODUCTION_EXIT_CRITERIA_V1`  
**Governance RC touch now:** **FORBIDDEN**  
**Money-Path implement now:** **BLOCKED** until Governance RC **CLOSED**

---

## 0 · Layer map

| Target | Status | How to prove |
|--------|--------|--------------|
| Engineering consistency | **PROVEN** | Drift Audit=0 · ACTIVE/Runtime/Registry pins |
| Deployment consistency | **PROVEN** | ACTIVE addresses · Upgrade Architecture · baseline |
| Governance process consistency | **IN_PROGRESS** | Exit Criteria Governance RC (G-RC-01..05) |
| Money-Path consistency | **NOT_PROVEN** | Implement TRE-02/REG-01/REG-04 → Re-Audit PASS |
| Constitution Full Alignment | **NOT_PROVEN** | Constitution Audit FAIL→PASS after Money-Path CLOSED |
| Production GO | **NOT_PROVEN** | All Exit Criteria gates (X-GO) |

**Critical unproven:** Money-Path · Constitution Full Alignment · Production GO.

---

## 1 · Honesty (hard)

TRE-02 / REG-01 / REG-04 are **unfinished implementation**, not missing evidence.  
Re-running audits alone cannot turn `FAIL` into `PASS`.

If Money-Path changes FeeRouter / Distributable / protocol logic: that is **implement consistency first**, then prove it.

---

## 2 · Canonical proof chain

```text
Governance RC CLOSED
        ↓
Money-Path RC implement (TRE-02 → REG-01 → REG-04)
  · code
  · contracts / Runtime / Registry wiring
  · testnet deploy
  · on-chain money-flow verify
  · Function / Product / UI regression
        ↓
Money-Path Re-Audit = PASS   (M-RC-04)
        ↓
Constitution Production Alignment Audit = PASS
        ↓
Exit Criteria all gates
        ↓
Production GO
```

---

## 3 · After Governance CLOSED (only then)

| Step | Gate / action | Finding |
|------|---------------|---------|
| 1 | M-RC-00 START + OPT-A/B lock | — |
| 2 | Implement + verify | TRE-02 |
| 3 | Implement + verify | REG-01 |
| 4 | Implement + verify (bundle TRE-02) | REG-04 |
| 5 | Function/Product/UI regression | — |
| 6 | M-RC-04 Money-Path Re-Audit PASS | — |
| 7 | Constitution Audit FAIL→PASS | no new Blocking |
| 8 | P0/P1/Drift/Conflict = 0 → X-FREEZE → X-GO | — |

---

## 4 · Current discipline

| Rule | Value |
|------|-------|
| Mutate Governance RC | **FORBIDDEN** |
| Start Money-Path implementation | **FORBIDDEN** (wait CLOSED) |
| Design / checklist polish | Allowed |
| Fake PASS / audit-as-implementation | **FORBIDDEN** |

JSON: [`CONSISTENCY-PROOF-CHAIN-LATEST.json`](./CONSISTENCY-PROOF-CHAIN-LATEST.json)
"""
    for dest in (EV, FRE):
        (dest / "CONSISTENCY-PROOF-CHAIN-LATEST.md").write_text(md, encoding="utf-8")

    # Additive pointer on exit criteria registry
    reg = ROOT / "registry/v311-production-exit-criteria.v1.yaml"
    text = reg.read_text(encoding="utf-8")
    if "consistency_proof_chain:" not in text:
        text = (
            text.rstrip()
            + """

# Locked proof chain (Dual-RC honesty)
consistency_proof_chain:
  machine_key: TT_V311_CONSISTENCY_PROOF_CHAIN
  human: evidence/GO_v311_constitution_production_alignment_audit/CONSISTENCY-PROOF-CHAIN-LATEST.md
  sequence:
    - Governance_RC_CLOSED
    - Money_Path_RC_IMPLEMENT_TRE02_REG01_REG04
    - Money_Path_Re_Audit_PASS
    - Constitution_Production_Alignment_Audit_PASS
    - Exit_Criteria_all_gates
    - Production_GO
  honesty:
    money_path_is_implement_then_prove: true
    audits_alone_cannot_pass_money_path: true
  governance_rc_mutate_now: FORBIDDEN
  money_path_implement_now: BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED
"""
        )
        reg.write_text(text + "\n", encoding="utf-8")

    if yaml is not None:
        yaml.safe_load(reg.read_text(encoding="utf-8"))

    # Runbook §0.1
    rb = ROOT / "docs/runbook/TT-V311-PRODUCTION-EXIT-CRITERIA-V1-LATEST.md"
    rt = rb.read_text(encoding="utf-8")
    if "## 0.1 · Consistency Proof Chain" not in rt:
        insert = """
## 0.1 · Consistency Proof Chain（锁定）

**机读：** [`CONSISTENCY-PROOF-CHAIN-LATEST.md`](../../evidence/GO_v311_constitution_production_alignment_audit/CONSISTENCY-PROOF-CHAIN-LATEST.md) · `TT_V311_CONSISTENCY_PROOF_CHAIN`

| 层 | 状态 |
|----|------|
| 工程 / 部署一致性 | PROVEN |
| 治理流程一致性 | IN_PROGRESS（Governance RC） |
| 资金路径一致性 | NOT_PROVEN（须 **实施** TRE-02/REG-01/REG-04） |
| Constitution Full Alignment | NOT_PROVEN（Re-Audit PASS 后） |
| Production GO | NOT_PROVEN |

```text
Governance CLOSED → Money-Path 实施 → Money-Path Re-Audit PASS
  → Constitution Audit PASS → Exit Criteria 全过 → Production GO
```

**诚实：** Money-Path 三项是未完成实现，不是缺审计证据。当前 **禁止** 改 Governance RC；Money-Path 实施 **仅** 在 Governance CLOSED 后启动。

"""
        idx2 = rt.find("## 1 ·")
        if idx2 > 0:
            rb.write_text(rt[:idx2] + insert + rt[idx2:], encoding="utf-8")

    # Money-Path charter stamp
    ch = EV / "MONEY-PATH-RC-CHARTER-LATEST.json"
    if ch.exists():
        c = json.loads(ch.read_text(encoding="utf-8"))
        c["proof_chain"] = "TT_V311_CONSISTENCY_PROOF_CHAIN"
        c["implement_sequence_locked"] = proof["canonical_sequence"]
        c["status"] = "REGISTERED_NOT_STARTED"
        c["implementation_status"] = "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        c["recorded_utc"] = now
        c["post_start_required"] = proof["post_governance_closed_plan"]["order"]
        ch.write_text(json.dumps(c, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Dual board
    for p in (
        EV / "DUAL-RC-TRACK-BOARD-LATEST.json",
        FRE / "DUAL-RC-TRACK-BOARD-LATEST.json",
    ):
        if not p.exists():
            continue
        d = json.loads(p.read_text(encoding="utf-8"))
        d["consistency_proof_chain"] = "TT_V311_CONSISTENCY_PROOF_CHAIN"
        d["governance_rc_mutate_now"] = "FORBIDDEN"
        d["money_path_implement_now"] = "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED"
        d["recorded_utc"] = now
        p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Remediation checklist gate reminder
    cl = EV / "MONEY-PATH-RC-REMEDIATION-CHECKLIST-LATEST.json"
    if cl.exists():
        checklist = json.loads(cl.read_text(encoding="utf-8"))
        checklist["proof_chain"] = "TT_V311_CONSISTENCY_PROOF_CHAIN"
        checklist["implementation_blocked_until"] = "GOVERNANCE_RC_CLOSED"
        checklist["recorded_utc"] = now
        checklist["note"] = (
            "Implement TRE-02/REG-01/REG-04 only after Governance CLOSED; "
            "then Re-Audit until Constitution FAIL->PASS"
        )
        cl.write_text(
            json.dumps(checklist, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
        )

    print(
        json.dumps(
            {
                "proof_chain": "LOCKED",
                "governance_touch": "FORBIDDEN",
                "money_path_implement": "BLOCKED_UNTIL_GOVERNANCE_RC_CLOSED",
                "critical_unproven": [
                    "money_path_consistency",
                    "constitution_full_alignment",
                    "production_go",
                ],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
