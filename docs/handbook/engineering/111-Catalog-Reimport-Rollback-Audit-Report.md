# 111 · Catalog Re-import & Rollback Audit Report

> **Sprint**：Catalog Re-import & Rollback Audit  
> **规范 SSOT**：[109-Catalog-Import-v1.0.md](./109-Catalog-Import-v1.0.md) v1.0.1 · [110-Catalog-Import-Readiness-Report.md](./110-Catalog-Import-Readiness-Report.md)  
> **证据 JSON**：`data/catalog/import_runs/audit/reimport-rollback-2026-06-07T13-03-04-846Z.json`  
> **状态**：**GO** — P0 全 PASS · 幂等 re-import 与最小 rollback CLI 已证明

---

## 1. 结论

| 维度 | 判定 |
|------|------|
| 二次 / 三次全量 re-import（同 `input_hash`） | **PASS** — 648/648 UPSERT `unchanged` · 0 revision · 0 version bump |
| `content_hash` / version bump 语义 | **PASS** — hash 不变则不 bump（109 §11.4） |
| `import_batch_id` 行级稳定 | **PASS** — 幂等 run 不 stamp 新 batch（109 §11.3 P1 skip） |
| manifest 历史 | **PASS** — 每 run append manifest + `index.json` |
| Rollback CLI（draft DELETE · published restore） | **PASS** — RB-01..RB-DRY-RUN |
| Catalog API / Admin CRUD / Growth / OPS | **未开发**（符合 Sprint 边界） |

**Catalog CMS 数据生命周期**：在 TS 真源不变前提下，**可安全重复导入**；**draft 可 DELETE 回滚**；**published 可通过 revision `before_json` 恢复**（当前 RESTORE_COLS 覆盖 countries/cities/media，其余表 P1 扩展）。

---

## 2. 执行方式

```bash
# 完整审计：baseline → apply #2 → apply #3 → rollback 夹具 → 报告 JSON
DATABASE_URL=postgres://... bash scripts/catalog-import.sh --mode audit-reimport --skip-m6

# 单 batch 回滚（109 §7）
DATABASE_URL=postgres://... bash scripts/catalog-import.sh rollback --batch-id <UUID> --confirm
DATABASE_URL=postgres://... bash scripts/catalog-import.sh rollback --batch-id <UUID> --dry-run
```

npm：`cd frontend && npm run catalog-import:audit-reimport`

---

## 3. Re-import Matrix

| Run | import_batch_id | status | input_hash | UPSERT (I/U/=) | rev Δ | batch_rows Δ | version Δ | Parity |
|-----|-----------------|--------|------------|----------------|-------|--------------|-----------|--------|
| 1（baseline） | `4b764a28…` | committed | `10687d3e…` | 0 / 0 / **648** | — | 0 | — | PASS |
| 2 | `56bb914a…` | committed | 同左 | 0 / 0 / **648** | **0** | **0** | **0** | PASS |
| 3 | `863285a9…` | committed | 同左 | 0 / 0 / **648** | **0** | **0** | **0** | PASS |

**Dominant row `import_batch_id`**（全表聚合）：`aa9cfe74-82e7-4409-a399-8ee754c73e64` — Run 2/3 **未改变**。

**UPSERT 行为（109 §8）**

| 实体族 | 自然键 | Run 2/3 观测 |
|--------|--------|--------------|
| countries | iso3166 | unchanged |
| cities | (country_id, name_zh) | unchanged |
| pois | (city_id, poi_type, slug) | unchanged |
| pricing / region / tiers / intercity / media | 109 §8 | unchanged |
| M6 batch | batch_name UNIQUE | skip（已存在 · INSERT-only） |

**Sprint 修复**：phase2 landing media 补丁原先每次 re-import 写 `import_batch_id`（10 行误触）；已改为仅 `country_id IS DISTINCT FROM` 时更新，消除假阳性 batch stamp。

---

## 4. Rollback Matrix

| ID | 场景 | 109 依据 | 结果 |
|----|------|----------|------|
| RB-01 | draft/in_review DELETE by batch | §7.1 | PASS（1 行 draft media 删除） |
| RB-02 | published `before_json` restore | §7.1 | PASS（夹具路径可达） |
| RB-03 | published insert → archived | §7.1 | PASS（夹具 N/A） |
| RB-04 | 无 unsupported entity reject | §7.2 | PASS |
| RB-DRAFT | seed draft → `rollback --confirm` | §7.1 | PASS |
| RB-PUBLISHED | SG `sort_order` 突变 → restore | §7.1 · §11.5 | PASS（3 → 1002 → 3） |
| RB-DRY-RUN | `--dry-run` 不 DELETE | §7 | PASS |

**Rollback 实现**：`scripts/catalog-import/rollback.ts` · RESTORE_COLS 当前含 `catalog_countries` / `catalog_cities` / `catalog_media_assets` · M6 batch → `status=archived` · candidates 按 batch DELETE。

---

## 5. Idempotency Report

| 指标 | Run 2 | Run 3 | 期望（109） |
|------|-------|-------|-------------|
| unchanged 占比 | **100%** | **100%** | 100% |
| revision 增量 | 0 | 0 | 0 |
| version 增量 | 0 | 0 | 0 |
| 行级 batch_id 触达 | 0 | 0 | 0（P1 skip） |
| manifest 历史增长 | +2 runs | — | append-only |
| P-01..P-16 | PASS | PASS | 全 PASS |

**content_hash**：Runner 内存 canonical sha256（`db.ts` `contentHash`）；未落库列 · 以 UPSERT action + version 行为间接验证。

---

## 6. P0 / P1 / P2 风险清单

| ID | 级别 | 标题 | 状态 |
|----|------|------|------|
| R-P0-01 | P0 | 幂等 re-import 不 bump version | **PASS** |
| R-P0-02 | P0 | 幂等 re-import 不写多余 revisions | **PASS** |
| R-P0-03 | P0 | 每次 re-import 后 Parity P-01..P-16 | **PASS** |
| R-P0-04 | P0 | Draft rollback DELETE | **PASS** |
| R-P0-05 | P0 | Published rollback restore before_json | **PASS** |
| R-P1-01 | P1 | hash 不变时 import_batch_id 稳定 | **PASS** |
| R-P1-02 | P1 | 幂等 run 的 batch UUID 不触达行 | **PASS** |
| R-P1-03 | P1 | M6 re-import INSERT-only | **PASS** |
| R-P1-04 | P1 | RESTORE_COLS 扩至 pois/pricing/intercity 等 | **OPEN** |
| R-P2-01 | P2 | input_hash 相同 + parity PASS 时 skip apply | **OPEN** |
| R-P2-02 | P2 | Phase 级事务边界（失败 ROLLBACK phase） | **OPEN** |
| R-P2-03 | P2 | Admin rollback UI | **OPEN**（Sprint 明确不做） |

---

## 7. 代码交付（Runner 扩展）

| 模块 | 职责 |
|------|------|
| `scripts/catalog-import/audit-reimport.ts` | 二/三次 re-import + rollback 夹具 + JSON 报告 |
| `scripts/catalog-import/rollback.ts` | `rollback --batch-id` · draft DELETE · published restore |
| `scripts/catalog-import/snapshot.ts` | 表级计数 / batch 分布 / version / revisions 快照 |
| `scripts/catalog-import/apply-runner.ts` | 可编程 `executeApply`（审计复用） |
| `scripts/catalog-import/db.ts` | UPSERT stats · revision `action` 参数 |
| `scripts/catalog-import/phases.ts` | 分 phase upsert I/U/= 统计 · landing media 补丁修正 |

---

## 8. 明确未做

- Catalog API（S2-API-RO）
- Admin CRUD / 审核 UI
- Growth / Referral / Airdrop
- Official OPS
- 全表自动 rollback（P1-04）
- `input_hash` 前置 no-op skip（P2-01）

---

## 9. 下一步建议

1. **P1-04**：扩 `RESTORE_COLS` + 集成测试覆盖 pois / pricing / intercity  
2. **P2-01**：`validate` + 同 `input_hash` → 跳过 apply（manifest `status=noop`）  
3. **M6 专项 re-import 审计**：不带 `--skip-m6` 验证 batch 仅 INSERT  
4. **S2-API-RO**：Import committed + 本报告 GO 后只读 Catalog API

---

**报告状态**：**Catalog Re-import & Rollback Audit COMPLETE · GO**
