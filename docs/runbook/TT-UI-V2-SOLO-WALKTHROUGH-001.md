# TT-UI-V2-SOLO-WALKTHROUGH-001 · 单人开发 · V2 前端 UI 走查清单

> **适用**：独立维护者、**① 本地**目视与机械闸。  
> **不适用**：GitHub PR、分支合线主持人、②③ 生产 GO（见 [solo-dev-rhythm §0.a](../solo-dev-rhythm.md)、[TT-9628 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary)）。

## 0. 单人开发口径（写死）

| 说法 | 单人默认 |
|------|----------|
| 合入方式 | **`git commit` → `git push origin main`**（或你的主分支）；**不建 PR** |
| Owner / 对拍 | **本人自检**（[solo-dev-rhythm §7](../solo-dev-rhythm.md)） |
| 完成标准 | 本清单勾选 + 本地 `exit 0` 证据；**不以**远端 Actions 顶栏为唯一依据 |
| 改代码节奏 | **一类问题一批 commit**（非「一问题一 PR」） |

## 1. 启动（①）

```bat
REM 全栈（Docker + API + 前端）
scripts\start-api-with-seed.bat

REM 仅 API 已在 8080
set TRAVELTRUST_FRONTEND_ONLY=1 ^&^& scripts\start-api-with-seed.bat
```

浏览器入口：

- 首页获客：`http://localhost:3012/`
- Console 主流程：`http://localhost:3012/auth/login` → `/orders` → `/disputes` → `/help`

## 2. Hydration 报错（常见 · 非业务 bug）

| 现象 | 原因 | 处理 |
|------|------|------|
| `data-extentions-extra-ocr-id` 等 mystery 属性 | 浏览器 OCR/翻译类扩展改 DOM | 隐身窗口复测；或禁用扩展；首页氛围 `<img>` 已 `suppressHydrationWarning` |
| 日期 input 不一致 | 已改为 **UTC 默认日期**（`useLandingPage`） | 硬刷新后应消失 |
| `/traveltrust` 画质按钮文案闪一下 | 已改为 **mount 后读 localStorage** | 可忽略单次闪烁 |

## 3. 机械闸（改 UI 后必跑）

```bash
cd frontend
npx vitest run lib/marketingUi.test.ts lib/marketingUi-import-hygiene.test.ts
bash ../scripts/dev/probe-console-ui-routes.sh
```

可选：`npm run dev:warm`（减首次编译等待）。

**不**把上述等同于 93/96-20 全路由已验。

## 4. 分区（勿把 ⏸ 当漏迁）

| 分区 | 路由示例 | 标准 |
|------|----------|------|
| **获客 landing** | `/` | `TT_MARKETING_HOME_*` 暖色 Hero；**不是** `TT_MARKETING_PRODUCT_PAGE_SHELL` |
| **Console 浅壳** | `/auth/*`、`/orders`、`/disputes`、`/help`、`/me/*` | `TT_MARKETING_PRODUCT_PAGE_SHELL` / `AUTH` / `ACCOUNT` |
| **深色环境光** | `/market`、`/community`、`/guides` | 有意深色；不强行 Console 浅壳 |
| **协议叙事** | `/traveltrust` | 深色 + PH1 媒体；TT-PH1-150～158 截图另签收 |
| **admin** | `/admin/**` | 单独立项；不在产品路径收口内 |

## 5. 首页 `/` 目视标准（SSOT · 2026-05-25）

**代码真源**：[FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [`frontend/app/(home)/README.md`](../../frontend/app/(home)/README.md) · **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §2 · 单文件 `LandingHeroForm.tsx`（`#landing-hero-form`）。

| # | 检查项 | 通过标准 |
|---|--------|----------|
| H1 | 路由与页壳 | **无** `app/page.tsx`；**Ken Burns** + **`TT_MARKETING_HOME_*`** 叠层（见 **`page.tsx`**） |
| H2 | Hero 结构 | **单卡** 玻璃表单；`#landing-hero-form` 可见 |
| H3 | 数据链 | **1×** `postItineraryCreate` → **`ITINERARY_CARD_COUNT=1`** → **`landingItinerarySession` = `localStorage`**（跨 tab）→ **`getOrder`** 预览解锁（**非** 真 USDC） |
| H4 | 提交钮 | 暖金 Action（`homeMarketing.contract`） |
| H5 | 顶栏 L0 | 仅 `pathname === "/"` 点亮 Web3旅行 |
| H6 | 页脚 | 冷灰 **`TT_MARKETING_HOME_FOOTER_*`** + **`TrustInfraWall`** |
| H7 | E2E 机读 | `home-landing-shell.spec.ts` · `useLandingPage.contract.test.ts` · **GO_local_web3_itinerary_l5** |

## 5b. `/market` 数据链（与 UI 壳分开验收 · SSOT）

**代码真源**：[`frontend/app/market/README.md`](../../frontend/app/market/README.md) · **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)** §3 · **`useMarketPage.contract.test.ts`**

| # | 检查项 | 通过标准 |
|---|--------|----------|
| M1 | 路由 | **`/discover`** 重定向 **`/market`**；列表 **仅** 在本页拉 **`GET …/discover/orders`** |
| M2 | 列表 | **`useMarketPage`** · **300ms debounce** · URL 筛选 sync |
| M3 | 收藏 | **`FAV_ORDERS_KEY`** / **`FAV_GUIDES_KEY`** — **`localStorage` only**（**F-020 best-effort 已接线（①）· ② SLA**） |
| M4 | 绿集 | **`bash scripts/dev/run-web3-itinerary-l5-green.sh`** exit 0（**①**；**非 ②③ GO**） |

## 6. `/traveltrust` 首屏目视要点（TT-PH1-150～163）

| 问题 | 说明 |
|------|------|
| 只见线框地球、不见标题 | 移动端地球区曾占满视口；已 **order-1 文案在上** + 限制地球高度 |
| 底部暖棕带 | 3D `CinematicHorizonBand` 地平线光；协议页有意，非 Console 浅壳 |
| 整体偏暗 | 协议深色场域 + 全屏 WebGL；文案应在 **深色玻璃卡** 内 |

## 7. 目视记录模板（贴 commit message 或任务卡）

```
路由: /
问题类型: [坏了 | 不一致 | 拿不准]
描述: …
```

## 8. 批次记录（单人 · commit 即可）

| 批次 | 内容 | ① 状态 |
|------|------|--------|
| 1 | 机械闸 + `text-smallall` + 启动脚本对齐 | 已闭 |
| 2 | `probe-console-ui-routes` + Console HTTP 全绿 | 已闭 |
| 3 | 首页代码审计 + `TravelTrustRoleVideoPlayer`/`Header` 运行时修复 | 已闭 |
| 4 | 首页日期格/玻璃输入 `cyan-*` → `TT_MARKETING_HOME_GLASS_*` / `ref-cyan` | 已闭 |
| 5 | Hydration（扩展属性 / UTC 日期 / traveltrust 画质 toggle）+ 首屏文案 order | 已闭（请硬刷新复测） |
| 6 | **V2 构建闸**：`npm run build` exit 0；R3F `events`/`setTimeout`/import 单点修 | **已闭 ①** |
| 7 | P0 首屏 safe-area/nav z-index；P1 `TT_MARKETING_BTN_CONSOLE_*` 主链迁移 | 已闭（**目视收口进行中**） |

**当前闸（①）**：`cd frontend && npm run build` **exit 0** = V2 构建闸绿；**不**等价全站目视或 ②③。

## 9. 下一批（P0+P1 目视收口 · 范围固定）

**范围**：`/`、`/traveltrust`、`/orders`、`/pay`、`/escrow`、`/disputes`、`/me` — **不**跑 93 全矩阵；**不**改 `market`/`community`/`admin`。

1. 重启 dev → **硬刷新**（`Ctrl+Shift+R`）上列路由各一遍  
2. 红屏/控制台错误 → **按路由单点修** → 再跑 `npm run build`  
3. 首页目视 OK → 任务卡 **TT-PH1-190/191**；`/traveltrust` → **TT-PH1-150～158**  
4. ② staging 主路径冒烟 — **禁止用 ① 冒充 ③**
