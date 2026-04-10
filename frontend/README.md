# TravelTrust 前端（Next.js + DApp + 3D）

- **技术栈（旅游项目前端）**：Next.js + React + TypeScript + wagmi + viem + WalletConnect v2 + R3F + drei + Framer Motion。**旅游项目 DApp**：Next.js / React / TS（见 [06-DApp架构总览](../docs/spec/06-DApp架构总览.md)、[09-技术架构总览](../docs/spec/09-技术架构总览-v1.0.md)）。
- **运行**：在 **`frontend` 目录**执行 `npm install` 后 **`npm run dev`**（勿在 CMD 里单独输入 `dev`，否则会报 `'dev' is not recognized`）。pnpm 用户：`pnpm run dev`。后端 API 基地址通过 `NEXT_PUBLIC_API_BASE_URL` 配置。
- **开发模式耗时（读日志）**：`next dev` 是**按路由懒编译**的。日志里 **`○ Compiling /traveltrust …`** / **`✓ Compiled … (5792 modules)`** 是**第一次**点到该路由时 Webpack 在扫依赖；紧接着的 **`GET /traveltrust 200 in 2061ms`** 往往把**编译 + 渲染**算在一起，所以会出现 **2～8 秒**，**不等于**线上 TTFB。同一路由**第二次**访问通常只有 **100～250ms** 量级（依赖已进 `.next/cache/webpack`）。**换路由又变慢**：每个**尚未编译过**的 `app/.../page` 都会再走一轮「Compiling …」。**可做的**：① 测真实速度用 **`npm run build && npm run start`**；② Windows 上若可接受 Turbopack 偶发 manifest 问题，用 **`npm run dev:turbopack`** 或 **`TRAVELTRUST_DEV_TURBO=1 npm run dev`**；③ dev 起来后在**另一终端**执行 **`npm run dev:warm`**（`scripts/warm-dev-routes.mjs`），预先 GET 常用路径，减少第一次手动点顶栏的等待。`next.config.js` 里 **`experimental.optimizePackageImports`** 含 framer-motion、TanStack、**wagmi、viem**；**`experimental.staleTimes`**（dynamic/static）延长客户端路由缓存复用；**`middlewarePrefetch: 'flexible'`** 略增预取积极性。**运行时**：`Providers` 内 **`RoutePrefetcher`** 在 `requestIdleCallback` 后对主路由 `router.prefetch`；顶栏 **`NavLink`** 在 **`pointerenter`** 时再预取目标。若需关掉空闲预取（弱网/调试）：**`NEXT_PUBLIC_DISABLE_IDLE_PREFETCH=1`**。
- **故障**：若出现 **`middleware-manifest.json` MODULE_NOT_FOUND**、**`app-build-manifest.json` ENOENT** 或 **`_buildManifest.js.tmp.*` ENOENT**（Windows 上 Turbopack 长时间 HMR 易发）：关掉**所有**占用 3012 的 `node`/`next` 窗口，只保留一个 dev；执行 **`npm run clean`** 后 **`npm run dev`**。**默认（Windows）`npm run dev` 走 Webpack**（`scripts/run-dev.mjs`），减轻上述竞态；需要 Turbopack 时用 **`npm run dev:turbopack`** 或环境变量 **`TRAVELTRUST_DEV_TURBO=1`**。macOS/Linux 仍为默认 Turbopack。勿同时开两个 dev 抢同一 `frontend/.next`。
- **WalletConnect v2**：在 [cloud.walletconnect.com](https://cloud.walletconnect.com) 创建项目，将 Project ID 写入 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`（见 `.env.example`）；不设置则仅使用注入型钱包（如 MetaMask）。
- **链 ID**：`NEXT_PUBLIC_CHAIN_ID` 用于 Escrow 页与钱包组件链校验，需与后端一致（如 Polygon 137、Amoy 80002）；见 `.env.example`。
- **FeeRouter（07 §五 5.2A）**：`NEXT_PUBLIC_FEE_ROUTER_ADDRESS` 须与 Escrow 创建时的 `platformFeeRecipient`、后端 `FEE_ROUTER_ADDRESS` 一致；读取辅助见 `lib/feeRouterEnv.ts`。
- **入口**：首页 **`/`**（顶栏 **Web3旅行**，i18n **`header_web3Travel`**）。**TravelTrust 网络落地页** **`/traveltrust`**：顶栏左侧 **TravelTrust** 字标（文案硬编码）单独链入，**不在** **`<nav>`** 内重复；**全站顶栏** **白底深字**，页身 **85** 深色壳 + 粒子 + **`#overview`**（**docs/spec/85** §二 2.6；**非**代币销售）。页内 CTA 以 **`/market`** 为撮合主入口（**不**并列 **`/discover`**）。**`<nav>`** 四链：**`/`**、**`/market`**、**`/did-rank`**、**`/community`**，文案键 **`header_web3Travel` / `header_market` / `header_didRank` / `header_community`**（`locales/zh.ts`、`en.ts`）。**自由市场** **`/market`** 全页底 **`WarmRouteFieldBackdrop`**（`#14100d` + **`bg-traveltrust-atmosphere`** + **`bg-traveltrust-dot-grid`**，`MarketAmbientBackdrop`）。**DID 排行榜** **`/did-rank`** 与 **TT 社区** **`/community/*`** 同暖场底 + **静态** **`bg-scifi-gradient-static`** + 领奖台柔光（壳层**无** Three、**无**整屏网格位移动画）；真值与缺口 **[docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md](../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)**。**`/did-rank` 榜单主架**：**竖脊三签**（旅行者/向导/商家）+ **`framer-motion` 内页翻页** + **`?board=`**；**`loading.tsx` 与书壳同构**；规格 **[docs/spec/30-DID排行榜-页面规范.md](../docs/spec/30-DID排行榜-页面规范.md) §1、§6**。Landing / Footer 链 **`/market`** 的可见文案复用 **`header_market`**（**05**）。**`/discover`** → **`/market`**（无顶栏重复链）。托管 **`/escrow/[id]`** 等经订单流或深链。**`/pay`** 主入口：用户菜单；帮助 / error 等非 **`<nav>`** 可保留深链（**04 §3.4**）。**顶栏 SSOT**：[86 §6.0](../docs/spec/86-UI-双系统未来风-风格与动效技术规格.md)、[07 §二 2.3 #9](../docs/spec/07-开发流程与顺序.md)；截图差异见 [28-截图风格对照与UI深度检查](../docs/spec/28-截图风格对照与UI深度检查.md)。**`/`** 页身为 **摄影 + CSS 点阵 + 玻璃**，**无**全屏 R3F Hero（**88 §一**、**86 §6.1**）。

## 质量

- **Lint**：`npm run lint`（Next.js ESLint）
- **类型**：`npx tsc --noEmit`
- **单测**：`npm run test`（Vitest，含 `lib/api`、`lib/apiClient`、`lib/didRankUtils`、`dapp/hooks/useEscrowActions`）
- **E2E**：`npx playwright install` 后 `npm run e2e`（需先 `npm run dev` 或已启动的本地服务）
- **Epic A（治理 proposals 执行态只读 UX · A-10 收口）**：验收命令见 **[docs/runbook/Epic-A-governance-execution-ux-ladder.md](../docs/runbook/Epic-A-governance-execution-ux-ladder.md)**（§ 前端验收命令）；证据指针 **[evidence/GO_EPIC_A_GOVERNANCE_EXEC_UX_CLOSE.md](../evidence/GO_EPIC_A_GOVERNANCE_EXEC_UX_CLOSE.md)**。

## 目录

- `app/`：页面与路由（App Router）
- `components/`：通用组件与 DApp 用 Providers（Wagmi + React Query）
- `lib/`：API 客户端、auth、me、orders 等（与 04 对接）
- `dapp/`：钱包、EIP-712、txMachine、viem watchContractEvent 等（与 06 一致）
- 3D / 动效：**R3F + drei** 用于 **`/traveltrust`** 环境粒子；**`MePageBackground`** 用于 **`/me`**、**`/guide`** 等（**不**含 **`/community/me`** — 社区「我」仅用 **`community/layout.tsx`** 壳 + 玻璃卡，**88 §二**）。**`/`** 为 **摄影底 + 点阵 + 玻璃**，**非**全屏 R3F Landing（**88**、**86 §6.1**）。Framer Motion 用于页面/组件过渡。可选：`r3f-perf`、WalletConnect UI 等（见 **09** §2.5、§2.7）。
