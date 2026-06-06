# Web3 页面 · Phase ① 总清单（确认 / 检查 / 收口 / 冻结）

**阶段：① 本地** · **盘点日：2026-06-03** · **ACTIVE**

**四页代码/UI 真源：** [`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md)（**以 `frontend/` 现码为准**）

**口径：** 「Web3 页面」= **13-1 表 2** 中 **Trust Console / Governance / 链上操作** 及 **创新行程 → Escrow → Pay** 主链；**五主路由** 含 Web3 叙事但 UI 冻结 SSOT 见 **FIVE-MAIN**（本表只列交叉绿集）。

---

## 总表

| # | 路由 | 产品职责 | UI 冻结 | ① 收口 | 绿集 / 烟测 | 今日检查 |
|---|------|----------|---------|--------|-------------|----------|
| 1 | `/` | Web3 旅行 Landing · 1× 行程 · 解锁 → Escrow | **五主 UI 已冻** + 数据链 [`(home)/README`](../../app/(home)/README.md) | [`GO_local_web3`](../GO_local_web3_itinerary_l5/README.md) | `run-web3-itinerary-l5-green.sh` | ✅ 2026-06-03 exit 0 |
| 2 | `/traveltrust` | 网络叙事 L1 | **五主 UI 已冻** | FIVE-MAIN | `five-main-routes-ui-antiregression-gate.sh` | ✅ 2026-06-03（契约对拍后） |
| 3 | `/market` | 撮合 · Escrow 角标 | **五主 UI 已冻** | MARKET-L5-CLOSURE | web3 绿集含 Market 契约 | ✅ 含于 web3 绿集 |
| 4 | `/did-rank` | 排行 · 治理奖励叙事 | **五主 UI 已冻** | FIVE-MAIN | 五主闸 | ✅ 2026-06-03 |
| 5 | `/community/*` | UGC · DID 徽章 | **五主 UI 已冻** | COMMUNITY-L5-CLOSURE | 五主闸 | ✅ 2026-06-03（仅契约对拍 · 无 UI 改动） |
| 6 | `/escrow/[id]` **草稿** | Experience 暖壳 | **UI 已冻** [`ESCROW-DRAFT-EXPERIENCE-FREEZE`](../GO_local_web3_itinerary_l5/ESCROW-DRAFT-EXPERIENCE-FREEZE.md) | [`ESCROW-ORDER-PAGE-PHASE1-CLOSURE`](../GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md) | web3 绿集 | ✅ 2026-06-03 |
| 7 | `/escrow/[id]` **已上链** | 协议 DID 壳 · deposit/release | **未 UI 冻结** | 维护期 | `escrowProtocolUi` · orders 绿集 | ⚠️ 见 [`ESCROW-ONCHAIN-RATE-STATUS`](./ESCROW-ONCHAIN-RATE-STATUS.md) |
| 8 | `/escrow/[id]/rate` | 行程评分 | **未收口** | 53-S8 维护 | 无独立 freeze 绿集 | ⚠️ 同上 |
| 9 | `/orders` · `/orders/new` | 订单列表 / 新建 | L5 维护（非五主） | [`GO_local_orders_l5`](../GO_local_orders_l5/README.md) | `run-orders-l5-green.sh` | ✅ 2026-06-03 |
| 10 | `/pay` | 支付 Hub · mock-pay / 钱包 | **Phase ① 收口** [`PAY-HUB-PHASE1-CLOSURE`](./PAY-HUB-PHASE1-CLOSURE.md) | 同左 | orders 绿集 · `payHubL5` | ✅ 2026-06-03 |
| 11 | `/staking` | 向导/商家质押 · Registry | **Phase ① 收口** [`STAKING-PHASE1-CLOSURE`](./STAKING-PHASE1-CLOSURE.md) | 同左 | 结构对拍 · 无独立 vitest 闸 | ✅ 文档收口 |
| 12 | `/governance` | Hub | **数据链维护**（非五主禁改表外） | [`GOVERNANCE-PAGES-PHASE1-CLOSURE`](./GOVERNANCE-PAGES-PHASE1-CLOSURE.md) | `governance-matrix-local-gate.sh` | ✅ 2026-06-03 |
| 13 | `/governance/proposals` · `[id]` | 提案列表/详情 | 同上 | 同上 | C-GOV-002/003 | ✅ |
| 14 | `/governance/delegate` | 委托 | 同上 | 同上 | C-GOV-005 | ✅ |
| 15 | `/governance/params` | 参数只读 | 同上 | 同上 | C-GOV-011 | ✅ |
| 16 | `/governance/fee-routes` | Fee 路由事件 | 同上 | 同上 | C-GOV-007 | ✅ |
| 17 | `/governance/vault-forwards` | Vault forwards | 同上 | 同上 | C-GOV-008 | ✅ |
| 18 | `/governance/distribution-accruals` · `[id]` | 应计只读 | 同上 | 同上 | C-GOV-009 | ✅ |
| 19 | `/governance/distribution-claim` | 钱包 Claim | 同上 | 同上 | C-GOV-010 | ✅ |
| 20 | `/guide/register` | 向导入驻 · 钱包验签 | **UI 已冻** | [`GUIDE-REGISTER-UI-FREEZE`](../GO_local_auth_l5/GUIDE-REGISTER-UI-FREEZE.md) | guideRegister* vitest | ✅ 2026-06-03 |
| 21 | `/provider/register` | 商家 KYB | **UI 已冻** | [`PROVIDER-REGISTER-UI-FREEZE`](../GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) | providerRegister* | ✅ 2026-06-03 |
| 22 | `/steward/register` | 主理人入驻 · stake | **UI 已冻** | [`STEWARD-REGISTER-UI-FREEZE`](../GO_local_steward_register_closure/STEWARD-REGISTER-UI-FREEZE.md) | stewardRegister* | 文档已冻 |
| 23 | `/me/identities` | 多重身份 Hub | **UI 已冻** | [`ME-IDENTITIES-UI-FREEZE`](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) | meIdentitiesPage | Hub 已冻 |
| 24 | `/market/acquisition` | 旅行收购 · bond | **子站** 筛选+数据链 **① 已闭** · Hub 卡 UI 冻于 **`/me/identities`** | [`market/acquisition/README`](../../app/market/acquisition/README.md) | acquisitionL5* | ✅ 2026-06-03 |
| 25 | `/market/provider` | 商家橱窗 | **子站** 筛选+Studio 门闸 **① 已闭**（**非** MARKET-L5） | [`market/provider/README`](../../app/market/provider/README.md) | marketSubsiteFilters* | ✅ 2026-06-03 |

---

## 今日机读留痕（2026-06-03 · ①）

| 命令 | 结果 |
|------|------|
| `bash scripts/dev/run-web3-itinerary-l5-green.sh` | **exit 0**（修复 `useLandingPage.contract.test.ts` ↔ `itineraries.rs` 对拍后） |
| `bash scripts/dev/run-orders-l5-green.sh` | **exit 0** |
| `bash scripts/gates/governance-matrix-local-gate.sh` | **exit 0** |
| `guideRegisterUiFreeze` · `providerRegisterL5` · `acquisitionL5*` | **exit 0** |
| `bash scripts/gates/five-main-routes-ui-antiregression-gate.sh` | **exit 0**（`communityPageTheme` · `communityMainPathRg` 契约对拍 · **无 UI 改动**） |

---

## 诚实边界（禁止假完成）

| 可宣称（①） | 禁止冒充 |
|-------------|----------|
| 上表「UI 已冻 / Phase ① 收口」页 + 绿集 exit 0 | ② staging 全矩阵 `GO` |
| mock-pay · chain_off 验签 · 治理矩阵契约切片 | ③ 主网真 USDC / Production GO |
| 草稿 Escrow Experience 已封口 | 已上链 Escrow 壳 / `/rate` 已 UI 冻结 |

**② 开工：** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · **① 剩余诚实清单：** [WEB3-LANDING-MARKET-LOCAL-REMAINING](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md) · **`/` ②：** [WEB3-HOME-PHASE2-BACKLOG](./WEB3-HOME-PHASE2-BACKLOG.md) · **三页筛选 ②/③：** [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md)

---

## ① 本地剩余（`/ ` + 自由市场三页 · 2026-06-03）

**SSOT：** [`WEB3-LANDING-MARKET-LOCAL-REMAINING.md`](./WEB3-LANDING-MARKET-LOCAL-REMAINING.md)

| 类别 | 代表项 | 说明 |
|------|--------|------|
| **产品口径** | 预览解锁 · mock 行程 · mock bond · cap 200 | **非 ① bug**；能力在 **②/③** backlog（**F-020 FE ① 已接线** · **②** 跨设备 SLA） |
| **架构限制** | `/market` 客户端 facet/天数/排序 · nil-guide 抢单 | **②** MKT-FILT-P2-008/011/012 |
| **小缺口** | ~~result/unlock sessionStorage~~ **① 已 localStorage+跨 tab** · 向导收藏 market-only（设计） | **②** WEB3-P2-012 账号态 |

**本四页 ① 数据链修补已闭**；上表为诚实边界，**不**阻塞 Phase ① 封版绿集。

---

## `/` · Web3 旅行（顶栏「Web3旅行」· #1）

| 项 | 结论 |
|----|------|
| **① 收口 / UI 冻结** | **是** |
| **代码 SSOT** | [`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md) §2 · [`app/(home)/README`](../../app/(home)/README.md) |
| **②/③ 任务** | [`WEB3-HOME-PHASE2-BACKLOG`](./WEB3-HOME-PHASE2-BACKLOG.md) |

| ID | 未完成项 | 阶段 |
|----|----------|------|
| WEB3-P2-001 | Phase B 背景视频 | **②** |
| WEB3-P2-002 | staging 创新行程 API 全链 | **②** |
| WEB3-P2-003 | 测试网真 USDC · `/pay` · Escrow deposit | **②** |
| WEB3-P2-004 | staging E2E 走廊 | **②** |
| WEB3-P2-005 | staging 全矩阵 R-003 GO | **②** |
| WEB3-P2-006 | staging 登录 + session + 创单 | **②** |
| WEB3-P2-007 | staging release-flow 导航链 | **②** |
| WEB3-P2-008 | staging 预算/pricing 对拍 | **②** |
| WEB3-P2-009 | 收藏服务端 API | **②** · **③** WEB3-P3-006 |
| WEB3-P2-010 | 真实 AI 行程生成 | **②** · **③** |
| WEB3-P2-011 | Hero 文案 staging 目视 | **②** |
| WEB3-P2-012 | result/unlock 跨 tab（① localStorage）· 账号态 | **②** · **③** |
| WEB3-P3-001～006 | 生产 PSP · 主网 Escrow · go-live · 收藏 GDPR | **③** |

---

## `/traveltrust` · TravelTrust 网络叙事（字标首页 · #2）

| 项 | 结论 |
|----|------|
| **① 收口 / UI 冻结** | **是**（叙事/UI · [`HOMEPAGE-NON-DATA-CLOSURE`](../GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md)） |
| **②/③ 任务** | [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](./TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) |

| ID | 未完成项 | 阶段 |
|----|----------|------|
| TTNET-P2-001 | 五角色实拍 MP4 | **②** |
| TTNET-P2-002 | 官方社媒 https env | **②** |
| TTNET-P2-003 | page-brief staging 真 API | **②** |
| TTNET-P2-004 | 测试网 TTG 真兑换（UI 示意不变） | **②** |
| TTNET-P2-005 | staging E2E（pi1-traveltrust-v6） | **②** |
| TTNET-P2-006 | 测试网 RPC 只读 | **②** |
| TTNET-P2-007 | staging 全矩阵 R-003 GO | **②** |
| TTNET-P2-008 | 埋点 staging ingest | **②** |
| TTNET-P3-001～004 | 生产 swap · 法务 · Lighthouse · go-live | **③** |

**② 宽轨：** 轨 8（`/`）· 轨 9（`/traveltrust`）· 轨 10（**三页筛选**）— [PHASE2-TESTNET-ACCEPTANCE §8～10](../../../docs/runbook/PHASE2-TESTNET-ACCEPTANCE.md)

---

## 真自由市场 · 三页筛选（`/market` · `/market/provider` · `/market/acquisition`）

| 项 | 结论 |
|----|------|
| **① 收口 / UI 冻结** | **旅行预约 `/market`：** UI **已冻** + 筛选 L5 **已闭** · **商家/收购子站：** 筛选+门闸数据链 **① 已闭**（2026-06-03）· **非** MARKET-L5 layout lock · 收购 **Hub 卡** UI 冻于 **`/me/identities`** |
| **代码 SSOT** | [`LANDING-MARKET-PAGES-CODE-SSOT.md`](./LANDING-MARKET-PAGES-CODE-SSOT.md) · [`app/market/README`](../../app/market/README.md) |
| **②/③ 任务** | [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](./MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |

| ID | 未完成项 | 阶段 |
|----|----------|------|
| MKT-FILT-P2-001 | `/market` 旅行预约 staging 筛选全链 | **②** |
| MKT-FILT-P2-002 | `/market/provider` staging PG + URL 筛选 | **②** |
| MKT-FILT-P2-003 | `/market/acquisition` staging PG + URL 筛选 | **②** |
| MKT-FILT-P2-004 | 子站筛选 staging E2E | **②** |
| MKT-FILT-P2-005 | staging API query 对拍（94 §2.3.5） | **②** |
| MKT-FILT-P2-006 | cursor 分页（catalog >200） | **②** |
| MKT-FILT-P2-007 | staging R-003 GO（B-MKT 行） | **②** |
| MKT-FILT-P2-008 | `/market` 客户端 facet/天数/排序 staging 对拍 | **②** |
| MKT-FILT-P2-009 | 收藏服务端 API | **②** · **③** MKT-FILT-P3-005 |
| MKT-FILT-P2-010 | Studio paid entitlement staging 对拍 | **②** |
| MKT-FILT-P2-011 | nil-guide 一步抢单 | **②** |
| MKT-FILT-P2-012 | discover/guides 服务端筛选收敛 | **②** |
| MKT-FILT-P3-001～005 | 生产分页 · 搜索 · CDN · go-live · 收藏 | **③** |

---

## 维护纪律（写死）

1. **已 UI 冻结** 页：仅 bugfix · 数据链路 · i18n（同语义）· a11y/错误态；**禁止** layout / token 回流。  
2. **Phase ① 收口** 页（Pay / Staking / Governance）：允许治理真值与 API 接线；**禁止** 冒充 ②③ 已验收。  
3. **未收口**（已上链 Escrow · `/rate`）：可维护功能，**不得** 写入「已冻结」结论。  
4. 动 **Escrow 草稿** 仍须 **`run-web3-itinerary-l5-green.sh`**；动 **五主路由壳** 仍须 **五主闸**。
