# `/community/me` · ① 本地 · 社区资料（TT 社区「我」）

**阶段：① 本地** — **社区资料**壳层；与 **`/me/identities`** 多重身份 Hub **数据同源、路由分离**。

**L5 独立冻结（ME-P1-6 · 2026-06-01）：** [`evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md`](../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md) — 路由边界 · AuthGate · Drawer/独立页 parity · contract · Playwright 绿集 · flags · limits · Go/No-Go。

**命名 SSOT（P3）：** [`evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md`](../../evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md)

## 入口语义（2026-06 · Hub 已取消）

| 项 | 说明 |
|----|------|
| **裸 `/community/me`** | **`router.replace`** → **`/me/settings/profile`**（`resolveCommunityMeHubRedirect`） |
| **`?tab=posts\|collects\|likes\|reports`** | 深链归一化至 **`/community/me/*`** 独立子页 |
| **顶栏 `nav_community_profile`** | 同上 redirect 链（资料编辑在 **`/me/settings/profile`**） |
| **社区底栏「社区资料」** | 若仍链 `/community/me`，行为同 redirect |

## 与 Hub / 动态分工（小红书式）

- **`/community` 动态：** 登录默认落点（顶栏从裸 `/community/me` 登录亦回动态）
- **本页（社区资料）：** 主动点底栏「社区资料」或带 **`?tab=`** 深链登录后进入；资料卡、笔记/收藏/赞过/订单抽屉
- **`/me/identities`：** 顶栏「多重身份 / 角色与入驻」· 入驻与槽位（[ME-IDENTITIES-UI-FREEZE](../../evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)）

## 独立子路由（ME-P1-4 · 工程 README）

| 路径 | README | 管理入口 href（已登录） |
|------|--------|-------------------------|
| `/community/me/posts` | [posts/README.md](./posts/README.md) | `/community/me/posts` |
| `/community/me/collects` | [collects/README.md](./collects/README.md) | `/community/me/collects` |
| `/community/me/likes` | [likes/README.md](./likes/README.md) | **`/community/me/likes`**（非 `?tab=likes`） |
| `/community/me/reports` | [reports/README.md](./reports/README.md) | `/community/me/reports` |

**Hub `?tab=`：** 访客开玻璃抽屉预览；已登录 **redirect** 上表独立页（Scheme A · [FREEZE](../../evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md)）。

## 导航 SSOT（ME-P1-5 · 与 FREEZE 对拍）

| 入口 | posts | collects | likes | reports |
|------|-------|----------|-------|---------|
| **顶栏用户菜单** | `/community/me/posts` | `/community/me/collects` | `/community/me/likes` | **工具区** → `/community/me/reports` |
| **资料卡笔记分段** | 同上 | 同上 | 同上（flag 关隐藏） | — |
| **Hub 抽屉 fullPageHref** | 同上 | 同上 | 同上 | 同上 |
| **QuickLinks / 快捷抽屉** | 列表页全量；**资料页抽屉** `compactForCommunityMe` 隐藏订单/内容/举报（见 `me_communityHint_compact`） | 同上 | 同上（`showLikesList`） | 顶栏工具区为主 |

**实现真源：** `headerUserMenuNavModel.ts` · `CommunityMeAccountPanelNotesNav.tsx` · `communityMeNotes/CommunityMeNotesDrawerStack.tsx` · `MeQuickLinksSection.tsx` · `CommunityMeQuickLinksDrawer.tsx`

## 逐页追踪（ME-P1-8 · ① 满分闸）

| 路径 | 角色 | `data-tt-*` |
|------|------|-------------|
| `/community/me` | **Redirect** | —（机读：`communitySubRoutes` **`kind: redirect`**） |
| `/me/settings/profile` 等 | 资料编辑 SSOT | `community-me-surface` · 见 FREEZE |
| `/community/me/posts` | 独立页 | `community-me-posts-page` |
| `/community/me/collects` | 独立页 | `community-me-collects-page` |
| `/community/me/likes` | 独立页 | `community-me-likes-page` |
| `/community/me/reports` | 独立页 | `community-me-reports-page` |
| `/community/me/reports/[id]` | 详情 | `community-report-ticket-page` |

SSOT：`lib/communityMePageTracker.v1.ts` · `communityMePageTracker.contract.test.ts`。

## 机读绿集（ME-P1-7 · 窄脚本 SSOT）

```bash
# 推荐：Vitest union + deterministic Playwright
bash scripts/dev/run-community-me-l5-green.sh
# 或
cd frontend && npm run green:community-me-l5

# 全站账户导航（Vitest 含本族契约 · Playwright 可委托上脚本并 SKIP 重复 i18n/vitest）
bash scripts/dev/smoke-account-nav-full-local.sh
```

**Vitest 仅：**

```bash
cd frontend
npm run test:i18n:ci
npm run test -- accountNavNamingP3 --run
npx vitest run \
  app/community/me/posts/communityMePostsPage.contract.test.ts \
  app/community/me/reports/communityMeReportsPage.contract.test.ts \
  components/me/communityMeProfile.contract.test.ts \
  lib/communityMeContentNav.test.ts \
  app/community/communityRouteDataHooks.contract.test.ts
```

**Playwright 子集（脚本已并跑）：** `community-me-l5-parity-closeout` · `community-me-load-more-mocked` · `community-me-dedicated-l5` · `community-me-data-state` — 见 [`evidence/GO_local_community_me_l5/README.md`](../../evidence/GO_local_community_me_l5/README.md)。

**Segment 活跃态（ME-P1-3）：** `communityMeContentSegmentClass` → `TT_COMMUNITY_ME_PANEL_L5.segmentLinkActive`（暖 `ref-sun` · 非 Hub 抽屉 cyan 壳）。

**PI-1 本机头像（PH1-FE-05 · F-007 · ① · 2026-05-30 已闭）：** 含于 `npm run e2e:pi1-community-all`（`CommunityMeAccountPanel` · `POST /api/v1/me/profile-avatar`）。机读锚点见 **[COMMUNITY-L5-CLOSURE](../../evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md)** §机读锚点（`data-tt-community-me-surface="community_me_profile"` 等）。Playwright API 须 **`TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1`**（`scripts/dev/start-api-for-playwright.*` 默认注入）。
