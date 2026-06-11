# TT-B312 · 五主路由壳层 Loading / Empty 与 88 / 86 矩阵差分审计

**卡号**：`TT-B312-88-FIVE-ROUTES-SHELL-UX-MATRIX-AUDIT-001` · **母表** `B-312`  
**日期**：2026-04-15  
**范围**：顶栏五主路由 **`/`**、**`/traveltrust`**、**`/market`**、**`/did-rank`**、**`/community/*`** 的**壳层**（layout + 段级 `loading.tsx` 与 Suspense 边界）相对 **[88 §一 / §1.1](../spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)** 与 **[86](../spec/86-UI-双系统未来风-风格与动效技术规格.md)** **§6.0.1** 的**只读**差分。**① UI 壳冻结（2026-05-25）** 真源 **[FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)**。**`/` · `/market*` 四页 ① 数据链**（debounce · **`localStorage`** · **F-020 best-effort → ② SLA**）**非本卡范围** — **[LANDING-MARKET-PAGES-CODE-SSOT](../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md)**。

**只读依据文件（本轮 ≤8）**：`88` 文首表、`86` §6.0.1 矩阵与 `loading.tsx` 备注、`frontend/app/(home)/loading.tsx`、`traveltrust/loading.tsx`、`market/loading.tsx`、`did-rank/loading.tsx`、`community/loading.tsx`、`CommunityRouteShell.tsx`（壳层叠层与 Tab）。

---

## 1. 真值锚（88 / 86）

| 维度 | 88 | 86 §6.0.1（与矩阵备注） |
|------|----|-------------------------|
| 五路由页身叠层 | **§一** 表：各路由主文件与 podium / scifi / vignette / `WarmRouteFieldBackdrop` / `MarketAmbientBackdrop` 等 | **C 列** 与各域 **A** 一致；**`/discover`** 为 **`→/market` 重定向壳**（**无**独立列表 UI） |
| `loading.tsx` | 以各路由 `loading` 与 **88** 叙述互证 | **骨架 / pulse / skeleton**；**不**承载 **86** 营销级粒子或地球；**分段 `error.tsx`** 随域 |

---

## 2. Loading 壳层差分矩阵（代码 ↔ 88 ↔ 86）

| 路由 | 88 §一 / §1.1 壳层要点 | 86 对 `loading` 的约束 | 实现（段 `loading.tsx` + 上级 layout） | 差分结论 |
|------|------------------------|-------------------------|----------------------------------------|----------|
| **`/`** | 成功态：**Ken Burns** + vignette + **`bg-web3-dot-grid`**（轻点阵） | 仅骨架，禁营销级粒子/R3F | **`(home)/loading.tsx`**：固定 `slate-900` + 暗遮罩 + **玻璃卡片**骨架；**无** Ken Burns 层、**无** `bg-web3-dot-grid` | **可接受差分**：符合 **86**「loading 不承载全量 Experience 装饰」；若产品要强对齐 **88** 视觉连续，可选后续在 loading 内加**静态**低对比点阵（**非**动画），须单开实现 TT + **07** 口径 |
| **`/traveltrust`** | `#14100d` + `TravelTrustAmbientCanvas` + 点阵氛围（**layout**） | 同上 | **`traveltrust/layout.tsx`** 已铺 `#14100d`、`bg-traveltrust-atmosphere`、点阵、Canvas；**`traveltrust/loading.tsx`** 仅在 **z-20** 子树内玻璃块骨架 | **一致**：壳在 layout，loading 不重复 Canvas，符合 **86** |
| **`/market`** | **`MarketAmbientBackdrop`**（`WarmRouteFieldBackdrop` + 弱叠层） | 同上 | **`market/loading.tsx`**：`MarketAmbientBackdrop` + 居中玻璃骨架 | **一致** |
| **`/did-rank`** | `#14100d` + **WarmRoute** + podium **0.42** / scifi-static **0.80** / vignette **0.55**（**§1.1**） | 同上 | **`did-rank/loading.tsx`**：`WarmRouteFieldBackdrop` + 与 **88 §1.1** 同数值叠层 + 榜单骨架组件 | **一致** |
| **`/community/*`** | 壳：**`community/layout` → `CommunityRouteShell`**，WarmRoute + podium **0.32** / scifi **0.75** / vignette **0.48**；L1 Tab 在壳内 | 同上；骨架不替代壳 | **`CommunityRouteShell`** 内联 **88** 叠层序与透明度；**`community/loading.tsx`** 仅为 **Feed 首屏形**骨架（注释写明**仅** `/community` 首页段；子路由另有 `loading`） | **一致**：暖场与 Tab **不**在 `loading.tsx` 重复实现，由 **Shell** 承载，符合分层 |

---

## 3. Empty（壳层口径）

| 项 | 结论 |
|----|------|
| **定义** | 本卡 **Empty** 指「路由级无内容壳」：五主路由均**无**独立 `not-found` 替代壳与 **88** 冲突；业务空列表 / 空 Feed 等属 **88 §3.2** 与各 `page.tsx`，**不在**本轮 8 文件证据包内逐条核验。 |
| **登记** | 若需 **「五主路由首页级 Empty 组件与 88 §3.2 逐条对拍」**，建议另开 **B-xxx / TT**（避免与 **B-347** 五主路由断点审计糊成一张；互证 **from-stash** **§TT-B336-B365** 互指段）。 |

---

## 4. 索引与母表

- **母表**：[`docs/任务母表.md`](../任务母表.md) **B-312**  
- **执行索引**：[`docs/AI任务卡索引.from-stash.md`](../AI任务卡索引.from-stash.md) 一览 **322** · **`### TT-B312-88-FIVE-ROUTES-SHELL-UX-MATRIX-AUDIT-001`**

---

## 5. 验收（本卡）

- 上表 **五路由 Loading** 行均已填 **差分结论** 且与 **88 / 86** 可复核。  
- **未** 修改任何 `frontend/app/**/page.tsx` 业务逻辑（本轮 **0** 实现 diff）。
