# TT-PDCA · Production Data Consistency Audit

**Version:** 1.0.0 · **生效：** 2026-07-14  
**上级 SSOT：** [`TT-BUSINESS-CONTENT-INTEGRITY-SSOT.md`](TT-BUSINESS-CONTENT-INTEGRITY-SSOT.md)  
**机读：** [`registry/business-content-integrity.v1.yaml`](../../registry/business-content-integrity.v1.yaml)  
**Runner：** `scripts/dev/run-pdca-business-content-snapshot.cjs`

```text
TT_PDCA: ACTIVE
TT_PDCA_BASELINE_MODE: SNAPSHOT_DIFF
```

---

## 0 · 目的

PDCA 是 BCI 的**可执行快照审计**：建立业务内容基线、与上一快照 diff、输出九维 integrity，供 **Daily Ops** 与 **Release Pipeline** 双挂载。

**不是** Release Validation 替代品；**不是**重开 DDG/OCS。

---

## 1 · 快照模式（不写死 10）

```text
Run 1（Tonight）     → baseline.json（无 previous → FIRST_SNAPSHOT）
Run 2（次日）       → baseline.json + diff.json（vs Run 1）
Run N（运营扩容后）  → 新 baseline；diff 相对 Run N−1（30→35 = PASS，30→29 = WARN）
```

冷启动 OCS 的「10」仅可在 `baseline.json.reference` 中标注 `reference_only: true`，**不参与**框架 FAIL 判决。

---

## 2 · 四产物（强制）

每次运行写入：

```text
evidence/GO_pdca_business_content/<UTC>/
├── baseline.json
├── diff.json
├── integrity.json
└── report.md
```

并更新指针：

```text
evidence/GO_pdca_business_content/BASELINE-LATEST.json   ← 上一快照 SSOT（供 diff）
evidence/GO_pdca_business_content/PDCA-LATEST.json       ← 本次运行索引
```

### 2.1 `baseline.json`（唯一真源）

```json
{
  "schema": "traveltrust.pdca_baseline.v1",
  "captured_at_utc": "2026-07-14T15:59:00Z",
  "environment": { "name": "staging", "api_base": "https://tt-api-staging.fly.dev" },
  "surfaces": {
    "community": { "count": { "total": 10, "official": 8, "campaign": 1, "pinned": 1 } },
    "official_guide": { "count": { "total": 10, "published": 10, "media_bound": 10 } }
  },
  "reference": {
    "ocs_cold_start_phase1": { "reference_only": true, "note": "Not a framework floor" }
  }
}
```

### 2.2 `diff.json`

```json
{
  "schema": "traveltrust.pdca_diff.v1",
  "previous_baseline_utc": "2026-07-13T16:00:00Z",
  "current_baseline_utc": "2026-07-14T15:59:00Z",
  "rows": [
    { "surface": "community", "metric": "count.total", "yesterday": 10, "today": 9, "verdict": "WARN" },
    { "surface": "community", "metric": "count.total", "yesterday": 10, "today": 6, "verdict": "FAIL" }
  ],
  "summary_verdict": "WARN"
}
```

**判决规则（框架常量）：**

- `today === yesterday` → PASS  
- `yesterday - today === 1` → WARN  
- `today <= floor(yesterday * 0.6)` → FAIL  
- 无 previous → `summary_verdict: FIRST_SNAPSHOT`

### 2.3 `integrity.json`（九维 · 机器可读）

含：`count` · `identity` · `data_origin` · `lifecycle` · `visibility` · `media` · `cms_binding` · `catalog` · **`ownership`**。

每 surface 独立 `verdict`；任一条 **ownership** 或 **identity** FAIL → `summary_verdict` 不得为 PASS。

### 2.4 `report.md`

人类摘要：环境、快照时间、diff 表、integrity 红灯、疑似根因（过滤 / 迁移 / 绑定 / 归属），**不替代** JSON 真源。

---

## 3 · 双挂载

| 场景 | 命令 | Exit 期望 |
|------|------|-----------|
| **Daily Ops** | `node scripts/dev/run-pdca-business-content-snapshot.cjs` | WARN=0 绿；WARN>0 非零可选 |
| **Release 前** | 同上 + `TRAVELTRUST_PDCA_REQUIRE_PASS=1` | FAIL 或 integrity FAIL → exit 1 |

环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `API_BASE` | `http://127.0.0.1:8080` | API 根 |
| `WEB_BASE` | staging 默认 `https://tt-web-staging.fly.dev` | 页面 HTML 只读探针 |
| `ENV_LABEL` | `local` | staging / local |
| `PDCA_ADMIN_TOKEN` | — | Admin/CMS 三角矩阵（只读 GET；**不**调用 promote） |
| `PDCA_ADMIN_EMAIL` / `PDCA_ADMIN_PASS` | — | 无 token 时 login-only；失败记 UNKNOWN |
| `TRAVELTRUST_PDCA_REQUIRE_PASS` | `0` | Release 闸设为 `1` |

### 3.1 · Destination / Campaign 三角矩阵（只读）

每 surface 写入 `baseline.json` → `surfaces.<name>.triangle_matrix`：

| 腿 | 来源 |
|----|------|
| **Admin/CMS** | `GET /api/v1/admin/content/countries*` · `GET /api/v1/admin/official/cold-start/campaigns*` |
| **Public API** | `GET /api/v1/catalog/countries` · `GET /api/v1/community/explore/destinations` · `GET /api/v1/official/cold-start/surfaces/:surface` |
| **Page visible** | `WEB_BASE` 初始 HTML · `data-tt-community-explore-dest-catalog` · `data-tt-cold-start-*` |

单腿不可达 → `probe_status: unknown` + `integrity` **WARN**；**禁止**把缺失字段伪造为 PASS。  
`FILTER_HIDE_*` 原因写入 `filter_hide_reasons`。  
**Admin 腿** enum：`RBAC_MASKED_404` · `STAGING_ROUTE_NOT_DEPLOYED` · `ADMIN_CONTRACT_MISSING` · `SOURCE_DIVERGENCE` · `ADMIN_LEG_UNRESOLVED`（**不得**据此 deploy/align）。  
**Content 腿** enum：`content_exists` · `filtered` · `binding_break` · `ownership_wrong` · `unknown`。  
页面腿默认 **Playwright CSR**（`PDCA_SKIP_PLAYWRIGHT=1` 回退 initial HTML）；等待 `data-tt-cold-start-ready` / explore destination DOM 后与 Public API 对拍。

---

## 4 · Surface 探针（v1 · 可扩展）

| Surface | v1 探针 | 备注 |
|---------|---------|------|
| Community | `GET /api/v1/community/feed` | count + identity 切片 |
| Guide | `GET /api/v1/guides` | |
| Official Guide | Admin / catalog 探针 | 迭代补全 |
| Destination | Destination hub 探针 | 迭代补全 |
| Campaign | OCS / Public Ops | 迭代补全 |
| Merchant | Provider 列表 | 迭代补全 |
| Hero | CMS landing ambient | 迭代补全 |
| CMS | Admin content 计数 | 迭代补全 |

探针未就绪的 surface 记 `probe_status: pending`，**不**伪造 PASS。

---

## 5 · 与 CMS Daily Ops 关系

```text
run-cms-daily-ops-board.cjs   → Upload / Publish / Verify / Live（资产流水线）
run-pdca-business-content-snapshot.cjs → 全站业务内容快照 diff（回归基线）
```

**并行运行**；PDCA 不进入 CMS 架构扩展。

---

## 6 · 诚实边界

- ① 本地 PDCA PASS **≠** ② Staging 内容基线 PASS **≠** ③ Production GO。  
- 首轮 `FIRST_SNAPSHOT` **不是**「内容完整已证」；仅建立 diff 起点。

---

## 7 · Remediation R-01（2026-07-14 · Guest CSR 对拍修复）

**证据：** `evidence/GO_pdca_business_content/PDCA-REMEDIATION-R01-LATEST.json`

| ID | 根因（唯一） | 最小修复 |
|----|-------------|----------|
| **R-01-COMMUNITY** | 全量 API 批次已在内存（`feedNextCursor=null`）仍被 `FEED_PAGE_SIZE` 客户端分页 + promo 预览去重各裁掉可见帖 | `communityFeedVisiblePosts.ts` · 无 cursor 时渲染全量 · promo 预览仅在 `postsToShow.length > 20` 时启用 |
| **R-01-HOME_HERO** | `coldStartConsumerPresentation` 未消费 API `item_type=guide` | 映射 `guide` → official_guide 卡片（href `/guides/:id` · title `public_title\|city`） |

**复验（② Staging · FE 部署后）：**

```bash
API_BASE=https://tt-api-staging.fly.dev \
WEB_BASE=https://tt-web-staging.fly.dev \
ENV_LABEL=staging \
node scripts/dev/run-pdca-guest-csr-reconcile.cjs
```

期望：`community` 与 `campaign.home_hero` 均为 `aligned`（API 计数 = Guest CSR DOM）。

**状态（2026-07-14T18:47Z · ② Staging）：** **CLOSED** · RC `e4fe13e2` · Guest CSR `20260714T184503Z`（Community 10/10 · home_hero 2/2）· PDCA `20260714T184707Z`（diff=PASS · integrity=WARN 仅 destination_admin 预存项）。

**禁止：** align · Content Freeze 解除 · 新增探针 surface。
