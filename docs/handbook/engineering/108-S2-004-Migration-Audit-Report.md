# 108 · S2-004 Migration Audit Report

**Version:** 1.0.0 · **最后更新：** 2026-06-07  
**文档类型：** **Migration Authoring & Audit** — 正向执行 · 回滚 · FK · 107 对拍  
**Migration 文件**：`crates/api/migrations/20260607130000_cms_catalog_s2_004_pricing_tiers_media.sql`  
**基准**：[107-Catalog-Schema-v1.0](./107-Catalog-Schema-v1.0.md) · [106](./106-Catalog-CMS-Implementation-Readiness-Report.md)  
**约束**：**仅 DDL**；不含 API · CRUD · Import · Growth · Official OPS

---

<a id="mar108-0-verdict"></a>

## 0. 总裁决

| 维度 | 裁决 | 证据 |
|------|------|------|
| **107 §6.2 顺序** | **PASS** | A1→A4 · B1→B4 · C1→C4 · D1 分段注释一致 |
| **正向执行** | **PASS** | `sqlx migrate run` exit **0** · `20260607130000/installed` |
| **幂等重跑** | **PASS** | 二次 `sqlx migrate run` 无 pending |
| **循环 FK** | **PASS** | media→tier 单向；D1 延迟 FK 无 chicken-egg |
| **数据丢失风险** | **PASS（低）** | 仅 ADD COLUMN / CREATE TABLE；无 DROP 数据列 · 无 TRUNCATE |
| **107 对拍** | **PASS** | 12 catalog 表 · 52 索引 · 约束全集 §3 |
| **回滚** | **PASS（手册）** | §6 逆向脚本 · 事务 dry-run exit 0 |
| **Import 阶段** | **GO → 109 FROZEN** | [109-Catalog-Import-v1.0](./109-Catalog-Import-v1.0.md) |

**Migration Audit：`PASS`** — Import 规范见 **[109-Catalog-Import-v1.0](./109-Catalog-Import-v1.0.md)**。

---

<a id="mar108-1-artifact"></a>

## 1. 交付物

| 项 | 路径 |
|----|------|
| S2-004 migration | `crates/api/migrations/20260607130000_cms_catalog_s2_004_pricing_tiers_media.sql` |
| Schema SSOT | [107-Catalog-Schema-v1.0.md](./107-Catalog-Schema-v1.0.md) |
| S1 前置 | `20260607120000_cms_catalog_p1.sql`（同次 migrate 已 apply） |

**行数**：~320 SQL · 四段 A/B/C/D · **无 seed 数据**（Import 轨写入）。

---

<a id="mar108-2-forward"></a>

## 2. 正向执行验证

**环境**

```text
DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust
Container: traveltrust-postgres
```

**命令**

```bash
cd crates/api && sqlx migrate run
```

**结果**

```text
Applied 20260607120000/migrate cms catalog p1
Applied 20260607120100/migrate cms official ops p2
Applied 20260607120200/migrate cms growth p3
Applied 20260607130000/migrate cms catalog s2 004 pricing tiers media
exit 0
```

**`sqlx migrate info`**：`20260607130000/installed` · 无 pending。

---

<a id="mar108-3-107-matrix"></a>

## 3. 107 对拍矩阵

### 3.1 表（12/12）

| 表 | S1 | S2-004 动作 | DB 存在 |
|----|-----|-------------|---------|
| catalog_countries | ✅ | A1 ALTER | ✅ |
| catalog_cities | ✅ | A2 ALTER | ✅ |
| catalog_pois | ✅ | A3 ALTER | ✅ |
| catalog_intercity_routes | ✅ | A4 ALTER | ✅ |
| catalog_media_assets | — | B1 CREATE | ✅ |
| catalog_hotel_tier_definitions | — | B2 CREATE | ✅ |
| catalog_pricing_templates | — | B3 CREATE | ✅ |
| catalog_transport_region_rules | — | B4 CREATE | ✅ |
| catalog_poi_image_batches | ✅ | C1 ALTER | ✅ |
| catalog_poi_image_candidates | ✅ | C2 ALTER | ✅ |
| catalog_poi_images_published | ✅ | C3 ALTER | ✅ |
| catalog_content_revisions | ✅ | C4 ALTER | ✅ |

### 3.2 §8 P0 → migration 映射

| # | P0 | migration 落点 | 状态 |
|---|-----|----------------|------|
| 1 | 四新表 | B1–B4 | ✅ |
| 2 | open_status CHECK | A1 · A2 | ✅ |
| 3 | cities UNIQUE(name_zh) | A2 | ✅ |
| 4 | hotel POI 不 import | 无 DDL（策略） | ✅ |
| 5 | M6 扩列 | C1–C3 | ✅ |
| 6 | import_batch_id | A1–A4 · B* · C1–C3 | ✅ |
| 7 | submit_label_zh | B2 | ✅ |
| 8 | pricing CHECK + updated_at | B3 | ✅ |
| 9 | revisions CHECK + UNIQUE | C4 | ✅ |
| 10 | media 先于 tier | B1→B2 | ✅ |
| 11 | rules_json schema | 文档（107 §4） | ✅ 无 DB JSON schema |

### 3.3 重点表约束核对

**catalog_pricing_templates**

| 107 要求 | DB 约束名 |
|----------|-----------|
| country_id UNIQUE FK CASCADE | `catalog_pricing_templates_country_id_key` · `_fkey` |
| per_*_cents ≥ 0 | `*_cents_check` ×3 |
| currency_code DEFAULT CNY | 列默认 |
| publish_status 四态 | `_publish_status_check` |

**catalog_hotel_tier_definitions**

| 107 要求 | DB |
|----------|-----|
| tier_code CHECK + UNIQUE | ✅ |
| submit_label_zh NOT NULL | ✅ |
| stock_image_asset_id → media SET NULL | `_stock_image_asset_id_fkey` |

**catalog_media_assets**

| 107 要求 | DB |
|----------|-----|
| url UNIQUE | `catalog_media_assets_url_key` |
| asset_kind / source_type CHECK | ✅ |
| optional FK country/city/poi SET NULL | ✅ |

**catalog_intercity_routes**

| 107 要求 | DB |
|----------|-----|
| mode IN (flight,rail) | `_mode_check` |
| from ≠ to | `_from_to_distinct_check` |
| UNIQUE(from,to,mode) | S1 保留 |

**M6 表族**

| 列 | batches | candidates | published |
|----|---------|------------|-----------|
| poi_kind / review_status | ✅ | ✅ | — |
| selected_candidate_id | ✅ + D1 FK | — | — |
| whitelist 列族 | notes/started_at | source_page/scene/license/notes | scene/source/license |
| approved_candidate_id | — | — | ✅ FK |
| media_asset_id | — | — | ✅ FK |
| version | ✅ | — | ✅ |
| UNIQUE(batch,poi,rank) | — | ✅ | — |

---

<a id="mar108-4-fk"></a>

## 4. FK 依赖与循环检测

### 4.1 创建顺序（已执行）

```text
A1 countries → A2 cities → A3 pois → A4 intercity
B1 media_assets (→ countries/cities/pois optional)
B2 hotel_tiers (→ media)
B3 pricing (→ countries)
B4 transport_region (→ countries)
C1 batches (+ country_id; selected_candidate_id 无 FK)
C2 candidates 扩列
C3 published (+ approved_candidate → candidates, media_asset → media)
C4 revisions 约束
D1 batches.selected_candidate_id → candidates
```

### 4.2 循环依赖

| 边 | 方向 | 循环？ |
|----|------|--------|
| tier.stock_image → media | 单向 | 否 |
| media.poi_id → pois | 单向 | 否 |
| published.media → media | 单向 | 否 |
| batch.selected → candidate | 单向 | 否 |
| candidate.batch → batch | 反向 CASCADE | 否（非环） |

**结论**：**无循环 FK**。

### 4.3 FK 链 smoke（事务内 INSERT · ROLLBACK）

插入链：country → city → media → tier → pricing → poi → batch → candidate → UPDATE selected → published。**exit 0**。

---

<a id="mar108-5-data-loss"></a>

## 5. 数据丢失风险

| 操作类 | 本 migration | 风险 |
|--------|--------------|------|
| DROP COLUMN | **无** | — |
| DROP TABLE | **无**（仅 rollback 手册含 DROP 新表） | — |
| ALTER TYPE 破坏性 | **无** | — |
| ADD NOT NULL 无 DEFAULT | **无**（poi_kind/review_status/version 均有 DEFAULT） | — |
| ADD UNIQUE | cities(name_zh) · candidates(batch,poi,rank) · revisions(entity,ver) | **空库 PASS**；**已有脏数据**须 preflight |
| ADD CHECK | open_status · mode · from≠to · entity_type | 空库 PASS |

**Preflight（非空库升级）**

1. `catalog_cities`：无同国 duplicate `name_zh`  
2. `catalog_poi_image_candidates`：无 duplicate `(batch_id, poi_id, rank)`  
3. `catalog_intercity_routes`：`mode ∈ {flight,rail}` 且 `from ≠ to`  
4. `catalog_content_revisions`：无 duplicate `(entity_type, entity_id, version)` · entity_type 在允许集内  

当前本地 Docker 库：**S1 表空** → 约束 ADD **零冲突**。

---

<a id="mar108-6-rollback"></a>

## 6. 回滚策略（手册 · 非自动 down migration）

本仓库 **无** sqlx down migration；回滚为 **逆向 DDL 手册**（预发/事故用）。

**顺序**：D1 → C4 → C3 → C2 → C1 → B4 → B3 → B2 → B1 → A4 → A3 → A2 → A1

**要点**

| 步 | 动作 |
|----|------|
| D1 | DROP batches.selected_candidate_id FK |
| C | DROP 新列 / revisions 约束 |
| B | DROP 四新表（CASCADE 仅影响 FK 引用列 SET NULL 侧） |
| A | DROP 新索引 / UNIQUE / CHECK / import_batch_id 列 |

**Dry-run**：`BEGIN … 部分逆向 … ROLLBACK` exit **0**（2026-06-07 审计）。

**生产建议**：回滚前备份；**published 行**须先业务 archive，再 DDL。

---

<a id="mar108-7-indexes"></a>

## 7. 索引审计

**catalog_* 索引合计**：**52**（含 PK/UNIQUE）

| 类 | 数量 | 107 对齐 |
|----|------|----------|
| import_batch 部分索引 | 9 | ✅ |
| publish 查询索引 | 8 | ✅ |
| FK 侧 / 复合 | 其余 | ✅ |

**无冗余冲突**：S1 `idx_catalog_cities_country_id` 保留；新增 `idx_catalog_cities_country_publish` 互补。

---

<a id="mar108-8-gaps"></a>

## 8. 已知非阻塞项（Import/API 轨）

| 项 | 说明 | 阶段 |
|----|------|------|
| rules_json DB JSON Schema | 107 §4 应用层校验 | Import |
| JSONB cents 内嵌 CHECK | 107 P1 可选 | API/Import |
| seed 数据 | migration 不含 | Import |
| catalog_import_batches 注册表 | 107 P1 可选 | Import |
| Down migration 文件 | 仓库惯例无 | Runbook §6 |

---

<a id="mar108-9-next"></a>

## 9. 下一步

| 序 | 动作 |
|----|------|
| 1 | **Import runner** | [109-Catalog-Import-v1.0](./109-Catalog-Import-v1.0.md) · parity suite |
| 2 | parity tests（105 §8.3） |
| 3 | S2-API-RO `GET /catalog/*` |

---

<a id="mar108-10-refs"></a>

## 10. 引用

| 主题 | 路径 |
|------|------|
| Migration SQL | `crates/api/migrations/20260607130000_cms_catalog_s2_004_pricing_tiers_media.sql` |
| Schema v1.0 | [107-Catalog-Schema-v1.0.md](./107-Catalog-Schema-v1.0.md) |
| Readiness | [106-Catalog-CMS-Implementation-Readiness-Report.md](./106-Catalog-CMS-Implementation-Readiness-Report.md) |

---

**报告状态**：**S2-004 Migration Audit PASS** · **Import 阶段 GO**
