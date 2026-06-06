# `/traveltrust` TravelTrust 网络叙事页 · 代码 SSOT

**① 本地 UI 壳：已冻结（2026-05-25）** · 五主路由互证：[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

| 层级 | 文件 |
|------|------|
| 路由薄层 | `page.tsx` → **`TravelTrustHomePageShell`** → **`TravelTrustNetworkPageMain`** · `layout.tsx` |
| 模块编排 | [`modules/traveltrust-home/README.md`](../../modules/traveltrust-home/README.md) |
| 布局锁 | `lib/traveltrustHomeLayoutLockL5.ts` — **`hero → roles → liquidity → trust → settlement → faq → start`** |
| L1 槽位 | `TravelTrustHomeLandingNavSlot` → `TravelTrustLandingChrome`（**portal → `document.body`** · `TT_Z.LANDING_CHROME` **280** · 低于 Header **300**） |
| L1 公告 | `TravelTrustPulseTicker` **`variant="inline"`** · **CSS** 跑马灯 **`globals.css`** **`.tt-traveltrust-pulse-inline-marquee-track`**（48s · 双份列表 **-50%**；`prefers-reduced-motion` → 手滑静态列表） |
| L1 公告标签对比度 | **closed ①（2026-06-03）** — 「**项目动态 · 全部 ›**」· **`TT_PULSE_TICKER_L5`** 显式 **`rgba(249,215,121,…)`** + **`globals.css`** **`[data-tt-traveltrust-pulse-label-cluster-l5]`** · **[`L1-PULSE-LABEL-CONTRAST-FREEZE`](../../evidence/GO_local_cinematic_l5_closure/L1-PULSE-LABEL-CONTRAST-FREEZE.md)** |
| L1 顶距 | `TT_MARKETING_SITE_HEADER_STICKY_OFFSET_TRAVELTRUST_L1_CLASS` — 小屏 **7.25rem**（含 mobile 四链 rail）· sm+ **4.5rem** |
| 路由 loading | `app/traveltrust/loading.tsx` — **仅顶栏细进度条**（**不**全屏 `TravelTrustHomeEntryOverlay`，避免盖住 L1） |
| L5 示意 | `TravelTrustStablecoinGateway` · `TT_STABLECOIN_GATEWAY_L5` |
| 角色剧场 | `TravelTrustHomeRolesSection` → `TravelTrustIdentityTheater`（「选择您的旅行角色」） |

**产品决策（2026-05-25）：** 角色剧场上方**不**再加独立 TT 产品介绍长文块 — Hero + handoff 文案已承担；**不**恢复 85 文档 `#overview` 四卡整节（与 layout lock 冲突）。

**规格：** [85 §二 2.6 / §三](../../../docs/spec/85-TravelTrust网络落地页-融资级设计与开发规格.md) · [88 §一](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md) · [GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md](../../evidence/GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md)

```bash
cd frontend
npx vitest run lib/traveltrustHomeLayoutLockL5.test.ts modules/traveltrust-home/traveltrustHomeModularityScore.test.ts
```

**②③：** 见 **[TRAVELTRUST-NETWORK-PHASE2-BACKLOG](../../evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md)**（**TTNET-P2-001～008** · **TTNET-P3-001～004**）· [PHASE2-TESTNET-ACCEPTANCE · 轨 9](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md)
