# PES Wave 2 · Conversion Funnel Audit

**生效：** 2026-06-07  
**Sprint：** Product Enhancement Sprint · Wave 2  
**基线：** `FINAL_SYSTEM_AUDIT: PASS`（冻结）  
**机读 ID：** `product-enhancement-wave2-funnel-20260607`

---

## 0 · 机读键

```text
FINAL_SYSTEM_AUDIT_BASELINE: PASS
PRODUCT_ENHANCEMENT_SPRINT: ACTIVE
PES_WAVE2_ID: product-enhancement-wave2-funnel-20260607
BUSINESS_CORE_CHAIN: FROZEN
API_CONTRACT: FROZEN
```

---

## 1 · 转化主链

| 序 | 阶段 | 路由 | 下一跳 CTA |
|----|------|------|------------|
| 1 | 访问 | `/` | 免费注册 |
| 2 | 注册 | `/auth/register` | 开通身份 |
| 3 | 身份 | `/me/identities` | 去社区发帖 |
| 4 | 发帖 | `/community?publish=1` | 去市场找向导 |
| 5 | 找向导 | `/market` | 查看订单 |
| 6 | 下单 | `/orders` | 进入治理 |
| 7 | 治理 | `/governance` | 浏览提案 |

**模型源：** `frontend/lib/conversionFunnelModel.ts`

---

## 2 · 六触点漏斗定位

| 触点 | 默认阶段 | Wave 2 叠加组件 |
|------|----------|-----------------|
| **首页** | visit | `RoleEntryQuickGrid` · `EscrowTrustMicro` |
| **Market** | find_guide | `ConversionFunnelRail` · `EscrowTrustMicro` (inline) |
| **Community** | post | `ConversionFunnelRail` (light) |
| **Guide** | find_guide（非向导 override→register） | `ConversionFunnelRail` |
| **Merchant** | identity | `ConversionFunnelRail` (light) |
| **Governance** | govern | `ConversionFunnelRail` (hub + proposals) |

---

## 3 · 断点矩阵（BP-01 ~ BP-08）

| ID | 严重度 | 触点 | 问题 | Wave 2 缓解 |
|----|--------|------|------|-------------|
| BP-01 | P0 | home | 首屏注册 CTA 弱曝光 | RoleEntryQuickGrid + EscrowTrustMicro |
| BP-02 | P0 | home, market | 行程区与角色剧场断链 | Funnel Rail 链至注册与市场 |
| BP-03 | P1 | guide, market | 向导招募入口分散 | Guide Funnel Rail + 抢单 CTA |
| BP-04 | P1 | merchant | 入驻路径跳跃 | Merchant Funnel Rail @ identity |
| BP-05 | P1 | community | 发帖需登录、空态弱 | Community Funnel Rail |
| BP-06 | P1 | governance | 信息密度高、提案 CTA 偏下 | Hub/Proposals Funnel Rail |
| BP-07 | P2 | home, market | ProductCrossNav 缺注册/社区/治理 | 各触点 Funnel Rail 补足 |
| BP-08 | P2 | market, community | 移动端筛选+Hero 过载 | 横向滑轨减认知负担 |

---

## 4 · 移动端摩擦点

| 区域 | 摩擦 | 缓解 |
|------|------|------|
| Market Hero + Filter | 首屏信息堆叠 | Funnel Rail 可横向 snap 滑动 |
| Community Discovery Chrome | 筛选条 + 发布并列 | Funnel Rail 置于 Header 下、单列 |
| 首页空态 | 角色入口在页脚才可见 | RoleEntryQuickGrid 2×2 网格、min-h 44px |
| 治理 Hub | 池/奖励区块长 | Funnel Rail 置顶、提案链直达 |

---

## 5 · Escrow 信任展示

- **首页：** card 变体（空态）+ inline（生成中）
- **Market：** inline 变体链至 `/trust`
- **不改：** Escrow 合约、订单释放、API 契约

---

## 6 · 验收

```bash
cd frontend
npx vitest run lib/productEnhancementSprint.contract.test.ts lib/conversionFunnelModel.test.ts
```

**DOM 探针：** `data-tt-pes-funnel-rail` · `data-tt-pes-role-grid` · `data-tt-pes-escrow-trust`

---

## 7 · 范围外（刻意未改）

- 核心业务链（Escrow 执行、订单状态机、治理投票）
- HTTP/API 契约
- 五主路由 layout lock 区块顺序
- `ProductCrossNav` 结构（由 Funnel Rail 叠加补足）

---

*PES Wave 2 Conversion Funnel Audit · 2026-06-07*
