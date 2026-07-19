# TT · PSG Production Completion Matrix（统一终局矩阵）

**Machine:** `TT_PSG_PRODUCTION_COMPLETION_MATRIX`  
**Status:** **ACTIVE_SSOT · FRAMEWORK_FROZEN · WAIT_WINDOW_NARROW** · `2026-07-19`  
**机读：** [`registry/psg-production-completion-matrix.v1.yaml`](../../registry/psg-production-completion-matrix.v1.yaml)  
**Definition：** [Completion Definition](./TT-PSG-PRODUCTION-COMPLETION-DEFINITION-LATEST.md)  
**Constitution：** [V3.1.1 · PSG Completion](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md#psg-production-completion)

```text
PSG Complete = L1 ∧ L2 ∧ L3 ∧ L4 ∧ L5 全部 PASS
任何单层 PASS ≠ PSG Complete

双闸（均未过 → 禁止金融协议部署）:
  G-RC   = 治理授权 · 现 WAITING_EXECUTE
  CDR-19 = 发布真实性 · 现 NOT_STARTED（等 G-RC）
Clean Deploy: LOCKED · PSG Completion: NOT_STARTED
WAIT_WINDOW HOLD · 无新增工作 · dirty/commit/SHA 均不动
防: 测A / 部署B / 证据C
```

---

## 0 · 统一五层

```text
TT_PSG_PRODUCTION_COMPLETION_MATRIX

Layer 1 Product
 ├ User Journey · Market · Provider · Order · CMS · Admin

Layer 2 Data
 ├ DB · API · UI · Consistency

Layer 3 Security
 ├ RBAC · Wallet · Auth · Permission

Layer 4 Operations
 ├ Monitoring · Incident · CMS Ops · Recovery

Layer 5 Financial-Grade Web3
 ├ Money Path · Escrow · Settlement · FeeRouter · Distributable
 ├ Steward Revenue · Treasury · Governance · Timelock
 ├ Wallet Security · Indexer · Reconciliation · Audit · 48H
```

| Layer | 诚实态 |
|-------|--------|
| L1–L4 | PARTIAL / NEED_FIX（旁证可有 · **不**推导 Complete） |
| L5 FG-Web3 | **NOT_READY** |
| **PSG Complete** | **否** |

---

## 1 · WAIT_WINDOW（窄范围）

| 允许 | 禁止 |
|------|------|
| G-RC Execute 准备（heartbeat / S1 arm / Close bundle） | 新增 Coverage 维 |
| Clean Deploy Ready 状态维护 | 新增 Capability 维 |
| | Money-Path / Settlement 广播 |
| | ACTIVE 翻转 |
| | FGCASE 实证 |
| | 单层 PASS 宣称 PSG Complete |

---

## 2 · G-RC CLOSED 后 · 唯一主链（写死）

```text
G-RC CLOSED
        ↓
⓪ CDR-19 Release Identity Closure
   （Production Certification 硬条件 · 非工程习惯）

   1 Dirty Audit
        ↓
   2 Change Classification
        ├── Release
        ├── Temp
        ├── Evidence
        └── Reject/Delete
        ↓
   3 Commit（仅确认后的 Release Scope）
        ↓
   4 Release SHA Pin
        ↓
   5 Artifact Binding（含 contract build output）
        ↓
   6 Evidence Manifest Binding
        ↓
   CDR-19 PASS
        ↓
① fcg_full_capability_v2_sepolia CLEAN Deploy
        ↓
② TT_PSG_PRODUCTION_COMPLETION_MATRIX L1–L5
        ↓
Completion Recalculate → Production Certification
```

**等价链（金融级审计硬要求）：**
```text
Source SHA = Deploy Artifact = Contract Bytecode = Evidence Package
```

**核心：** 证明部署物 = 已审版本 · **不是**「Git 看起来干净」。  
**禁止：** G-RC CLOSED 前清理 dirty（会丢待审变更 / 混入非本版修改 / 破坏 SHA 审计链）。  
**正确：** 先分类，再提交。  
**硬闸：** CDR-19 ❌ → **禁止** Clean Deploy。  
**WAIT_WINDOW：** 零发布动作 · dirty **保持不动**。

---

## 3 · 推导禁令

| 禁止推导 |
|----------|
| L1 PASS → PSG Complete |
| L2 / Web2 Measurement PASS → PSG Complete |
| L3 局部 / RBAC 切片 → PSG Complete |
| L4 Ops 局部 → PSG Complete |
| L5 PREP_READY / Case staged / 部分 FGCASE → PSG Complete |
| 任意单层 PASS → PSG Complete |

**仅当五层全部 PASS 且本矩阵 Recalculate 通过，方可宣称 PSG Complete。**

---

## 4 · 工程纪律（唯一出口 · 禁止平行体系）

| 禁止再产生 | 原因 |
|------------|------|
| Coverage Matrix v3 | 已有唯一出口 |
| New Capability Matrix | 已有唯一出口 |
| New Audit Dimension | 已有唯一出口 |
| 第六 / 第七套体系 | **禁止** |

**唯一出口：** `TT_PSG_PRODUCTION_COMPLETION_MATRIX`

**新发现问题只能归类为：**

| Gap 类 | 落点 |
|--------|------|
| L1 Product Gap | Layer 1 |
| L2 Data Gap | Layer 2 |
| L3 Security Gap | Layer 3 |
| L4 Operations Gap | Layer 4 |
| L5 FG-Web3 Gap | Layer 5 |

---

## 5 · 项目阶段（写死）

```text
之前:  Build Phase → Feature Validation
现在:  Protocol Assurance Phase
         → Financial-Grade Verification
         → Production Certification
```

**WAIT_WINDOW 价值：** 把 G-RC 解锁后的唯一主链准备到 **一次运行**，避免反复返工。  
本窗只维护：G-RC Execute 准备 · Clean Deploy Ready。
