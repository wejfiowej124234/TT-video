# 120 · S5 Catalog Release Freeze Report

> **Sprint**：S5 · **Catalog 主线发布冻结证据包**  
> **审计 SSOT**：[113](./113-S2b-Catalog-Consumer-Audit-Report.md)–[119](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md)（S2b Consumer → S4c Geo Final）  
> **日期**：2026-06-07  
> **结论**：**CATALOG_RELEASE_FREEZE_GO**

---

## 1. 冻结结论

| 维度 | 判定 |
|------|------|
| S2–S4c 报告链完整（113–119） | **GO** |
| 一键复跑 gate（S2c + S3/W5 + S4c） | **GO** — `bash scripts/check-s5-catalog-release-freeze.sh` |
| 2026-06-07 本地复跑 | **PASS** · ~121s · `CATALOG_RELEASE_FREEZE_GO` |
| 默认 `NEXT_PUBLIC_CATALOG_API_ENABLED` | **0（冻结）** |
| 默认 `CATALOG_SERVER_GEO_VALIDATION` | **unset / 0（冻结）** |
| Custom Itinerary 报价主链 | **仍 TS + W4 shadow（冻结）** |
| 前端 UI 新接线 / Admin CRUD / Growth / OPS | **禁止（S5 未做）** |

**S5 正式标记**：Catalog Consumer + RO API + POI Media + Server Geo Alignment **可发布证据包已冻结**；任何 prod 切流须 **新 Sprint + 显式 flag**，不得借 S5 默认开启。

---

## 2. 证据包索引（S2 → S4c）

| Phase | Sprint | 报告 | 状态 | 一键 gate |
|-------|--------|------|------|-----------|
| S2-API-RO | S2 | [112](./112-S2-API-RO-Audit-Report.md) | RO 六端点 GO | `catalog-api-smoke.sh`（内嵌于下游） |
| S2b Consumer | S2b | [113](./113-S2b-Catalog-Consumer-Audit-Report.md) · [114](./114-S2b-Catalog-Consumer-Closure-Report.md) | CLOSURE GO | `check-s2b-catalog-consumer-closure.sh` |
| S2c Live | S2c | [115](./115-S2c-Catalog-Live-Gate-Report.md) | LIVE FULL GO | **`check-s2c-catalog-live-gate.sh`** |
| S3/W5 POI Media | S3 | [116](./116-S3-W5-POI-Media-Catalog-Report.md) | W5 GO | **`check-s3-w5-poi-media-catalog-gate.sh`** |
| S4 Server Validation | S4 | [117](./117-S4-Catalog-Server-Validation-Alignment-Report.md) | ALIGNMENT GO | `check-s4-catalog-server-validation-alignment.sh` |
| S4b Meta Countries | S4b | [118](./118-S4b-Meta-Product-Countries-Catalog-Alignment-Report.md) | B-S4-01 CLOSED | `check-s4b-meta-product-countries-catalog-alignment.sh` |
| S4c Geo Final | S4c | [119](./119-S4c-Catalog-Geo-Server-Final-Revalidation-Report.md) | FINAL GO | **`check-s4c-catalog-geo-server-final-revalidation.sh`** |
| **S5 Freeze** | **S5** | **本报告 120** | **FREEZE GO** | **`check-s5-catalog-release-freeze.sh`** |

**S5 一键 gate 串联**：S2c live → S3/W5 → S4c final（S4c 内含 S4/S4b + 双 flag live geo + 再次 S2c 终验）。

---

## 3. 环境变量与默认值（冻结口径）

| 变量 | 生产/本地默认 | 语义 | 切流方式 |
|------|---------------|------|----------|
| `NEXT_PUBLIC_CATALOG_API_ENABLED` | **0 / unset** | FE catalog fetch **关**；UI 读 TS SSOT | 显式 `=1` + 新 Sprint |
| `CATALOG_SERVER_GEO_VALIDATION` | **0 / unset** | Rust POST geo + GET meta 国家 **仍 core** | 显式 `=1` + `DATABASE_URL` |
| `CATALOG_API_BASE_URL` | `http://127.0.0.1:8080`（gate 默认） | Vitest live / smoke 指向 | 部署时覆写 |
| `TRAVELTRUST_PUBLIC_CATALOG_SURFACE` | 见 `.env.example` | 公众 `/api/v1/catalog/*` 路由面 | 非 Consumer flag |
| `DATABASE_URL` | 根 `.env` | PG + **catalog import committed** | gate 硬前提 |

---

## 4. 回退策略（冻结不变）

| 层 | 路径 | 默认 | opt-in 失败回退 |
|----|------|------|-----------------|
| **FE Consumer** | `catalogApi` hooks / resolve | TS 首屏 · `ENABLED=0` 不 fetch | API 空/失败 → TS（Vitest 覆盖） |
| **FE 报价** | `useQuoteCalculation` 等 | **始终 TS** | W4 shadow 对拍 · **不切 UI 主链** |
| **GET /meta.product_countries** | S4b | core 编译期十国 | flag=1 PG 失败/行数≠10 → core |
| **POST /itineraries* geo** | S4 | core `preset_cities` | flag=1 PG 读失败 → core |
| **Catalog RO API** | `GET /api/v1/catalog/*` | 无 DB → 503 | N/A（只读） |
| **Import Runner** | `scripts/catalog-import/` | TS → PG 写入 | rollback CLI（111） |

---

## 5. S5 一键 gate

```bash
bash scripts/check-s5-catalog-release-freeze.sh
```

| Step | 内容 |
|------|------|
| Preflight | `DATABASE_URL` · `ENABLED=0` · API 未起则自动 `cargo run` |
| 1/3 | S2c live — smoke · Vitest 80 · CI-LIVE · S2b Playwright W1/W3 |
| 2/3 | S3/W5 — poi-images · adapter · resolve merge · Playwright W5 |
| 3/3 | S4c — 双 flag `/meta` + POST custom · S4 · S4b · S2c 终验 |

**成功输出**：`S5 catalog release freeze gate: PASS` + **`CATALOG_RELEASE_FREEZE_GO`**

**前提**：`DATABASE_URL` + catalog import committed（与 115/119 相同）。

---

## 6. 2026-06-07 复跑摘要

| 子 gate | 结果 |
|---------|------|
| S2c live | **PASS** — 80 Vitest · CI-LIVE 0 skip · S2b W1/W3 E2E |
| S3/W5 | **PASS** — poi-images smoke · Vitest · Playwright W5 |
| S4c final | **PASS** — `read_source=core|catalog-pg` · POST custom geo · S4/S4b · 无 meta WARN |
| **S5 合计** | **PASS** · exit 0 · **CATALOG_RELEASE_FREEZE_GO** |

---

## 7. 冻结期仍禁止（不得借 S5 变更）

| 类别 | 说明 |
|------|------|
| Admin Catalog CRUD / 审核 UI | OPS · 105 §Admin |
| Growth / Referral / Official OPS | 101/103 边界 |
| `NEXT_PUBLIC_CATALOG_API_ENABLED=1` **默认值** | 生产仍 TS |
| Custom Itinerary **报价 UI 主链**切 Catalog API | W4 shadow only |
| `itinerarySubmitLogic` enrich 切 adapter | 114 §3.3 |
| POST submit / pricing / hotel / transport 运行时切流 | S2b–S4c 均未做 |

---

## 8. S6+ 方可启动（冻结登记 · 117/119）

| ID | 项 | 说明 |
|----|-----|------|
| B-S4-02 | PATCH itinerary catalog geo | sync 路径 · pool 注入 |
| B-S4-03 | custom `day_plans` 城市 preset | 当前仅非空校验 |
| B-S4-04 | POST /guides ISO → catalog | KYB 边界 |
| B-S4-05 | 删除 `preset_cities.rs` / `product_countries.rs` | 105 §8.4 S6+ · cache/snapshot |
| B-S4-06 | Admin M6 publish drift 语义 | OPS |
| — | FE 报价 UI 切 Catalog API | 须 W4 绿 + 产品 sign-off |
| — | `ENABLED=1` 生产默认 | 须 Consumer + live gate 回归 |
| — | Rust preset_cities 默认读 PG | 须 S4 式 parity + 回退 |

---

## 9. Consumer Matrix 冻结态（C-21）

| ID | S5 状态 |
|----|---------|
| C-01~C-18 低风险 UI | **CLOSED**（114） |
| C-12 POI 图像 RO | **GO**（116） |
| C-21 Server geo | **S4c FINAL GO** — meta + POST opt-in · PATCH/custom 城市 **仍缺口** |

---

## 10. 明确未做（S5 边界）

- **无新功能** · 无 UI diff · 无报价主链改动  
- 未改 `.env` 生产默认 · 未开 Admin/Growth/OPS  

---

## 11. Implementation Log

| Phase | 内容 | 文档 |
|-------|------|------|
| S2c–S4c | 见 §2 | 115–119 |
| **S5** | **Release freeze + 一键 gate** | 113 §11 · **120** |
| **Entry Recheck** | **Phase ③ Entry · post-S5** | [PHASE3-ENTRY-RECHECK-REPORT.md](../../runbook/PHASE3-ENTRY-RECHECK-REPORT.md) |

---

**报告状态**：**CATALOG_RELEASE_FREEZE_GO** · **Phase ③ Entry Recheck GO**（20260607T144225Z）· 一键 gate 绿
