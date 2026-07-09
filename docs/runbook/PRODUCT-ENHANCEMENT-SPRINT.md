<!-- ARCHIVED · SSOT: docs/runbook/PHASE3-PRODUCTION-PREPARATION.md · PRODUCT_ENHANCEMENT_SPRINT: ARCHIVED -->
> **ARCHIVED** · Sprint overlay **frozen** · Phase ③ mainline resumed via Production Convergence.  
> **Do not use** machine keys below for Production GO gate decisions.

# Product Enhancement Sprint

**生效：** 2026-06-07 · **ARCHIVED：** 2026-07-01  
**状态：** **ARCHIVED**（Wave 4.1 完成 · ③ Production Convergence 主轨 ACTIVE）  
**前置基线：** `FINAL_SYSTEM_AUDIT: PASS`（冻结 · 不扩展审计范围）  
**历史暂停项：** Phase ③ Production GO · Production Infrastructure Audit · **Wave 5**（已随 Convergence 恢复审计轨）

---

## 0 · 机读键（历史 · 见 PHASE3-PRODUCTION-PREPARATION.md）

```text
PHASE3_PRODUCTION_GO: NO_GO
PRODUCTION_INFRASTRUCTURE_AUDIT: ACTIVE
PRODUCT_ENHANCEMENT_SPRINT: ARCHIVED
FINAL_SYSTEM_AUDIT_BASELINE: PASS
BUSINESS_CORE_CHAIN: FROZEN
SYSTEM_AUDIT_SCOPE: FROZEN
PES_SPRINT_ID: product-enhancement-sprint-20260607
PES_WAVE2_ID: product-enhancement-wave2-funnel-20260607
PES_WAVE3_ID: product-enhancement-wave3-analytics-20260607
PES_RUJR: COMPLETE
PES_RUJR_ID: pes-real-user-journey-review-20260607
PES_FEATURE_DEVELOPMENT: PAUSED
PES_WAVE4_ID: product-enhancement-wave4-closure-20260607
PES_WAVE4_1_ID: pes-wave4-1-validation-20260607
PES_WAVE5: BLOCKED
PES_WAVE5_DECISION: PENDING_BROWSER_EVIDENCE
```

---

## 1 · 范围

| 触点 | 路由 / 入口 | Sprint 重点 |
|------|-------------|-------------|
| **首页** | `/` · `ItineraryResultsSection` | 生成加载反馈 · Escrow 转化条 |
| **Market** | `/market` | 空态转化 · 商业化展示 |
| **Community** | `/community/*` | 空态 UGC 激励 · 探索 CTA |
| **Guide** | `/guide` | 零单向导转化 · 抢单入口 |
| **Merchant** | `/provider/register` pending | 入驻价值说明 · 合规徽章 |
| **Governance** | `/governance/proposals` | 加载骨架 · 空提案 CTA · 治理转化 |

---

## 2 · 纪律（写死）

| 允许 | 禁止 |
|------|------|
| 加载反馈 · 空态 · 转化条 · 44px 触控 · i18n | 核心业务链（Escrow/订单/治理执行/API 契约）变更 |
| 叠加式 UX 组件（`components/product-enhancement/`） | 扩展 FINAL_SYSTEM_AUDIT 范围 |
| bugfix · a11y · 移动端触控 | 恢复 Production GO / 主网 / live PSP 实施 |
| Contract 测试 `productEnhancementSprint.contract.test.ts` | 五主路由 **layout lock** 结构重排 |

**共享库：** `frontend/lib/productEnhancementSprint.ts`  
**i18n 前缀：** `pes_*`

---

## 3 · 交付（Wave 1 · 2026-06-07）

- [x] `TouchpointLoadingBand` / `TouchpointEmptyPanel` / `TouchpointConversionStrip`
- [x] 六触点 Wave 1 接入
- [x] `pes_*` 中英文案
- [x] `productEnhancementSprint.contract.test.ts`

---

## 3b · 交付（Wave 2 · Conversion Funnel · 2026-06-07）

- [x] `conversionFunnelModel.ts` · BP-01~08 断点登记
- [x] `ConversionFunnelRail` / `RoleEntryQuickGrid` / `EscrowTrustMicro`
- [x] 六触点 Wave 2 叠加接入
- [x] `pes2_*` 中英文案
- [x] `conversionFunnelModel.test.ts`
- [x] [PES-CONVERSION-FUNNEL-AUDIT-WAVE2](./PES-CONVERSION-FUNNEL-AUDIT-WAVE2.md)

---

## 3c · 交付（Wave 3 · Conversion Analytics · 2026-06-07）

- [x] `conversionAnalyticsLayer.ts` · 统一埋点 + 聚合
- [x] `conversionAnalyticsAbRegistry.ts` · A/B Test Registry
- [x] `ConversionFunnelDashboard` · `/admin/conversion-analytics`
- [x] Wave 1/2 PES 组件埋点接入
- [x] `pes3_*` 中英文案
- [x] `conversionAnalyticsLayer.test.ts`
- [x] [PES-CONVERSION-ANALYTICS-WAVE3](./PES-CONVERSION-ANALYTICS-WAVE3.md)

---

## 3d · 交付（RUJR · Real User Journey Review · 2026-06-07）

- [x] 四角色 × 12 轮 = **48 次**走查路径 SSOT（`pesJourneyReviewModel.ts`）
- [x] 走查聚合 · Top-10 Drop-off / Friction / UX Backlog
- [x] `e2e/pes-real-user-journey-review.spec.ts`
- [x] 证据 `frontend/evidence/pes-rujr-20260607/`
- [x] [PES-REAL-USER-JOURNEY-REVIEW](./PES-REAL-USER-JOURNEY-REVIEW.md)
- [x] Wave 4 方向决策 → **Conversion Closure Sprint**

---

## 3e · 交付（Wave 4 · Conversion Closure · 2026-06-07）

- [x] `pesAuthReturnFlow.ts` · 统一 Auth Return + `pes_intent`
- [x] `conversionClosureWave4.ts` · Before/After 矩阵 · Delta Report
- [x] `PersistentRoleEntryBar` · CC-P0-03 visit→register
- [x] `MarketOrderClosureStrip` · CC-P0-01 find_guide→order
- [x] `IdentityPostClosureStrip` · CC-P0-02 identity→post
- [x] `pes4_*` 中英文案
- [x] `conversionClosureWave4.test.ts` · `pesAuthReturnFlow.test.ts`
- [x] [PES-WAVE4-CONVERSION-CLOSURE-AUDIT](./PES-WAVE4-CONVERSION-CLOSURE-AUDIT.md)

---

## 3f · 交付（Wave 4.1 · Validation · 2026-06-07）

- [x] `wave4Validation.ts` · Actual Funnel Matrix · Drop-off Delta
- [x] `e2e/pes-wave4-validation.spec.ts` · 50 轮轻量 RUJR
- [x] `wave4Validation.test.ts` · 合成证据导出
- [x] 分批验证框架 `wave41BatchValidation.ts` · `run-pes-wave41-batches.sh`
- [x] smoke 10 轮埋点非空（10/10 runs · 172 events · 2026-06-07）
- [ ] batch 1–5 + aggregate（**进行中**）
- [ ] 浏览器 `wave41-validation.json` + Matrix 达标
- [x] [PES-WAVE4-VALIDATION-AUDIT](./PES-WAVE4-VALIDATION-AUDIT.md)
- [x] [PES-WAVE5-DECISION-PACKAGE](./PES-WAVE5-DECISION-PACKAGE.md) · **Wave 5 BLOCKED**

---

## 4 · 验收

```bash
cd frontend
npx vitest run lib/wave41BatchValidation.test.ts lib/wave4Validation.test.ts
# Wave 4.1 分批浏览器验证（解锁 Wave 5 前必跑）：
bash scripts/dev/run-pes-wave41-batches.sh
# 五主绿集（结构未改 · 应仍 exit 0）：
npx vitest run app/\(home\)/homeMarketing.contract.test.ts components/market/marketTheme.contract.test.ts
```

---

## 5 · 相关文档

| 文档 | 关系 |
|------|------|
| [FINAL-SYSTEM-AUDIT-REPORT](./FINAL-SYSTEM-AUDIT-REPORT.md) | 冻结基线 |
| [PHASE3-PRODUCTION-PREPARATION](./PHASE3-PRODUCTION-PREPARATION.md) | GO 程序已 PAUSED |
| [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) | layout lock · Sprint 仅叠加 UX |
| [PES-CONVERSION-FUNNEL-AUDIT-WAVE2](./PES-CONVERSION-FUNNEL-AUDIT-WAVE2.md) | Wave 2 转化漏斗审计 |
| [PES-CONVERSION-ANALYTICS-WAVE3](./PES-CONVERSION-ANALYTICS-WAVE3.md) | Wave 3 转化分析层 |
| [PES-REAL-USER-JOURNEY-REVIEW](./PES-REAL-USER-JOURNEY-REVIEW.md) | RUJR · Top-10 |
| [PES-WAVE4-CONVERSION-CLOSURE-AUDIT](./PES-WAVE4-CONVERSION-CLOSURE-AUDIT.md) | Wave 4 闭合审计 |
| [PES-WAVE4-VALIDATION-AUDIT](./PES-WAVE4-VALIDATION-AUDIT.md) | Wave 4.1 验证 |
| [PES-WAVE5-DECISION-PACKAGE](./PES-WAVE5-DECISION-PACKAGE.md) | Wave 5 决策（BLOCKED） |

---

*Product Enhancement Sprint ACTIVE · Wave 4.1 Validation · Wave 5 BLOCKED · 2026-06-07*
