# Multi-Identity Workspace · 统一 SSOT（Definition Sprint v1）

**文档状态：** **ACTIVE · CONFIRMED**（2026-06-11 · Owner 确认 · Sebastian Ward）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

**规范句（LOCKED）：** **一个 Account + 多 Identity Slots + 多 Workspace**

**读序：**

| 顺序 | 文档 | 关系 |
|------|------|------|
| 1 | **本文** | Workspace 职责 · IA · 六维定义 · 确认闸 |
| 2 | [identity-multi-slot-naming-l5.v1.md](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md) | 名称分层 · 槽位 · PD 边界 |
| 3 | [IDENTITY-CENTER-PHASE2-FREEZE.md](../GO_local_auth_l5/IDENTITY-CENTER-PHASE2-FREEZE.md) | Hub + 四轨 settings **UI/产品面已闭** |
| 4 | [ME-IDENTITIES-UI-FREEZE.md](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) | `/me/identities` layout lock |
| 5 | [GUIDE-WORKBENCH-INBOX-L5-FREEZE.md](../GO_local_guide_workbench_l5/GUIDE-WORKBENCH-INBOX-L5-FREEZE.md) | Guide ① 已实施收件箱（**实现参考，非 Definition 扩 scope 依据**） |
| 6 | 代码旁证 | `frontend/lib/workspace/workspaceIdentityModel.ts` · `workspaceOrderBus.ts` |

**诚实边界：** 本文 **Definition（应然）** 与 **Completion Sprint（实然代码）** 分列；**① 本地 Definition 确认 ≠ ② staging GO ≠ ③ Production GO**。

---

## 0. Definition Sprint 纪律

| 规则 | 说明 |
|------|------|
| **先定义、后实现** | 五身份六维表 **Owner 已确认**（§9）— Completion Sprint 可继续 |
| **允许** | bugfix · 数据链/i18n/a11y · 与 spec/04/87 对拍 · **不新增** Steward/Acquisition 独立 operator 路由 |
| **OUT（全身份）** | 顶栏 HeaderIdentitySwitcher（**P3**）· 第五 `users.role` · 五主路由 UI 回流 · **`/acquisition` operator 壳**（延后拆线） |

**导航分层（LOCKED · Owner 2026-06-11）：**

```
Account → Identity Hub → Workspace（经营）→ Order Bus → Settings（资料）
```

**Hub Active CTA：** active → **Workspace**（非 settings）；settings 由工作台内链进入。

---

## 1. 跨身份基础设施（共用 SSOT）

### 1.1 Account vs Identity Slot vs Workspace

| 层 | 职责 | 入口 | **不得**承载 |
|----|------|------|--------------|
| **Account** | 登录 · 安全 · 社区昵称/头像 | `/me/settings/profile` · `/me/security` | 向导/商家/主理人 **业务挂牌字段** |
| **Identity Hub** | 五槽状态 · 申请/开通 CTA · **不**并列全部工作台 | `/me/identities` | 订单列表 · 经营统计 · 治理操作 |
| **Workspace** | 单身份 **接单/经营/履约** 闭环 | 见 §2 各身份 `workbenchHref` | 账户安全 · 全站导航重复 · 其他身份 settings |

### 1.2 订单总线（Order Bus · LOCKED）

| 项 | 定义 |
|----|------|
| **列表 SSOT** | `GET /api/v1/orders` → 前端 **`/orders`**（全身份共用） |
| **详情/履约 SSOT** | **`/escrow/[id]`**（含 pay / rate / proof 走廊） |
| **分轨键** | 列表项 **`business_line`**：`trip` · `merchant_service` · `acquisition`（**禁止**前端目的地启发式分类） |
| **工作台过滤** | 各 Workspace **收件箱** 在客户端按 `business_line` + 参与方角色过滤；**不**另建 `/orders/merchant` 等平行列表（② 前） |
| **进行中深链** | `/orders?state=in_progress`（统一 query · `ORDERS_LIST_IN_PROGRESS_VALUE`） |

### 1.3 导航分层（消除重复入口）

| 层级 | 职责 | 真源 | **禁止** |
|------|------|------|----------|
| **顶栏** | 全站发现 · **我的订单** · 账户菜单 | `headerUserMenuNavModel.ts` | 按身份复制订单中心 |
| **Identity Hub** | 槽位状态 → **工作台** 或 **入驻** | `meIdentitiesCoreCardModel.ts` | 并列五个工作台 dashboard |
| **Settings Hub** | 账户设置 + **可选** 已开通身份工作台一行 | `meSettingsNavModel.ts` | 商家/向导 **业务资料** 编辑 |
| **Workspace 内** | 本身份待办 · 统计 · 链到 settings/子站 | 各 `app/{guide,provider,…}` | `ProductCrossNav` 页脚站点导航 |
| **社区 QuickLinks** | 社区语境快捷链（含已开通工作台） | `MeQuickLinksSection.tsx` | 替代 Hub 或顶栏 |

### 1.4 身份设置（Settings · P2 已闭）

四轨 **业务公开展示资料** 与 Account 分离：

| 身份 | Settings 路由 | API |
|------|---------------|-----|
| Guide | `/me/identities/guide/settings` | `GET/PATCH /me/guide-profile` |
| Merchant | `/me/identities/merchant/settings` | `GET/PATCH /me/merchant-profile` |
| Region Steward | `/me/identities/region-steward/settings` | `GET/PATCH /me/region-steward-profile` |
| Acquisition | `/me/identities/acquisition/settings` | `GET/PATCH /me/acquisition-profile` |

**Workspace 内链 settings；settings 不承载 inbox/统计/治理写操作。**

---

## 2. 五身份 · 六维定义表

**六维：** 职责边界 · 工作台结构 · 待办中心 · 订单中心 · 经营数据 · 快捷操作 ·（+ 身份设置见 §1.4）

图例：**✅ ① 已有** · **📋 TARGET** · **❌ OUT** · **⏸ 待确认**

---

### 2.1 Traveler（旅行者 · 默认消费者身份）

| 维 | 定义 |
|----|------|
| **职责边界** | 发现行程 · 下单 · 支付/托管 · 社区消费 · **非** operator |
| **工作台** | **无独立 `/traveler` 工作台**；默认落点 **`/community`**（动态/资料） |
| **工作台结构** | ❌ 不建 Dashboard 壳；消费动线：`/` · `/market` · `/community` |
| **待办中心** | **无专用 inbox**；订单待办 → **`/orders`**；社区通知 → 消息/动态（现有） |
| **订单中心** | **`/orders`** · 过滤 **`business_line=trip`** · → **`/escrow/[id]`** |
| **经营数据** | 社区资料区统计 · `GET /me` → `orders_total` · `total_spent` · `reviews_count` |
| **快捷操作** | 顶栏订单 · 社区 QuickLinks（市场/向导/设置）· **无**「旅行者工作台」入口 |
| **身份设置** | **`/me/settings/*`**（profile · privacy · trust · notifications） |
| **IN** | 行程创建 `/` · `/orders/new` · 收藏/帖子 |
| **OUT** | 接单 · listing 发布 · 治理 · 商家橱窗 Studio |

**Hub CTA：** 旅行者 callout（状态脊签）→ profile / 注册

**① 现状 vs TARGET：** ✅ 与 TARGET 一致（Low gap）

---

### 2.2 Guide（向导 · operator）

| 维 | 定义 |
|----|------|
| **职责边界** | **接单与经营**：抢单/接单 · 双边确认 · 接待履约 · 接待统计 · **非** 身份矩阵/治理/商家 |
| **工作台** | **`/guide`**（唯一 operator 壳 SSOT） |
| **工作台结构（自上而下）** | ① 资质横幅 **（仅异常：pending/rejected/suspended）** → ② 标题 → ③ **Hero 收件箱** → ④ 身份快照 **（仅 KYC/风险/处置异常）** → ⑤ 本周期 · ⑥ 接待统计 |
| **待办中心** | **`GuideWorkbenchInboxCard`**：待接单 N · 今日待处理 · **下一单摘要卡**（旅客/目的地/日期/金额/状态/主 CTA）→ `/escrow/[id]` |
| **订单中心** | Inbox 主 CTA → escrow；次级 **「查看全部进行中」** → `/orders?state=in_progress`（**trip** 轨）；抢单 **`/market`** |
| **经营数据** | `GuideDashboardStats` · `GuideBillingPeriodCard`（`GET /me` stats 同源） |
| **快捷操作** | Hub active → **`/guide`** · Settings Hub `showGuideHub` · 社区 QuickLinks · **无** 页内快捷入口网格 |
| **身份设置** | **`/me/identities/guide/settings`**（挂牌 persona · 非 register 重走） |
| **IN** | 收件箱 · 周期/接待统计 · 链 identity Hub |
| **OUT** | `MeTrustSection` 全量 · 信誉公式 · 治理 · 商家 Studio · 页脚 `ProductCrossNav` |

**Hub CTA：** 槽 active → **`/guide`**（工作台）；settings 由工作台内链

**① 现状：** ✅ L5 收件箱已闭（2026-06-09）· 2026-06-11 收版（异常态/空态/去重导航）

**⏸ 待确认：** 无（Guide 为 **Definition 模板**）

---

### 2.3 Merchant（商家 · provider role）

| 维 | 定义 |
|----|------|
| **职责边界** | **服务 listing 经营**：橱窗发布 · 服务订单履约 · 店铺资料 · **非** 向导 trip 抢单 · **非** 治理 |
| **工作台** | **`/provider`**（operator）与 **`/market/provider`**（公开子站/Studio）**分轨** |
| **工作台结构** | ① 标题 → ② **服务订单收件箱** → ③ **经营概览** → 内链 **settings** + **管理橱窗** |
| **待办中心** | **`ProviderWorkbenchInboxCard`**：新订单/进行中计数 · **下一单摘要** · 主 CTA → escrow |
| **订单中心** | 过滤 **`business_line=merchant_service`** · 列表仍 **`/orders`** · escrow 走廊共用 |
| **经营数据** | **TARGET：** 订单数 · 进行中 · 周期营收/结算（需 **`GET /me` provider stats 扩展**）· **①：** 客户端概览 + `orders_total` |
| **快捷操作** | Hub active → **`/provider`** · Settings `showMerchantHub` · 工作台内 **管理橱窗** → `/market/provider` |
| **身份设置** | **`/me/identities/merchant/settings`**（masonry 预览同子站规则） |
| **入驻** | `/auth/register?role=provider` → `/provider/register` → onboarding → Admin 审核 |
| **IN** | 工作台 + 子站 Studio + settings |
| **OUT** | 在 settings 编辑 KYB · 在 workbench 承载账户/profile |

**Hub CTA：** 槽 active → **`/provider`**（工作台）；settings 由工作台内链

**① 现状 vs TARGET：**

| 项 | 现状 | TARGET |
|----|------|--------|
| 工作台 | `/provider` MVP 已有 | 结构确认后增强 stats API |
| 待办 | 客户端 `merchant_service` 过滤 | + 服务端 seller 视角 filter（②） |
| 统计 | 概览 2 卡 | 周期营收/结算/ listing 数 |

---

### 2.4 Region Steward（区域主理人 · 治理 operator）

| 维 | 定义 |
|----|------|
| **职责边界** | **区域治理运营**：质押 · 提案 · 委托 · 区域池/奖励 · **非** C 端订单 inbox · **非** 商家/向导经营 |
| **工作台** | **`/governance?view=region`**（区域治理视角）；全站壳 **`/governance`** |
| **工作台结构** | Hub → 治理首页 · 子路由 proposals/delegate/fee-routes · settings 内链区域工作台 |
| **待办中心** | **📋 TARGET：** 治理待办（开放提案投票截止 · 区域异常）— **① 无独立 inbox** |
| **订单中心** | **N/A**（不参与 escrow 消费者/向导订单列表） |
| **经营数据** | 治理页 pool/rewards 段 · **📋 TARGET：** 区域 steward 仪表盘块 |
| **快捷操作** | Hub active → **`/governance?view=region`** · Settings `showStewardHub` · 工作台内链 settings |
| **身份设置** | **`/me/identities/region-steward/settings`**（次级 · 由治理页内链） |
| **入驻** | `/steward/register` → onboarding → Admin · 质押 |
| **IN** | 治理栈 · steward settings |
| **OUT** | `/orders` 收件箱 · 商家 Studio · 收购 bond UI · **独立 `/steward` operator 壳** |

**Hub CTA：** 槽 active → **`/governance?view=region`**（治理工作台优先）

**① 现状 vs TARGET：** ✅ Hub/Settings/QuickLinks 对齐 · 治理页 pool/rewards 已有 · **无** escrow inbox（符合 N/A）

---

### 2.5 Acquisition（旅行收购 · 附加能力 slot）

| 维 | 定义 |
|----|------|
| **职责边界** | **发布收购 listing · 承运履约**（委托方=owner · 承运=guide 侧）；**非** 第五 `users.role` · **非** region_steward 准入 |
| **工作台** | **`/market/acquisition`**（**子站即工作台** · Studio + 瀑布流 + trust strip） |
| **工作台结构** | ① trust/bond 条（异常时）→ ② 发布/草稿 Studio → ③ 子站 listing · settings 内链 |
| **待办中心** | 订单待办经 **Order Bus** · 子站内 Studio/ listing 动线 · **无** 独立 `/acquisition` inbox 壳 |
| **订单中心** | `POST …/acquisition/listings/:id/orders` · **`order_kind=acquisition_listing`** · 列表/filter 同 Order Bus |
| **经营数据** | **`/community/me` trust strip** · trust API · 子站内发布统计 |
| **快捷操作** | Hub active → **`/market/acquisition`** · Settings `showAcquisitionHub` · **`/community/me` strip** |
| **身份设置** | **`/me/identities/acquisition/settings`**（次级 · 由子站/工作台内链） |
| **IN** | PD-009 门闸 · 子站 · settings · bond |
| **OUT** | region_steward 准入费 · 商家 KYB · 向导 `/guide` 混用 · **独立 `/acquisition` operator 壳（延后）** |

**Hub CTA：** 槽 active → **`/market/acquisition`**（子站即工作台）

**① 现状 vs TARGET：** ✅ 与 Owner 确认一致 · **不** 新增 `/acquisition` 路由

---

## 3. 统一 Workspace 路由表（Definition · TARGET）

| identity | workbench | public | apply | settings | orders filter |
|----------|-----------|--------|-------|----------|---------------|
| traveler | — | `/community` | `/auth/register` | `/me/settings/profile` | `trip` |
| guide | `/guide` | `/guides` | `/guide/register` | `…/guide/settings` | `trip`（guide 参与） |
| merchant | `/provider` | `/market/provider` | `/provider/register` | `…/merchant/settings` | `merchant_service` |
| region_steward | **`/governance?view=region`** | `/governance` | `/steward/register` | `…/region-steward/settings` | — |
| acquisition | **`/market/acquisition`** | 同左 | `/market/acquisition` | `…/acquisition/settings` | `acquisition` |

**代码旁证：** `frontend/lib/workspace/workspaceIdentityModel.ts` · `meIdentitiesCoreCardModel.ts`

---

## 4. 职责重叠 · 消除规则

| 冲突 | 规则 |
|------|------|
| Hub vs Workspace | Hub **只**状态+CTA；**不**放订单列表/统计 |
| Settings vs Workspace | Settings **只**业务公开展示资料；**不**放 inbox/治理写 |
| `/orders` vs Workspace inbox | 全量列表在 `/orders`；Workbench **只**摘要+下一单+深链 |
| Guide vs Merchant | Guide **`trip`** · Merchant **`merchant_service`** · **禁止**同一页双身份 inbox |
| Acquisition vs Guide | 收购 **承运**订单在 acquisition 轨；向导 **trip** 在 guide 轨 |
| 顶栏 vs Workspace | 顶栏 **一份**「我的订单」；Workbench **不**复制顶栏站点 map |

---

## 5. 快捷操作 · 统一清单（按身份）

| 动作 | Traveler | Guide | Merchant | Steward | Acquisition |
|------|----------|-------|----------|---------|-------------|
| 我的订单 | 顶栏 | 顶栏 + 工作台次级 | 同 | — | 顶栏（承运单） |
| 进入工作台 | — | Hub/Settings/QuickLinks | 同 | Hub→治理 | Hub→子站 |
| 编辑业务资料 | profile | guide/settings | merchant/settings | steward/settings | acquisition/settings |
| 发布/Studio | 行程 `/` | `/market` 抢单 | `/market/provider` | — | acquisition Studio |
| 身份 Hub | `/me/identities` | 同 | 同 | 同 | 同 |

---

## 6. ① 实现状态快照（实然 · 非 Definition 签字依据）

| 身份 | 工作台 | Inbox | Stats API | Hub CTA 对齐 Definition |
|------|--------|-------|-----------|---------------------------|
| Traveler | ✅ | — | ✅ | ✅ |
| Guide | ✅ L5 | ✅ | ✅ | ✅ |
| Merchant | ✅ MVP | ✅ 客户端 | ⚠️ 弱 | ✅ |
| Steward | ✅ `/governance?view=region` | — | ⚠️ | ✅ |
| Acquisition | ✅ 子站 | — | ⚠️ strip | ✅ |

---

## 7. Completion Sprint 关系

| Sprint | 状态 |
|--------|------|
| **Definition（本文）** | **ACTIVE · CONFIRMED** |
| [Completion 20260611](./MULTI-IDENTITY-WORKSPACE-SPRINT-20260611.md) | **W0–W3 IA 已闭 · W4+ 继续** |

---

## 8. ②③ 留闸（Definition 不写死实现）

- 顶栏 **Workspace Switcher**（P3 · ADR）
- `GET /orders?seller=1` / role-aware 服务端 filter
- Provider/Steward **周期 stats** 与 staging 真链
- Production GO / go-live

---

## 9. Owner 确认表

| # | 确认项 | 结论 |
|---|--------|------|
| 1 | 五身份 **职责边界**（§2）无交叉承载 | ✅ |
| 2 | **订单总线**（§1.2）为全站唯一列表/escrow 走廊 | ✅ |
| 3 | **Guide 工作台结构**（§2.2）为 Merchant 模板 | ✅ |
| 4 | **Merchant** workbench=`/provider` · public=`/market/provider` | ✅ |
| 5 | **Steward** Hub CTA → **`/governance?view=region`**（治理工作台优先） | ✅ |
| 6 | **Acquisition** **子站即工作台** · 不新增 `/acquisition` | ✅ |
| 7 | Hub active CTA **工作台优先**（覆盖 P2「active→settings」） | ✅ |

**签字：** Sebastian Ward · **日期：** 2026-06-11

---

**Maintainer：** Sebastian Ward · Definition Sprint 主持 · ① 本地
