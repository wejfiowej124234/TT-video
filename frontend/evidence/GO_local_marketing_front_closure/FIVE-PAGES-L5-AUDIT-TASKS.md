# 五页 L5 真实实现审计任务清单（Web3旅行 · 自由市场 · 排行榜 · TT社区）

**阶段口径：** **① 本地** → **② 测试网** → **③ 公网/生产**（须顺序递进，禁止跳阶 GO）

**审计范围（顶栏四链 + 市场子站）：**

| 用户说法 | 路由 |
|----------|------|
| Web3旅行 | **`/`** |
| 自由市场 | **`/market`** · **`/market/provider`** · **`/market/acquisition`** |
| 排行榜 | **`/did-rank`** |
| TT社区 | **`/community/*`** |

**冻结 SSOT：** [FIVE-MAIN-ROUTES-PHASE1-FREEZE](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [LANDING-MARKET-PAGES-CODE-SSOT](../GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) · [DID-RANK-PHASE1-FREEZE](./DID-RANK-PHASE1-FREEZE.md) · [COMMUNITY-PHASE1-FREEZE](./COMMUNITY-PHASE1-FREEZE.md)

**分册详表：** 排行榜 + 社区细项见 **[DID-RANK-COMMUNITY-L5-AUDIT-TASKS](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md)**（**P1-DR-*** · **P1-CM-***）

---

## ① 本地 · 已收口（2026-06-03）

### Web3旅行 `/` + 自由市场

| ID | 项 | 状态 | 真源 / 验收 |
|----|-----|------|-------------|
| **P1-WB-01** | 1× `postItineraryCreate` · `ITINERARY_CARD_COUNT=1` | **已闭** | `useLandingPage.ts` · `homeMarketing.contract.test.ts` |
| **P1-WB-02** | 预览解锁 → `getOrder`（**非**真 USDC） | **✅ 完成 · ① 诚实机读** | `UnlockModal` · 真 USDC → **②** L-001 |
| **P1-WB-03** | `localStorage` 恢复 + 跨 tab | **已闭** | `landingItinerarySession.ts` |
| **P1-WB-04** | Hero→Market `country/city/days` 深链 | **已闭** | `landingMarketDeepLink.ts` |
| **P1-WB-05** | `/market` discover/guides + **300ms debounce** + URL 同步 | **已闭** | `useMarketPage.ts` |
| **P1-WB-06** | 绑定向导/接单/自定义行程写链 | **已闭** | `useMarketPageAcceptAndItineraryDeepLinks.ts` |
| **P1-WB-07** | 子站 PG listings + demo 降级披露 | **已闭** | `useMarketStandaloneBusinessPage.ts` |
| **P1-WB-08** | **F-020** 收藏 · localStorage SSOT + 已登录 API 同步 | **已闭** | `marketTravelBookmarksSync.ts` · `data-tt-*-favorites-mode` |
| **P1-WB-09** | **F-020 文档/SSOT 对拍**（消除「FE 未接线」漂移） | **已闭** | `app/market/README.md` · `LANDING-MARKET-PAGES-CODE-SSOT.md` |
| **P1-WB-HON** | Web3/市场 ① 诚实机读 contract | **已闭** | `lib/web3PagesPhase1DataHonesty.contract.test.ts` |

**① 诚实边界（非 bug · ②/③）：** [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](../GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md) **L-001～011**

### 排行榜 + TT 社区

**P1 全表见 [DID-RANK-COMMUNITY-L5-AUDIT-TASKS §①](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md)**（含 **P1-DR-22** · **P1-DR-12** · **P1-CM-ACT-03** · **P1-CM-EXP-02** · **P1-CM-HON-01** 等 2026-06-03 补闭项）。

**文档↔代码（2026-06-03）：** [FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603](./FIVE-PAGES-ENTERPRISE-CODE-AUDIT-20260603.md)（**十维矩阵 · AF-01～13**）· [FIVE-MAIN §文档同步清单](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) · [31 v2.13](../../../docs/spec/31-TT社区页面设计.md) · [30 v2.2.3](../../../docs/spec/30-DID排行榜-页面规范.md) — **以仓库实现为准**，**① 绿 ≠ ②③ GO**。

---

## ① 验收命令

```bash
# Web3旅行 + 市场 + escrow 走廊
bash scripts/dev/run-web3-itinerary-l5-green.sh

# 排行榜
bash scripts/dev/run-did-rank-l5-green.sh

# TT 社区
bash scripts/dev/run-community-l5-green.sh

# 五主 UI 并集
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
```

---

## ② 测试网 · 待办（勿在 ① 实施/宣称 GO）

| 域 | SSOT | 代表 ID |
|----|------|---------|
| **`/`** | [WEB3-HOME-PHASE2-BACKLOG](../GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) | **WEB3-P2-001～012**（真 USDC · AI · 账号态 · **WEB3-P2-009** 收藏跨设备 SLA） |
| **市场三页** | [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG](../GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) | **MKT-FILT-P2-001～014** · **MKT-FILT-P2-009** |
| **排行榜** | [DID-RANK-COMMUNITY-L5-AUDIT-TASKS §②](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) | **P2-DR-03～16** |
| **TT社区** | 同上 §② | **P2-CM-01～18** · **COM-②-4～8**（[COMMUNITY-PHASE-2-3-ROADMAP](./COMMUNITY-PHASE-2-3-ROADMAP.md)） |
| **总闸** | [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) | **G-0～G-4** · **P2-CROSS-01** |

**② 入口闸：** G-0～G-4 清零后再开工。

---

## ③ 公网 / 生产 · 待办

| 域 | SSOT | 代表 ID |
|----|------|---------|
| **`/` + 市场** | WEB3-HOME · MARKET-SUBSITE backlog | **WEB3-P3-*** · **MKT-FILT-P3-*** |
| **排行榜 + 社区** | [DID-RANK-COMMUNITY-L5-AUDIT-TASKS §③](./DID-RANK-COMMUNITY-L5-AUDIT-TASKS.md) | **P3-DR-*** · **P3-CM-*** · **P3-INFRA-*** |
| **go-live** | [go-live-checklist](../../../docs/go-live-checklist.md) | Production GO 单独闸 |

---

## 读法

- **① 已闭** = UI 壳冻结 + API 主路径 + 诚实空态/披露 + **`data-tt-*` 机读** + 绿集 **exit 0**。
- **②** = 产品真值、staging 密度、宽 E2E、真 UGC/geo/通知、榜口径、**F-020 跨设备 SLA**。
- **③** = 链上、生产 PSP/CDN、公网 GO。
- **禁止**用 ① showcase/devPreview/mock 行程/示意奖池 冒充 ②③ GO（[CONTRIBUTING · 禁止假完成](../../../CONTRIBUTING.md#no-false-completion)）。

---

## ① 收口声明（2026-06-03 · 五页 P1 全闭）

**Web3旅行 + 自由市场（含子站）+ 排行榜 + TT 社区：** ① 表内 **P1-WB-*** · **P1-DR/Cm**（分册）均已 **已闭**。**②③** 仅入上表索引与分册 backlog，**未在本阶段实施**。
