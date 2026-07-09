# 171 · BE-RS-01 RegionShare Reconcile Implementation Report

> **Sprint**：170-B · **BE-RS-01 RegionShare Reconcile**  
> **基线**：[170 审计报告](./170-Business-Expansion-Sprint169-RS-DAO-Enterprise-Audit-Report.md) · [167 企业差距审计](./167-Business-Expansion-Enterprise-Gap-Audit-Report.md)  
> **纪律**：133 Growth Freeze · **不碰** DAO Governance UAT（BE-DAO-01 暂缓）· FRD/GCM 已 GO（168-B）· 无 Product/UI 页面验收扩 scope  
> **阶段**：① 本地 gate **GO** · ② Sepolia live job 模板就绪  
> **日期**：2026-06-08  
> **Gate**：`bash scripts/dev/run-sprint170-be-rs01-implementation-gate.sh`

---

## 1. Executive Verdict

| 轨道 | P0 ID | 裁定 | 自动化（170 目标 ≥75%） |
|------|-------|------|-------------------------|
| **RegionShare Reconcile** | BE-RS-01 | **BE_RS_01_GO** | **78%**（RS-R01–R07 机读闭环） |

**Combined**：`TT_SPRINT170_BE_RS_01: IMPLEMENTATION_GO`

**DAO**：BE-DAO-01 **未在本 Sprint 实施**（按 170-B scope lock 暂缓至 RegionShare 完成后独立 Sprint）。

---

## 2. 交付物索引

| 类别 | 路径 |
|------|------|
| Reconcile engine | `crates/api/src/db/region_share_reconcile_ops.rs` |
| P5 stats 补齐 | `crates/api/src/db/p5_country_ledger.rs` · `p5_country_ledger_lines_stats` |
| Internal API | `POST /api/v1/internal/region-share-reconcile` |
| Admin API | `GET …/admin/region-share/reconcile/latest` · `…/reports` · `…/reports/:id` |
| Admin UI | `/admin/region-share/reconcile` |
| Observability | `overview.region_share_projection_closure_observability` |
| Ops job | `scripts/ops/region-share-reconcile.sh` |
| Cron | `scripts/ops/region-share-reconcile-cron.sh` |
| Gate | `scripts/dev/run-sprint170-be-rs01-implementation-gate.sh` |
| Smoke | `scripts/dev/smoke-region-share-reconcile-p0-local.sh` |
| Evidence | `evidence/GO_BE_RS_01/` |

---

## 3. RS-R04–R07 闭环

| Check | 实现 | 结果 |
|-------|------|------|
| **RS-R04** 金额三角 | `amount_triangle` · FeeRouter `to_country` ↔ Vault forwarded ↔ P5 credits | **PASS**（marker 机读） |
| **RS-R05** Snapshot epoch | `epoch_reconcile` · `distinct_snapshot_blocks` per epoch | **PASS** |
| **RS-R06** Block spread | 沿用 B-398 revenue pipeline obs（未改 SSOT） | **PARTIAL amount**（by design） |
| **RS-R07** 闭环 job | `region-share-reconcile.sh` + cron + `reconciliation_reports` + drift_alert | **PASS** |

**三角 marker 语义**：`aligned` · `drift` · `incomparable`（空腿或单腿）。

**持久化**：`reconciliation_reports.report_type = region_share_projection_closure_v1`

---

## 4. 验收矩阵

| ID | 结果 |
|----|------|
| RS-A01 internal POST + persist | **PASS** |
| RS-A02 amount_triangle_marker | **PASS** |
| RS-A03 epoch_reconcile_marker | **PASS** |
| RS-A04 admin latest + list | **PASS** |
| RS-A05 observability overview key | **PASS** |
| RS-A06 region-share-reconcile.sh | **PASS**（gate；live Sepolia 见 evidence 模板） |
| RS-A07 167 gap probe BE-RS-01 MET | **PASS** |
| RS-A08 cargo unit + Vitest contract | **PASS** |

---

## 5. Sepolia live 运行（Ops 待填）

```bash
export API_BASE_URL=https://<staging-api>
export INTERNAL_API_SECRET=<secret>
# optional:
export REGION_SHARE_RECONCILE_VERIFY_OVERVIEW=true
export ADMIN_BEARER_TOKEN=<token>
bash scripts/ops/region-share-reconcile.sh
```

将 `report_id` · `amount_triangle_marker` 填入 `evidence/GO_BE_RS_01/sepolia_run_template.json`。

---

## 6. 与 169/170 关系

| Sprint | 结论 |
|--------|------|
| **169 审计** | BE_RS_01_HOLD · 42% 自动化 |
| **170-B** | **BE_RS_01_GO** · 78% 自动化 · 跨腿金额 + epoch + job |
| **Next** | BE-DAO-01 Governance UAT（独立 Sprint） |

---

*171 · Sprint 170-B · BE-RS-01 RegionShare Reconcile · 2026-06-08*
