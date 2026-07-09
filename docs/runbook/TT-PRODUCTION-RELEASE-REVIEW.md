# TT-PRODUCTION-RELEASE-REVIEW · 企业级发布前验收（Business Domain Validation）

**Version:** 1.0.0 · **生效：** 2026-07-02  
**机读：** [`registry/production-release-review.v1.yaml`](../../registry/production-release-review.v1.yaml)  
**性质：** **最终产品验收** — **不是**第六类常驻审计；**是**把每个业务域拉到与 **Guide** 同深度

```text
TT_PRODUCTION_RELEASE_REVIEW: CLOSED
TT_FULL_TEST_ACCOUNT_E2E: CLOSED
TT_BUSINESS_DOMAIN_VALIDATION: PASS
```

---

## 0 · 与你表格的对应关系

| 你关心的深度 | 本 Review 如何落地 |
|--------------|-------------------|
| API → Frontend → Browser 一致 | **L4 页面一致性** + 扩展 `business-domain-validation-probes.cjs` + Playwright `business-domain-validation.spec.ts` |
| 商家 / 收购 / 行程 / 消息 | 独立域行 · UAT-04/09/10/11 · BDV 浏览器探针 |
| 全页面不漏 | **L1** — 以 04 §3.4 + 13-1 表 1 为页面清单，逐域登记 |
| 全流程重走 | **L2** — 游客/向导/商家/Governance 流程清单（手册 + walkthrough 证据） |
| Admin 真点 | **L3** — 在 40/40 之上补「按钮级」Release Review（非替代 Functional Audit） |
| 企业体验 | **L5** — Experience Review 登记 Enhancement，不混入 Product Defect |

---

## 1 · 五层结构

### L1 · 所有页面（100%）

每一页检查：UI 完整 · 数据来自 API · Admin 配置入口 · L5 · 无空数据异常 · 无 test 泄漏 · 无 placeholder 误导

### L2 · 所有业务流程

游客：注册 → 身份 → 预约 → Escrow → 完成  
向导：注册 → 审核 → 上架 → 接单 → 完成  
商家：注册 → 审核 → 发布 → 成交  
Governance：Proposal → Vote → Queue → Execute

### L3 · 所有后台功能

Content · Official Ops · Platform · User · Campaign — 在 40/40 机器 PASS 之上 **按钮级** 验收

### L4 · 页面一致性（核心）

每个业务域：**API count/字段 == Frontend mapping == Browser 可见**

### L5 · 企业体验

Airbnb/Booking/携程/Web3 PM 视角 — 登记 **Enhancement**，不当作 blocking defect

---

## 2 · 域矩阵（诚实现状 · 2026-07-02）

| Domain | API | Browser | Admin | Business | UX | Status |
|--------|-----|---------|-------|----------|-----|--------|
| Market · Guides | ✅ | ✅ | ✅ | ✅ | ✅ | **PASS** |
| Community | ✅ | ✅ | ✅ | ✅ | ⚠️ | PARTIAL |
| Discover | ✅ | ⚠️ | — | ✅ | ⚠️ | PARTIAL |
| Home / Campaign | ✅ | ⚠️ | — | ⚠️ | ⚠️ | PARTIAL |
| Governance | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | PARTIAL |
| Admin Platform | ✅ | ✅ | ✅ | ✅ | ⚠️ | PARTIAL |
| **Provider** | ⚠️ | ❌→🔄 | ⚠️ | ⚠️ | ❌ | **GAP** |
| **Acquisition** | ⚠️ | ❌→🔄 | ⚠️ | ⚠️ | ❌ | **GAP** |
| **Itinerary** | ⚠️ | ❌ | — | ⚠️ | ❌ | **GAP** |
| **Messages** | ⚠️ | ❌→🔄 | — | ⚠️ | ❌ | **GAP** |
| **Orders · Escrow** | ⚠️ | ❌ | ⚠️ | ⚠️ | ❌ | **GAP** |
| **Web3 · Staking** | ⚠️ | ❌ | — | ⚠️ | ❌ | **GAP** |

🔄 = 本 Review 已加探针，待跑通并提升到 PASS

**目标：** 全表 **PASS** 后 `TT_PRODUCTION_RELEASE_REVIEW: CLOSED`，与 PI3 基础设施轨并行但 **产品缺陷必须先清零**。

---

## 3 · 执行

```bash
bash scripts/dev/run-production-release-review.sh
```

产物：`evidence/GO_production_release_review/<UTC>/`

- `release-review-ledger.json` — 唯一 Release Review Ledger
- `RELEASE-REVIEW-LEDGER.md` — 人读矩阵
- `bdv-probes-*.log` · `bdv-browser.log`

---

## 4 · 分类纪律

| 分类 | 处置 |
|------|------|
| **Product Defect** | 必须修复至 PASS |
| **Production Blocker** | PI3-001～006 排队；不阻断域矩阵产品收敛 |
| **Expected Difference** | 确认设计 · 不修成一致 |
| **Enhancement** | Post-GO 或 PI3 后 |

---

## 5 · 与 Phase12 Final Convergence 的关系

- **Phase12：** 汇总既有五类审计证据 · 结束 Phase①/② · 切换主线至 PI3  
- **本 Review：** 把 **域深度拉平** · 全站 PASS 作为 **进入 PI3 前的最终产品签字**

---

**TT_PRODUCTION_RELEASE_REVIEW: IN_PROGRESS** — 直至域矩阵全 PASS
