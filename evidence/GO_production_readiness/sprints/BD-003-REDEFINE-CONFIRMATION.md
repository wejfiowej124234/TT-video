# BD-003 · REDEFINE 确认文档

**Document type:** Root Cause REDEFINE Confirmation（Discovery-only · 无 Fix）  
**Recorded:** 2026-07-08  
**Sprint:** B · **TT_SPRINT_B:** READY · **TT_SPRINT_B_ACTIVE:** false  
**Status:** REDEFINE **CONFIRMED**（文档确认）· **Root Cause CONFIRMED for Sprint ACTIVE:** ❌（本文档不触发 ACTIVE）

---

## 1. 摘要

| 字段 | 值 |
|------|-----|
| Issue ID | BD-003 |
| 原 Root Cause 假设 | Listings Cover 图不完整 |
| 假设状态 | **REJECTED** |
| 候选解释 | `premature_listings_cover_hypothesis_on_staging` |
| Staging Exit Condition | **MET** — Provider 10/10 + Acquisition 10/10 · cover_url 存在 · HEAD 200 · Market 可读 |
| Public Catalog | `meta.source=postgres_catalog` · `data_origin=production` · 0 ID 重复 |
| 结论 | Cover 不是 staging Public Market 阻塞点；BD-003 在 Sprint B **无 Fix 价值** |

---

## 2. 原假设 · REJECTED

### 2.1 原表述

> **BD-003：** Listings Cover 图不完整 — Market/API 层 listing 缺少 `cover_url`、不可加载或 Market 不可读。

### 2.2 否定依据

| 探针 | 结果 | 说明 |
|------|------|------|
| BD-003 Cover Discovery | **PASS** | Provider 10/10 · Acquisition 10/10 · `missing_cover=0` · `head_fail=0` |
| Provider Day2 · Images | **PASS** | `HEAD cover_url` 样本 PASS；现 public 全量 10/10 亦 PASS |
| Market HTTP | **PASS** | `/market/provider` · `/market/acquisition` 列表 200 |
| Data Lineage Audit | **CONFIRM** | provider/acquisition 经 `governed_market_listings_v1` + DDG；非 missing cover |

**REJECTED 声明：** 在 staging 当前 **Public Catalog 基线** 下，「Listings Cover 不完整」**不能**解释任何 Market 列表阻塞，**不应**作为 Sprint B Fix 目标。若按原假设修 cover 字段或补图，将 **修错问题**（与 Sprint A/B BD-001/BD-002 假设否定同源）。

---

## 3. Exit Condition · MET（staging）

Registry 登记 Exit：`Provider + Acquisition listings cover 完整且 Market 可读`

| Surface | Total | missing cover | HEAD fail | Market HTTP | data_origin |
|---------|-------|---------------|-----------|-------------|-------------|
| Provider | 10 | 0 | 0 | 200 | production |
| Acquisition | 10 | 0 | 0 | 200 | production |

**语义层判定：** Exit Condition **已满足** · BD-003 若以 Cover 为唯一 scope，**具备关闭为 staging 不适用 / hypothesis rejected 的条件**。

---

## 4. 候选解释 · CONFIRMED_CANDIDATE

### 4.1 表述

> **`premature_listings_cover_hypothesis_on_staging`** — BD-003 在 framework bootstrap 时登记，早于 Listings BDR Day3 探针与 OCS production public baseline 完备验证；staging 上 Public Catalog 已输出完整可加载 cover，原假设为 **过早登记**。

### 4.2 次要信号（不升格为 BD-003 主因 · 路由至独立轨）

| 信号 ID | 说明 | 建议归属 |
|---------|------|----------|
| `cover_path_not_ocs_manifest` | 10/10 使用 `/uploads/community-posts/ocs-*` · 0/10 在 `market/ocs/{chain_id}/` manifest | **Market Media DDG** 独立轨 |
| `listings_bdr_day3_unprobed` | `registry/business-data-readiness` listings 域 Day3 probe **pending** | **Listings BDR Day3** |
| `automation_db_bloat` | admin queue 110 行 · 69 smoke/probe · public 仅 20 published | **非 Cover RC** · 数据治理 / Catalog 基线（另轨） |
| `/market` bypass catalog | discover/orders + guides 非 listings catalog | **架构血缘** · 非 Cover 缺失 |

---

## 5. Data Lineage 审计 · 补充（非 BD-003 Cover 主因）

| 页面 | API | Public Catalog? | staging 条数 |
|------|-----|-----------------|--------------|
| `/market` | discover/orders + guides | **否** | orders 1 · guides 10 |
| `/market/provider` | `market/provider/listings` | **是** | 10 |
| `/market/acquisition` | `market/acquisition/listings` | **是** | 10 |

**含义：** Provider/Acquisition **Cover 完整**；页面/API 血缘不统一与 automation 累积是 **独立治理议题**，不应复用 BD-003「Cover 不完整」ID。

---

## 6. Supporting Evidence

| # | 路径 | 用途 |
|---|------|------|
| E1 | `evidence/GO_production_readiness/step3/BD-003-LISTINGS-COVER-DISCOVERY-LATEST.json` | Cover 全量探针 · Exit MET |
| E2 | `evidence/GO_production_readiness/sprints/BD-003-DISCOVERY-RESULT.md` | Discovery 摘要 · REJECTED |
| E3 | `evidence/GO_production_readiness/step3/BD-003-DATA-LINEAGE-AUDIT-LATEST.json` | 三页面血缘 · Catalog 过滤链 |
| E4 | `evidence/GO_production_readiness/sprints/BD-003-DATA-LINEAGE-AUDIT.md` | Lineage 人读摘要 |
| E5 | `evidence/GO_production_readiness/step2/PROVIDER-BUSINESS-DATA-READINESS-DAY2-LATEST.json` | Day2 Images PASS |
| E6 | `scripts/dev/run-provider-business-data-readiness-probes.cjs` | Day2 可复现 |
| E7 | `registry/market-media-ddg-remediation.v1.yaml` | 路径/manifest 迁移独立轨 |
| E8 | `registry/business-data-readiness.v1.yaml` | Listings Day3 pending |

---

## 7. Impact

### 7.1 业务影响

| 层级 | 状态 | 用户可见影响 |
|------|------|----------------|
| Public Market · Provider cover | ✅ | 10/10 可加载 |
| Public Market · Acquisition cover | ✅ | 10/10 可加载 |
| Market 列表 HTTP | ✅ | 200 |
| Listings Cover 作为 Sprint B 阻塞 | **NO** | 无用户可见 Cover 缺口 |

### 7.2 与 Open RC 关系

- **BD-003（Cover 假设）：** 无 Fix 价值；Exit 已 MET。
- **BFM-001：** 独立队列 · Acquisition 真人链 · 与 Cover **无直接因果**。
- **Listings BDR Day3 / Market Media DDG：** 已有 registry 独立轨 · **不吸收进 BD-003**。

### 7.3 Sprint 信号（本文档 **不修改**）

- `TT_SPRINT_B=READY`
- `TT_SPRINT_B_ACTIVE=false`
- `root_cause_confirmed=false`
- `fix_authorized=false`

---

## 8. 关闭 vs 拆分 · 建议

### 8.1 选项 A · **关闭为 staging 不适用**

BD-003 **CLOSED** — 原假设 REJECTED · Exit MET · 无 Fix。

### 8.2 选项 B · **关闭 + 显式拆分至独立治理轨（推荐）**

同选项 A 关闭 · 残余信号书面路由至 **Listings BDR Day3** + **Market Media DDG** · **不开** 新 Sprint B RC。

### 8.3 选项 C · **REDEFINE-in-place（不推荐）**

保留 OPEN 改写为 Data Lineage → ID 与 Cover Evidence 混淆 · **拒绝**。

---

## 9. 签核槽

| 角色 | 状态 |
|------|------|
| Evidence | ✅ E1–E8 |
| REDEFINE 文档 | ✅ 本文档 |
| Owner Decision | ✅ `OWNER-LISTINGS-COVER-DECISION.md` |
| fix_authorized | ❌ false |
| TT_SPRINT_B ACTIVE | ❌ false |

---

*Generated · mode: discovery_only · no registry · no data · no ACTIVE*
