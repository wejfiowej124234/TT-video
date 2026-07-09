# TT-PH1-SITE-THEME-V1 · 企业级控件矩阵（逐路由 · 逐层 · ①）

**Version:** 1.1.0  
**最后更新：** 2026-05-22  
**母文档：** [TT-PH1-SITE-THEME-V1-UPGRADE-001](TT-PH1-SITE-THEME-V1-UPGRADE-001.md) **v1.7.0**  
**阶段：** **① 本地**（不宣称 ②③）  
**代码真源：** [`frontend/lib/marketingUi.ts`](../../frontend/lib/marketingUi.ts) · [`frontend/lib/uiSystem.ts`](../../frontend/lib/uiSystem.ts) · [`frontend/lib/communityA11yFocus.ts`](../../frontend/lib/communityA11yFocus.ts)

> **用途：** 维护者/AI 按 **路由 → 叠层 → 控件** 查「该用什么 token、是否已落地、可否 defer」。**施工**仍以母文档 §2.1 顺序为准；本文件为 **验收清单 SSOT**，不替代 88/86 业务规格。

---

## 1. 设计 DNA（与首页对齐 · 写死）

| 维度 | 首页 `/` 参照 | marketDark 子页（`/market*`、`/did-rank`、`/community/*`） |
|------|----------------|--------------------------------------------------------|
| **主 Action 色** | L0 `REGISTER_PILL_WARM` · Hero **`TT_MARKETING_HOME_SUBMIT_FAB`**（§1.7 暖金） | **`TT_MARKETING_ACTION_GRADIENT_FILL`**（`#e8c96a→#f0a878→#d4845f`） |
| **标题渐变** | `from-ref-sun` 族 | **`TT_MARKETING_ACTION_TITLE_GRADIENT`** |
| **页壳底** | 摄影 + vignette + 点阵 | **`#14100d` + `WarmRouteFieldBackdrop` + 弱赛博**（88 §一） |
| **L0 顶栏** | 深条 + 暖金四链 | **冻结** · `headerNavItemIsActive` |
| **禁止** | — | 子页 **Hub/Tab/主 CTA** 使用全局蓝紫 **`bg-cta-gradient`** |

**语义色（允许 · 非主 Action）：**

| 语义 | Token / 类 | 场景 |
|------|------------|------|
| Escrow DID 深色钮 | `TT_MARKETING_BTN_ESCROW_DID_PRIMARY` | 保持青色业务语义 |
| 玻璃输入 focus | `marketCyan*` / `travelFocusRing*` | Market 抽屉、Console 撮合区（**D3 defer**） |
| 未读角标 | `ref-coral` 实心点 | L1 消息 Tab 角标（**非** fuchsia） |
| 角色徽章 | `ref-sun` / 浅琥珀 | guide vs tourist；**非**帖卡霓虹边框 |

---

## 2. 分区边界（企业级 · 必守）

| 分区 | `UiZone` | 路由前缀 | 本矩阵 |
|------|----------|----------|--------|
| **Experience** | `experience` | `/`、`/traveltrust` | **只读参照** · 母文档 §1 锁死 |
| **marketDark** | `marketDark` | `/market`、`/did-rank`、`/community` | **全文覆盖** |
| **Console** | `console` | `/orders`、`/pay`、`/escrow`、`/me`（非 community/me） | **不在轨** · `TT_MARKETING_PRODUCT_PAGE_*` |
| **Admin** | `admin` | `/admin/*` | **不在轨** |
| **桥接** | `console` | `/auth/*`、`/help` | **TT-PH1-217** · 浅色 |
| **桥接** | `console` | `/guides/*` | **TT-PH1-216** · 主 CTA 暖金 · 内链 `marketCyan*` |
| **规范页** | `console` | `/terms/community-guidelines` | 浅色 · `/community/guidelines` 重定向至此 |

**假完成边界：** ① Vitest 44/46+ **≠** ② 测试网 **≠** 93 域全矩阵 GO（[TT-9628](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)）。

---

## 3. 控件分层词汇（L0～L5 · 页面 UI L5）

| 层 | 名称 | 典型控件 | SSOT |
|----|------|----------|------|
| **L0** | 全站顶栏 | 四链、Register、语言、钱包 | `TT_MARKETING_HEADER_*` · **冻结** |
| **L1** | 路由壳 | community Tab 条、发布 FAB、底栏 | `TT_COMMUNITY_SHELL_L5` · `TT_MARKETING_DARK_ROUTE_*` |
| **L2** | 页头/Hub | Market Hub、Did 周期 Tab、Feed 顶区 | `TT_MARKETING_MARKET_HUB_*` · `TT_COMMUNITY_FEED_ACTION.header*` |
| **L3** | 列表/卡/抽屉 | Feed 卡、榜单块、筛选带 | `TT_COMMUNITY_FEED_ACTION` · `TT_MARKETING_MARKET_DARK_PATH` |
| **L4** | 状态 | loading/error/空态/骨架 | 与 L1 同壳色 · **禁止** 第二套冷色底 |
| **L5** | 页面 UI 闭卷 | 上列 + §6.2 目视 | 母文档 **§1.6 P5-1～P5-5** |

**状态图例（矩阵列「① 状态」）：**

| 标记 | 含义 |
|------|------|
| **✓** | 已接 token · ① 验收通过 |
| **△** | 部分暖金 · 次要控件仍 defer（见 §6） |
| **○** | 计划 **TT-PH1-219** 波次 |
| **—** | 不适用 / 重定向 / 壳级继承 |

---

## 4. Token 注册表（按族 · 施工时只引此处）

| Token 族 | 常量前缀 | 用于 |
|----------|----------|------|
| Action 渐变 | `TT_MARKETING_ACTION_*` | 主 CTA、Tab 激活、周期 Tab、标题渐变 |
| Market 深色路径 | `TT_MARKETING_MARKET_DARK_PATH` | 筛选标签、内链、玻璃卡描边、空态 |
| Market 钮 | `TT_MARKETING_BTN_MARKET_PRIMARY` | Hero/Hub/弹窗主提交 |
| Did 榜 | `TT_MARKETING_DID_RANK_*` · `TT_MARKETING_DID_RANK_PATH` | **五签** Tab（含 **itinerary**）、Top3、弹窗 |
| Community 壳 | `TT_COMMUNITY_SHELL_L5` | layout 顶/底 Tab |
| Community 页身 | `TT_COMMUNITY_PAGE_L5` | 子页面板、**primaryCtaFilled** 空态主钮 |
| Feed Action | `TT_COMMUNITY_FEED_ACTION` | Feed 顶区/Tab/筛选/FAB/帖卡壳/发布提交 |
| 抽屉/弹层 | `TT_COMMUNITY_DRAWER_L5` | Publish/PostDetail/Login/Report/分享菜单/帖卡内徽章 |
| Focus | `community*Focus` in `communityA11yFocus.ts` | 深底 focus 环（优先 `ref-sun`） |

---

## 5. `/market`（5 路由）

**共用：** `MarketLayout` · `MarketAmbientBackdrop` · L0 深顶栏 · `UiZone=marketDark`

### 5.1 `/market`（主列表）

| 层 | 控件 / 功能 | Token / 组件 | ① |
|----|-------------|--------------|---|
| L2 | Hero 主 CTA / Escrow 药丸 | `TT_MARKETING_BTN_MARKET_PRIMARY` · `ref-sun` Escrow | ✓ |
| L2 | Hub 子导航激活 | `TT_MARKETING_MARKET_HUB_NAV_LINK_ACTIVE` | ✓ |
| L2 | ViewSwitcher / 筛选粘性条 | `TT_MARKETING_MARKET_DARK_PATH` · `ACTION_*` | ✓ |
| L3 | 指南卡 / Masonry CTA | `MARKET_DARK_PATH.masonryCtaLink` | ✓ |
| L3 | 空态主钮 | `TT_MARKETING_BTN_MARKET_PRIMARY`（darkBg） | ✓ |
| L3 | 空态（Console 浅色分支） | `bg-cta-gradient` | △ defer · 非 marketDark 主路径 |
| L3 | Order/Guide 抽屉主钮 | `BTN_MARKET_PRIMARY` | ✓ |
| L3 | 抽屉输入 focus | `marketCyan*` | △ **D3** |
| L4 | loading / error | `MarketRouteSuspense` 同壳 | ✓ |

### 5.2 `/market/provider` · `/market/acquisition`

| 层 | 控件 | Token | ① |
|----|------|-------|---|
| L2 | 段落地 CTA → did-rank | `TT_MARKETING_BTN_MARKET_PRIMARY` | ✓ |
| L2 | Hub | 同 5.1 | ✓ |

### 5.3 `/market/provider/showcase/[id]` · `/market/acquisition/[id]`

| 层 | 控件 | Token | ① |
|----|------|-------|---|
| L2 | `MarketSubsitePageChrome` | `TT_MARKETING_MARKET_DARK_PATH` | ✓ |
| L3 | 详情主 CTA / 重试 | `BTN_MARKET_PRIMARY` | ✓ |

---

## 6. `/did-rank`（1 路由）

| 层 | 控件 / 功能 | Token / 组件 | ① |
|----|-------------|--------------|---|
| L2 | 页头 `h1` 渐变 | `TT_MARKETING_ACTION_TITLE_GRADIENT` | ✓ |
| L2 | 周期 Tab（24h/7d/30d） | `TT_MARKETING_ACTION_PERIOD_TAB_*` | ✓ |
| L2 | **五签** Tab 激活 | `TT_MARKETING_DID_RANK_TAB_ACTIVE` | ✓ |
| L3 | Top3 卡标题/链接 | `TT_MARKETING_DID_RANK_PATH` · `refTopThreeStyles` | ✓ |
| L3 |  traveler 高亮环 | 暖金/ref-sun（非 cyan ring） | ✓ |
| L3 | 错误重试 | `TT_MARKETING_BTN_MARKET_PRIMARY` 族 | ✓ |
| L3 | 录榜/指南弹窗 | `DidRankRecordModal` / `DidRankGuideModal` | ✓ |
| L4 | 奖池/骨架 | 同壳 | ✓ |

---

## 7. `/community/*`（18 `page.tsx` · 15 有效页）

**共用 L1：** `CommunityRouteShell` · `TT_COMMUNITY_SHELL_L5` · 底栏/顶栏 Tab · 发布 FAB `TT_MARKETING_DARK_ROUTE_PUBLISH_FAB` · 未读点 **ref-coral**

### 7.1 `/community` · `/community/topic/[tag]`（Feed）

| 层 | 控件 | Token | ① |
|----|------|-------|---|
| L2 | Feed 顶区标题 | `TT_COMMUNITY_FEED_ACTION.headerTitle` | ✓ |
| L2 | 主 Tab（推荐/关注…） | `feedTabActive` / `feedTabUnderline` | ✓ |
| L2 | 排序/筛选 chip | `sortChip*` / `filterChip*` | ✓ |
| L2 | 发帖条触发 | `composerTrigger` | ✓ |
| L3 | 帖卡外框 | `TT_COMMUNITY_FEED_ACTION.feedCard` | ✓（**219**） |
| L3 | 帖卡内 role pill/图标 | 历史霓虹 | △ 次要 · §6 defer |
| L3 | 点赞/评论/分享 | 图标色 | △ 次要 |
| L3 | **PublishDrawer** 提交 | `publishSubmit` | ✓（**219**） |
| L3 | PublishDrawer 壳/类型 chip | cyan 边框 | △ 抽屉内 **○→△** 可续收 |
| L3 | PostDetailDrawer | cyan/fuchsia 混用 | △ **219+** |
| L4 | 空态/骨架/Toast | `emptyPanel` / `skeletonCard` / `toast` | ✓ |

### 7.2 `/community/explore`

| 层 | 控件 | Token | ① |
|----|------|-------|---|
| L2 | 页头 | `TT_COMMUNITY_PAGE_L5.pageTitle` | ✓ |
| L3 | 目的地/作者 chip | 部分 fuchsia | △ 栅格次要链 **○** |
| L3 | 空态 CTA | `primaryCtaFilled` | △ **219** 局部 |

### 7.3 `/community/messages` · `/community/messages/[id]`

| 层 | 控件 | Token | ① |
|----|------|-------|---|
| L2 | 列表筛选 Tab | 部分 fuchsia 激活态 | △ **219+** |
| L3 | 空态「去发现」 | `primaryCtaFilled` | ✓（**219**） |
| L3 | 发送钮（线程页） | 待收 ACTION | △ |
| L3 | 分享模式条 | fuchsia 底 | △ 语义条 **○** |

### 7.4 `/community/friends` · `/community/activity`

| 层 | 控件 | Token | ① |
|----|------|-------|---|
| L3 | 空态/关系主 CTA | `primaryCtaFilled` | ✓（**219**） |
| L3 | 请求列表行内钮 | slate/ghost | ✓ |

### 7.5 `/community/me` 及子路径

| 路由 | 主控件 | Token | ① |
|------|--------|-------|---|
| `/community/me` | 账户面板/抽屉 | `TT_COMMUNITY_PAGE_L5` | ✓ |
| `/community/me/posts` | 空态发布 | `primaryCtaFilled` | ✓ |
| `/community/me/collects` | 空态去发现 | `primaryCtaFilled` | ✓ |
| `/community/me/reports` | 申诉 CTA | `primaryCtaFilled` | ✓ |
| `/community/me/likes` | redirect | — | — |

### 7.6 其它 community 页

| 路由 | 说明 | ① |
|------|------|---|
| `/community/user/[id]` | 关注/聊天主钮 → `primaryCtaFilled` | ✓ |
| `/community/feedback` | 提交/列表 CTA → `primaryCtaFilled` | ✓（**219**） |
| `/community/tt` | 主/次 CTA 暖金 | ✓（**219**） |
| `/community/guidelines` | redirect → terms | — |
| `/community/post/[id]` | redirect → feed query | — |

---

## 8. TT-PH1-219 实施波次（① · 企业级收口）

| 批次 | 范围 | ① 状态 |
|------|------|--------|
| **219a** | Token：`feedCard` / `publishSubmit` / `primaryCtaFilled*` / `badgeUnread` | **closed** |
| **219b** | Feed 卡 + PublishDrawer 提交 + 空态主 CTA 批量（18 文件） | **closed** |
| **219c** | L1 未读角标 → `ref-coral` | **closed** |
| **219d** | explore/messages/PostDetailDrawer 次要霓虹 | **open** · △ |
| **219e** | PublishDrawer 壳 cyan → 暖描边 | **open** |
| **219d** | explore/messages/PostDetail 壳与交互暖色 | **closed** · ① |
| **219e** | PublishDrawer 壳 + `TT_COMMUNITY_DRAWER_L5` | **closed** · ① |
| **219f** | §6.2 POST 证据目录补全 | **open** · 见母文档 §7.1 |

**验收：** 母文档 §6.1（**49/49** · 含 `communityDrawerTheme`）+ community 树 **无** `fuchsia`/`cyan-500` 主路径（`rg` 可证）。

---

## 9. 全局 defer 登记（允许 · 须写明）

| ID | 元素 | 理由 | 复验 |
|----|------|------|------|
| **D3** | Market 抽屉 `marketCyan*` focus | 玻璃可读性 88 | 目视 `/market` 抽屉 |
| **PD-1** | PublishDrawer 上传虚线区 focus | `ring-ref-sun` | ① closed |
| **PD-2** | PostDetail 轮播点/发送 | `sendBtn` · `bg-ref-sun` | ① closed |
| **FC-1** | Feed 卡内标签/角色/关注 | `TT_COMMUNITY_DRAWER_L5` | ① closed |
| **ES-1** | `EmptyState` 非 darkBg 蓝紫 | Console 浅色分支 | 不在 marketDark |
| **88-DOC** | 88 正文历史 cyan 描述 | 默认 defer 文档批 | 用户明示台账同批再改 |

---

## 10. 维护命令

```bash
# 主路径冷色残留（marketDark 目录）
rg "bg-cta-gradient|border-fuchsia|bg-fuchsia-500/15" frontend/app/market frontend/app/did-rank frontend/app/community frontend/components/market frontend/components/did-rank frontend/components/community -g "*.tsx"

# 母文档 §6.1 全量
cd frontend && npm run test -- --run lib/uiSystem.test.ts lib/marketingUi.test.ts \
  components/market/marketTheme.contract.test.ts \
  components/did-rank/didRankTheme.contract.test.ts \
  components/community/communityShellTheme.contract.test.ts \
  components/community/communityPageTheme.contract.test.ts \
  components/community/communityFeedActionTheme.contract.test.ts \
  components/guides/guidesTheme.contract.test.ts \
  components/auth/authHelpBridgeTheme.contract.test.ts \
  app/traveltrust/traveltrustErrorTheme.contract.test.ts
```

---

## 11. 模态 / 抽屉 / 覆盖层（跨路由 · 功能键位）

| 组件 | 触发入口 | 关键按键 / 区块 | Token |
|------|----------|-----------------|-------|
| `PublishDrawer` | Feed 发布 FAB / 发帖条 | 返回 · 关闭 · 类型 chip · 提交 | `TT_COMMUNITY_DRAWER_L5` + `publishSubmit` |
| `PostDetailDrawer` | 帖卡「全文」 | 关闭 · 分享 · 评论排序 Tab · 发送 | `TT_COMMUNITY_DRAWER_L5` + `sendBtn` |
| `CommentDrawer` | 评论图标 | 同 PostDetail 评论区 | 继承 drawer 族 |
| `CommunityLoginModal` | 未登录拦截 | 关闭 · 登录链 | `TT_COMMUNITY_DRAWER_L5.sheet` 族 |
| `CommunityReportDrawer` | 举报 | 提交 · 单选 | `accent-ref-sun` · 暖描边 |
| `CommunityVideoOverlay` | 视频播放 | 关闭 · 进度条 | `overlayVideoFrame` · `bg-ref-sun/90` |
| `CommunityPostShareMenu` | 分享 | 复制链 · DM | `menuPanel` · `menuItemHover` |
| `CommunityTopicHero` | 话题页 | 清除筛选 · 回 Feed | `topicHeroFrame` / `headerPillWarm` |

---

## 12. ① 本地统一验收（企业级 · 一键）

```bash
# 1) 冷色残留应为 0（community 树）
rg "fuchsia|cyan-500|bg-cta-gradient" frontend/app/community frontend/components/community -g "*.tsx" || echo "OK: no matches"

# 2) 机读 49/49
cd frontend && npm run test -- --run \
  components/community/communityDrawerTheme.contract.test.ts \
  components/community/communityFeedActionTheme.contract.test.ts \
  # … 完整列表见母文档 §6.1
```

**目视：** `PLAYWRIGHT_REUSE_FE_SERVER=1 npm run e2e:site-theme-v1-capture` → `evidence/GO_local_site_theme_v1/POST-screenshots/`。

---

**维护者：** solo · **①**  
**与母文档同步：** 母文档 **v1.7.0** 须引用本文件为 **控件矩阵 SSOT**
