# 110 · Catalog Import Readiness Report

**Version:** 1.0.0 · **最后更新：** 2026-06-07  
**文档类型：** **Import Readiness Audit** — 109 逐项审计 · 可实施性裁决  
**基准**：[109-Catalog-Import-v1.0](./109-Catalog-Import-v1.0.md) · [108](./108-S2-004-Migration-Audit-Report.md) · [107](./107-Catalog-Schema-v1.0.md)  
**约束**：**无 Import Runner · 无 API · 无 Admin CRUD · 无 Growth · 无 Official OPS**

> **SSOT**：本报告为 **Import v1.0 可实施性登记**；Runner 开工前须 **§6 Checklist P0 全勾**。

**先读**：[109](./109-Catalog-Import-v1.0.md)

---

<a id="irr110-0-verdict"></a>

## 0. 总裁决

| 维度 | 裁决 |
|------|------|
| **Import v1.0 规范完整度** | **PASS（92%）** — 契约 · 序列 · YAML · 策略齐全 |
| **首库全量 import（空 catalog_*）** | **GO** |
| **Re-import / published rollback** | **CONDITIONAL** — 须 Runner 写 revisions（§6 P0-04） |
| **Import Runner 可开工** | **GO**（首库 + §11 契约） |

**Import Readiness：`GO`** — 109 **v1.0.1** + preflight **PASS**；可启动 Import Runner（§109 §11 · §110 §7）。

---

<a id="irr110-1-audit-matrix"></a>

## 1. 逐项审计矩阵

**图例**：✅ 就绪 · ⚠️ 条件 · ❌ 阻塞 · N/A

| # | 审计项 | 状态 | 发现 |
|---|--------|------|------|
| A1 | **Import Data Contract** §2.1–2.10 | ✅ | 10 类记录 · 幂等键 · cents 规则明确 |
| A2 | **Phase 1–10 顺序** §4 | ✅ | Media→…→Parity；依赖无环 |
| A3 | **city_slug_map.v1.yaml** | ✅ | 10 国 38 城 · 与 geoOptions/preset_cities **全等** |
| A4 | **country_transport_region.v1.yaml** | ✅ | 10 ISO · 与 interCityTransport 区域分支一致 |
| A5 | **poiSlugV1** §3.2 | ⚠️ | 算法冻结；`poi_slug_overrides.v1.yaml` **未落盘**（fnv 兜底可用） |
| A6 | **Pricing templates** §3.4 | ✅ | BY_COUNTRY×10 · ×100 · CNY 口径文档化 |
| A7 | **Hotel tiers** §3.3 | ✅ | 3 行 global · multiplier 对拍 HOTEL_TIER_MULTIPLIER |
| A8 | **Intercity generator** §3.5 | ⚠️ | **须 TS 同源**；行数预算 109 低估（见 A8.1） |
| A9 | **Manifest lifecycle** §5 | ⚠️ | 文件 manifest OK；无 DB batch 注册表（P1） |
| A10 | **UPSERT / re-import** §8 | ⚠️ | UPSERT 与「旧 batch 保留」语义需 Runner 澄清（§5 R-P0-03） |
| A11 | **Rollback** §7 | ⚠️ | 首库 DELETE OK；published UPSERT 需 revisions（§5 R-P0-02） |
| A12 | **Parity Matrix** §6 | ⚠️ | P-01..P-16 定义完整；**自动化测试未实现** |
| A13 | **M6 北京 batch** §3.7 | ✅ | 1 batch · 7 POI entries · 不 auto-publish |
| A14 | **S2-004 DDL** | ✅ | 108 PASS · 本地 migrate 已验证 |

### A8.1 Intercity 行数修正

| 指标 | 109 估算 | **审计实测** |
|------|----------|--------------|
| 有向 city 对（十国内） | — | **146**（Σ n×(n−1)） |
| route 行 | 120–180 | **~146–272**（每对 1–2 mode） |
| 新加坡 | 0 | **0** ✓ |

生成器须 **国别内** 二重循环（不跨国）；与 109 算法一致。

### A3.1 city_slug_map 对拍

| 检查 | 结果 |
|------|------|
| 国 ISO 序 CN→ES | ✅ 同 PRODUCT_COUNTRIES |
| guide_register_label_key | ✅ 同 productCountries.ts |
| 城 name_zh 集合 | ✅ 38 = geoOptions = preset_cities.rs |
| slug 格式 `[a-z0-9-]+` | ✅ |
| region_label | ✅ 同 CITY_TO_REGION |

### A4.1 country_transport_region 对拍

| ISO | yaml default_modes | TS 区域分支 |
|-----|-------------------|-------------|
| SG | `[]` | `region === "新加坡" return []` ✅ |
| AU | `[flight]` | 默认 `return ["flight"]` ✅ |
| AE | rail+flight · ground label | UAE_GROUND pair + 默认 ✅ |
| JP | rail+flight · Shinkansen label | ✅ |

成对 Set（JAPAN_RAIL_ONLY 等）**不在 YAML** — 正确，由 generator 写 routes 表。

---

<a id="irr110-2-contract-audit"></a>

## 2. Import Data Contract 深度审计

| 契约 | DB 对齐 107 | TS 真源 | 缺口 |
|------|-------------|---------|------|
| CountryRecord | ✅ | productCountries + landing | `video_slug` = iso lower 可选 |
| CityRecord | ✅ | geoOptions + yaml | — |
| PoiRecord | ✅ | get*Details | `name_en` 109 允许 = label（中文）· P2 i18n |
| HotelTierRecord | ✅ | HOTEL_TIERS | sort_order 0,1,2 与数组序一致 |
| PricingTemplateRecord | ✅ | getPricingForCountry | 十国均 CNY 展示 · 非财务真币 |
| IntercityRouteRecord | ✅ | getInterCityTransportModes | rules_json 107 §4 |
| TransportRegionRuleRecord | ✅ | yaml | — |
| MediaAssetRecord | ✅ | landing + tier images | 13 URL P0 |
| M6* | ✅ | poiImageVerification | batch_name = `CN-北京-attraction-01` |

**全局字段**

| 字段 | 审计 |
|------|------|
| import_batch_id | ✅ 107 全表（revisions 除外） |
| publish_status published | ✅ 首库与 TS 静态等价 |
| version | ⚠️ UPSERT 变更时 bump 规则待 Runner 实现（§6 P0-05） |

---

<a id="irr110-3-phase-audit"></a>

## 3. Phase 1–10 顺序审计

| Phase | 名称 | 行数预算 | 前置 | 审计 |
|-------|------|----------|------|------|
| **0** | import_batch_id + manifest created | — | PG migrated | ✅ |
| **1** | Media | 13 | — | ✅ landing×10 + tier×3 |
| **2** | Countries | 10 | P1 asset ids | ✅ 两阶段：media → country payload |
| **3** | Cities | 38 | P2 country_id | ✅ |
| **4** | Hotel tiers | 3 | P1 tier media | ✅ |
| **5** | Pricing | 10 | P2 country_id | ✅ |
| **6** | Transport region | 10 | P2 country_id | ✅ |
| **7** | POIs | ~400–440 | P3 city_id | ✅ 38 城 × attraction+food；`cityDetailsCoverage` 10/10 pass |
| **8** | Intercity | ~146–272 | P3 city ids | ⚠️ TS generator 必选 |
| **9** | M6 optional | 1+N | P7 poi_id | ✅ review 不 publish |
| **10** | Parity gate | — | P1–9 | ⚠️ 测试待实现 |

**不可逆点**：P2 失败后 P1 media 可 DELETE by batch；P7 后 POI 被 M6 FK 引用 — P9 失败不删 P7。

---

<a id="irr110-4-strategy-audit"></a>

## 4. 分策略审计

### 4.1 poiSlugV1

| 步骤 | 可实施 | 备注 |
|------|--------|------|
| overrides yaml | ⚠️ P1 | 文件不存在；**不阻塞** |
| ASCII legacy_value | ✅ | 如 `biangbiang面` → fnv |
| fnv1a32 8 hex | ✅ | 须在 Runner 单测冻结向量 |

**风险**：同 city 不同 poi_type 同 legacy_value 极 rare；slug 含 poiType 前缀防碰撞 ✅。

### 4.2 Pricing

| 项 | 审计 |
|----|------|
| yuanToCents | ✅ `Math.round(y*100)` |
| keys 十国 | ✅ getPricingCountryKeys()=10 |
| 排除 IT/UK | ✅ 非 BY_COUNTRY |

### 4.3 Hotel tiers

| tier_code | multiplier TS |
|-----------|---------------|
| tier_economy | 1 |
| tier_comfort | 1.65 |
| tier_luxury | 2.5 |

### 4.4 Intercity generator

| 要求 | 审计 |
|------|------|
| 调用 TS 导出函数 | **P0 强制** — Rust-only runner **不可** |
| mode_only 语义 | ✅ modes.length===1 |
| 意大利/英国 city 不在 loop | ✅ 仅 PRODUCT_COUNTRIES 城 |
| 悉尼↔墨尔本双 mode | ✅ TS L152 |

### 4.5 Manifest lifecycle

| 态 | 可实施 | 缺口 |
|----|--------|------|
| created→running | ✅ | manifest JSON 写盘 |
| validating | ✅ | 调用 parity |
| committed/failed | ✅ | — |
| rollback_pending | ⚠️ | 无 Admin UI；CLI P0 |

### 4.6 UPSERT / re-import

| 实体 | UPSERT 键 | 审计 |
|------|-----------|------|
| media | url | ✅ UNIQUE |
| countries | iso3166 | ✅ |
| pois | (city, type, slug) | ⚠️ slug 变 = 新行（re-import 改算法风险） |
| M6 | INSERT only | ✅ |

**R-P0-03**：全量 re-import 时 **行级 import_batch_id 更新**为最新 batch；历史靠 manifest + revisions，非保留旧 batch_id 于行上。

### 4.7 Rollback

| 场景 | 可行 | 条件 |
|------|------|------|
| 首库 failed mid-run | ✅ | DELETE WHERE import_batch_id |
| committed 后全量撤销 | ⚠️ | 须 manifest 行清单 + DELETE/revisions |
| published UPSERT 撤销 | ❌ P0 未定义 import 写 revisions | Runner 须补 |

---

<a id="irr110-5-risks"></a>

## 5. P0 / P1 / P2 风险矩阵

| ID | 级 | 风险 | 影响 | 消减 |
|----|-----|------|------|------|
| **R-P0-01** | **P0** | Runner 非 TS 导致 intercity/POI/pricing 漂移 | 报价/交通错误 | **强制** tsx/Node · import 同仓库 frontend 模块 |
| **R-P0-02** | **P0** | Import 不写 content_revisions | re-import rollback 不可用 | UPSERT 前 snapshot → revisions |
| **R-P0-03** | **P0** | re-import 与 batch 保留语义模糊 | 运维误删 | Runner 文档：行 batch_id 更新 · manifest 存档 |
| **R-P0-04** | **P0** | yaml↔geoOptions 无 CI | 静默漂移 | ✅ `scripts/check-catalog-slug-map.sh` |
| **R-P0-05** | **P0** | version bump 规则未实现 | 乐观锁失效 | 内容 JSON hash 变则 version+1 |
| **R-P1-01** | P1 | Parity 仅抽 50 对 intercity | 漏网 pair bug | 全量 146 对 CI |
| **R-P1-02** | P1 | poi_slug_overrides 缺失 | slug 不可读 | 热门 POI 人工 slug |
| **R-P1-03** | P1 | 十国均 CNY 无 UI 说明 | 运营误解 | Admin/API 文档 |
| **R-P1-04** | P1 | manifest 无 JSON Schema | 工具链弱 | `catalog_import_manifest.v1.schema.json` |
| **R-P1-05** | P1 | M6 仅北京 | 他城图仍 TS | 分批 expansion |
| **R-P1-06** | P1 | 增量按 country import | 长跑 | §8 P1 子集 |
| **R-P2-01** | P2 | catalog_import_batches 表 | 查询慢 | SQL 视图 manifest |
| **R-P2-02** | P2 | poi_hero 批量 media | 库外 URL | payload.image_url 够用 |
| **R-P2-03** | P2 | input hash 幂等 skip | 重复跑 | §8.5 |
| **R-P2-04** | P2 | name_en 中文 label | SEO | 翻译表 |

---

<a id="irr110-6-validation-matrix"></a>

## 6. Import Validation Matrix

**执行方**：Import Runner Phase 10 · CI nightly optional

| ID | 类型 | 验证式 | 失败级 |
|----|------|--------|--------|
| **V-01** | Preflight | S2-004 migrated | **BLOCK** |
| **V-02** | Preflight | yaml 38 城 = geoOptions | **BLOCK** |
| **V-03** | Preflight | yaml 10 ISO = PRODUCT_COUNTRIES | **BLOCK** |
| **V-04** | Preflight | transport yaml 10 regions | **BLOCK** |
| **V-05** | Phase 1 | 13 media url HEAD 200 | **BLOCK** |
| **V-06** | Phase 2 | countries=10 · payload.landing_ambient | **BLOCK** |
| **V-07** | Phase 3 | cities=38 · slug unique per country | **BLOCK** |
| **V-08** | Phase 4 | tiers=3 · multiplier 1/1.65/2.5 | **BLOCK** |
| **V-09** | Phase 5 | pricing=10 · cents 反算 | **BLOCK** |
| **V-10** | Phase 6 | region_rules=10 | **BLOCK** |
| **V-11** | Phase 7 | pois hotel=0 · legacy 覆盖 | **BLOCK** |
| **V-12** | Phase 7 | per city att/food count = TS | **BLOCK** |
| **V-13** | Phase 8 | SG intercity rows=0 | **BLOCK** |
| **V-14** | Phase 8 | 50 对 mode 集 = TS | **BLOCK** |
| **V-15** | Phase 8 | total routes ∈ [146,272] | **WARN** |
| **V-16** | Phase 9 | M6 batch status=review | **WARN** if skipped |
| **V-17** | Phase 9 | published_poi_images=0 | **BLOCK** if M6 ran |
| **V-18** | Post | import_batch_id 非空 | **BLOCK** |
| **V-19** | Post | orphan FK count=0 | **BLOCK** |
| **V-20** | Post | manifest parity.passed=true | **BLOCK** |
| **V-21** | Behavior | hotelNightRatePerPerson comfort | **BLOCK** |
| **V-22** | Behavior | normalizeInterCity 曼谷→清迈 | **BLOCK** |

**映射 109 §6**：V-06..V-14 覆盖 P-01..P-16；V-21..V-22 覆盖 B-01..B-05。

---

<a id="irr110-7-runner-checklist"></a>

## 7. Import Runner Requirements Checklist

> Runner **开工门禁**；不含 API/Admin。

### 7.1 架构（P0）

- [ ] **R-ARCH-01** 实现语言：**TypeScript**（tsx），直接 import `frontend/lib/**` 真源
- [ ] **R-ARCH-02** PG 访问：`DATABASE_URL` · sqlx 或 `pg` 驱动
- [ ] **R-ARCH-03** 单命令入口：`catalog-import run [--dry-run] [--skip-m6]`
- [ ] **R-ARCH-04** 读取 `data/catalog/*.v1.yaml` · 拒绝 unknown version
- [ ] **R-ARCH-05** 生成 `data/catalog/import_runs/{uuid}.manifest.json`

### 7.2 Phase 实现（P0）

- [ ] **R-PH-01** Phase 1–10 顺序不可配置跳过（M6 可 `--skip-m6`）
- [ ] **R-PH-02** 全行写入同一 `import_batch_id`
- [ ] **R-PH-03** UPSERT ON CONFLICT 按 109 §8 自然键
- [ ] **R-PH-04** intercity：国别内 nested loop · 调用 `getInterCityTransportModes`
- [ ] **R-PH-05** POI：调用 `getAttractionDetails` / `getFoodDetails`
- [ ] **R-PH-06** pricing：`getPricingForCountry` + yuanToCents
- [ ] **R-PH-07** `--dry-run` 只写 manifest 不写 PG

### 7.3 数据完整性（P0）

- [ ] **R-DATA-01** poiSlugV1 单测向量 ≥5（CJK + ASCII）
- [ ] **R-DATA-02** UPSERT 变更写 `catalog_content_revisions`（action=import）
- [ ] **R-DATA-03** content hash 变则 `version = version + 1`
- [ ] **R-DATA-04** 事务边界：每 Phase 单事务 · 失败 ROLLBACK phase
- [ ] **R-DATA-05** preflight V-01..V-04

### 7.4 对拍（P0）

- [ ] **R-PAR-01** Phase 10 跑 V-05..V-22
- [ ] **R-PAR-02** 扩展 `cityDetailsCoverage.test.ts` → DB fixture 版（P1 可 follow-up PR）
- [ ] **R-PAR-03** intercity 金样例：东京→大阪 rail · 曼谷→清迈 flight only · 新加坡任意对 empty

### 7.5 回滚 CLI（P0 最小）

- [ ] **R-RB-01** `catalog-import rollback --batch-id UUID --confirm`
- [ ] **R-RB-02** DELETE rows WHERE import_batch_id AND publish_status IN (draft,in_review) — 首库路径
- [ ] **R-RB-03** published 行：拒绝 DELETE · 提示 revisions/manual（P1 自动 rollback）

### 7.6 明确不做（Scope）

- [ ] **R-NO-01** 不实现 Catalog API
- [ ] **R-NO-02** 不实现 Admin CRUD
- [ ] **R-NO-03** 不 auto-publish M6
- [ ] **R-NO-04** 不 import Growth / ops_*

---

<a id="irr110-8-volumes"></a>

## 8. 冻结导入量级（审计确认）

| 实体 | 109 | 审计 |
|------|-----|------|
| countries | 10 | 10 |
| cities | 38 | 38 |
| attractions | ~190–220 | **~200**（38 城 · cityDetailsCoverage pass） |
| food | ~190–220 | **~200** |
| hotel tiers | 3 | 3 |
| pricing | 10 | 10 |
| region rules | 10 | 10 |
| intercity routes | 120–180 | **146–272**（109 修正建议） |
| media | 13 | 13 |
| M6 candidates | N | **7 POI × 多候选**（北京 attraction） |

---

<a id="irr110-9-gaps-109"></a>

## 9. 109 v1.0.1 修订（**已完成**）

| # | 修订 | 状态 |
|---|------|------|
| 1 | intercity 行数 **146–272** | ✅ 109 §1.3 · §3.5 |
| 2 | Runner **必须 TS** | ✅ 109 §11.2 |
| 3 | re-import / import_batch_id 语义 | ✅ 109 §11.3 |
| 4 | Import UPSERT 写 revisions | ✅ 109 §11.5 |
| 5 | `check-catalog-slug-map.sh` | ✅ **PASS** |

---

<a id="irr110-10-next"></a>

## 10. 下一步

| 序 | 动作 | 门禁 |
|----|------|------|
| 1 | Owner 确认 **CONDITIONAL GO** | 本报告 |
| 2 | 109 v1.0.1 微修订（§9 可选） | — |
| 3 | `check-catalog-slug-map` preflight 脚本 | R-P0-04 |
| 4 | Import Runner PR（§7 P0） | R-ARCH..R-RB |
| 5 | 首库 import + manifest committed | V-20 PASS |
| 6 | S2-API-RO | import committed 后 |

---

<a id="irr110-11-refs"></a>

## 11. 引用

| 主题 | 路径 |
|------|------|
| Import 规范 | [109-Catalog-Import-v1.0.md](./109-Catalog-Import-v1.0.md) |
| Migration | [108-S2-004-Migration-Audit-Report.md](./108-S2-004-Migration-Audit-Report.md) |
| city slug | `data/catalog/city_slug_map.v1.yaml` |
| transport | `data/catalog/country_transport_region.v1.yaml` |
| 覆盖测试 | `frontend/lib/cityDetails/cityDetailsCoverage.test.ts` |

---

**报告状态**：**Catalog Import Readiness Audit COMPLETE** · **CONDITIONAL GO**  
**Import v1.0**：**可实施**（首库全量 + TS Runner + §7 P0 Checklist）
