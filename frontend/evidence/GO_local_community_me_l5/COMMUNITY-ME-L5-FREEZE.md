# `/community/me` · Phase ① L5 独立冻结声明（ME-P1-6 · 2026-06-01）

**阶段：① 本地** — 社区资料 Hub、笔记玻璃抽屉、Posts/Collects/Likes/Reports 独立页之 **路由边界 · AuthGate · Drawer/独立页 parity · VM 契约 · 机读绿集** 一并收口；**不**表示 ② 测试网 / ③ 生产 GO；**非**五主路由 `/community` Feed 壳层冻结（见 **FIVE-MAIN** · **COMMUNITY-L5-CLOSURE**）。

**代码真源：** `frontend/app/community/me/*` · `frontend/components/me/communityMeNotes/*` · `frontend/components/me/CommunityMeDedicatedPageAuthGate.tsx` · `frontend/lib/communityMe*.ts`

**互指：** [路由 README](../../app/community/me/README.md) · [MARKET-L5 收口](../GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) · [ME-IDENTITIES 冻结](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) · [Acquisition PD-009](../../app/market/acquisition/README.md) · [COMMUNITY-L5-CLOSURE](../GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md) · [P3 账户命名](../GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) · 统一追踪 `lib/accountNav/accountNavPageTracker.v1.ts`

---

## 收口结论（ACTIVE · FROZEN · ①）

| 维度 | 状态 | 真源 |
|------|------|------|
| **Hub 社区资料壳** | **已冻结（维护期）** | `app/community/me/page.tsx` · `CommunityMeAccountPanel` |
| **Hub 玻璃抽屉（访客 AuthGate + 登录 redirect）** | **已冻结** | `CommunityMeNotesDrawerStack` · `CommunityMeNotesGlassDrawer` |
| **独立页 Posts/Collects/Likes/Reports** | **已冻结（VM + AuthGate）** | 各 `useCommunityMe*Page` · `CommunityMeDedicatedPageAuthGate` |
| **Drawer ↔ 独立页 parity（PostDetailDrawer 内联）** | **① 已闭** | ME-P0 · `community-me-l5-parity-closeout.spec.ts` |
| **Collects partialHint** | **① 已闭** | `useCommunityMeCollectsHydratedList` · parity closeout |
| **Reports VM + AuthGate** | **① 已闭** | `useCommunityMeReportsPage` · `communityMeReportsPage.contract.test.ts` |
| **工程 README** | **已对齐** | `app/community/me/README.md` · 子路由 `posts|collects|likes|reports/README.md`（ME-P1-4） |
| **导航 href SSOT** | **已对齐** | ME-P1-5 · 顶栏 / QuickLinks / 笔记 nav / 抽屉 fullPageHref → 独立页（likes **`/community/me/likes`**） |
| **机读闸 JSON** | **ACTIVE** | [community-me-l5-local-gate.v1.json](./community-me-l5-local-gate.v1.json) |

**维护期纪律（写死）：** 仅 **bugfix** · **数据链路** · **i18n（同语义）** · **a11y/错误态** · **门闸**；**禁止** Hub/抽屉/独立页 **结构 · L5 token · layout lock** 回流；**禁止** Drawer 内开帖 **`router.push('/community/post/…')`** 回流。

---

## 路由边界

| 路径 | 角色 | 登录态 | 说明 |
|------|------|--------|------|
| **`/community/me`** | Hub · 社区资料 | 访客：AuthGate + 分段 Tab 开抽屉预览；已登录：资料卡 + 社交统计 | `data-tt-community-me-page="1"` |
| **`/community/me?tab=posts\|collects\|likes\|orders`** | Hub 深链 | 访客：玻璃抽屉 + 各面 AuthGate；**已登录：自动 redirect** 至独立页或 `/orders` | `parseCommunityMeTabQuery` · `communityMeDedicatedPathForTab` |
| **`/community/me/posts`** | 独立页 · 我的帖子 | `CommunityMeDedicatedPageAuthGate` | `data-tt-community-me-posts-page="1"` · `?vis=` 可见性筛选 |
| **`/community/me/collects`** | 独立页 · 收藏 | 同上 | `data-tt-community-me-collects-page="1"` |
| **`/community/me/likes`** | 独立页 · 赞过 | 同上；**Feature Flag 关时无路由入口** | `data-tt-community-me-likes-page="1"` |
| **`/community/me/reports`** | 独立页 · 我的举报 | 同上 | `data-tt-community-me-reports-page="1"` |
| **`/community/me/reports/[id]`** | 举报详情 | 登录后；**不**并入 Hub `?tab=` | 160 子站 · login `returnUrl` 保留规范路径 |

**Hub vs 动态 vs 多重身份（IA 写死）：**

- **`/community` 动态：** 登录默认落点（顶栏从裸 `/community/me` 登录亦回动态）
- **`/community/me`：** 社区资料 · 笔记预览抽屉 · 全量管理走独立页
- **`/me/identities`：** 多重身份 / 入驻 Hub（[ME-IDENTITIES-UI-FREEZE](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)）

**已登录 Hub `?tab=` redirect 表（Scheme A · 机读 `community-me-l5-local-gate.v1.json` → `hub_tab_redirects`）：**

| `tab` | 规范路径 |
|-------|----------|
| `posts` · `community_posts` | `/community/me/posts` |
| `collects` | `/community/me/collects` |
| `likes` | `/community/me/likes`（flag 关 → strip tab） |
| `orders` | `/orders` |

---

## AuthGate 策略

| 面 | 访客 | `authPending` | 已登录 |
|----|------|---------------|--------|
| **Hub 主壳** | `community_me_auth_gate` · `data-tt-data-state="invalid"` + 登录链 | 骨架 pulse | 资料卡 + 统计 |
| **Hub 抽屉（posts/collects/likes/orders）** | 各 `community_me_*_auth_gate` · 停留 Hub URL | 抽屉 loading | **redirect 独立页**（orders → `/orders`） |
| **独立页** | `CommunityMeDedicatedPageAuthGate` · 面级 `surfaceDataAttr` · `returnUrl` = 当前路径 | 页级 skeleton | 渲染 `*PageMain` + `*Portals` |
| **Reports 独立页** | `community_me_reports_auth_gate` | 同上 | VM 列表 · **无** Hub 抽屉等价 |

**登录回流 SSOT：** `communityMeLoginReturnUrl`（`lib/communityMeContentNav.ts`）— Hub 保留 query；`reports` / `reports/:id` 保持规范路径；独立页 pathname 直返；fallback **`communityMeDedicatedPathForTab`**（likes → `/community/me/likes`）。

---

## 导航 href SSOT（ME-P1-5 · ①）

**原则：** 全站**管理入口**直链独立页；Hub **`?tab=`** 仅访客抽屉预览 + 已登录 redirect。

| 能力 | 规范 href | 代码真源 |
|------|-----------|----------|
| **我的发布** | `/community/me/posts` | **顶栏下拉「我的」** · `CommunityMeAccountPanelNotesNav` · drawer `fullPageHref` · QuickLinks |
| **我的收藏** | `/community/me/collects` | **顶栏下拉「我的」** · 同上 |
| **赞过** | **`/community/me/likes`** | **顶栏下拉「我的」**（flag 关时隐藏）· 同上 |
| **我的订单** | `/orders` | **顶栏下拉「我的」** · NotesNav · QuickLinks |
| **我的举报** | `/community/me/reports` | QuickLinks · 顶栏工具区（**无** Hub tab） |
| **顶栏社区资料** | `/community/me` | `nav_community_profile` |

**顶栏冻结文档：** [HEADER-UTILITY-MENU-L5-FREEZE](../GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md) · **`Header.test`** 断言 `/community/me/likes`。

**G-01 数据链 contract：** `app/community/communityRouteDataHooks.contract.test.ts` 含 **`/community/me/likes`**（VM + `getMeLikes`）。

---

## Drawer / 独立页 parity（ME-P0 · ① 已闭）

| 能力 | Hub 抽屉 | 独立页 | 共享 VM |
|------|----------|--------|---------|
| **Posts** | `useCommunityMePostsExperience` → `CommunityMePostsExperiencePortals` | `useCommunityMePostsPage` → `CommunityMePostsPortals` | 同源 query + session pin + vis filter |
| **Collects** | `CommunityMeCollectsExperience` | `useCommunityMeCollectsPage` | `useCommunityMeCollectsHydratedList` · partialHint |
| **Likes** | `CommunityMeLikesExperience` | `useCommunityMeLikesPage` | `useCommunityMeLikesHydratedList` · partialHint |
| **PostDetailDrawer** | **内联** `PostDetailDrawerPortal` | 同上 | **禁止** `/community/post/:id` 导航 |
| **Orders** | `CommunityMeOrdersDrawerPreview` | `/orders` 全站页 | 抽屉仅预览 |

**机读抽屉壳：** `data-tt-community-me-notes-drawer="1"`（`CommunityMeNotesGlassDrawer`）

---

## 机读锚点

```text
# Hub
data-tt-community-me-page="1"
data-tt-community-me-surface="community_me_auth_gate|community_me_profile|community_me_*_auth_gate"
data-tt-community-me-notes-drawer="1"

# 独立页
data-tt-community-me-posts-page="1"
data-tt-community-me-collects-page="1"
data-tt-community-me-likes-page="1"
data-tt-community-me-reports-page="1"

# 交互
data-tt-community-me-session-pin-note="page|drawer"
data-tt-community-me-load-more="page|drawer"
data-tt-community-post-detail-drawer="1"    # PostDetailDrawer（开于 me 域时不改 URL）
```

**Selector SSOT：** `frontend/test-utils/dataTtSelectors.ts`

---

## 逐页追踪（满分 SSOT · ME-P1-8）

机读清单：`lib/communityMePageTracker.v1.ts` · `lib/communityMePageTracker.contract.test.ts`（Hub + 四独立页 + 举报详情 + 顶栏「我的/工具」与资料卡分段对拍）。

**全站账户导航合并闸：** `lib/accountNav/accountNavPageTracker.v1.ts` · `evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json` · `run-community-me-l5-green.sh` 末段含 `account-nav-header-ia` + Hub 举报抽屉 + **`community-me-hub-tab-redirect-matrix`** E2E。

## Contract 清单（Vitest · ①）

| 文件 | 覆盖 | 用例数（收口日） |
|------|------|------------------|
| `lib/communityMePageTracker.contract.test.ts` | **逐页** L5 marker · AuthGate · 顶栏 IA · 禁 `/community/post` 导航 | **11** |
| `app/community/me/posts/communityMePostsPage.contract.test.ts` | Posts/Collects/Likes/Orders 抽屉 · load-more · green script · header nav | **24** |
| `app/community/me/reports/communityMeReportsPage.contract.test.ts` | Reports AuthGate + VM + load-more | **3** |
| `components/me/communityMeProfile.contract.test.ts` | 资料卡 · 头像 file upload · 暖色 L5 · segment SSOT | **5** |
| `lib/communityMeContentNav.test.ts` | `?tab=` · dedicated redirect · login returnUrl · **segment 暖 token** | **15** |
| `app/community/communityRouteDataHooks.contract.test.ts` | me/* 路由 API hook wiring | **13** |
| `app/community/communitySubRoutes.contract.test.ts` | `/community/me/reports*` 子路由锚点 | **含 me 行** |

**Posts/Collects/Likes/Reports 契约要点（摘录）：**

- 独立页 **`CommunityMeDedicatedPageAuthGate`**；page **无** 内联 `getMyPosts` / `getMyCommunityReports`
- Drawer **无** `router.push('/community/post/…')`；**无** `fetchAllPostsForCommunityMeDrawer` / **`fetchOrdersForCommunityMeMyOrdersDrawer`**
- 删除/取消收藏/取消赞 **`window.confirm` 禁止** → L5 Dialog
- Collects/Likes **`partialHint`** + **`CommunityMeSessionPinNote`**（≥2 项）
- Reports **`useCommunityMeReportsListQuery`**（递增 `limit` load-more）
- Segment 活跃态 **`TT_COMMUNITY_ME_PANEL_L5.segmentLinkActive`**（**非** `cyan-200`）

---

## ① 验收命令（绿集 · exit 0）

### Vitest（最小集 · ME-P1-6 / ME-P1-7）

```bash
cd frontend
npx vitest run \
  lib/communityMePageTracker.contract.test.ts \
  app/community/me/posts/communityMePostsPage.contract.test.ts \
  app/community/me/reports/communityMeReportsPage.contract.test.ts \
  components/me/communityMeProfile.contract.test.ts \
  lib/communityMeContentNav.test.ts \
  app/community/communityRouteDataHooks.contract.test.ts
```

**收口日记录：** **60 passed**（5 files · 2026-06-01）。

**命名 / i18n 并跑（P3）：**

```bash
cd frontend
npm run test:i18n:ci
npm run test -- accountNavNamingP3 --run
```

### Playwright（`/community/me` 域 · ①）

**ME-P1-6 收尾（parity · partialHint · Reports · drawer 内联 · API fixture）：**

```bash
cd frontend
npx playwright test e2e/community-me-l5-parity-closeout.spec.ts --project=chromium
```

**独立页 L5 confirm · session pin · load-more：**

```bash
cd frontend
npx playwright test e2e/community-me-dedicated-l5.spec.ts --project=chromium
npx playwright test e2e/community-me-load-more-mocked.spec.ts --project=chromium
npx playwright test e2e/community-me-hub-notes-drawer-ia.spec.ts --project=chromium
npx playwright test e2e/community-me-data-state.spec.ts --project=chromium
```

**子路由机读锚点（含 reports）：**

```bash
cd frontend
npm run e2e:community-subroutes-l5
```

**Hub 资料 · 本机头像（PH1-FE-05 · 与 COMMUNITY-L5 同键）：**

```bash
cd frontend
PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all
# API 须 TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR=1（start-api-for-playwright 默认注入）
```

**ME-P1-6 推荐一键（Vitest + parity closeout）：**

```bash
cd frontend
npx vitest run app/community/me/posts/communityMePostsPage.contract.test.ts app/community/me/reports/communityMeReportsPage.contract.test.ts components/me/communityMeProfile.contract.test.ts lib/communityMeContentNav.test.ts \
  && npx playwright test e2e/community-me-l5-parity-closeout.spec.ts --project=chromium
```

**ME-P1-7 窄绿脚本（Vitest union + deterministic Playwright · CI 可回归）：**

```bash
# 仓库根
bash scripts/dev/run-community-me-l5-green.sh
# 或
cd frontend && npm run green:community-me-l5
```

含：**Vitest 5 文件 union** · Playwright **暖序**（`l5-a-parity` → `l5-b-load-more` → `l5-c-dedicated` → `data-state -g "访客"`；经 `run-e2e-default.mjs` · 默认 `PLAYWRIGHT_E2E_STABILITY=1`）。机读闸：**[`community-me-l5-local-gate.v1.json`](./community-me-l5-local-gate.v1.json)** · 收口行 **`TT_COMMUNITY_ME_L5_GREEN: OK`**。

**全站账户导航全量烟测（Vitest 已含社区契约 · Playwright 本脚本可 `SKIP_COMMUNITY_ME_*` 委托）：**

```bash
bash scripts/dev/smoke-account-nav-full-local.sh
PLAYWRIGHT_COMMUNITY_ME=1 bash scripts/dev/smoke-account-nav-full-local.sh
PLAYWRIGHT_FULL=1 bash scripts/dev/smoke-account-nav-full-local.sh
```

末行 **`TT_ACCOUNT_NAV_FULL_SMOKE: OK`** · SSOT [`account-nav-page-tracker.v1.json`](../GO_local_auth_l5/account-nav-page-tracker.v1.json) → `playwright_matrix`.

**前置：** 本地 API `:8080` · `SEED_TEST_ACCOUNTS=1` · `npm run dev` 或 Playwright webServer。

---

## Feature Flags（构建时 `NEXT_PUBLIC_*`）

| 变量 | 默认 | 影响面 |
|------|------|--------|
| **`NEXT_PUBLIC_COMMUNITY_ME_LIKES_LIST`** | **未设 = 开启**；`0`/`false`/`off` = 关 | `/community/me/likes` · Hub `?tab=likes` · `GET …/me/likes` · 「帖子获赞」统计 |
| **`NEXT_PUBLIC_COMMUNITY_ME_AVATAR_UPLOAD`** | 非 production 默认开；production 未显式开 = 关 | 资料卡本机头像 · `POST …/me/profile-avatar` |
| **`NEXT_PUBLIC_COMMUNITY_ME_BIO`** | 关 | 独立 bio 预览区 |
| **`NEXT_PUBLIC_COMMUNITY_ME_BIO_ALLOW_PRODUCTION`** | 关 | production 下 bio 双闸 |

**SSOT：** `lib/communityMeFeatureFlags.ts`

---

## Known Limits（① · 诚实边界）

| 限制 | 值 | 真源 |
|------|-----|------|
| **Collects ID 列表单次上限** | **100** | `COMMUNITY_ME_DRAWER_LIST_ID_CAP` ↔ API `LIST_LIMIT` |
| **Likes ID 列表单次上限** | **100** | 同上 |
| **Collects/Likes hydrate 分批** | **24** / 批 | `COMMUNITY_ME_*_HYDRATE_PAGE_SIZE` |
| **Posts 首屏分页** | **30** + cursor | `COMMUNITY_ME_POSTS_LIST_PAGE_SIZE` · `getMyPosts` |
| **Posts API `limit` 顶** | **100** | `posts.rs` · UI 触顶提示 `community_me_posts_page_truncated_hint` |
| **Orders Hub 抽屉分页** | **30** / 页 + cursor；会话 raw 顶 **1200**（40 页） | `COMMUNITY_ME_ORDERS_DRAWER_PAGE_SIZE` · `useCommunityMeOrdersDrawerList` · `MY_ORDERS_DRAWER_RAW_FETCH_CAP` |
| **Reports 列表** | 首屏 **30**；load-more 递增 `limit`（无 cursor/offset）；API 顶 **100** | `useCommunityMeReportsListQuery` · `COMMUNITY_ME_REPORTS_LIST_PAGE_SIZE` |
| **Session pin** | **会话内**置顶；刷新恢复 API 顺序 | `useCommunityMePageSessionPin` |
| **Segment 活跃态（ME-P1-3）** | 暖金 **`text-ref-sun`** · **`TT_COMMUNITY_ME_PANEL_L5.segmentLinkActive`** | `communityMeContentSegmentClass` · **非** `cyan-200` |
| **Collects/Likes partial hydrate** | 缺失帖显示 **partialHint**；非全列表失败 | `partialHint` status 条 |
| **Hub 抽屉** | 登录用户 **不** 承载全量管理（redirect 独立页） | Scheme A |
| **②③** | staging 全矩阵 · 生产 PSP · 主网 | **非本冻结 GO 口径** |

---

## Go / No-Go 验收标准（①）

### GO（可宣称「`/community/me` Phase ① L5 冻结维护态」）

- [ ] 上节 **Vitest 最小集** `exit 0`（**60** tests · 含 segment token + green script contract）
- [ ] **`npm run green:community-me-l5`**（或 `bash scripts/dev/run-community-me-l5-green.sh`）`exit 0` · 末行 **`TT_COMMUNITY_ME_L5_GREEN: OK`**
- [ ] **`community-me-l5-parity-closeout.spec.ts`** 社区用例 **6/6 pass**（无 drawer skip）
- [ ] 动 **`app/community/me/*`** 或 **`components/me/communityMeNotes/*`** 后，相关 **contract** 与 **parity closeout** 复跑 `exit 0`
- [ ] **无** Drawer/独立页 **`router.push('/community/post/')`** 回归（contract 静态断言）
- [ ] **无** `window.confirm` 于 posts/collects/likes/orders 删除链（contract 静态断言）
- [ ] AuthGate 访客 **`data-tt-data-state="invalid"`** 可被 `community-me-data-state` 检出

### No-Go（不得合并 / 不得宣称已闭）

- Vitest 或 parity closeout **失败** / 用 **skip** 冒充 drawer 已验
- 新增 Hub/独立页 **layout lock** 未更新本 FREEZE + contract
- 用 **① 绿集** 冒充 **② 测试网** 或 **③ Production GO**
- 用窄切片 **`report.json` GO** 冒充全站 `/community/me` 每交叉角色已验收（见 **TT-9628 覆盖边界**）

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| API 分页 / hydrate / 门闸 / trust · i18n 同语义 | Hub/抽屉/独立页 **视觉结构** 回流 |
| bugfix · partialHint / load-more 数据链 | Drawer 开帖改回 **独立 post 路由** |
| 契约与 E2E 对齐真值 | 未跑绿集的 IA / 分段 Tab 重排 |
| Feature flag 诚实化文档 | 假完成 **②③ GO** |

---

## ②③ 显式非本收口

- 测试网 staging 全矩阵 · 生产 webhook · 主网 · `go-live` **Production GO**
- 全站 **93** 域矩阵每路由×每角色（Community C7 槽 **≠** 本域全交叉 GO）
- 见 **PHASE2-REPOSITORY-STATUS** · **COMMUNITY-PHASE-2-3-ROADMAP**

---

## 互指

| 读者 | 文档 |
|------|------|
| 改 `/community/me` 前 | **本文** → 路由 README → contract 清单 |
| 五主 Feed 壳 | **FIVE-MAIN-ROUTES-PHASE1-FREEZE** · **COMMUNITY-L5-CLOSURE** |
| 账户命名 | **ACCOUNT-NAV-NAMING-P3** |
| 收购 trust 条 | **acquisition README** · **ME-IDENTITIES-UI-FREEZE** |
| 机读闸 JSON | [community-me-l5-local-gate.v1.json](./community-me-l5-local-gate.v1.json) |
