# Batch-13 · FP-B · 能力挡板（HU-491 / HU-493）· LATEST

**Machine:** `TT_ADMIN_BATCH13_FP_B_CAPABILITY_BLOCKERS`  
**Stamp:** `20260726T080500Z`  
**Status:** **FP-B_CODE_LANDED · ① 编译/机读绿 · ② Staging C-01… 待**  
**HUs (code path):** **491**（向导审卡 PG SSOT）· **493**（概况真数 / 签收空诚实）  
**Related (partial):** **481**（guides `total`+`source=postgres`）· **Q2-C**（`passport_hash_present`）  
**Patch:** `PATCH-STG-017`  
**≠ tip 移动 · ≠ Hard Gate unlock · ≠ Cutover · ≠ Production GO · ≠ FINANCE_WRITE**  
**≠ Q1/Q6 满分宣称**（须 ② Staging 证据）

---

## 1 · HU-491 · 向导审查 PG SSOT

| 步 | 动作 | ① 状态 |
|----|------|--------|
| Q1-A | `GET …/guide-application` 有 `db_pool` → `select_latest_guide_for_user`；失败 **503**（禁 silent memory） | **CODE** |
| Q1-B | `PATCH` 审核：先 `update_guide_registration_review` + 批准时 `update_user_role_if_safe`；memory 仅 best-effort 同步 | **CODE** |
| Q2-C | 响应 `passport_hash_present` · FE 诚实行「哈希存证 · 以证件照核对」 | **CODE** |
| Q1-D～G | 主审面统一 / 状态词 / Staging 截图 | **PENDING · ② / 续 FP-B 尾或 CAP-W** |

**锚：** `crates/api/src/chain_off/guide_profile.rs` · `crates/api/src/db/guides.rs` · `AdminGuideApplicationReviewCard.tsx`

---

## 2 · HU-493 · 概况真数 / 签收空

| 步 | 动作 | ① 状态 |
|----|------|--------|
| Q6-A | `GET /admin/guides` PG 列表 · `total` + `meta.source=postgres`；失败 503 | **CODE** |
| Q6-B | orders/disputes：PG `COUNT` → `total` · `meta.source`；`items_source=memory` 诚实 | **CODE** |
| Q6-D | 概况「本页数值源」折叠 | **CODE** |
| 设计空 | guides `total=0` →「暂无向导」≠「暂无统计」 | **CODE** |
| Q6-C/E/F | 域灯设计未部署 / 特权比 / Staging 截图 | **PENDING · ② / 续 HU-478·480** |

**锚：** `admin_guides_http.rs` · `get_admin_orders` / `get_admin_disputes` · `useAdminHomeKpi` / `fetchAdminQueueList` · `AdminHomeSystemOverview.tsx`

---

## 3 · 验收（本波）

| 项 | 状态 |
|----|------|
| `cargo check -p traveltrust-api` | **PASS（①）** |
| `adminHomeKpiMetric` + 相关 vitest | 见本波机读 |
| tip `ea71c577` | **未动** |
| Hard Gate / Cutover / Production GO | **LOCKED / NO_GO** |
| Staging 向导批准端到端 + 概况 source 截图 | **PENDING（②）** |

---

## 4 · 下一波

**FP-C** · 订单 → 财务只读 → 配置（Owner 开闸后）— 见 [`FAST-PATH`](./TT-BATCH13-FAST-PATH-REMEDIATION-PLAN-LATEST.md)

```text
TT_ADMIN_BATCH13_FP_B: CODE_LANDED
TT_ADMIN_BATCH13_FP_B_STAGING: PENDING
TT_ADMIN_BATCH13_NEXT: FP_C
TT_ADMIN_BATCH13_TIP: ea71c577_IMMOBILE
TT_HARD_GATE_LOCKED: true
TT_CUTOVER_LOCKED: true
TT_PRODUCTION_GO: NO_GO
TT_FINANCE_WRITE: FORBIDDEN
```
