# Batch-14 · COLLECTIVE FIX IN PROGRESS · LATEST

**Machine:** `TT_ADMIN_BATCH14_COLLECTIVE_FIX`  
**Stamp:** `20260726T103700Z`  
**Status:** **`FIX_IN_PROGRESS`** · `FREEZE_UNLOCK: true`（**仅**本批集体改 · tip/HG/Cutover/GO **仍 LOCKED**）  
**Patch:** `PATCH-STG-019`  
**Working bake:** `2f943f3f…` API · Web still `a6f481c3…` until redeploy（tip cite `ea71c577…` **IMMOBILE**）  
**Sole worklist:** [`ADMIN-RELEASE-REALITY-AUDIT`](./TT-BATCH14-ADMIN-RELEASE-REALITY-AUDIT-LATEST.md) **NEED_FIX**  
**PCR:** [`PCR-20260726-BATCH14-COLLECTIVE-FIX`](../../registry/psg-change-records/PCR-20260726-BATCH14-COLLECTIVE-FIX.json)  
**L2 probe:** [`evidence/GO_batch14_collective_fix/L2-RUNTIME-PROBE-LATEST.json`](../../evidence/GO_batch14_collective_fix/L2-RUNTIME-PROBE-LATEST.json) · **`l2_runtime_align: PASS`**（users/orders/disputes `meta.source=postgres`）  
**Open recording:** [`BATCH14-OPEN`](./TT-BATCH14-OPEN-RECORDING-LATEST.md) → 本包接管施工  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ 新功能 · ≠ 关闭 HU-495/487/490 · ≠ 重新设计 Web3**

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
| **W3 P1** | 财务导航 · guides 三角 · 多身份 · 权限矩阵 | 571～574 | **571 CODE** · **572 CLOSED** · 573 pending redeploy · **574 BLOCKED_PROVISION** |
| **W4 P2** | 响应式 · PAGE_SURFACE ED · 空态 | 575～577 | **575 CLOSED** · **576 ED** · 577 pending redeploy |
| **W5** | Staging 验证 · 证据 · 评分 | — | **L2 PASS** · L4 评分 **134/200** · 仍 NEED_FIX |
| **W6** | Final Truth Recertify | — | **DEFERRED**（≠ 本轮签收） |

**禁止本轨关闭：** HU-**495** · **487** · **490**（另口令）

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
TT_ADMIN_BATCH14_WORKING_BAKE: 2f943f3f
TT_ADMIN_BATCH14_L1: PASS
TT_ADMIN_BATCH14_L2: PASS
TT_ADMIN_BATCH14_L3: CODE_DEPLOYED_PARTIAL_VERIFY
TT_ADMIN_BATCH14_L4: PARTIAL_122_200_NEED_FIX
TT_ADMIN_BATCH14_L5: DEFERRED
TT_ADMIN_BATCH14_TIP: ea71c577_IMMOBILE
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
```
