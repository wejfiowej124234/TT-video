# PES · Real User Journey Review (RUJR)

**生效：** 2026-06-07  
**程序：** Product Enhancement Sprint · **RUJR 阶段**  
**基线：** `FINAL_SYSTEM_AUDIT: PASS`（冻结）  
**机读 ID：** `pes-real-user-journey-review-20260607`

---

## 0 · 机读键

```text
FINAL_SYSTEM_AUDIT_BASELINE: PASS
PRODUCT_ENHANCEMENT_SPRINT: ACTIVE
PES_FEATURE_DEVELOPMENT: PAUSED
PES_RUJR: ACTIVE
PES_RUJR_ID: pes-real-user-journey-review-20260607
PES_WAVE4: PENDING_DECISION
BUSINESS_CORE_CHAIN: FROZEN
API_CONTRACT: FROZEN
```

---

## 1 · 走查方法

| 项 | 值 |
|----|-----|
| 角色 | 旅行者 · 向导 · 商家 · 治理参与者 |
| 轮次 | **12 轮/角色 × 4 = 48 次**完整路径 |
| 埋点 | Wave 3 `Conversion Analytics Layer`（localStorage） |
| 看板 | `/admin/conversion-analytics` |
| 自动化 | `e2e/pes-real-user-journey-review.spec.ts` |
| 证据 | `frontend/evidence/pes-rujr-20260607/rujr-report-synth.json` |

**纪律：** 本阶段 **暂停 Wave 4 功能开发**；仅走查、聚合、输出 Backlog。

---

## 2 · 漏斗 KPI（48 次走查聚合）

| 指标 | 观测值 |
|------|--------|
| 总会话 | 48 |
| 总事件 | 150 |
| 注册意向 | 37 |
| 身份意向 | 26 |
| 向导招募点击 | 6 |
| 治理参与 | 6 |
| Escrow 信任点击 | 8 |

| 阶段 | 会话触达 |
|------|----------|
| visit | 48 |
| register | 39 |
| identity | 32 |
| post | 13 |
| find_guide | 22 |
| order | 2 |
| govern | 12 |

---

## 3 · Top-10 Drop-off Points

| # | 转化段 | 流失率 | 证据 |
|---|--------|--------|------|
| 1 | find_guide → order | **90.9%** | 找向导后极少形成订单（登录 + Escrow 门槛） |
| 2 | identity → post | **59.4%** | 身份开通后未进入社区 UGC |
| 3 | visit → register | 18.8% | 首屏仍有一部分访客未触达注册 |
| 4 | register → identity | 17.9% | 注册后未完成身份/角色开通 |
| 5 | post → find_guide | 15.4% | 发帖后未进入市场（非线性路径会稀释） |
| 6 | order → govern | 0%* | 治理参与者常跳过订单直达 Hub |

\*治理路径非严格线性，order 阶段样本少（n=2）。

**首要断点结论：** **市场→订单** 与 **身份→发帖** 是 Wave 4 最优先修复的漏斗缺口。

---

## 4 · Top-10 Friction Points

| # | ID | 严重度 | 观测率 | 问题 |
|---|-----|--------|--------|------|
| 1 | FR-01 | P0 | 20.8% | 首页空态外 RoleEntry 不可见 |
| 2 | FR-04 | P0 | 18.8% | 注册/发帖/入驻登录门闸 |
| 3 | FR-05 | P1 | 6.3% | 向导招募入口分散 |
| 4 | FR-09 | P2 | — | ProductCrossNav 缺转化链 |
| 5 | FR-03 | P0 | — | 市场→订单 + Escrow 认知成本 |
| 6 | FR-02 | P0 | — | 行程与 /traveltrust 断链 |
| 7 | FR-06 | P1 | — | 商家入驻路径跳跃 |
| 8 | FR-07 | P1 | — | 治理 Hub 信息密度 |
| 9 | FR-08 | P1 | — | 移动端筛选过载 |
| 10 | FR-10 | P2 | — | Escrow 信任页回流弱 |

登记源：`frontend/lib/pesJourneyReviewModel.ts` · `PES_FRICTION_CATALOG`

---

## 5 · UX Improvement Backlog（Wave 4 候选）

| ID | 优先级 | Wave 4 主题 | 来源 |
|----|--------|-------------|------|
| UX-01 | P0 | 首屏常驻角色入口 + 生成中 CTA | FR-01 |
| UX-02 | P0 | 统一 Auth 回流 + 意图保留 | FR-04 |
| UX-03 | P0 | 市场「一键下单」+ Escrow 分步引导 | FR-03 |
| UX-04 | P0 | Hero 提交后双 CTA（市场/注册） | FR-02 |
| UX-05 | P1 | 市场 Hub 向导招募横幅 | FR-05 |
| UX-06 | P1 | 入驻进度与 onboarding 深链合一 | FR-06 |
| UX-07 | P1 | 治理 Hub 折叠池 + 提案快捷区 | FR-07 |
| UX-08 | P1 | 移动端渐进披露筛选 | FR-08 |
| UX-09 | P2 | 全局 PesFunnelQuickLinks | FR-09 |
| UX-10 | P2 | 信任页回程 CTA | FR-10 |

---

## 6 · Wave 4 方向建议（待决策）

基于 RUJR，建议 **Wave 4 = Conversion Closure Sprint**，聚焦：

1. **P0 · 漏斗闭环** — 市场→订单、身份→发帖（UX-01 ~ UX-04）
2. **P1 · 角色招募** — 向导/商家/治理入口收敛（UX-05 ~ UX-07）
3. **P2 · 导航与信任回流** — QuickLinks + /trust 回程（UX-09 ~ UX-10）

**明确不做：** 订单/Escrow/治理执行逻辑、API 契约变更。

---

## 7 · 验收与复跑

```bash
cd frontend
# 聚合契约 + 证据 JSON
npx vitest run lib/pesJourneyReviewAggregate.test.ts
# 浏览器走查（需 dev/API · 单轮约 2–3 min × 48）
npx playwright test e2e/pes-real-user-journey-review.spec.ts --project=chromium
```

---

## 8 · 相关文档

| 文档 | 关系 |
|------|------|
| [PRODUCT-ENHANCEMENT-SPRINT](./PRODUCT-ENHANCEMENT-SPRINT.md) | Sprint 总览 |
| [PES-CONVERSION-ANALYTICS-WAVE3](./PES-CONVERSION-ANALYTICS-WAVE3.md) | 埋点与看板 |
| [PES-CONVERSION-FUNNEL-AUDIT-WAVE2](./PES-CONVERSION-FUNNEL-AUDIT-WAVE2.md) | Wave 2 断点 |

---

*PES Real User Journey Review · 48 runs · Wave 4 PENDING_DECISION · 2026-06-07*
