/**
 * Focus ring for travel-colored links (13-1 / 37 / 88 §3.3).
 * 浅色 **`Link`** 消费侧多拼 **`travelFocusRingOffset2Classes`**（本 **`travelLinkFocusClasses`** 为 **`Offset1`/`Offset2`** 基类）。**`/help`**, **`/terms`**, **`/privacy`**, **`/terms/community-guidelines`**, **`/governance/*`**,
 * **`/guide`** 工作台 **ApiErrorAlert** 态与 **非向导** 警示区 **`/me`** **`Link`**（**`FOCUS_RING`**）、**`/me/error`** 与 **`/disputes/error`** 与 **`/orders/error`** 与 **`/did-rank/error`** 与 **`/community/error`** 深壳 **`ProductCrossNav`**（及同页 **cyan** 快链）；**`/guides`** 列表、**guides 详情页**（**`bg-market-atmosphere`**；路径 `` `/guides/[id]` ``；面包屑、**`ProductCrossNav`**、**`资质`**与 **`loading`/`error`** 内联链）、**`GuideDetailRouteSuspense`** **`fallback`**、**`MeStatsSection`**（**`bg-slate-900/70`** 卡内 **`/market`**）、**`FeeRouterWiringNotice`** **`did`** 不一致链、**`ReviewBlock`** **`variantDid`**（玻璃 **`bg-slate-900/70`** 等）— **`marketCyanInlineLinkFocusClasses`**（**`ring-offset-slate-900`**）；**`EscrowDetailHeader`** **`variantDid`**（**`order-protocol-zone`** **`bg-slate-950`** **顶栏** **`Link`/`button`**）与 **`OnchainEventTimeline`** **`variantDid`** **`tx`/`a` 链** — **`touchTargetLink44Classes`+**`deepShellInlineLinkFocusClasses`**（**`ring-offset-slate-950`**），
 * `/disputes`（列表与错误态回站）、`/disputes/[id]` **浅色控制台**（**`disputeConsoleFocus`** = **`travelFocusRingCoreOffset2Classes`** + **`ring-offset-bg-console`**；**trust**、**travel**、**warning** 三类 主 **`btn-console`** 各自显式 ring + 同色 **`ring-offset-bg-console`**），`/itinerary/new` **向导上下文**「向该向导下单」pill **`Link`**（**`travelFocusRingCoreOffset2Classes`** + **`ring-offset-bg-console`**）**、**主表单** **`input`（含 **`travel_date`**）/`textarea`/提交**、**国家·城市 pill**、**成功态 **`Link`**，fromOrder 内联 Escrow/Pay 链、**`login_required` 补救登录链**，**`/orders/new`** 无向导时 **`/guide/register`**、**主表单** **guides 加载失败** **重试** 与 **`select`/`input`/提交**（**`travelFocusRingCoreOffset2Classes`** + **`ring-offset-bg-console`**）**，**`/pay`** **orderId **`input`** 与 **trust** **`Link`**（**`ring-offset-bg-console`**）**，**鉴权** login · forgot-password · verify-email · reset-password **页表单 **`input`/`btn-console`**，**`/auth/register`** **`inputClass`** 与 **`RegisterGuideForm`/`RegisterTouristForm`** **提交**，**`/auth/*`** 表尾/条款链，**`/staking`** 申请 **CTA `btn-console`**（**`ring-trust-600`** + **`ring-offset-bg-console`**），**`/orders` 列表加载错误态**三链，`/orders`, **`admin/indexer/reconcile-reports`** **导出·筛选项**（白 **`Offset2White`**、浅色 **`ring-offset-bg-console`**）、`AdminSearchParamsSuspense` fallback,
 * 浅色域分段 `error.tsx`（各路由段）、根 **app/error.tsx** **重试/回首页** 主 **`button`/`Link`**（**`travelFocusRingCoreOffset2Classes`** + **`ring-offset-bg-console`**）、**global-error.tsx `ProductCrossNav*`**、**guide/register** **主表单**、**me/password** **表单**、**admin 子树** 列表与详情链、**`admin/error`** 重试·回首页、**admin 索引器** 刷新、**admin 索引器 reconcile 单报告** 刷新·复制·下载 JSON（均 **`ring-offset-bg-console`**）、**AdminShellBar**；**`EscrowDetailHeader`** **非赛博** **`travelLinkFocus`**（**`variantDid`** **`deepShell`** **见上行**）；**`/traveltrust/error`** **`ref-cyan`** 内联链与 **`ProductCrossNav`**（**`communityCardLinkFocus`**，`communityA11yFocus`）；**`/traveltrust`** 成功页 **`ctaBtnSecondary`** **`focus-visible`**、**`details`/`summary`**（规格 toggle、FAQ）**`communityCardLinkFocus`**；**`TravelTrustStickyCta`** **四 **`Link`** **`ref-cyan` ring** **`ring-offset-slate-950`**；**`TravelTrustDemoPreview`** 模拟主 **`button`**；**`TravelTrustAllocationPlaceholder`** **`/market`** pill **`Link`**（**`communityCardLinkFocus`**）；**`FeeRouterWiringNotice`** **`/governance/fee-routes`** 浅色 **`travelFocusRingOffset2Classes`**（**`did`** **`marketCyan`** **见上行**）。**`WalletStatusMini`**（**`Header`**、**`/traveltrust`** Hero）**`focus-visible:ring-inset`**。
 * **`/market`** 成功 toast **`Link`**、**`InviteGuideModal`** 关闭/底栏、**`GuideCard`/`OrderCard`/`OrderDetailDrawer`/`GuideDetailDrawer`/`ViewSwitcher`/`StickyFilterBar`/`MarketContent`** 浅色主控 **`travelFocusRingCoreOffset2`** + **`ring-offset-bg-console`**、**`EmptyState`**、**`EmptyCrossNav`**、**`AgreementSummaryAccordion`**、**`InviteGuideModal`** 底栏（**`travelFocusRingOffset2Classes`** 内嵌 **`ring-offset-bg-console`**，或 **`travelLinkFocus`** 与 **`ring-offset-bg-console`** 同串）；**`UnlockModal`** 取消/支付 **`travelFocusRingCoreOffset1`** + **`ring-offset-bg-console`**；**`StakingStakePanel`/`StakingWithdrawPanel`** **提交** **`ring-offset-bg-console`**；**`ProductCrossNav`** 默认 **`travelFocusRingOffset2Classes`**（**`linkClassName`**）；**`UnifiedItineraryList`** 浅色 **`u.link`**、**`expandAll`** 同用 **`travelFocusRingOffset2Classes`**（**did** **`communityCardLinkFocus`**）；**`OrderMessageLink`** **`compact`** 浅色行；**`variantDid`** **`marketCyanInlineLinkFocusClasses`**（**`bg-slate-900/70`**）。**`/orders/new`** 下单成功态 **Escrow/Pay** 内联链 + **`AgreementSummaryAccordion`** 展开/复制；**`/admin/*`** **`reviews`/`orders`/`disputes`** 表行与详情 **`text-travel-600/90`** 次链（**Pay hub** / 前台 **Escrow** / **争议详情**）及 **`/admin/reviews`** **预设低分** 与 **清除分值** 钮；**`/`（Landing）** **`ItineraryResultsSection`** 已解锁卡 **Escrow/Pay** 深底链（**`ring-offset-slate-950`**）与收藏 **focus-visible**；**`ReviewBlock`** **浅色** **`travelLinkFocus`**、**`variantDid`** **`details`/`summary`** **与** **retry** **`marketCyan`**（**见上行**）；**`EscrowDetail`** **DID** 草稿 **城市 `select` / 叙事 `textarea`**（**`bg-slate-950/80`**，**焦点环** **`ring-offset-slate-900`** **对齐玻璃叠层**）；**玻璃卡** **保存**、**`CreateOnChainEscrowBlock`** 外区与 **工厂弹层** 主/取消钮 **`marketCyanPillControlFocusClasses`**；**`OrderActionsBlock`** **did** **全钮** 与 **争议摘要 `textarea`**；**`EscrowTxModal`** **did** **取消/确认** 与 **`openDispute` `textarea`**；**`OrderFlowSteps`** **`variant=did`** **步骤 `li`**；**`ReviewBlock`** **提交评分**、**`select`/`input`（did）**；**`SetEscrowAddressBlock`** **`did`**；**`ReorgBanner`** **刷新·关闭**（**`pillFocusClass`**：**`did`** 用 **`marketCyanPill`**；浅色用 **`CoreOffset2`** 与 **`ring-offset-bg-console`**）；**`ConfirmFinalPlanBlock`** **外链入口钮与浅色确认弹层**（**`travelFocusRingCoreOffset2`**）；**`BilateralConfirmBlock`** **`did`** **双边确认**；**`ChatBlock`** **浅色** **发送**；**链**（**编辑行程**、**评分入口**）**`marketCyanInlineLinkFocusClasses`**；**`order-protocol-zone`** **底栏** **`deepShellPillControlFocusClasses`**；**`ChatBlock`** **`variant=did`** **重试** 与 **内联链** **`marketCyanInlineLinkFocusClasses`**、**发送** **`marketCyanPillControlFocusClasses`**。
 * **`FeeRouterWiringNotice`**：不一致态治理链仅 **`Link`**（**`light`** **`travelFocusRingOffset2Classes`**、**`did`** **`marketCyanInlineLinkFocusClasses`**），**无** **`btn-console`**。**`CreateOnChainEscrowBlock`** 外区「打开工厂弹层」 **`button`** 与弹层 **`btn-console`** 同批 **`factoryModalCtaFocusClass`**（**did **`marketCyanPill`**；浅色 **`travelCoreOffset2`** + **`ring-offset-bg-console`**）。
 * **`travelFocusRingCore*`**：无固定 **`rounded-*`**，供 **`rounded-xl`/`rounded-full`** 等自备圆角的控件复用（07 §六 6.3B 序 5）。
 * **`travelFocusRingCoreSoft*`**：**`ring-travel-500/50`**；**`travelFocusRingCoreSoftOffset2Classes`** 内嵌 **`ring-offset-bg-console`**（**`LandingFooter`**）。**`travelFocusRingCoreOffset2WhiteClasses`**：**`Header`** 白底 **`ring-offset-white`**。**`travelFocusRingCoreInsetMenuClasses`**：**Header** 用户菜单 **`ring-inset`** + **`bg-ink-100`**。
 */
export const travelFocusRingCoreClasses =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500";

/** Landing **`/`** 页脚等：**半通透** travel ring（与 **`travelFocusRingCoreClasses`** 同色色相、 **`/50`**）。 */
export const travelFocusRingCoreSoftClasses =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-travel-500/50";

/** **`LandingFooter`** 等 **`bg-bg-console`** 浅底链：**soft** ring + **2px** offset + **`ring-offset-bg-console`**。 */
export const travelFocusRingCoreSoftOffset2Classes = `${travelFocusRingCoreSoftClasses} focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

/** **Header** 白底栏：**offset-2** + **`ring-offset-white`**（非 **`CoreOffset2`** 的默认 offset 色）。 */
export const travelFocusRingCoreOffset2WhiteClasses = `${travelFocusRingCoreClasses} focus-visible:ring-offset-2 focus-visible:ring-offset-white`;

/** **Header** 用户下拉：**inset** ring + **`focus-visible:bg-ink-100`**。 */
export const travelFocusRingCoreInsetMenuClasses = `${travelFocusRingCoreClasses} focus-visible:ring-inset focus-visible:bg-ink-100`;

/** 核心 travel ring + **1px** offset（如 **UnlockModal** 底栏等）。 */
export const travelFocusRingCoreOffset1Classes = `${travelFocusRingCoreClasses} focus-visible:ring-offset-1`;

/** 核心 travel ring + **2px** offset；元素自身已含 **`rounded-*`** 时用本常量，勿与 **`travelFocusRingOffset2Classes`**（含默认 **`rounded-sm`**）混用。 */
export const travelFocusRingCoreOffset2Classes = `${travelFocusRingCoreClasses} focus-visible:ring-offset-2`;

export const travelLinkFocusClasses =
  `rounded-[var(--radius-sm)] ${travelFocusRingCoreClasses}`;

/** Base travel ring + 1px offset（展开钮等浅卡 inline 控件；07 §六 6.3B 序 5 / 88）。 */
export const travelFocusRingOffset1Classes = `${travelLinkFocusClasses} focus-visible:ring-offset-1`;

/** Base travel ring + 2px offset + **`ring-offset-bg-console`**（市场空态 CTA、邀请向导弹窗列表项、**`AgreementSummaryAccordion`** 折叠钮等；07 §六 6.3B 序 5 / 88）。白底控件请用 **`travelFocusRingCoreOffset2WhiteClasses`** 等，勿与本常量混用。 */
export const travelFocusRingOffset2Classes = `${travelLinkFocusClasses} focus-visible:ring-offset-2 focus-visible:ring-offset-bg-console`;

/** **13/37** 最小触摸高度 + **显式主轴**：拼在 **`text-travel-*`** 信息页 **`Link`**（`` `/help` `` FAQ、`` `/terms/community-guidelines` `` 回链、浅色分段 **`error.tsx`** 脚注三链等）上，与 **`travelFocusRingOffset2Classes`** 同串（**88** §3.5）。默认 **`justify-center`**；左对齐块级链请叠 **`!justify-start`**（如 **`/admin/users`** 表内 **`text-left`** 钮）。 */
export const touchTargetLink44Classes = "inline-flex min-h-[44px] items-center justify-center";

/** 分段 **`error.tsx`** / Admin·Governance 错误壳：尊重 **`prefers-reduced-motion`**（GO_96_16 D4/D6）。 */
export const errorBoundaryMotionSafeClasses =
  "motion-reduce:transition-none motion-reduce:animate-none";

/**
 * **`bg-market-atmosphere`** + **玻璃/青链** 内联 **`text-cyan-300`/`text-slate-300`**：**`/guides`** 列表、**`/guides/[id]`** 全页内联链、**`GuideDetailRouteSuspense`** **`fallback`**、**`MeStatsSection`** **`/market`** 链（与 **`deepShellInlineLinkFocusClasses`** 的 **`slate-950`** offset 分层）。
 * **勿**在 **`ink-*`/`bg-bg-console`** 浅色控制台混用本常量。
 */
export const marketCyanInlineLinkFocusClasses =
  "rounded-sm px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

/** **玻璃卡**（**`bg-slate-900/70`** ~ **`bg-slate-900/95`** 模态）主 **`button`/`btn-console`**：**`ring-cyan-400`** + **`ring-offset-slate-900`**（与 **`marketCyanInlineLinkFocusClasses`** 同偏移；**Escrow** **`CreateOnChainEscrowBlock`** 外区 CTA 与工厂弹层钮、**`OrderActionsBlock`**、**`EscrowTxModal`**、**`EscrowOnChainActions`**、**`ChatBlock`** **`variant=did`** **发送**；**`OrderFlowSteps`** **`variant=did`** **步骤项**）。 */
export const marketCyanPillControlFocusClasses =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

/** 深壳（**全页 `bg-slate-950*`** 或等价赛博 **`error.tsx`**）**内联** `text-cyan-300` / `text-slate-300` 链：**`me`/`disputes`/`orders`/`did-rank`/`community` `error.tsx`**；**`OnchainEventTimeline`（did）** **`tx`** **`a`**（**Escrow** 深段）。**块级 pill** 重试/回首页 → **`deepShellPillControlFocusClasses`**。 */
export const deepShellInlineLinkFocusClasses =
  "rounded-sm px-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/** 深壳 **`bg-slate-950`** 段 **`error.tsx`** 主 **`button`** / 幽灵 **`Link`**（**重试**、**回首页**）：**`ring-cyan-400`** + **`ring-offset-slate-950`**（与 **`did-rank/error`** 主 CTA 对齐）。 */
export const deepShellPillControlFocusClasses =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950";

/** Auth L5 暗壳（`/auth/login` · `/auth/register`）块级控件：暖金 ring · 勿用 cyan / `ring-offset-bg-console` */
export const authL5PillControlFocusClasses =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";

/** Auth L5 暗壳内联链 */
export const authL5InlineLinkFocusClasses =
  "rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ref-sun/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]";
