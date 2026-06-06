# `/` Web3 旅行首页 · Phase ② 待验 backlog（2026-06-03）

**阶段：② 测试网** — **宽轨**（**非** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) 窄 onboarding 主清单）  
**① 已闭（不重做）：** UI 壳冻结 · 1×POST · 1 预览卡 · 预览解锁 · Escrow 草稿 — [`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md)

**硬边界：** **不改** [`FIVE-MAIN-ROUTES`](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) **UI 壳**；② 仅 **数据链 / 真链 / 媒体 / staging 证据**。

---

## 总表

| ID | 清单项 | ① 状态 | ② 任务 | ③ |
|----|--------|--------|--------|---|
| **WEB3-P2-001** | 首页背景 **Phase B** 国别 MP4 + `NEXT_PUBLIC_LANDING_HOME_AMBIENT_USE_LOCAL_VIDEO=1` | Ken Burns 静图 **已闭** | **② 待验** | — |
| **WEB3-P2-002** | **`/`→解锁→Escrow 草稿→confirm** 全链在 **staging PG/API** 对拍（**非** mock-pay） | ① 本地烟测 **已闭** | **② 待验** | — |
| **WEB3-P2-003** | **测试网真 USDC** · **`/pay`** · **Escrow deposit**（`useEscrowDeposit` / 合约地址与 **04/14** 对拍） | mock-pay / chain_off **①** | **② 待验** | 主网真资金 → **③** |
| **WEB3-P2-004** | **staging E2E** 创新行程走廊（`e2e:web3-itinerary-10` 或等价 · staging `API_BASE` + Next URL） | ① Playwright **可选** | **② 待验** | — |
| **WEB3-P2-005** | **staging 全矩阵** `report.json` **`release_gate=GO`**（含 `/` 域行） | ISS-007 窄切片 **≠ GO** | **② 待验**（轨 1 · R-003） | Production GO → **③** |
| **WEB3-P2-006** | **staging 登录 + 账号态恢复 + 创单**（FIVE-MAIN ② `/` 行） | ① 本地 **localStorage + 跨 tab** **已闭** | **② 待验** | — |
| **WEB3-P2-007** | **staging `release-flow`** · `/`→Market→Orders→Escrow 导航链（**52/36 E2E**） | ① 本地结构 E2E **已建** | **② 待验** | — |
| **WEB3-P2-008** | **staging 预算/pricing** 与 `POST /itineraries` 对拍（**80 §5.3** 双轨收敛 · 后端） | ① mock 估算 **已闭** | **② 待验** | — |
| **WEB3-P2-009** | **收藏跨设备 SLA**（**`/` + `/market`** · F-020 **① 已 best-effort 接线** → ② staging 强一致 / 失败恢复策略） | ① **localStorage + 已登录 API sync** **已闭** · **P1-WB-08** | **② 待验** | 跨设备 → **③** |
| **WEB3-P2-010** | **真实 AI / pricing_service 行程生成**（替换 `generate_itinerary_mock` · **80 §8**） | ① mock 规则 **已闭** | **② 待验** | 生产 SLA → **③** |
| **WEB3-P2-011** | **Hero 文案诚实化 staging 复验**（无 Polygon/USDC 过度承诺 · i18n 与 UnlockModal 口径一致） | ① 2026-06-03 **已闭** | **② 目视** | — |
| **WEB3-P2-012** | **`resultOrderIds` / `unlockedOrderIds` 跨 tab 恢复**（`localStorage` 或 staging 账号态） | ① **localStorage + storage 事件** **2026-06-03 已闭** | **② 待验**（登录账号态 SSOT） | **③** 账号态 SSOT |

**① 2026-06-03 数据链补强（非 UI）：** 刷新后已解锁卡 **`getOrder` 回填** · **收藏 localStorage ↔ market 同步** · **result/unlock localStorage + 跨 tab（`localStorageJson` · `subscribeLandingItineraryStorage`）** · Hero **→ `/market?country=&city=&days=`（精确 1–30）** · **Hero i18n 诚实化** · mock 行程 **`content_images`** — 见 [`landingItinerarySession.ts`](../../lib/landingItinerarySession.ts) · [`marketFavoritesStorage.ts`](../../lib/marketFavoritesStorage.ts) · [`landingItineraryHydrate.ts`](../../lib/landingItineraryHydrate.ts) · [`landingMarketDeepLink.ts`](../../lib/landingMarketDeepLink.ts) · [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md) · [`app/(home)/README.md`](../../app/(home)/README.md) · `generate_itinerary_mock`。

---

## 逐项说明

### WEB3-P2-001 · Phase B 背景视频

| 项 | 内容 |
|----|------|
| **真源** | [`public/media/landing/README.md`](../../public/media/landing/README.md) · `lib/landingHomeAmbientVideo.ts` |
| **② 完成标准** | 十国 MP4 入库 · env 开启 · 失败回退 Ken Burns · **无** UI 结构改版 |
| **证据** | `evidence/GO_phase2_testnet_20260526/web3-home/`（待建）· 目视 + 可选短视频截图 |

### WEB3-P2-002 · staging 创新行程 API 全链

| 项 | 内容 |
|----|------|
| **① 对照** | `bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh` |
| **② 完成标准** | 同一脚本（或 staging 变体）对 **`R003_API_BASE` + staging DB** **exit 0**；`P3_CHAIN_OFF=0` 或 staging 链配置按 **04 §3.4** |
| **依赖** | G-2 staging HTTPS · 测试网合约/registry（**TT-9630**） |
| **证据** | `TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK (② staging)` 日志 |

### WEB3-P2-003 · 测试网真 USDC / Escrow deposit

| 项 | 内容 |
|----|------|
| **范围** | [`/pay`](../../app/pay/README.md) · [`EscrowDetail`](../../components/escrow/EscrowDetail/README.md) 链上写 · **非** 首页 UnlockModal 真扣款 |
| **② 完成标准** | staging 钱包 **deposit** 成功 · 订单 **`hasEscrow`** · indexer/投影与 **GET /orders/:id** 一致 |
| **③** | 主网 **`CHAIN_RPC_URL`** · 真资金 Escrow — [PHASE2-START-CHECKLIST §7](../../../docs/runbook/PHASE2-START-CHECKLIST.md) |
| **证据** | 链 tx hash + API 对拍 JSON（脱敏） |

### WEB3-P2-004 · staging E2E 走廊

| 项 | 内容 |
|----|------|
| **① 对照** | `npm run e2e:web3-itinerary-10` · [`run-enterprise-local-10.sh`](../../../scripts/dev/run-enterprise-local-10.sh) |
| **② 完成标准** | staging Next + staging API 跑通 **1 spec**（或 enterprise-10 staging 变体）**exit 0** |
| **证据** | Playwright report 路径写入 `evidence/GO_phase2_testnet_20260526/web3-home/` |

### WEB3-P2-005 · R-003 staging 全矩阵 GO

| 项 | 内容 |
|----|------|
| **真源** | [PHASE2-TESTNET-ACCEPTANCE · 轨 1](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) · `run_r003_staging_evidence_chain.py` |
| **② 完成标准** | `environment.name=staging` + **`release_gate=GO`**（**非** `PARTIAL_GO`） |
| **诚实边界** | 窄切片 43 锚全过 **仍** 可能 `PARTIAL_GO` — 见 [`evidence/GO_local_r002_verify/README.md`](../../../evidence/GO_local_r002_verify/README.md) |

### WEB3-P2-006 · staging 登录 / session / 创单

| 项 | 内容 |
|----|------|
| **真源** | [`landingItinerarySession.ts`](../../lib/landingItinerarySession.ts) · [`useLandingPage.ts`](../../components/landing/useLandingPage.ts) · FIVE-MAIN §② **`/`** 行 |
| **② 完成标准** | staging 账号登录后 **1×POST** + **服务端/账号态恢复**（跨设备 SSOT）+ 预览卡仍 **1 张** · API 与 **04** 对拍 · ① 已用 **localStorage** 作客户端缓存 |
| **诚实边界** | **UnlockModal 仍非真 USDC 扣款**（① 产品口径）；真付走 **WEB3-P2-003** `/pay` |

### WEB3-P2-007 · staging release-flow 首页导航链

| 项 | 内容 |
|----|------|
| **真源** | [`e2e/release-flow.spec.ts`](../../e2e/release-flow.spec.ts) · FIVE-MAIN §② **`release-flow` 首页路径** |
| **② 完成标准** | staging HTTPS Next 上 **「Landing → Market → Orders → Escrow」** spec **exit 0**（**非** 真 deposit/release） |
| **与 P2-004 分工** | P2-004 = 创新行程全链；P2-007 = 发版结构导航链 |

### WEB3-P2-008 · staging 预算/pricing 对拍

| 项 | 内容 |
|----|------|
| **真源** | **80 §5.3** 预算双轨 · `generate_itinerary_mock` ↔ 前端预算展示 |
| **② 完成标准** | staging **`POST /itineraries`** 响应金额与 UI 预览卡 **同一 SSOT**（`pricing_core` 或等价收敛） |
| **诚实边界** | **Live Quote / Import Quote 页** = **80 Phase 2 独立项**，**不**在本页 UI 壳范围 |

---

## ③ 明确不在 ②（勿混入）

| ID | 项 |
|----|-----|
| **WEB3-P3-001** | 生产 PSP / `sk_live_` |
| **WEB3-P3-002** | 主网真资金 Escrow · Ethereum Mainnet cutover |
| **WEB3-P3-003** | [`go-live-checklist`](../../../docs/go-live-checklist.md) Production GO · TT-MAINNET G0～G6+SL |
| **WEB3-P3-004** | **Escrow 链上 SSOT 演练**（go-live **§4.5** · TT-RELEASE-GATE-ESCROW-SSOT-014）· 创新链下游 |
| **WEB3-P3-005** | **公网 Stripe/webhook** 生产回调（与 **WEB3-P3-001** PSP 同批验收） |
| **WEB3-P3-006** | **`/` · `/market` 收藏跨设备同步** · 生产 **`/me`** 持久化与 GDPR 删除 |

---

## 不在本页 ②/③ 单列（全站或其它 Phase · 勿混入）

| 项 | 阶段 | 说明 |
|----|------|------|
| **UnlockModal 真 USDC 扣款** | — | ① 产品 **不做**；真付走 **P2-003** `/pay` |
| **80 Live Quote / Import Quote 页** | 80 Phase 2 | 独立功能，非 `/` UI 壳 |
| **80 RAG / pricing_service 全量** | 80 Phase 2/3 | 平台级，见 **80 §8** |
| **云朵/粒子 Hero 动效** | — | FIVE-MAIN **明确不做** |

---

## 互指

| 文档 | 用途 |
|------|------|
| [`WEB3-PAGES-PHASE1-INVENTORY.md`](./WEB3-PAGES-PHASE1-INVENTORY.md) | ① 总表 #1 `/` |
| [`app/(home)/README.md`](../../app/(home)/README.md) | 代码 SSOT · 三阶台账 |
| [PHASE2-ENTERPRISE-GAP-AUDIT §3.8](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md) | 企业缺口审计 |
| [PHASE2-TESTNET-ACCEPTANCE · 轨 8](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md) | 宽 ② 执行顺序 |
