# 123 · 101 CMS Blueprint Compatibility & Production Readiness Audit

> **Sprint**：101/102 Blueprint Compatibility Audit  
> **蓝图 SSOT**：[101-CMS与内容运营中心实施蓝图 v1.1.0](./101-CMS与内容运营中心实施蓝图.md)  
> **交叉基准**：[120-S5-Catalog-Release-Freeze](./120-S5-Catalog-Release-Freeze-Report.md) · [119-S4c](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md) · [104-Admin-Coverage-Gap](./104-Admin-Coverage-Gap-Report.md) · [PHASE3_ENTRY_GO](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md)  
> **日期**：2026-06-07  
> **纪律**：**仅审计** · **禁止** 新功能 · **禁止** 生产配置变更 · **禁止** Catalog S6+ / Admin CRUD / Growth / Official OPS 开发  
> **总裁定**：**101 CMS 平面 — Production GO（平台 PI3）非阻塞 · 101 运营就绪 — HOLD**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **101 蓝图 vs 代码（2026-06-07）** | **部分过时** — §0–§1 多处仍写「全缺」，与 S2–S5 Catalog 链不一致 → 见 §4 **REWRITE** 项 |
| **P1 Content（M1–M6）** | **部分实现** — DDL + Import + RO API + FE Consumer（flag=0 冻结）· **无** Admin CRUD |
| **P2 Official OPS（M7–M10）** | **未实现（运行时）** — DDL + Hub · 无 API/子页 |
| **P4 Legacy Admin** | **GO** — 社区/入驻/财务/Indexer/RBAC 等维持 FINAL Audit 域 |
| **平台 Production GO（PI3-001～006）** | **101 CMS 不阻塞** — Phase ③ Entry 显式排除 CMS Admin CRUD / Growth / OPS |
| **101「冷启动运营就绪」** | **HOLD** — 仍依赖 TS 硬编码 + env seed；无运营控制台 |

**101 CMS 审计结论：** **HOLD**（运营/CMS 能力）· **非 PI3 Production GO blocker**

---

## 2. 审计方法与真源

| 来源 | 用途 |
|------|------|
| `101 v1.1.0` M1–M10 · §8–§11 backlog | 蓝图期望 |
| `crates/api/migrations/202606071*.sql` | DDL 真源 |
| `crates/api/src/routes/catalog/` | 公众 RO API（112） |
| `scripts/catalog-import/` | TS→PG 导入（109/111） |
| `frontend/lib/catalogApi/` · `cityDetails/*` | Consumer 双读（113–120） |
| `frontend/app/admin/content/` · `official/` | Admin UI |
| `crates/api/src/routes/admin/` | **无** `/admin/content|official|growth` 写路由 |
| [120](./120-S5-Catalog-Release-Freeze-Report.md) | S5 冻结纪律 |

**机读 gate：** `bash scripts/check-101-102-blueprint-compatibility-audit.sh`（汇总 123/124/125）

---

## 3. 四平面功能矩阵（101）

图例：**实现** · **部分** · **未实现** · **过时** · **重复**

| ID | 模块 | 蓝图状态（101） | 代码真源（2026-06-07） | 分类 | 判定 | PI3 阻塞 | 工作量 | 测试范围 |
|----|------|-----------------|------------------------|------|------|----------|--------|----------|
| **M1** | 国家 catalog | P0 全缺 | `catalog_countries` DDL · import · `GET /catalog/countries` · meta/core 十国仍 TS | **部分** | **HOLD** | 否 | **M**（Admin CRUD） | catalog smoke · import parity · S4b meta |
| **M2** | 城市 | P0 全缺 | `catalog_cities` · RO API · `geoOptions.ts`/`preset_cities.rs` 主读 | **部分** | **HOLD** | 否 | **M** | S2c live · POST geo S4 |
| **M3** | 景区 POI | P0 全缺 | `catalog_pois` type=attraction · RO · `cityDetails/attractions.ts` | **部分** | **HOLD** | 否 | **L** | Consumer W1/W3 · catalog-api-smoke |
| **M4** | 酒店 POI | P0 全缺 | 同上 hotel · `hotels.ts` · `hotelTierPricing.ts` | **部分** | **HOLD** | 否 | **S** | 报价 W4 shadow |
| **M5** | 美食 POI | P0 全缺 | 同上 food · `food.ts` | **部分** | **HOLD** | 否 | **S** | 同上 |
| **M6** | POI 图片 | P0 工程侧 | `catalog_poi_image_*` DDL · `GET /catalog/poi-images` · TS 验证流水线仍主读 | **部分** | **HOLD** | 否 | **XL**（Admin 审核 UI） | S3/W5 gate · Playwright W5 |
| **—** | 城际交通 | 101 P0 同批 | `catalog_intercity_routes` · RO API · `interCityTransport.ts` | **部分** | **HOLD** | 否 | **M** | catalog intercity smoke |
| **—** | 国家定价 | 101 P1 | `catalog_country_pricing` S2-004 · RO `/catalog/pricing` · `lib/countries/*` | **部分** | **HOLD** | 否 | **M** | pricing parity test |
| **—** | 公众 Catalog API | 101 P0-API-01 | **8+ RO 端点已实现**（112 GO） | **实现** | **GO** | 否 | — | `check-s5-catalog-release-freeze.sh` |
| **—** | FE Catalog Consumer | 101 P0-FE-07 | hooks/resolve · **默认 ENABLED=0**（120 冻结） | **部分** | **GO**（冻结口径） | 否 | **L**（opt-in 切流） | S2b/S2c Vitest · E2E |
| **—** | Catalog Import | 101 P0-MIG-01 | `scripts/catalog-import/` · rollback（111 GO） | **实现** | **GO** | 否 | — | import audit · S2c |
| **—** | Admin Content CRUD | 101 P0-API-02 | **无** API · Hub only · S5 **禁止** | **未实现** | **HOLD** | 否 | **XL** (~25 routes) | 105 §Admin 设计 · 新 Sprint |
| **—** | publish-queue / 审批 | 101 §4.1 | 侧栏链 404 · 可复用 `/admin/approvals` 未扩展 | **未实现** | **HOLD** | 否 | **L** | admin approvals smoke |
| **M7** | 官方账号 | P0 Seed only | `ops_official_accounts` DDL · Hub · `seed_*` 仍真源 | **部分** | **HOLD** | 否 | **L** | seed audit · 无 Admin API |
| **M8** | 官方攻略 | P0 全缺 | `ops_official_guide_posts` DDL · `communityShowcase*.ts` inject | **部分** | **HOLD** | 否 | **L** | community C1 · dev inject off prod |
| **M9** | 行程模板 | P0 Mock | `ops_official_itinerary_templates` · `marketDevVarietyOrders` | **部分** | **HOLD** | 否 | **XL** | market seed env gate |
| **M10** | 冷启动 Campaign | P0 Env 矩阵 | `ops_cold_start_*` DDL · internal stats 部分 · 6+ env | **部分** | **HOLD** | 否 | **XL** | public_catalog_surface internal |
| **P4** | Legacy Admin | 101 保留 | 72+ 页 · ~94 admin API · FINAL Audit PASS | **实现** | **GO** | 否 | — | phase3-entry admin smoke |
| **P4** | trust-growth A/B | 101 ≠ Growth | `/admin/trust-growth` **完整** | **实现** | **GO** | 否 | — | F-032 trust_growth tests |

---

## 4. 过时 / 重复设计（101 专章）

### 4.1 REWRITE（蓝图须修订，非立即开发）

| ID | 101 陈述 | 代码真源 | 建议 |
|----|----------|----------|------|
| **RW-101-01** | §0「P1 CMS 基本缺失 · 无 GET /catalog/*」 | 112 RO 八端点 GO | 改为「RO **GO** · Admin CRUD **HOLD**」 |
| **RW-101-02** | §1 M1–M5「DB today: 无」 | S1+S2-004 migrations applied 路径 | 改为「DDL+import **GO** · published 数据 **条件** import」 |
| **RW-101-03** | §11 S2「Admin CRUD + 公众读」 | 实际 S2=API-RO（105/112）· Admin CRUD **未做** | Sprint 表与 105/120 对齐 |
| **RW-101-04** | §0「S1 地基开发已启动」 | S1–S5 Catalog 已冻结 | 更新为「Catalog 轨 **FREEZE** · Official/Growth **S1 stub**」 |
| **RW-101-05** | 104 §1.9「无 GET /catalog/*」 | 已过时 | 104 读者改读 112/120 |

### 4.2 重复设计（保留并行 · 文档须分清）

| 重复面 | A | B | 裁定 |
|--------|---|---|------|
| 旅行目录 | TS `cityDetails/*` | PG `catalog_*` + RO API | **双读 intentional** · 120 冻结默认 TS |
| Banner/转化 | P4 `trust-growth` A/B | P3 G7 Growth Analytics | **分工保留** · 101 §0 已述 |
| 风控 | community `risk_signals` | G6 Growth Anti-Fraud | **部分重叠** · G6 须 **扩展** 非重写 community |
| Catalog CMS | 105 S2 Catalog Admin | 101 M1–M6 Admin | **同一能力** · 105 为设计 SSOT |

---

## 5. 与 Catalog S2–S5 / 120 冻结对齐

| 101 项 | S5 冻结口径 | 审计裁定 |
|--------|-------------|----------|
| Admin Catalog CRUD | **禁止**（S5 未做） | **HOLD** — 正确未做 |
| `NEXT_PUBLIC_CATALOG_API_ENABLED=1` | **禁止默认** | **GO** — 默认 0 |
| Custom Itinerary 报价主链 | TS + W4 shadow | **GO** — 未切 Catalog API |
| POST geo / meta countries | S4c opt-in | **GO** — 默认 core |
| POI images 公众面 | S3/W5 GO | **GO** — RO API |

**结论：** 101 蓝图中的 **P0 Admin CRUD / 切流** 与 **120 FREEZE** 冲突若执行则 **违规**；Production 应以 **120 + TS fallback** 为准，**非** 101 §10 P0-API-02 立即落地。

---

## 6. Production GO 要求对照（CMS / 运营）

| 要求来源 | CMS/OPS 是否必须 | 当前满足 | 判定 |
|----------|------------------|----------|------|
| PI3-001～006 | **否** | N/A | **GO**（非阻塞） |
| PHASE3_ENTRY §5 排除项 | CMS Admin / Growth / OPS **不做** | 符合 | **GO** |
| go-live 核心链（订单/Escrow/社区/支付） | 不依赖 101 Admin | FINAL Audit PASS | **GO** |
| 101 §9 冷启动八步 | **产品运营** 完整冷启动 | TS+seed 替代 | **HOLD** |
| ③ 无 env seed 生产 | `SEED_TEST_ACCOUNTS=0` | 文档化 | **GO**（纪律） |
| 运营可编辑目录/官方内容 | 101 目标态 | 无 Admin | **HOLD** |

**平台 Production GO：** CMS **不阻塞** · 101 运营完整度 **HOLD**

---

## 7. 剩余 Owner / 产品动作（非本 Sprint 代码）

| 优先级 | 动作 | 判定路径 |
|--------|------|----------|
| P0 文档 | 修订 101 §0/§1/§11 与 112/120 对齐 | **REWRITE → [135](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) CLOSED** |
| P1 运营 | prod 禁 showcase/demo env · `public_catalog_surface` 策略书面化 | **HOLD** |
| P2 产品 | 决定是否 post-GA Sprint 开 Admin CRUD（新 Sprint · 破 120 冻结） | 产品签核 |
| P2 切流 | Catalog Consumer opt-in 仅在新 Sprint + flag | 120 程序 |

---

## 8. 复验命令

```bash
bash scripts/check-101-102-blueprint-compatibility-audit.sh
bash scripts/check-s5-catalog-release-freeze.sh
bash scripts/check-134-cms-official-ops-post-growth-recheck.sh
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py   # 并行 PI3
```

---

## 9. 交叉引用

| 文档 | 关系 |
|------|------|
| [124-102-Referral-Audit](./124-102-Referral-Audit-Report.md) | P3 Growth 专审 |
| [125-Production-Feature-Gap-Matrix](./125-Production-Feature-Gap-Matrix.md) | 全站汇总 |
| [133-G-S8-Growth-Release-Freeze-Report](./133-G-S8-Growth-Release-Freeze-Report.md) | Growth 冻结 · Post-Growth 基线 |
| [134-101-CMS-Official-OPS-Post-Growth-Recheck-Report](./134-101-CMS-Official-OPS-Post-Growth-Recheck-Report.md) | **Post-Growth CMS/Official 复评** |
| [135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report](./135-DOC-101-RW-CMS-Official-OPS-Blueprint-Rewrite-Report.md) | **DOC-101-RW** · RW-101-01～05 **CLOSED** |

---

**维护者：** Blueprint Compatibility Audit · 2026-06-07
