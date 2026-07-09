# Product Experience Audit · UX Findings Report

**Report ID:** PEA-SOAK-20260608 · **Completed:** 2026-06-08T10:57:54Z
**Method:** Static IA/UX review — not code-correctness testing
**Policy:** staging-soak frozen · record only · optimize after audit · then real-user UAT

## Summary

| Severity | Count |
|----------|------:|
| **P0** | 5 |
| **P1** | 14 |
| **P2** | 10 |
| **Total** | 29 |

## P0

### UX-P0-01 · Me/Profile 信息架构迁移未完成，首访路径与标签不一致

- **Domain:** Identity · **Personas:** Traveler, Guide
- **Actual:** /me 重定向至 /community feed；遗留 community_tab_me 标签；Header Profile 指向 /me/settings/profile
- **Cognitive cost:** 用户以为 Me=个人中心，却进入社区 feed

### UX-P0-02 · Merchant 与 Provider 双命名体系贯穿 URL/API/UI

- **Domain:** Identity · **Personas:** Merchant
- **Actual:** URL/query 为 provider；UI 为 Merchant；Studio 为 merchant* 代码 ID
- **Cognitive cost:** 商家无法将 Merchant onboarding 与 /provider/register 对应

### UX-P0-03 · Referral 增长任务路径深埋，首访不可发现

- **Domain:** Referral · **Personas:** Traveler
- **Actual:** Referrals 仅 Settings→Travel→Referrals & points；非五主路由
- **Cognitive cost:** 增长核心动作需 3+ 次点击

### UX-P0-04 · Growth Center 与 Trust Growth 命名碰撞

- **Domain:** Growth · **Personas:** Operator, Admin
- **Actual:** Sidebar Growth 组 vs Governance 组 trust-growth；Analytics 另拆 conversion-analytics
- **Cognitive cost:** Ops 易进错控制台；KPI 归属不清

### UX-P0-05 · 工程 Sprint 标识暴露于用户界面

- **Domain:** Referral · **Personas:** Traveler
- **Actual:** me_referrals_eyebrow: Growth · G-S4 渲染在 Referrals 页
- **Cognitive cost:** 破坏产品专业感；用户无法理解 G-S4

## P1

| ID | Domain | Title |
|----|--------|-------|
| UX-P1-01 | Market | 订单/支付/托管不在全局主导航 |
| UX-P1-02 | Market | 向导招募入口分散（BP-03） |
| UX-P1-03 | Identity | 商家 5 步入驻跨页跳跃，Settings 无承接 |
| UX-P1-04 | Market | Guide 工作台与 Guides 目录单复数路径无统合 wayfinding |
| UX-P1-05 | CMS | CMS Hub 链接网格与 Sidebar 不一致 |
| UX-P1-06 | Community Moderation | Community 首项 Nav 标签与页面标题不一致 |
| UX-P1-07 | Official OPS | Operations Guides 与 Official Guides 同名异义 |
| UX-P1-08 | Growth | 两套 Analytics 产品 IA 未向运营解释 |
| UX-P1-09 | Market | 支付/托管术语混用 |
| UX-P1-10 | Referral | Referrals 无邀请成果空态引导 |
| UX-P1-11 | Early Bird | Early Bird 消费者触达与 Admin stages 关联弱 |
| UX-P1-12 | Official OPS | 冷启动 consumer 空态过于泛化 |
| UX-P1-13 | Community Moderation | Community Admin Legacy list UX 与 Ops Plane 不一致 |
| UX-P1-14 | CMS | Content/Official/Growth breadcrumb 上下文缺失 |

## P2

| ID | Domain | Title |
|----|--------|-------|
| UX-P2-01 | Market | 首页 Plan trip 与 Header Web3 Travel 双 framing |
| UX-P2-02 | Market | Market / Book travel / Merchants 动词不一致 |
| UX-P2-03 | Market | 订单/收藏多标签指相近目的地 |
| UX-P2-04 | Identity | Multiple roles & onboarding 菜单文案过长 |
| UX-P2-05 | CMS | Sidebar Content vs Hub Content Center |
| UX-P2-06 | Official OPS | Official Ops nav vs Official Operations H1 |
| UX-P2-07 | Community Moderation | Mod cases 缩写 vs moderation/cases 路径 |
| UX-P2-08 | Identity | 商家注册复用 GuideRegister UI 骨架 |
| UX-P2-09 | Governance | Consumer Governance 与 Admin Governance 无 wayfinding |
| UX-P2-10 | CMS | Admin Home 未覆盖 Content/Official/Growth 四平面 |

## Post-audit sequence

1. Unified UX optimization sprint (P0→P1→P2)
2. Spot-check re-audit
3. Real-user UAT
4. 33/33 GO → Token Debt Sprint → next testnet release
