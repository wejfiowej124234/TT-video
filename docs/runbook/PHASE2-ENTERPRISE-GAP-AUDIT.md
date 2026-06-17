# Phase ② 测试网 · 企业级缺口审计

**Status:** **② Closing Gap GO Ready** — SSOT [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · Open 项 [PHASE2-OPEN-ITEMS-BURN-DOWN](./PHASE2-OPEN-ITEMS-BURN-DOWN.md) · **Phase ① Freeze ACTIVE**  
**阶段：** **② 测试网** — **只读审计落盘**；**不** 授权写代码、部署、Stripe 出网或合约 broadcast。  
**审计日期：** 2026-05-28  
**类型：** 企业级阶段边界冻结（证据补充 · Phase ① Freeze 允许）

**诚实边界（必读）：**

| 声明 | **不等于** |
|------|------------|
| ② 测试网专项验收 | 全站 **93** 矩阵 **GO** |
| ② staging 窄切片 smoke | **③ Production GO** |
| ISS-007 窄切片 **`PARTIAL_GO`** | staging 全矩阵 **`release_gate=GO`** |

见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) · [TT-9628 · 覆盖边界](TT-9628-main-line-vs-branch-lines-delivery.md#tt-9628-coverage-boundary) · [`evidence/GO_local_r002_verify/README.md`](../../evidence/GO_local_r002_verify/README.md)。

---

## 互指（SSOT 关系）

| 文档 | 关系 |
|------|------|
| [GO_local_phase1](../../frontend/evidence/GO_local_phase1/README.md) | **① 已闭环** 总验收证据包 |
| [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) | **① 垂直 CLOSED** vs 全仓 ① ≠ 100% |
| [PHASE1-FREEZE-ONBOARDING-HUB](../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) | **① Freeze** — 本审计属允许的「证据补充」 |
| [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) | **窄 ②** — onboarding 五域 · **G-0～G-4** 总入口闸 |
| [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) | **宽 ②** — 全站六轨 · R-003 staging GO |
| [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) | **G-1** 环境隔离签字模板 |
| [PHASE1_5-DATA-LINK-MODEL-GATE](./PHASE1_5-DATA-LINK-MODEL-GATE.md) | **①.5** — 宽 ② 前的隐藏依赖 |
| [onboarding-fee-schedule.v1 §8.2](../spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施) | ONB-P2-001～006 backlog |

**范围从属（防误读）：**

```
PHASE2-START-CHECKLIST（窄 ② · onboarding 五域）
    ⊂ PHASE2-TESTNET-ACCEPTANCE（宽 ② · 六轨）
    ⊂ TT-TESTNET-FULLSTACK（治理 + 资金栈 · 更大依赖面）
```

**清 G-0～G-4 ≠ R-003 staging `release_gate=GO`**。窄 ② onboarding 垂直闭环 **不** 自动满足宽 ② 全矩阵。

---

## 一、总览：能不能进 Phase ②？

| 维度 | 状态 | 一句话 |
|------|------|--------|
| ① 功能/链路（onboarding 垂直） | 🟢 | quote→PI→entitlement→mark-paid→role-confirm→Hub **① 已验** |
| G-0～G-4 总入口闸 | 🟡 | G-0/G-4 文档已闭；**G-1/G-2 实质未就绪** |
| Staging 基础设施 | 🔴 | 无已登记 HTTPS staging API + 测试 PG 证据包 |
| Stripe/PSP ② 真收单 | 🟡 | 代码/① PG·IT 较全；**② 真网/浏览器/E2E 未验** |
| Webhook 公网闭环 | 🟡 | 验签实现 + 合成 IT；**staging listen/入站未决** |
| 测试网合约 + stake | 🔴 | 脚本/registry 有；**地址槽全空**、Sepolia 证据包缺失 |
| Staging 烟测/矩阵 | 🟡 | [`smoke-onboarding-testnet.sh`](../../scripts/dev/smoke-onboarding-testnet.sh) **已建**；证据根 **已入库** · **staging 未跑绿** |
| 全站 ②（R-003/93/95） | 🔴 | [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) **六轨均未封口** |
| ①.5 数据建模闸 | 🟡 | PD-009/双写已闭；**§6 仍有 4 项未勾** |

**结论：** **不宜**宣称「可以进入 Phase ② **实施**」。可以进入 **Phase ② 准备期**（基础设施 + G-1/G-2 + 证据目录 + 环境隔离决策），但 **G-0～G-4 未全绿前** 不应开 Stripe 出网、合约 broadcast 或 staging 真收单。

---

## 二、G-0～G-4 逐条审计

对照 [PHASE2-START-CHECKLIST · §0](./PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前)。

| 闸 | 要求 | 现状 | 缺口 |
|----|------|------|------|
| **G-0** | `bash scripts/dev/run-go-local-phase1-acceptance.sh` **exit 0** + 双日志留盘 | **① 已落盘**（`acceptance.latest.log` · `site10.acceptance.latest.log`） | 维护后按需复跑；**非** ② 开工阻塞项 |
| **G-1** | staging DB / Stripe test / `whsec` 与生产隔离 | `.env.example` 有模板；`r003-staging-chain.env.example` 存在 | 无 Owner 签字的环境隔离表；无 staging 密钥轮换/runbook **实例** |
| **G-2** | HTTPS `API_BASE` + 测试 PG migrate + 与 ① 同版镜像 | 本地 Docker/PG 可跑 | 无 staging 主机；`registry/protocol-convergence-deployments.v1.yaml` 的 `testnet_template` **地址全 null** |
| **G-3** | ② 范围书面、不与 ③ 混句 | PHASE2-START-CHECKLIST + Freeze 已写 | ✅ **文档层满足** |
| **G-4** | ① `fee_schedule` 对拍稳定；② **非零** `amount_minor` | ① 三方对拍 + PG 011 全链 | staging 上**未验证** `TRAVELTRUST_ONBOARDING_LOCAL_DEV=0` + 真 amount |

---

## 三、分域深度缺口（五主轨 + 横切）

### 3.1 Stripe / PSP（ONB-P2-001～006）

**已有（① 代码 + 机读）：**

- **Rust：** `stripe_onboarding/`、PaymentIntent/Checkout 路径、`metadata.fee_schedule.amount_minor`
- **前端：** `StripeOnboardingPayment.tsx` + `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **PG·IT：** `matrix_93_d_onb_005_f036_ext`（合成 whsec）、refund/dispute 017/014/016 等
- **Runbook：** [TT-9618 §3.1～3.2](./TT-9618-onboarding-local-testnet.md)

**仍缺（② 必做）：**

| ID | 缺口 | 严重度 |
|----|------|--------|
| ONB-P2-001 | staging 上 `sk_test` 真创建 PI + Elements 浏览器支付 | 🔴 |
| ONB-P2-002 | Hosted Checkout + `return_url` staging 回跳（可选但 backlog 已列） | 🟡 |
| ONB-P2-003 | Stripe **真投递** `payment_intent.succeeded`（**非**合成 IT） | 🔴 |
| ONB-P2-004 | 非零 `amount_minor` = computed（如 US 29900）在 staging PG 留痕 | 🔴 |
| ONB-P2-005 | 四方对拍脚本（quote / PI / entitlement / Stripe PI.amount）— **无**独立 staging 断言脚本 | 🔴 |
| ONB-P2-006 | `smoke-onboarding-*-testnet.sh` — **仓库内不存在** | 🔴 |
| 96-18 GAP | 3DS / SAQ / PCI 全叙事仍为 Target；非 Stripe PSP 未接 | 🟡 |
| E2E | Playwright 无 Stripe Elements 真确认链；`stripe trigger` **不能**代替 metadata 真链 | 🔴 |

### 3.2 Webhook 回调

**已有：** 内网 JSON（① 烟测绿）、Stripe 验签 handler、HMAC/allowlist 可选闸、Ingress 示例 YAML、Admin webhook-jobs/dlq。

**仍缺：**

- staging **公网入站** 或 listen 转发机方案未落地（**B-WH-3**）
- staging 上 `matrix_93_b_onb_006*` 合规拒服复跑（**B-WH-5**）
- 异步队列开启时 webhook-jobs/dlq **② 运维演练** 未做
- 96-08 财务分录与 Stripe refund/dispute **仅资格域**，非全量对账

### 3.3 测试网合约部署（TT-9630）

**已有：**

- `deploy-steward-stake-pool-testnet.sh`、`check-protocol-convergence-pregate.sh`
- `registry/protocol-convergence-deployments.v1.yaml`（SSOT hash 已登记）
- [GO_phase2_protocol_convergence_testnet_pregate](../../frontend/evidence/GO_phase2_protocol_convergence_testnet_pregate/README.md)（① 前置）

**仍缺：**

| 项 | 说明 |
|----|------|
| RPC + 部署钱包 + gas | 测试网凭据未入 registry（**B-CHAIN-1**） |
| Broadcast 证据 | `GO_phase2_steward_stake_sepolia` 文档引用但**目录不存在** |
| Country pool CN | `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` **未填** |
| API 重启对齐 | 部署后 staging `.env` + `/meta` 链上地址对拍未做 |
| TTG v2 全栈 | TT-TESTNET-FULLSTACK 治理栈与 steward pool 是更大依赖面 |

### 3.4 链上 stake 对拍（TT-9629 · A 轨）

**已有：** Anvil smoke 脚本、stake-quote/status API、protocol-ssot 四相等式闸（①）。

**仍缺：**

- **B 轨 paid ≠ A 轨 staked** — Hub 阶段可区分，但 **② 无「双轨完成」staging 证据**
- 测试网 TTG faucet / 用户余额流程未文档化（**B-STAKE-2**）
- staging `CHAIN_RPC_URL` 未配 → stake-status skipped（**B-STAKE-3**）
- `smoke-steward-stake-testnet-readonly.sh` 需部署后才 meaningful
- 法务 R4/R5（protocol convergence 诚实边界）未签 **不能**对外宣称经济真值

### 3.5 Staging smoke / 企业矩阵

| 脚本 / 证据 | ① | ② |
|-------------|---|---|
| `smoke-onboarding-full-chain-local.sh` | ✅ | — |
| `smoke-provider/steward-onboarding-local` | ✅ | — |
| `run-go-local-phase1-acceptance.sh` | ✅ | — |
| `smoke-onboarding-testnet.sh` | — | 🟡 已建 · 待 staging 跑绿 |
| `evidence/GO_phase2_testnet_20260526/` | — | ✅ 已入库（[README](../../evidence/GO_phase2_testnet_20260526/README.md)） |

**更宽 ② 轨道**（[PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md)）：

| 轨 | 内容 | 状态 |
|----|------|------|
| 1 | R-003 staging 全矩阵 `report.json` `release_gate=GO` | 🔴 |
| 2 | did-rank D1–D4 staging 数据链 | 🔴 |
| 3 | C-GOV MANUAL-P1 钱包日志 | 🔴 |
| 4 | ISS-007/008/009 在 staging 逐项闭 | 🔴 |
| 5 | 收购 PD-009 §8.2（②-A～I） | 🔴 |
| 6 | Steward stake Sepolia/staging | 🔴 |
| 7 | TT 社区 COM-② / P2-* | 🟡 槽 PASS · staging 增量 OPEN |
| 8 | **`/` Web3 创新行程 WEB3-P2-001～012** | 🔴 |
| 9 | **`/traveltrust` 叙事 TTNET-P2-001～008** | 🔴 |
| 10 | **真自由市场三页筛选 MKT-FILT-P2-001～012** | 🔴 |

**工具链已备、未跑：** `check_r003_staging_env_ready.py`、`run_r003_staging_evidence_chain.py`、`tt-9627-testnet-segment12-smoke-pack.sh`。

### 3.8 `/` Web3 创新行程（WEB3-P2 · 宽 ②）

**① 已闭（不重做 UI/① 链）：** [`GO_local_web3_itinerary_l5`](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md) · **`run-web3-itinerary-l5-green.sh`** · [`FIVE-MAIN` `/` 段](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

**② backlog SSOT：** [`WEB3-HOME-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md)

| ID | 缺口 | 严重度 |
|----|------|--------|
| WEB3-P2-001 | Phase B 国别 MP4 + env（**媒体** · **非** UI 改版） | 🟡 |
| WEB3-P2-002 | staging PG/API 上 **`smoke-web3-itinerary-full-chain`** 变体 **exit 0** | 🔴 |
| WEB3-P2-003 | 测试网 **真 USDC** · **`/pay`** · **Escrow deposit**（**非** mock-pay） | 🔴 |
| WEB3-P2-004 | staging **`e2e:web3-itinerary-10`**（或 enterprise-10 staging） | 🟡 |
| WEB3-P2-005 | 并入轨 1 · R-003 **`release_gate=GO`**（**非** ISS-007 **`PARTIAL_GO`**） | 🔴 |
| WEB3-P2-006 | staging 登录 + session + 创单 | 🟡 |
| WEB3-P2-007 | staging **release-flow** 导航链 | 🟡 |
| WEB3-P2-008 | staging 预算/pricing 与 **`POST /itineraries`** 对拍 | 🟡 |
| WEB3-P2-009 | 收藏 **服务端 API** | 🟡 |
| WEB3-P2-010 | **真实 AI** / pricing_service 行程 | 🔴 |
| WEB3-P2-011 | Hero 文案 staging 目视（① 已诚实化） | 🟢 |
| WEB3-P2-012 | result/unlock **跨 tab** 或账号态 | 🟡 |

**依赖：** G-2 staging · **TT-9630** 测试网合约 · **`P3_CHAIN_OFF=0`**（staging 链配置）

**③（勿混入 ②）：** WEB3-P3-001～006 — 主网真资金 · 生产 PSP · **go-live** · 收藏 GDPR（见 backlog §③）

**① 剩余诚实清单：** [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md)

### 3.9 `/traveltrust` 网络叙事（TTNET-P2 · 宽 ②）

**① 已闭（不重做 UI）：** [`HOMEPAGE-NON-DATA-CLOSURE`](../../frontend/evidence/GO_local_cinematic_l5_closure/HOMEPAGE-NON-DATA-CLOSURE.md) · **`traveltrustHomeLayoutLockL5`** · **FIVE-MAIN**

**② backlog SSOT：** [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md)

| ID | 缺口 | 严重度 |
|----|------|--------|
| TTNET-P2-001 | 五角色实拍 MP4（**DEFER-02**） | 🟡 |
| TTNET-P2-002 | 官方社媒 **https** env | 🟡 |
| TTNET-P2-003 | **page-brief** staging 真 API | 🔴 |
| TTNET-P2-004 | 测试网 **TTG 真兑换**（数据链 · UI 示意不变） | 🔴 |
| TTNET-P2-005 | staging **pi1-traveltrust-v6** E2E | 🟡 |
| TTNET-P2-006 | 测试网 **RPC** 只读诚实化 | 🟡 |
| TTNET-P2-007 | 并入轨 1 · R-003 **`release_gate=GO`** | 🔴 |
| TTNET-P2-008 | 埋点 **TT-PH1-050** staging ingest | 🟡 |

**③：** TTNET-P3-001～004 — 见 backlog §③

### 3.10 真自由市场三页筛选（MKT-FILT-P2 · 宽 ②）

**① 已闭（2026-06-03 · 数据链 · UI 未动）：** [`MARKET-L5-CLOSURE`](../../frontend/evidence/GO_local_marketing_front_closure/MARKET-L5-CLOSURE.md) · [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG §①`](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) · **94 §2.3**

**② backlog SSOT：** [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md)

| ID | 缺口 | 严重度 |
|----|------|--------|
| MKT-FILT-P2-001 | **`/market`** staging discover/guides + facet 筛选全链 | 🔴 |
| MKT-FILT-P2-002 | **`/market/provider`** staging PG + URL 筛选 + 摘要条数 | 🔴 |
| MKT-FILT-P2-003 | **`/market/acquisition`** 同上 · PD-009 payload | 🔴 |
| MKT-FILT-P2-004 | staging E2E 子站筛选（reset · 空态 · 无 demo 误回退） | 🟡 |
| MKT-FILT-P2-005 | staging **`GET …/listings?country=&category=&sort=`** 证据 | 🔴 |
| MKT-FILT-P2-006 | **`cursor`** 分页（catalog **>200**） | 🟡 |
| MKT-FILT-P2-007 | 并入轨 1 · R-003 **`release_gate=GO`**（**93 B-MKT**） | 🔴 |
| MKT-FILT-P2-008 | **`/market`** staging 客户端 facet/天数/排序 对拍 | 🔴 |
| MKT-FILT-P2-009 | 收藏 **服务端 API** | 🟡 |
| MKT-FILT-P2-010 | Studio **paid entitlement** staging 对拍（① FE 已闭） | 🟡 |
| MKT-FILT-P2-011 | **nil-guide** 一步抢单 | 🟡 |
| MKT-FILT-P2-012 | discover/guides **服务端筛选**收敛 | 🔴 |

**③：** MKT-FILT-P3-001～005 — 生产分页 · 搜索 · CDN · 收藏 · **go-live**（见 backlog §③）

**① 剩余诚实清单：** [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md)

---

## 四、横切维度（企业级）

### 4.1 数据模型 · ①.5 闸

[PHASE1_5 §6](./PHASE1_5-DATA-LINK-MODEL-GATE.md#6-出口判据满足后才开-②) **仍未勾完：**

- [ ] **资料 + 质押** 两表 — 产品/合规签字
- [ ] **状态机** 写入 04 §3.4 + admin 路径
- [ ] **本地 seed**：guide + provider/steward 各一条可演示链
- [ ] **API·IT** 覆盖 S1–S4 全链（非仅 page contract）
- [ ] **96-17 §0.3** 生产核对矩阵与实现对拍

**影响：** 即使 onboarding ① 垂直闭了，宽 ②（R-003）仍可能大面积 FAIL — [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md) 明确要求先过 ①.5。

### 4.2 安全 · 密钥 · 合规

| 项 | ① | ② 缺口 |
|----|---|--------|
| 密钥隔离（96-03） | 文档 | staging 实例 + 轮换演练 |
| OFAC / denylist | PG·IT 有 | staging PG 复验 |
| SEED_TEST_ACCOUNTS / admin mint | ① 本地 | 仅 staging 策略 + **禁生产** |
| mTLS / allowlist | 示例 YAML | staging Ingress 未绑定 |
| PCI / SAQ | Target | 不进 ② 最小集；**对外叙事须标注 Partial** |

### 4.3 运维 · 可观测

- Admin：`/admin/onboarding/*`、compliance-audit-events、webhook-jobs — **① PG·IT 有，staging 未跑**
- `ONBOARDING_WEBHOOK_ASYNC_QUEUE` — **② 需 DLQ 演练**
- CI：远端 Actions 不可用 → **② 须本地自留 exit 0**（[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)）
- 监控/告警：③ 项；staging 至少需 webhook 失败率 **人工查**

### 4.4 前端 · 多垂直

| 垂直 | ① | ② 缺口 |
|------|---|--------|
| Onboarding Console | Freeze · L5 锁 | Stripe staging pk + HTTPS FE |
| Hub identities | Freeze · 核心卡 ① | staging URL Playwright 可选 |
| 收购 PD-009 | §8.1 CLOSED | §8.2 九项（Escrow testnet、bond 对账、榜、moderation…） |
| 商家入驻 | ① smoke 绿 | staging 重复 + listing 发布 |
| did-rank | ① UI 壳 | §3.2 D1–D9 staging 产品数据 |

### 4.5 文档一致性（审计发现）

1. **三份 ② 入口并存且范围不同：** [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md)（onboarding 五域）⊂ [PHASE2-TESTNET-ACCEPTANCE](./PHASE2-TESTNET-ACCEPTANCE.md)（全站六轨）⊂ TT-TESTNET-FULLSTACK（治理+资金栈）
2. **证据目录：** `evidence/GO_phase2_testnet_*` / `GO_phase2_steward_stake_sepolia/` **已入库** — 内容仍 **NOT STARTED** 直至 staging 真跑
3. **建议：** 统一「窄 ② onboarding」vs「宽 ② staging GO」从属关系（见本文 **互指** 节）

---

## 五、缺口优先级矩阵（进 ② 前）

### P0 — 不开工则 ② 无法进行

- **G-2** staging HTTPS API + 测试 PostgreSQL + migrate + 版本钉住
- **G-1** 环境隔离决策书（Stripe test 账户、whsec、`DATABASE_URL`、禁止 local-dev 零金额）
- ~~**证据根目录**~~ → **已建** [`evidence/GO_phase2_testnet_20260526/`](../../evidence/GO_phase2_testnet_20260526/README.md) + `FAILURES.md`
- `python scripts/dev/check_r003_staging_env_ready.py` **exit 0**（宽 ② 前置）

### P1 — onboarding 垂直 ② 最小可验集

- Stripe Dashboard test webhook → staging `payment_intent.succeeded` **真投递**
- [`smoke-onboarding-testnet.sh`](../../scripts/dev/smoke-onboarding-testnet.sh)（**须**预检 + staging 真 Stripe/webhook 跑绿）
- **ONB-P2-005** [`assert-onboarding-fee-schedule-quad-party.mjs`](../../scripts/dev/assert-onboarding-fee-schedule-quad-party.mjs)（含 Stripe API 读回 amount）
- staging 跑 `tt-9618-onboarding-pg-evidence.sh`（步 5～7 on staging `DATABASE_URL`）

### P2 — 主理人双轨（与 B 轨并行、分证据）

- TT-9630 序 0 绿 → `DRY_RUN=1` deploy → Sepolia broadcast → registry 填地址
- `smoke-steward-stake-testnet-readonly.sh` + HTTP quote 对拍
- Anvil smoke **exit 0** 作为 ② 预演（**非**替代 testnet）

### P3 — 企业宽 ②（PHASE2-TESTNET-ACCEPTANCE）

- 补完 [PHASE1_5 §6](./PHASE1_5-DATA-LINK-MODEL-GATE.md#6-出口判据满足后才开-②) 剩余项
- R-003 staging 全矩阵 → `release_gate=GO`（**非** ISS-007 窄切片）
- 收购 §8.2、did-rank D1–D4、C-GOV 分轨证据

---

## 六、建议进入 ② 的执行顺序

与 [PHASE2-START-CHECKLIST · §6](./PHASE2-START-CHECKLIST.md#6--跨域依赖矩阵) 对齐：

1. **G-1** 环境隔离决策
2. **G-2** staging API + PG
3. ~~**G-0** 自留 ① acceptance 日志~~ — **已完成**（双日志已落盘）
4. 关闭 staging local-dev 零金额（**G-4**）
5. Stripe test + 公网/listen webhook
6. ONB-P2-005 对拍 + testnet smoke
7. **并行：** TT-9630 合约部署
8. stake 只读对拍 + **双轨证据分离**
9. **宽 ②：** R-003 / ①.5 出口 / 垂直 backlog

**Phase ① Freeze 下允许的工作：** P0 的文档/证据目录/环境模板、G-1 决策表、bugfix；**不允许** 无 G 闸的 Stripe 功能开发或新 Hub/onboarding 特性（见 [PHASE1-FREEZE](./PHASE1-FREEZE-ONBOARDING-HUB.md)）。

---

## 七、审计结论（企业口径）

| 问题 | 答案 |
|------|------|
| ① 是否够格说「产品 onboarding 本地闭环」？ | **是**（在 Freeze 维护前提下） |
| 是否够格开 Phase ② **编码/部署**？ | **否** — G-1/G-2 红，staging 烟测与证据包缺失 |
| **最大风险** | 用 ① PG·IT **合成 Stripe** 或 internal webhook **冒充** ② 真 PSP（[禁止假完成](../../CONTRIBUTING.md#no-false-completion)） |
| **第二大风险** | B 轨 **paid** 与 A 轨 **stake** 在 Hub/叙事上混为一谈 |
| **宽 vs 窄 ②** | 窄（onboarding）约 2～3 周准备 + 1 周验收取决于 staging；宽（R-003 GO）显著更大，且受 ①.5 未勾项牵制 |

---

## 八、禁止假完成 · 机读对照表

下列 **① 绿** **不得** 在结论句中替代右列 **②** 目标：

| ① 已验（可引用） | **不能** 冒充 |
|------------------|---------------|
| `matrix_93_*` 合成 `whsec` IT | Stripe Dashboard **真投递** webhook |
| `POST internal/webhook` / `local-dev/mark-paid` | staging `payment_intent.succeeded` |
| `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` 零金额 | `amount_minor` = computed 非零 |
| `run-go-local-phase1-acceptance.sh` | `smoke-onboarding-*-testnet.sh` |
| `smoke-steward-stake-anvil.sh` | Sepolia broadcast + registry 填址 |
| `gen-r002-iss007-prereport` 43 锚 PASS | staging `report.json` **`release_gate=GO`** |
| [acquisition §8.1 CLOSED](../spec/artifacts/acquisition-publish-trust-rules.v1.md#81-第一阶段--本地--closed2026-05-27) | [§8.2 九项](../spec/artifacts/acquisition-publish-trust-rules.v1.md#82-第二阶段--测试网--待验backlog) staging 证据 |

---

## 十、Remediation 状态（2026-05-28 · Phase ① Freeze 证据/工具）

| 审计项 | 状态 | 产物 |
|--------|------|------|
| 证据根悬空 | **已修复** | `evidence/GO_phase2_testnet_20260526/` · `GO_phase2_steward_stake_sepolia/` |
| ONB-P2-006 | **已建** | `scripts/dev/smoke-onboarding-testnet.sh` |
| ONB-P2-005 | **已建** | `scripts/dev/assert-onboarding-fee-schedule-quad-party.mjs` |
| G-0 日志 | **已落盘** | `acceptance.latest.log` + `site10.acceptance.latest.log`（`record-*-acceptance-log.sh`） |
| Web3 行程 L5（`/`→解锁→Escrow 草稿） | **① 已闭** | [`GO_local_web3_itinerary_l5`](../../frontend/evidence/GO_local_web3_itinerary_l5/README.md) · `run-web3-itinerary-l5-green.sh` |
| **`/` Web3 ② backlog（WEB3-P2-001～006）** | **已登记 · 待验** | [`WEB3-HOME-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) · [PHASE2-TESTNET-ACCEPTANCE §8](./PHASE2-TESTNET-ACCEPTANCE.md) |
| **`/traveltrust` ② backlog（TTNET-P2-001～008）** | **已登记 · 待验** | [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) · [PHASE2-TESTNET-ACCEPTANCE §9](./PHASE2-TESTNET-ACCEPTANCE.md) |
| **三页筛选 ① 数据链 + ②/③ backlog（MKT-FILT-P2-001～012）** | **① 已闭 · ② 已登记 · 待验** | [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) · [PHASE2-TESTNET-ACCEPTANCE §10](./PHASE2-TESTNET-ACCEPTANCE.md) |
| **① 剩余诚实清单（`/` + 三页市场）** | **ACTIVE** | [`WEB3-LANDING-MARKET-LOCAL-REMAINING`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md) |
| G-1 决策 | **模板** | [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) |
| G 闸预检 | **已建** | `scripts/dev/check-phase2-onboarding-staging-ready.sh` |
| staging env | **模板** | `scripts/dev/staging-onboarding.env.example` |
| ①.5 seed 切片 | **已建** | `scripts/dev/smoke-phase15-identity-demo-local.sh` |
| G-2 staging 主机 | **仍 OPEN** | 须运维部署 HTTPS API + PG |
| 宽 ② R-003 GO | **仍 OPEN** | 须 `run_r003_staging_evidence_chain` on staging |

**② 阶段结论不变：** 工具/证据就绪 **≠** Phase ② **实施已启动**。**严格 Prepared / Not Started** — staging · Stripe · 测试网 · 链上宣称 **须 G-1/G-2 清闸后** 方合法。官方口径见 **[PHASE2-REPOSITORY-STATUS · 合法宣称闸](./PHASE2-REPOSITORY-STATUS.md#合法宣称闸强制--防假完成)**。

---

## 九、变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：企业级缺口审计落盘；② **NOT STARTED**；互指 GO_local_phase1 · PHASE2-START · PHASE2-TESTNET-ACCEPTANCE |
| 2026-05-28 | §十 Remediation：证据入库 · G-1 模板 · 预检/烟测/四方对拍脚本 |
| 2026-06-03 | **§3.8** + **§十**：**WEB3-HOME-PHASE2-BACKLOG**（**WEB3-P2-001～006**）— 补 **`/`** ② 待验项 |
| 2026-06-03 | **§3.9** + **§十**：**TRAVELTRUST-NETWORK-PHASE2-BACKLOG**（**TTNET-P2-001～008**）— 补 **`/traveltrust`** ② 待验项 |
| 2026-06-03 | **§3.10** + **§十**：**MARKET-SUBSITE-FILTER-PHASE2-BACKLOG**（**MKT-FILT-P2-001～007** · **MKT-FILT-P3-001～004**）— 三页筛选 ②/③ |

---

**End of PHASE2-ENTERPRISE-GAP-AUDIT · ② Prepared / Not Started · [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md)**
