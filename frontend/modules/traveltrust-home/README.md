# TravelTrust 营销首页模块（`modules/traveltrust-home`）

**① 本地 UI 壳：已冻结（2026-05-25）** · 路由 `app/traveltrust/page.tsx` · 五主路由：[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

**IA（layout lock · 勿静默改序）：** `hero → liquidity → trust → settlement → roles → faq → start`。**顶栏目录与公告不动。** 角色剧场（「选择您的旅行角色」）**上方不**再加独立 TT 产品介绍长文块 — Hero + `traveltrust_theater_handoff_line` 已承担；**不**恢复 85 文档 `#overview` 四卡整节（2026-05-25 产品决策）。

企业级满分分层：**编排 / 节边界 / 入口闸在模块内**；**叙事 UI 在 `cinematic`**；**样式 SSOT 按域拆分在 `lib/traveltrust/l5`**。

## 分层

| 层 | 目录 | 职责 |
| --- | --- | --- |
| **core** | `core/` | 里程碑、预取、常量（真源在 `lib/traveltrust/home`） |
| **context** | `context/` | `HomeEntryGateProvider` + `HomeEntryBridgeProvider` |
| **hooks** | `hooks/` | Composer 生命周期、里程碑 hook |
| **sections** | `sections/` | Hero / WebGL / BelowFold 编排 + **per-section dynamic** |
| **presentation** | `presentation/` | Shell、Composer、Dynamics / Overlays / MainColumn |
| **app** | `app/traveltrust/` | 路由薄层（`page` / `layout` / re-export Main） |
| **cinematic** | `components/traveltrust/cinematic/` | 区块实现（**禁止** import `@/modules/traveltrust-home`） |
| **tokens** | `lib/traveltrust/l5/` | 14 域 L5 token |
| **page-scene** | `cinematic/page-scene/` | 3D 子模块 |
| **home lib** | `lib/traveltrust/home/` | entryBridge、cinematic-bridge、BelowFoldShell、契约、目视 QA |

## 依赖方向

```
app → modules/traveltrust-home → @/lib/traveltrust/home/cinematic-bridge → cinematic
cinematic → lib/traveltrust/home (bridge + BelowFoldShell + constants)
modules/traveltrust-home → lib/traveltrust/l5
```

## 模块化评分

自动化门禁：**16/16**（`traveltrustHomeModularityScore.test.ts`；勿写成 14/16）

| 类别 | 维度 |
| --- | --- |
| 边界 | entry-bridge、route-thin、section-boundaries、per-section-wrappers、section-marker-ssot |
| 样式/3D | l5-domains、page-scene、l5-resolvers、monolith-facade、globe-entrance |
| 编排 | section-registry、layout-lock、below-fold-shell-ssot、below-fold-narrative-ssot |
| 质量 | visual-qa-code-evidence、visual-qa-e2e-manifest |
| UI 归属 | section-ui-slot（`sections/ui`） |

布局锁：`TT-TRAVELTRUST-HOME-LAYOUT-LOCK-2026-08-v12-ttg-l5-craft`

P1 e2e：`npm run e2e:traveltrust-home-modular-qa`（需 `:3012`）

## 入口闸

- 首次进入 `/traveltrust`：`TravelTrustHomePageShell`
- 跳过：`?tt_no_gate=1` 或 session 已完成
- 预取：`TravelTrustHomePrefetchBoot` + `registry` critical loaders

## 契约测试

- `traveltrustHomeArchitecture.test.ts`
- `traveltrustHomeModularityScore.test.ts` — **16/16**（与上文「模块化评分」表一致）
- `traveltrustHomeBelowFoldContract.test.ts`
- `traveltrustHomeVisualQa.test.ts` — 清单 ↔ 代码锚点
- `traveltrustHomeLayoutLockL5.test.ts`（lib）
- `app/traveltrust/traveltrustNetworkPage.contract.test.ts`

## L1 / L0（① 视觉冻结 · 2026-05-26 文档对代码）

| 项 | 真源 |
|----|------|
| **L1 壳** | `presentation/TravelTrustHomeLandingNavSlot.tsx` — **fixed** + **createPortal(..., document.body)**（脱离 `#main-content z-0`，避免 Header **z-300** 盖住公告） |
| **L1 内容** | `TravelTrustLandingChrome` — **双行常驻**：上行 LIVE + 章节 nav + 减特效；下行 **「项目动态」** + `TravelTrustPulseTicker` inline |
| **公告滚动** | `TravelTrustPulseTicker` + **`TT_PULSE_TICKER_L5.inlineMarqueeTrackClass`** → **`globals.css`** **`@keyframes tt-traveltrust-pulse-inline-marquee`**（**48s** · 勿依赖 Tailwind `animate-*` JIT）；悬停 **暂停**；系统减动效 → **`inlineStaticListClass`** 手滑 |
| **公告标签对比度** | **closed ①（2026-06-03）** — 左簇「项目动态 · 全部 ›」· portal 暗底可读 · **[`L1-PULSE-LABEL-CONTRAST-FREEZE`](../../evidence/GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md)** |
| **入口闸** | `HomeEntryGateProvider` — **仅预取/里程碑**；**不** `setGateOpen(true)` 全屏遮罩 |
| **路由 loading** | `app/traveltrust/loading.tsx` — 顶栏 **`z-[400]`** 细线，**非** 全屏入口 overlay |
| **L0** | `headerNavItemIsActive` — **`/traveltrust` 不点亮「Web3旅行」** |

证据：**[`GO_local_marketing_front_closure`](../../evidence/GO_local_marketing_front_closure/README.md)** · **[FIVE-MAIN-ROUTES](../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)**

## Dev 注意

删除 `cinematic-bridge` compat shim 后，若 chunk 报错：删除 `frontend/.next` 并重启 `next dev`。
