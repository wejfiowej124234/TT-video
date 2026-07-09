# TT-FRONTEND-API-CONSISTENCY-AUDIT · 企业级前端–API 一致性审计

**Version:** 1.0.0 · **生效：** 2026-07-02  
**机读：** [`registry/frontend-api-consistency-audit.v1.yaml`](../../registry/frontend-api-consistency-audit.v1.yaml)  
**Gate：** `bash scripts/gates/check-frontend-api-consistency-audit-ssot.sh`

```text
TT_FRONTEND_API_CONSISTENCY_AUDIT: ENFORCED
```

---

## 0 · 为什么需要这一层

很多企业 **API 100 分、数据库 100 分**，但用户仍认为「系统坏了」，常见原因：

| 层 | 典型故障 |
|----|----------|
| Frontend Mapping | 字段映射错 · filter 与 API 参数不一致 |
| State Store | React cache 重复 · 30s TTL 陈旧数据 |
| UI | Placeholder 头像碰撞 · Skeleton 误导 |
| Browser | Hydration 双渲染 · Mock 泄漏到 Staging/Prod |

**本审计检查整条链：**

```text
Database → API → Frontend Mapping → State Store → UI → Browser
```

---

## 1 · 发布流程位置（每次上线必跑）

```text
Product Capability Complete
        │
        ▼
Frontend ↔ API Consistency Audit    ← 本 Runbook
        │
        ▼
Display Data Governance
        │
        ▼
Business Manual UAT
        │
        ▼
PI3 → Production GO
```

---

## 2 · 检查维度（写死）

| 检查项 | 说明 |
|--------|------|
| API 数量 == UI 数量 | 列表/card 数与 API `items`/`posts` 一致 |
| UUID 一致 | 无重复 id · 无 mock id 混入 |
| Status 一致 | published/draft 与公众面一致 |
| 排序一致 | API sort 与 UI 展示顺序 |
| Filter 一致 | 城市/标签筛选与 query 参数对齐 |
| Pagination 一致 | cursor/limit 不丢不重 |
| Placeholder 不误导 | 无 avatar 碰撞 · 无假 production |
| Skeleton 不误导 | loading 态不误展示 mock |
| Cache 不重复 | 内存 cache 不叠加 stale 行 |
| Hydration 不重复 | SSR/CSR 不双份列表 |
| Mock 不泄漏 | Staging/Prod `NODE_ENV=production` 无 showcase fallback |
| data_origin 一致 | test/demo 带 `[TEST]` · 不冒充 production |

---

## 3 · 审计面（Surfaces）

| ID | 面 | API | 前端 |
|----|-----|-----|------|
| **S01** | Market · Guides | `GET /guides` | `/market` GuideCard |
| **S02** | Market · Discover | `GET /discover/orders` | 订单栏 |
| **S03** | Community · Feed | `GET /community/feed` | `/community` Feed/Drawer |
| **S04** | Governance | `GET /governance/proposals` | `/governance` |
| **S05** | Official · Campaign | `GET /official/cold-start/surfaces/:surface` | 首页/市场/社区 |
| **S06** | Content | Admin publish + 公众 resolve | Landing/POI |

---

## 4 · 执行

### 4.1 API 层（自动化 · 必跑）

```bash
# Local
bash scripts/dev/run-frontend-api-consistency-audit.sh

# Staging
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash scripts/dev/run-frontend-api-consistency-audit.sh
```

产物：`evidence/GO_frontend_api_consistency_audit/<env>_<UTC>/audit-report.json`

### 4.3 Strict 模式（Phase 3 复跑 · Warning 清零）

```bash
STRICT_WARNINGS=1 bash scripts/dev/run-frontend-api-consistency-audit.sh
```

**PASS 条件：** `blocking: 0` · `warnings: 0`

### 4.4 Visual Consistency 修复（Warning 修复脚本）

```bash
# 测试向导唯一 avatar_url
API_BASE=https://tt-api-staging.fly.dev node scripts/dev/assign-public-guide-display-avatars.cjs
```

```bash
cd frontend
STAGING_API_BASE=https://tt-api-staging.fly.dev \
STAGING_WEB_BASE=https://tt-web-staging.fly.dev \
  npx playwright test e2e/frontend-api-consistency-audit.spec.ts --project=chromium
```

**一键（API strict + 浏览器 + 截图证据）：**

```bash
bash scripts/dev/record-frontend-api-consistency-audit-staging.sh
```

产物：`evidence/GO_frontend_api_consistency_audit/staging_browser_<UTC>/`（`audit-report.json` · `browser-report.json` · `screenshots/`）

---

## 5 · PASS / FAIL

- **PASS：** 所有 **blocking** 检查为 0 · 非 blocking（如 avatar placeholder 碰撞）记入 `warnings`
- **FAIL：** UUID 重复 · Mock 泄漏 · API/Feed 数量不一致 · Draft 泄漏到公众面

---

## 6 · 与 Display Data Governance 的分工

| 审计 | 范围 |
|------|------|
| **Frontend–API Consistency** | 全页面 · 链路透传 · UI 映射 · cache/mock |
| **Display Data Governance** | 公众展示 **数据内容** · canonical · test policy |

**顺序：** Consistency Audit **先**发现「API 对但 UI 错」→ Governance **再**清理数据内容。

---

**TT_FRONTEND_API_CONSISTENCY_AUDIT: ENFORCED**
