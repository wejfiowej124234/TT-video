# Batch-14 · COLLECTIVE FIX IN PROGRESS · LATEST

**Machine:** `TT_ADMIN_BATCH14_COLLECTIVE_FIX`  
**Stamp:** `20260726T122000Z`  
**Status:** **`FIX_IN_PROGRESS`** · `FREEZE_UNLOCK: true`（**仅**本批集体改 · tip/HG/Cutover/GO **仍 LOCKED**）  
**Patch:** `PATCH-STG-019`  
**Working bake:** Web+API **`5d73c50d…` ALIGNED** · FP-E markers **8/8** · tip cite `ea71c577…` **IMMOBILE**  
**Sole worklist:** [`ADMIN-RELEASE-REALITY-AUDIT`](./TT-BATCH14-ADMIN-RELEASE-REALITY-AUDIT-LATEST.md) **NEED_FIX · 144/200**  
**PCR:** [`PCR-20260726-BATCH14-COLLECTIVE-FIX`](../../registry/psg-change-records/PCR-20260726-BATCH14-COLLECTIVE-FIX.json) · Web fresh bake [`PCR-20260726-BATCH14-STAGING-WEB-FRESH-BAKE`](../../registry/psg-change-records/PCR-20260726-BATCH14-STAGING-WEB-FRESH-BAKE.json)  
**L2 probe:** [`evidence/GO_batch14_collective_fix/L2-RUNTIME-PROBE-LATEST.json`](../../evidence/GO_batch14_collective_fix/L2-RUNTIME-PROBE-LATEST.json) · **`l2_runtime_align: PASS`**（users/orders/disputes `meta.source=postgres`）  
**FP-E:** [`REALITY-FP-E-RECHECK-LATEST.json`](../../evidence/GO_batch14_collective_fix/REALITY-FP-E-RECHECK-LATEST.json) · **8/8** on bake `5d73c50d`  
**Open recording:** [`BATCH14-OPEN`](./TT-BATCH14-OPEN-RECORDING-LATEST.md) → 本包接管施工  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ 新功能 · ≠ 假关 HU-495/487/490 · ≠ 重新设计 Web3**

---

## 0 · Owner 口令

**「开始第十四批集体改」** — 严格以 Reality Audit NEED_FIX 为唯一施工清单；Baseline 不一致修复；P0→P1→P2。

---

## 0.1 · 对齐阶梯（写死 · 非重设计 Web3）

本批 **不是**「重新设计 Web3」。协议唯一基线已冻结为 **Candidate v2**；施工只做 **实现对齐 → 数据真实 → 展示真实 → 证据 → 再认证**：

```text
Candidate v2
（Web3 协议唯一基线 · pin PSG-REL-20260720-WEB3-CAND-V2）
        ↓
API / Backend 实现对齐
（读源 / meta.source / 禁 memory 裂脑签收）
        ↓
Runtime 数据真实
（Staging Web bake ↔ API build 对齐 · PG 正式库）
        ↓
Admin 展示真实
（叶页 fail-closed 灯变绿仅当 meta.source=postgres）
        ↓
Evidence 验证
（Staging 探针 · 截图 · 评分更新 · ①≠②≠③）
        ↓
Final Truth Recertify
（全通后 · tip ea71c577 IMMOBILE · 同步 Product/Eng/Inventory/Reality/Integrity · ≠ Production GO）
```

| 阶 | 含义 | 本批动作 |
|----|------|----------|
| **L0 Candidate v2** | 协议唯一基线 | **cite-only** · 不改协议 · 不扩 HU 出 568～577 |
| **L1 API/Backend** | 实现对齐 | W1：users/orders/disputes PG-first + `meta.source` |
| **L2 Runtime** | 数据真实 | W1 部署：API bake 追上 Web · HU-568 |
| **L3 Admin 展示** | 展示真实 | W1+W2：源灯诚实 · 对比度可读 |
| **L4 Evidence** | 验证 | W5：Staging 探针/截图/评分 |
| **L5 Recertify** | Final Truth | W6：**全通后**才跑 · HG/Cutover/GO 仍 LOCKED |

**禁止：** 用本批开新 Web3 功能面 · 用 Admin UI 美化冒充协议变更 · 用 ① 本地绿冒充 L4/L5。

---

## 1 · 施工序（写死）

| Wave | 范围 | HU / 簇 | 状态 |
|------|------|---------|------|
| **W1 P0 数据** | Web/API 对齐 · disputes/orders/users `meta.source` · 去 memory 裂脑 · 向导 PG（HU-491） | 568 · 569 · 570 · 491 | **568/569/491 CLOSED** · 570 PARTIAL（三叶） |
| **W2 P0 UI** | 暗色对比度残差 | contrast_cluster | **CODE PASS** · visual recheck CODE_PASS（Web 叶页待 redeploy） |
| **W3 P1** | 财务导航 · guides 三角 · 多身份 · 权限矩阵 | 571～574 | **571 CODE** · **572 CLOSED** · **573 CLOSED** · **574 CLOSED**（ADM-U01 102/102） |
| **W4 P2** | 响应式 · PAGE_SURFACE ED · 空态 | 575～577 | **575 CLOSED** · **576 ED** · 577 pending redeploy |
| **W5** | Staging 验证 · 证据 · 评分 | — | **L2 PASS** · FP-E **8/8** · Web/API **`5d73c50d` ALIGN** · L4 评分 **144/200** · 仍 NEED_FIX |
| **W6** | Final Truth Recertify | — | **DEFERRED**（prep only · ≠ 本轮签收） |

**验收授权（本会话）：** HU-**495** · **487** · **490** — **证据未达 30/30·40/40 → 闸仍 OPEN（禁止假关）**  
**本轮基线码（① · 待二次 Web bake）：** Q3 `idType` 幽灵清 · Q6 域灯 `neutral` · Q5 steward 诚实空 · Q1-D 档案监管≠主审 · Q2-B avatar · Q3-B 时薪档案标注

---

## 2 · 纪律

| 项 | 值 |
|----|-----|
| tip cite | `ea71c577…` **IMMOBILE** |
| Hard Gate / Cutover / GO | **LOCKED** / **LOCKED** / **NO_GO** |
| `FINANCE_WRITE` | **FORBIDDEN** |
| 新 HU 范围 | **禁止**扩至 578+（除非 Owner 另开） |
| 假满分 / Production GO 宣称 | **禁止** |

```text
TT_ADMIN_BATCH14_COLLECTIVE_FIX: IN_PROGRESS
TT_ADMIN_BATCH14_FREEZE_UNLOCK: true
TT_ADMIN_BATCH14_PATCH: PATCH-STG-019
TT_ADMIN_BATCH14_LADDER: Candidate_v2→API→Runtime→Admin→Evidence→Recertify
TT_ADMIN_BATCH14_NOT_WEB3_REDESIGN: true
TT_ADMIN_BATCH14_WORKING_BAKE: 5d73c50d
TT_ADMIN_BATCH14_WEB_API_ALIGN: PASS
TT_ADMIN_BATCH14_FP_E_MARKERS: 8/8
TT_ADMIN_BATCH14_L1: PASS
TT_ADMIN_BATCH14_L2: PASS
TT_ADMIN_BATCH14_L3: CODE_DEPLOYED_PARTIAL_VERIFY
TT_ADMIN_BATCH14_L4: PARTIAL_144_200_NEED_FIX
TT_ADMIN_BATCH14_L5: DEFERRED
TT_ADMIN_BATCH14_SCORE: 144/200
TT_ADMIN_BATCH14_HU_574: CLOSED
TT_ADMIN_BATCH14_HU_495: OPEN
TT_ADMIN_BATCH14_HU_487: OPEN
TT_ADMIN_BATCH14_HU_490: OPEN
TT_ADMIN_BATCH14_TIP: ea71c577_IMMOBILE
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
```
