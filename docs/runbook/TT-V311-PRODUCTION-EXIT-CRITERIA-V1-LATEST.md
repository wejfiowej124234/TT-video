# TT · Production Exit Criteria v1（Dual-RC）

**Machine:** `TT_V311_PRODUCTION_EXIT_CRITERIA_V1`  
**Version:** `1.1.0` · **Status:** `ACTIVE_SSOT` · **Immutable Exit Gates**  
**Registry:** [`registry/v311-production-exit-criteria.v1.yaml`](../../registry/v311-production-exit-criteria.v1.yaml)  
**Economic SSOT (sole):** [`TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md`](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md)  
**PSG Completion：** [`TT_PSG_PRODUCTION_COMPLETION_DEFINITION`](./TT-PSG-PRODUCTION-COMPLETION-DEFINITION-LATEST.md)  
**Dual-RC board:** [`DUAL-RC-TRACK-BOARD-LATEST.md`](../../evidence/GO_v311_constitution_production_alignment_audit/DUAL-RC-TRACK-BOARD-LATEST.md)  
**Alignment policy:** [`TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md`](./TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)  
**Recorded:** `2026-07-19T09:30:00Z`（v1.1.0 · FG-Web3 强制纳入 Completion）

> 后续所有审计、认证与发布 **必须** 引用本 Exit Criteria **与** PSG Production Completion Definition。  
> **本文件不**自动等于 Production GO。  
> **未**改协议 · ACTIVE 地址矩阵 · Runtime · Package LOCK · **未**改经济数字。  
> **PSG 全部完成** = Product ∧ Data ∧ Security ∧ Operations ∧ **Financial-Grade Web3**；**禁止** Web2 Coverage 单独充当完成标准。

---

## 0 · Dual-RC 与退出原则（写死）

| Track | 当前 | 退出产物 |
|-------|------|----------|
| **A Governance RC** | `CONTINUE_CURRENT_RC` · `FROZEN_WAITING_EXECUTE` | G-RC-01…05 → **Governance RC CLOSED** |
| **B Money-Path RC** | `REGISTERED_NOT_STARTED` | M-RC-00…04 → **Money-Path Alignment PASS** |
| **FG-Web3** | NOT_READY | Full Capability Gate · FG-01…15 全 PASS |
| **PSG 汇聚** | NOT_CLAIMED | 五柱 PASS → X-FREEZE → **X-GO** |

```text
Constitution V3.1.1 (LOCK) + PSG Completion Binding (FG-Web3 mandatory)
        │
        ├─ Governance RC (G-RC-*)
        │     Execute → Function 54/0/0 → UI Full → Product → CLOSED
        │     (LOCK-1: Product PASS 必须消费 Function + UI 最终证据)
        │     DEFER money-path P0 = TRE-02 · REG-01 · REG-04
        │
        ├─ Money-Path RC (M-RC-*)
        │     START only after Governance CLOSED
        │     TRE-02 · REG-01 · REG-04 → Re-Audit PASS
        │
        ├─ Financial-Grade Web3 Gate (Full Capability)
        │     Money-Path · Escrow SM · SettlementRouter · FeeRouter · Distributable
        │     · Steward · Treasury · TTG · Timelock · Wallet · RBAC · Indexer
        │     · On-chain/DB/UI · Audit Evidence · 48H Observation
        │
        └─ X-FREEZE → X-GO (Production GO)
              X-GO HARD requires M-RC-04 PASS ∧ FG-Web3 PASS ∧ 五柱 Completion
```

**禁止：** 把 TRE-02/REG-01/REG-04 混入 Governance RC 退出宣称。  
**禁止：** 用 ACCEPT 替代 Constitution Violation / Blocking Risk 的 FIX。  
**禁止：** docs-only 假 PASS。  
**禁止：** 仅 Web2 Coverage / Measurement FINAL 宣称 PSG 完成或 X-GO。

---


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
| Financial-Grade Web3 | **FG-01…15 PASS**（Full Capability Gate · **不可**用 Web2 Coverage 替代） |
| PSG Completion | **Product ∧ Data ∧ Security ∧ Operations ∧ FG-Web3** 全 PASS |
| Alignment | Blocking/P0/P1/Drift/Conflict = 0 |
| PSG Cert | Production Cert PASS · Freeze PASS · P10.5 PASS · W5 Sign-off |

**X-FREEZE：** 可 Owner 书面延期 Money-Path，**仅当**不宣称资金对齐且 **X-GO 仍被 M-RC-04 / FG-Web3 阻塞**。

**禁止：** `X-GO` /「PSG 完成」= Web2 Coverage PASS only。

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

1. 一切 Production-Grade / Constitution Audit **必须 cite** `TT_V311_PRODUCTION_EXIT_CRITERIA_V1` **与** `TT_PSG_PRODUCTION_COMPLETION_DEFINITION`  
2. Finding 对照 `findings_map` + Truth Classification  
3. Dual-RC 隔离强制  
4. PASS/FAIL 只认 Gate `pass_requires` / `fail_if` + Required Evidence  
5. 「PSG 是否完成」**默认**含 Financial-Grade Web3；**禁止** Web2 Coverage 单独 PASS

---

## 6 · 当前快照

| Gate | 状态 |
|------|------|
| G-RC-01 | OPEN（GOV-02 Queued） |
| G-RC-02…05 | OPEN |
| M-RC-* | NOT_STARTED（P0 已延期登记） |
| X-FREEZE / X-GO | NOT_CLAIMED |
