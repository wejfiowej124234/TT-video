# TT · Economic Constitution V3.1.1 · Target Baseline（LOCKED）

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.


**Machine:** `TT_ECONOMIC_CONSTITUTION_V3_1`  
**SSOT:** [`TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md`](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md)  
**Registry:** [`registry/traveltrust-economic-constitution-v3.1.v1.yaml`](../../registry/traveltrust-economic-constitution-v3.1.v1.yaml)  
**Recorded:** 2026-07-18T08:10:00Z · **Candidate v2 FG binding:** 2026-07-20（附录 F · 非经济）  

---

## 0 · FREEZE（Owner 裁定 · 写死）

| 项 | 值 |
|----|-----|
| **经济模型** | **V3.1.1 LOCKED** |
| **禁止** | 再改宪章经济规则 / 措辞级「小优化」冒充实质变更 |
| **V3.2 候选** | 国家六态生命周期 · Steward 月结 Claim — **附录 D only** |
| **金融级 Web3 执行基线** | **Candidate v2** · `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B（宪章 **附录 F**） |
| **Historical** | FG-15-A / clean / FCG = **NOT FOR PROMOTION** |
| **Live** | Full Alignment **NOT_PASS** · FG-15-B **RUNNING** · L5 Final **WAIT ETA** |
| **Production GO** | 不因 LOCK / Candidate 自动变 |
| **Hard Gate / Wave** | **REFUSED / FORBIDDEN**（宪章附录 F 禁止为宣称就绪而翻闸） |
| **Full Alignment** | [程序](./TT-PSG-WEB3-FULL-CONSTITUTION-ALIGNMENT-LATEST.md) · [十域 Matrix](./TT-WEB3-FULL-CONSTITUTION-GAP-MATRIX-LATEST.md) · **NOT_PASS** |
| **A1 Gap Matrix** | [TT-A1-CONTRACTS-ALIGNMENT-GAP-MATRIX-LATEST.md](./TT-A1-CONTRACTS-ALIGNMENT-GAP-MATRIX-LATEST.md) · **22 GAP / 6 PASS / 1 N/A** |

### A1 执行原则

| 原则 | 说明 |
|------|------|
| 宪章不改代码 | 不因现有代码改 V3.1.1 |
| 代码对齐宪章 | 实现以 V3.1.1 为目标 |
| 发现 Gap | 记 Backlog · 不改宪章 |
| 无法实现 | 仅 **ECP → V3.2**（须 Owner 批准） |
| 禁止双真源 | V3.1.1 = 唯一 Economic SSOT |

**PSG 纪律：** 能改实现解决 → **禁止**改 V3.1.1；仅当宪章逻辑错误或客观上无法实现 → ECP → V3.2。

```text
Economic Constitution V3.1.1 (LOCKED)
        ↓
① Full Alignment Audit → ② Gap Backlog → ③ Solution Design
        ↓
④ Implementation（合约/Registry/BE/FE/迁移/重部署/确认）
        ↓
⑤ Re-Alignment Audit → ⑥ PSG Certification
        ↓
TT_WEB3_FULL_ALIGNMENT = PASS
```

**主线 SSOT：** [TT-PSG-WEB3-ALIGNMENT-MAINLINE-LATEST.md](./TT-PSG-WEB3-ALIGNMENT-MAINLINE-LATEST.md)

---

## 1 · Alignment Ladder（唯一主线）

| Seq | 层 | Exit Criteria（摘要） |
|-----|-----|------------------------|
| A0 | **LOCK** | 本文 + Registry `economic_model_locked: true` |
| A1 | **Contracts** | Distributable 状态机 · Access Fee 退款 · Stake Min · REMOVE/Recovery · Destination 归因 · 45/55 或 100% Pool |
| A2 | **Registry** | Stake Minimum 表 · Access Fee · Country 参数 · Recovery Budget 键 |
| A3 | **Backend** | `Order.destination_country` SSOT · 服务费状态 · 退款冲正进 LOCKED 前 |
| A4 | **Frontend** | 下单：本金+服务费+Gas · 主理人申请/Fee · 禁止多国一期拆分 |
| A5 | **DAO** | 提案门槛三级 · 国别费率 · REMOVE · Inactive 重开 |
| A6 | **Evidence** | 逐 Gap 证据包 |
| A7 | **Certification** | Web3 Full Alignment PASS（另闸 Production GO） |

**禁止跳步。禁止** 对齐中途重开经济模型辩论（除非 Blocking Defect 证明 V3.1.1 不可实现 → 升 V3.2）。

---

## 2 · V3.2 Backlog（登记 · 不做）

| ID | 项 | 说明 |
|----|-----|------|
| V32-COUNTRY-FSM | 国家状态机 | APPLYING→…→OPEN_FOR_REAPPLICATION |
| V32-MONTHLY-CLAIM | Steward 收益月结 | DISTRIBUTABLE→MONTHLY_CLAIMABLE→CLAIMED |

---

## 3 · PM Bundle

A1-R1 **Track E** 可 Staging Exec（Sepolia）；Owner Sign-off **不**挡本 Bundle · 收敛至 Human Certification Gate。

---

## 4 · NEXT

**当前：** 双轨已立 · A1-R1 **ACTIVE** · Owner Sign-off **DEFERRED→Human Gate**  
**立即：** Staging Exec（`TRAVELTRUST_OWNER_PM_REMEDIATION_OK=1`）关 T-04∥T-05 · **禁止**等人签 Production  
**禁止：** 改 V3.1.1 · 用 Human Gate 挡 Staging · 假 CLOSED