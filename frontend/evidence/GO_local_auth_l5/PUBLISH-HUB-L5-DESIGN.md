# 发布中心 · L5 设计方案 SSOT（`/me/publish` · ① 本地 · **FROZEN**）

**文档状态：** **ACTIVE · FROZEN**（2026-06-12 · Phase A 设计闸 · Owner scope ①）

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产（须顺序；禁止跳阶）

**互指：** [WORKSPACE-DEFINITION-SSOT.v1.md](../GO_local_identity_workspace/WORKSPACE-DEFINITION-SSOT.v1.md) · [ACCOUNT-NAV-NAMING-P3.md](./ACCOUNT-NAV-NAMING-P3.md) · [ME-IDENTITIES-UI-FREEZE.md](./ME-IDENTITIES-UI-FREEZE.md) · **[PUBLISH-HUB-PHASE-TASK-LIST.md](./PUBLISH-HUB-PHASE-TASK-LIST.md)**（**① L5 收口 + ② 任务清单**） · [identity-multi-slot-naming-l5.v1.md](../../../docs/spec/artifacts/identity-multi-slot-naming-l5.v1.md) · [MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md](./MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md)

**代码真源（Phase A 落地后）：** `frontend/app/me/publish/` · `frontend/lib/me/publishHubL5.ts` · `frontend/lib/me/publishHubModel.ts` · `frontend/lib/me/publishHubPhaseAModel.ts` · `frontend/components/header/headerUserMenuNavModel.ts`

**诚实边界：** ① 设计冻结 + Phase A 本地绿 **≠** ② staging 全矩阵 GO **≠** ③ Production GO。五轨 **全量 inventory + 聚合 API** 分阶段交付（① BFF · ② api 真源）。

---

## 收口总表

| 项 | 结论 |
|----|------|
| **有没有设计 SSOT** | **是（① · 本文 FROZEN）** |
| **有没有 UI 冻结（发布中心页）** | **Phase A 起 · `data-tt-publish-hub-ui-frozen="1"`**（结构/token 变更须绿集） |
| **① L5 级 ACTIVE 收口** | **ACTIVE**（2026-06-12 · PH-A-9～A-13）· 见 [PHASE1-CLOSURE](./PUBLISH-HUB-PHASE1-CLOSURE.md) · [L5-AUDIT](./PUBLISH-HUB-L5-AUDIT.md) |
| **有没有替代 Workspace / Order Bus** | **否** — 发布中心为 **聚合读 + 轻操作**，执行面仍深链工作台 |

---

## 1. 产品定义

### 1.1 一句话

**发布中心** = 跨身份 **「我发布了什么」** 的统一入口；**我的订单** = Order Bus；**我的帖子** = 社区 UGC。**三者不得混称。**

### 1.2 路由 SSOT

| 概念 | 路由 | zh | en | i18n 键 |
|------|------|----|----|---------|
| **发布中心** | **`/me/publish`** | 发布中心 | Publish hub | `publish_hub_title` |
| 我的订单 | `/orders` | 我的订单 | My orders | `header_myOrders` |
| 我的帖子 | `/community/me/posts` | **我的帖子**（原误标「我的发布」） | My posts | `header_userMenu_my_posts` |
| 多重身份 Hub | `/me/identities` | 多重身份 / 角色与入驻 | Multiple roles | `header_multiIdentity` |

### 1.3 与现有分层关系（LOCKED · 增量）

```
Account → 【发布中心 /me/publish】→ Workspace → Order Bus → Settings
         ↑
    Identity Hub（仅摘要链，不并列五个 dashboard）
```

| 层 | 职责 | **不得**被发布中心替代 |
|----|------|------------------------|
| Identity Hub | 槽位 · 申请 · 进工作台 CTA | 全量 listing CRUD |
| **发布中心** | 五轨 inventory 聚合 · 允许的下架/删草稿 | 收件箱 · Studio · 治理写操作 · 社区帖 |
| Workspace | 单身份经营闭环 | — |
| Order Bus | `/orders` · `/escrow/[id]` | — |

**OUT（全阶段）：** 独立 `/acquisition` operator 壳 · 五主路由 UI 回流 · 用发布中心冒充 staging GO。

---

## 2. 信息架构 · 页面结构

### 2.1 视觉族

| 项 | SSOT |
|----|------|
| 壳 | Auth L5 暖金暗玻璃（与 `/me/settings` · `/me/identities` 同族） |
| Token | `lib/me/publishHubL5.ts` |
| 顶栏 | `isAuthL5DarkHeaderPath("/me/publish")` → authL5 utility |
| 探针 | `data-tt-publish-hub="1"` · `data-tt-publish-hub-ui-frozen="1"` · `data-tt-auth-visual="l5"` |

### 2.2 页身结构（自上而下 · Phase A 起冻结）

1. `<main>` · L5 pageShell · 机读 data attrs
2. `AuthL5PageBackdrop`
3. **Header**：eyebrow · 渐变 `h1` · lead
4. **摘要条**（**`GET /me/publish-summary`** BFF ① · 客户端 fallback）
5. **筛选 chip 行**：`全部` · `行程` · `向导` · `商家` · `收购` · `提案`
6. **内容轨 Section**（按筛选展开；每轨 `data-tt-publish-hub-rail="{rail}"`）
7. **空态 / 未开通态**（每轨独立 CTA）
8. **Footer cross-nav**：我的订单 · 多重身份 · 设置

**段级态：** `loading.tsx` / `error.tsx` — L5 暗壳。

---

## 3. 五轨功能模型（发布中心）

**L5 边界：** 社区帖 **不在** 发布中心 — 统一入口为头像下拉 **`header_userMenu_my_posts`** → **`/community/me/posts`**（与 **`/community`** 发帖抽屉同源）。

统一卡片 schema（`PublishHubItem` · `lib/me/publishHubModel.ts`）：

| 字段 | 说明 |
|------|------|
| `rail` | `trip` · `guide` · `merchant` · `acquisition` · `governance` |
| `id` | 业务 id |
| `title` / `subtitle` | 主副标题 |
| `status` | badge 枚举 + i18n |
| `updatedAt` | ISO |
| `primaryAction` | 查看 / 进订单 |
| `secondaryActions` | 下架 · 删草稿 · 编辑（按轨） |
| `workbenchHref` | 深链工作台 |
| `lockedReason` | 槽未开通 |

### 3.1 五轨 · 发布 · 查看 · 删除/下架

| 轨 | 发布入口 | 发布中心展示 | 允许操作 | 深链执行面 |
|----|----------|--------------|----------|------------|
| **trip** | `/` Web3 旅行 | 我创建的 Escrow 订单摘要 | 无 listing 下架 | `/orders` · `/escrow/[id]` |
| **guide** | `/me/identities/guide/settings` | 挂牌状态摘要 | 编辑资料（② 可选 hide） | `/guide` |
| **merchant** | `/market/provider?studio=1` | 已发布 + 草稿 | **下架 · 删草稿** | `/provider` |
| **acquisition** | `/market/acquisition` Studio | 已发布 + 草稿 | **下架 · 删草稿**（API 缺口） | `/market/acquisition` |
| **governance** | `/governance/proposals/new` | **我发起的** 提案 | 无删除；进详情 | `/governance?view=region` |

**社区帖（非发布中心轨）：** 发布 `/community` · 管理 **`/community/me/posts`** · 仅头像下拉「我的帖子」入口。

### 3.2 组件复用（Phase A～C）

| 轨 | 组件策略 |
|----|----------|
| merchant | 复用 `MerchantWorkbenchShowcaseInventory` + `useProviderWorkbenchListings` |
| acquisition | TARGET：`PublishHubListingInventory` variant=acquisition | ✅ Phase A-3 |
| 其余列表轨 | `PublishHubItemCard` + `publishHubItemMappers` | ✅ Phase A-8 |

---

## 4. 导航命名（P3 增量 · LOCKED）

### 4.1 顶栏头像 · 「我的」分组顺序

| 序 | labelKey（zh） | href | featured |
|----|----------------|------|----------|
| 1 | `header_userMenu_publish_hub` → **发布中心** | `/me/publish` | authL5 **featured** |
| 2 | `header_myOrders` | `/orders` | — |
| 3 | `header_userMenu_my_posts` → **我的帖子** | `/community/me/posts` | — |
| 4 | `header_userMenu_my_collects` | `/community/me/collects` | — |
| 5 | `header_userMenu_my_likes` | `/community/me/likes` | 可选 env |

**机读：** `headerUserMenuNavModel.ts` · `accountNavNamingP3.contract.test.ts` · `headerUserMenuNavModel.test.ts`

### 4.2 其它互指（Phase A-5 ✅ · ①）

| 位置 | 改动 | 状态 |
|------|------|------|
| `/me/identities` Hub | 页脚 **发布中心** → `/me/publish` | ✅ A-5 |
| `/me/settings` | 旅行分组 **发布中心** 项（全员） | ✅ A-5 |

---

## 5. API 缺口清单

### 5.1 ① Phase A 可用（已有）

| API | 用途 |
|-----|------|
| `GET /api/v1/me/merchant-listings` | 商家轨 inventory |
| `POST /api/v1/market/provider/listings/:id/archive` | 商家下架 |
| `DELETE /api/v1/market/provider/listings/drafts/:draft_id` | 商家删草稿 |
| `GET /api/v1/community/me/posts` | 社区全页（**非**发布中心 preview） |
| `GET /api/v1/orders` | 行程轨（Phase A-3+） |
| `GET /api/v1/me/publish-summary` | 五轨计数聚合（① Next BFF · ② traveltrust-api 真源） |

### 5.2 ① 扩展（Phase A-3～A-6 · 已闭）

| API | 方法 | 轨 | 状态 |
|-----|------|-----|------|
| `GET /api/v1/me/acquisition-listings` | GET | acquisition | ✅ Phase A-3 |
| `POST /api/v1/market/acquisition/listings/:id/archive` | POST | acquisition | ✅ Phase A-3 |
| `DELETE /api/v1/market/acquisition/listings/drafts/:draft_id` | DELETE | acquisition | ✅ Phase A-3 |
| `GET /api/v1/governance/proposals?mine=1` | GET | governance | ✅ Phase A-5（`proposer` 投影过滤） |

---

## 6. Phase 交付矩阵

### 6.1 Phase A — ① 本地（五轨功能 MVP · ACTIVE）

| ID | 交付项 | 状态 | 验收 |
|----|--------|------|------|
| A-1 | 路由 `/me/publish` + L5 壳 + 五轨筛选 | **ACTIVE** | `publishHubPage.contract` · `publishHubUiFreeze` |
| A-2 | 顶栏 **发布中心** + zh **我的帖子** 改名 + 商家轨 MVP | **ACTIVE** | `headerUserMenuNavModel.test` · `accountNavNamingP3` |
| A-3 | 收购轨 + `GET /me/acquisition-listings` + archive/delete API | **ACTIVE** | `publishHubPage.contract` · `meAcquisitionListings` · smoke 扩展 |
| A-4 | 行程轨 + orders trip/traveler + 汇总条 + 「全部」隐藏空占位 | **ACTIVE** | `publishHubPage.contract` · `publishHubUiFreeze` |
| A-5 | 治理轨 + `GET /governance/proposals?mine=1` + Hub/设置互指 | **ACTIVE** | `publishHubPage.contract` · `meSettingsL5` |
| A-6 | 向导轨 + `GET /me/guide-profile` | **ACTIVE** | `publishHubGuideModel` · `publishHubPage.contract` |
| A-7 | `smoke-publish-hub-local.sh` | **ACTIVE** | 末行 `TT_PUBLISH_HUB_SMOKE: OK` |
| A-8 | 统一 `PublishHubItem` 横向卡片（cover + status badge） | **ACTIVE** | `publishHubItemModel` · `publishHubUiFreeze` |

**① L5 级 ACTIVE 收口（ACTIVE · 2026-06-12）：** [PUBLISH-HUB-PHASE1-CLOSURE.md](./PUBLISH-HUB-PHASE1-CLOSURE.md) · **PH-A-9～A-13** · 可选 **A-14** G-0

### 6.2 Phase B — ② 测试网（任务清单 · Not Started）

**SSOT：** [PUBLISH-HUB-PHASE-TASK-LIST.md §②](./PUBLISH-HUB-PHASE-TASK-LIST.md) · 机读 `publishHubPhaseBModel.ts` · **须 G-1/G-2**

| ID | 交付项 | 状态 |
|----|--------|------|
| B-1 | `GET /me/publish-summary` 服务端聚合 | backlog |
| B-2 | 顶栏身份 switcher ↔ 发布中心默认筛选 | backlog |
| B-3 | staging 五轨功能 CRUD 回归 | backlog |
| B-4 | governance `?mine=1` 与 Governor 投影 staging 对拍 | backlog |
| B-5 | merchant/acquisition 下架与 market discover 一致 | backlog |
| B-6 | 社区帖跨设备与 preview 一致（F-020 SLA） | backlog |
| B-7 | Playwright `/me/publish` staging | backlog |
| B-8 | ISS-007 / 93 矩阵 staging `release_gate=GO` | backlog |
| B-9 | Phase ② 总闸边界复核 | backlog |
| B-10 | ② 证据 `TT_PUBLISH_HUB_STAGING: OK` | backlog |

### 6.3 Phase C — ③ 生产

| ID | 交付项 |
|----|--------|
| C-1 | 链上提案 exec 与发布中心状态同步 |
| C-2 | 真 bond / Governor 写链 |
| C-3 | Production GO |

---

## 7. Phase A 验收矩阵（十维 · ① L5 达标线）

| # | 维度 | ① L5 达标线 | MVP（A-1～A-8） | L5 收口（A-9～A-13） |
|---|------|-------------|-----------------|----------------------|
| 1 | 业务逻辑 | 五轨 inventory **同源 API/BFF** | ✅ | — |
| 2 | IA | 单一入口；订单/帖子/发布中心三分 | ✅ | — |
| 3 | UI L5 | Auth L5 壳 · 统一 Item 卡片 | ✅ | A-12 cover 抛光 |
| 4 | UX | 登录/未开通/空态/汇总/智能「全部」 | ✅ | A-10 PW · A-11 段级态 |
| 5 | i18n | `publish_hub_*` zh/en | ✅ | — |
| 6 | a11y | tablist · ≥44px · 卡片 alt | ⚠️ 基线 | **A-11 复审** |
| 7 | 测试 | contract + smoke | ✅ | **A-9** fullClosure · **A-10** PW |
| 8 | 文档 | FROZEN + 任务清单 | ✅ | **A-13** 声明 |
| 9 | 安全 | owner session only | ✅ | — |
| 10 | 阶段诚实 | ① **≠** ② **≠** ③ | ✅ | **A-13** |

**MVP 绿集（A-1～A-8）：**

```bash
cd frontend
npm run test:i18n:ci
npm run test -- publishHubPage publishHubUiFreeze publishHubGuideModel publishHubItemModel accountNavNamingP3 headerUserMenuNavModel uiSystem --run
bash scripts/dev/smoke-publish-hub-local.sh   # 仓库根
```

**L5 收口绿集（A-9～A-13 完成后）：** 见 [PUBLISH-HUB-PHASE-TASK-LIST.md §1.3](./PUBLISH-HUB-PHASE-TASK-LIST.md)

---

## 8. 机读绿集（Phase A MVP · A-1～A-8）

```bash
cd frontend
npm run test:i18n:ci
npm run test -- publishHubPage publishHubUiFreeze publishHubGuideModel publishHubItemModel publishHubPhaseTaskList accountNavNamingP3 headerUserMenuNavModel uiSystem --run
bash scripts/dev/smoke-publish-hub-local.sh   # 仓库根
```

---

## 9. 后续变更边界（发布中心页）

| 允许 | 禁止 |
|------|------|
| 数据链 · i18n · a11y · 各轨 Section 内容 | 删 Header/筛选/五轨分区骨架 |
| 复用 workbench inventory 组件 | 五主路由 layout 回流 |
| Phase A-3+ 轨 increment | 未跑绿集改 `publishHubL5` token |
| 聚合 API（②） | 用 Phase A 冒充全站发布 GO |

---

## 10. 冻结声明

**自 2026-06-12 起**，本文档为 **`/me/publish` 发布中心** 的 **唯一产品 + IA + 命名 + API 缺口 + Phase 验收** SSOT。Phase A-1～A-2 实现 **必须** 与 §2～§7 对拍；冲突 **以 `frontend/app/me/publish/` + 机读契约为准**，并回写本文 §6 状态列。

**Maintainer：** Sebastian Ward（塞巴斯蒂安·沃德）· ① 本地
