# PES Wave 3 · Conversion Analytics Layer

**生效：** 2026-06-07  
**Sprint：** Product Enhancement Sprint · Wave 3  
**基线：** `FINAL_SYSTEM_AUDIT: PASS`（冻结）  
**机读 ID：** `product-enhancement-wave3-analytics-20260607`

---

## 0 · 机读键

```text
FINAL_SYSTEM_AUDIT_BASELINE: PASS
PRODUCT_ENHANCEMENT_SPRINT: ACTIVE
PES_WAVE3_ID: product-enhancement-wave3-analytics-20260607
BUSINESS_CORE_CHAIN: FROZEN
API_CONTRACT: FROZEN
```

---

## 1 · 统一埋点体系

| 类别 | 说明 | 触发点 |
|------|------|--------|
| `touchpoint_view` | 触点曝光 | PES 组件 mount |
| `funnel_stage_click` | 漏斗阶段点击 | `ConversionFunnelRail` |
| `funnel_next_cta` | 下一跳 CTA | Funnel Rail 主 CTA |
| `cta_click` | 转化条 CTA | `TouchpointConversionStrip` |
| `role_entry_click` | 角色入口 | `RoleEntryQuickGrid` |
| `registration_intent` | 注册意向 | `/auth/register` 链 |
| `identity_intent` | 身份意向 | `/me/identities` · merchant 角色 |
| `guide_recruit_click` | 向导招募 | `/guide/register` |
| `governance_participation` | 治理参与 | `/governance*` |
| `escrow_trust_click` | Escrow 信任 | `/trust` |
| `ab_exposure` / `ab_conversion` | A/B | 实验曝光与转化 |

**存储：** `localStorage` · `tt_pes_conversion_analytics_v1`（环形缓冲 2500 条）  
**会话：** `sessionStorage` · `tt_pes_analytics_session_v1`  
**源码：** `frontend/lib/conversionAnalyticsLayer.ts`

---

## 2 · Funnel Dashboard

**路由：** `/admin/conversion-analytics`  
**组件：** `ConversionFunnelDashboard`

| 区块 | 内容 |
|------|------|
| KPI | 事件 · 会话 · 注册/身份/向导/治理意向 |
| 漏斗表 | 七阶段 sessions + events |
| Drop-off Matrix | 相邻阶段流失率 / 留存率 |
| 触点统计 | 六触点曝光 + CTA 点击 |
| A/B Registry | 实验曝光 · 转化 · CVR |

---

## 3 · Drop-off Matrix

| 从 | 到 | 指标 |
|----|-----|------|
| visit | register | 首屏→注册 |
| register | identity | 注册→身份 |
| identity | post | 身份→发帖 |
| post | find_guide | 发帖→找向导 |
| find_guide | order | 找向导→下单 |
| order | govern | 下单→治理 |

计算：`dropoffRate = 1 - (toSessions / fromSessions)`

---

## 4 · A/B Test Registry

| ID | 触点 | 变体 | 主指标 |
|----|------|------|--------|
| `ab-home-role-grid-v1` | home | control · role_grid_prominent | registration_intent |
| `ab-market-escrow-inline-v1` | market | control · escrow_card | escrow_trust_click |
| `ab-governance-funnel-compact-v1` | governance | control · funnel_compact | governance_participation |

**登记源：** `frontend/lib/conversionAnalyticsAbRegistry.ts`

---

## 5 · 六触点埋点接入

| 触点 | 组件 |
|------|------|
| home | RoleEntryQuickGrid · EscrowTrustMicro · TouchpointConversionStrip |
| market | ConversionFunnelRail · EscrowTrustMicro · TouchpointConversionStrip |
| community | ConversionFunnelRail · TouchpointConversionStrip |
| guide | ConversionFunnelRail · TouchpointConversionStrip |
| merchant | ConversionFunnelRail · TouchpointConversionStrip |
| governance | ConversionFunnelRail · TouchpointConversionStrip |

---

## 6 · 验收

```bash
cd frontend
npx vitest run lib/productEnhancementSprint.contract.test.ts lib/conversionFunnelModel.test.ts lib/conversionAnalyticsLayer.test.ts
```

**探针：** `data-tt-pes-funnel-dashboard` · `data-tt-admin-conversion-analytics`

---

## 7 · 范围外

- 订单 / Escrow / 治理 **执行**逻辑
- HTTP API 契约新增或变更
- 服务端聚合（Wave 3 仅客户端层）

---

*PES Wave 3 Conversion Analytics Layer · 2026-06-07*
