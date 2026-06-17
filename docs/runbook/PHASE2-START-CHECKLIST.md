# Phase ② Start Checklist · 启动条件与阻塞项

**Status:** **Closing Gap GO Ready · Community C1–C12 PASS** · Open 收口 [PHASE2-OPEN-ITEMS-BURN-DOWN](./PHASE2-OPEN-ITEMS-BURN-DOWN.md) · 总态 [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md)

> **合法宣称：** G-1/G-2/G-4 **机读绿**（2026-06-06）· Perfect Validation **NO-GO**（soak/indexer）· 见 [PHASE2-OPEN-ITEMS-BURN-DOWN §2](./PHASE2-OPEN-ITEMS-BURN-DOWN.md)。

---

## 0 · 总入口闸（Phase ② 任何工作流开工前）

| # | 启动条件 | 当前态 | 阻塞若未满足 |
|---|----------|--------|--------------|
| **G-T** | **①→② Transition Audit** → [PHASE2-READY-REPORT](./PHASE2-READY-REPORT.md) **`TT_PHASE2_READY_VERDICT: READY_FOR_C1_C12`**（`bash scripts/dev/bootstrap-phase2-g1-g2.sh` · `transition-audit/latest/`） | **PASS** · `20260531T085525Z` · **T9 PASS** | **C1–C12 ALL PASS** · [`CLOSING-REVIEW.md`](../../evidence/GO_phase2_testnet_20260526/community/CLOSING-REVIEW.md) · **≠** Phase ② **GO** |
| **C1** | 社区 Feed ≥20 production UGC · automation_leak=0 · staging seed 对拍 | **PASS** · `20260605T123651Z` · feed **22** · [`community/C1/`](../../evidence/GO_phase2_testnet_20260526/community/C1/) | **可宣称 ② C1 槽 PASS** · **≠** C2～C12 GO |
| **C2** | MIME+魔数+体限+路径 · Feed 隔离 · security IT + staging upload | **PASS** · `20260605T125440Z` · **`matrix_93_d_com_c2_*` 11** · staging E2E exit 0 · [`community/C2/`](../../evidence/GO_phase2_testnet_20260526/community/C2/) | **可宣称 ② C2 槽 PASS** · **≠** C3～C12 GO · **≠** Phase ② GO |
| **C3** | 举报→审核→下架 · Admin moderation staging E2E | **PASS** · `20260605T125712Z` · **`matrix_93_d_com_c3_*` 2** · staging moderation E2E exit 0 · [`community/C3/`](../../evidence/GO_phase2_testnet_20260526/community/C3/) | **可宣称 ② C3 槽 PASS** · **≠** C4～C12 GO · **≠** Phase ② GO |
| **C4** | HLS/MP4 + CDN · staging 播放器 | **PASS** · `20260605T141755Z` · **`matrix_93_d_com_c4_*` 3** · staging MP4 playback + Feed **canplay** · **HLS-CDN pending** · [`community/C4/`](../../evidence/GO_phase2_testnet_20260526/community/C4/) | **可宣称 ② C4 槽 PASS** · **≠** 生产 CDN/HLS GO · **≠** C5～C12 GO · **≠** Phase ② GO |
| **C5** | 多图 CDN / 图片交付 · Cache-Control · 公开读路径 | **PASS** · `20260605T143234Z` · **`matrix_93_d_com_c5_*` 3** · staging image delivery + browser load · **production CDN pending** · [`community/C5/`](../../evidence/GO_phase2_testnet_20260526/community/C5/) | **可宣称 ② C5 槽 PASS** · **≠** Production CDN GO · **≠** C6～C12 GO · **≠** Phase ② GO |
| **C6** | 社交图与互动 · 关注/粉丝/私信/通知 · 用户回访 | **PASS** · `20260605T144104Z` · **`matrix_93_d_com_c6_*` 3** · staging social API + browser revisit · [`community/C6/`](../../evidence/GO_phase2_testnet_20260526/community/C6/) | **可宣称 ② C6 槽 PASS** · **≠** C7～C12 GO · **≠** Phase ② GO |
| **C7** | 93 矩阵社区 D 域 staging · C1–C6 映射 · 机读校验 | **PASS** · `20260605T144841Z` · [`report.json`](../../evidence/GO_phase2_testnet_20260526/community/C7/report.json) **`release_gate=GO`** · `record-community-c7-evidence.sh` · [`community/C7/`](../../evidence/GO_phase2_testnet_20260526/community/C7/) | **可宣称 ② C7 槽 PASS** · **≠** full-site 93 GO · **≠** C8～C12 GO · **≠** Phase ② GO |
| **C8** | Runbook/监控 · staging ops 闭环 · C1–C7 证据可追溯 | **PASS** · `20260605T145342Z` · [COMMUNITY-STAGING-OPS-RUNBOOK](./COMMUNITY-STAGING-OPS-RUNBOOK.md) · `record-community-c8-evidence.sh` · monitoring smoke exit 0 · [`community/C8/`](../../evidence/GO_phase2_testnet_20260526/community/C8/) | **可宣称 ② C8 槽 PASS** · **≠** C9～C12 GO · **≠** Phase ② GO |
| **C9** | Shell Token · Founder Review + 88 §18.7 视觉签字 | **PASS** · `20260605T151358Z` · `record-community-c9-evidence.sh` · [`visual-review.md`](../../evidence/GO_phase2_testnet_20260526/community/C9/visual-review.md) · 9 screenshots · shell vitest exit 0 · [`community/C9/`](../../evidence/GO_phase2_testnet_20260526/community/C9/) | **可宣称 ② C9 槽 PASS** · **≠** C11～C12 GO · **≠** Phase ② GO |
| **C10** | Critical User Journey · Feed 宽路径 staging E2E | **PASS** · `20260605T235244Z` · `record-community-c10-evidence.sh` · [`journey-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C10/journey-summary.md) · 11 screenshots · API + browser E2E exit 0 · [`TT-PHASE2-C10-STAGING-EVIDENCE`](./TT-PHASE2-C10-STAGING-EVIDENCE.md) · [`community/C10/`](../../evidence/GO_phase2_testnet_20260526/community/C10/) | **可宣称 ② C10 槽 PASS** · **≠** C12 GO · **≠** Phase ② GO |
| **C11** | 04 路由闸 · staging 对拍 | **PASS** · `20260606T001039Z` · `record-community-c11-evidence.sh` · [`route-gate-report.json`](../../evidence/GO_phase2_testnet_20260526/community/C11/route-gate-report.json) · 24 API + 18 browser routes · [`TT-PHASE2-C11-STAGING-EVIDENCE`](./TT-PHASE2-C11-STAGING-EVIDENCE.md) · [`community/C11/`](../../evidence/GO_phase2_testnet_20260526/community/C11/) | **可宣称 ② C11 槽 PASS** · **≠** Phase ② GO |
| **C12** | DID / Trust / Reputation 互链 · Feed/Profile/Rank | **PASS** · `20260606T001931Z` · `record-community-c12-evidence.sh` · [`did-interlink-summary.md`](../../evidence/GO_phase2_testnet_20260526/community/C12/did-interlink-summary.md) · 8 screenshots · API/IT + browser E2E exit 0 · [`TT-PHASE2-C12-STAGING-EVIDENCE`](./TT-PHASE2-C12-STAGING-EVIDENCE.md) · [`community/C12/`](../../evidence/GO_phase2_testnet_20260526/community/C12/) | **可宣称 ② C12 槽 PASS** · **≠** Phase ② GO |
| **G-0** | **Phase ① 总验收** `bash scripts/dev/run-go-local-phase1-acceptance.sh` **exit 0**；建议 `bash scripts/dev/record-go-local-phase1-acceptance-log.sh` 留痕 | **① 已闭环** | **不得** 开 Stripe 出网 / staging 真收单 |
| **G-1** | **测试环境隔离决策**：staging **`DATABASE_URL`**、Stripe **test** 账户、**`whsec_*`** 与 **生产密钥零混用**（[96-03 §轮换](../spec/96-03-安全密钥与供应链.md)） | **✅ 机读绿** · [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) **2026-05-31** | 密钥混用 → **禁止** 开 webhook |
| **G-2** | **staging 主机可达**：HTTPS **`API_BASE_URL`**、测试 PG 已 **`sqlx migrate`**、**`chain_off.db_pool`** 与 **①** 同版本镜像 | **✅ Fly HTTPS** · `tt-api-staging` · `tt-web-staging` · 六域 UAT **25/0/0** | 无 staging API → 无法做 **②** 烟测 |
| **G-3** | **书面范围**：本轮仅 **② 测试网**；结论句 **不** 与 **③ Production GO** 合并 | **本文即范围闸** | 假完成风险见 [CONTRIBUTING · 禁止假完成](../../CONTRIBUTING.md#no-false-completion) |
| **G-4** | **B 轨价目冻结**：`fee_schedule_v1` 在 **①** 三方对拍稳定；**②** 须 **非零** `amount_minor`（**关闭** staging 上 `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`） | **✅ ② PASS** · 20260606T095305Z · [`closing-gap/G4-stripe-g4/`](../../evidence/GO_phase2_testnet_20260526/closing-gap/G4-stripe-g4/) | local-dev 零金额覆盖 **禁止** 出现在 staging |

> **未清 G-0～G-4 前：** 各域 backlog **保持暂停**（[onboarding-fee-schedule.v1 §8.2](../spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施)）。

---

## 1 · Stripe / PSP（B 轨 · 96-18 准入费）

**Backlog ID：** **ONB-P2-001～006**（[§8.2](../spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施)）  
**Runbook：** [TT-9618 §3 · §3.1 · §3.2](../runbook/TT-9618-onboarding-local-testnet.md)

### 1.1 启动条件（须全部满足后再开实施）

| # | 条件 |
|---|------|
| S-PSP-1 | Stripe Dashboard **test mode** 账户与 **sk_test_** / **pk_test_** 已就绪 |
| S-PSP-2 | staging API 配置 **`TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`** + **`TRAVELTRUST_STRIPE_SECRET_KEY`**（**非** ① stub） |
| S-PSP-3 | **`POST …/payment-intents`** 金额读 **`metadata.fee_schedule.amount_minor`**（**非** ① local-dev 覆盖） |
| S-PSP-4 | 前端 staging **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** 与 **sk_test** 同账户 |
| S-PSP-5 | **Checkout 路径（若启用）**：`TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT=1` + **`return_url`** 合法（[`onboardingReturnUrlForCheckout`](../../frontend/app/me/onboarding/meOnboardingPageHelpers.ts) · **① 契约已锁**） |
| S-PSP-6 | **② 对拍用例设计就绪**：quote / PI / entitlement / **Stripe PaymentIntent.amount** 四方一致（**ONB-P2-005**） |

### 1.2 阻塞项

| ID | 阻塞 | 说明 |
|----|------|------|
| B-PSP-1 | **staging 未部署或未 HTTPS** | **sk_test** 出网需可达 API；**① localhost** **≠** **②** |
| B-PSP-2 | **`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` 在 staging** | 零金额与 **② 真收单** 互斥 |
| B-PSP-3 | **Webhook 未配置** | 无 **`TRAVELTRUST_STRIPE_WEBHOOK_SECRET`** → `stripe_webhook_not_configured`；PI 可建但 **paid** 无法闭环 |
| B-PSP-4 | **ONB-P2-006 未在 staging 跑绿** | 脚本 [`smoke-onboarding-testnet.sh`](../../scripts/dev/smoke-onboarding-testnet.sh) 已建 — **须** G 闸 + 真 Stripe 证据 |
| B-PSP-5 | **Refund / dispute ② 证据** | **①** 仅有 PG·IT 合成验签；**②** 须 Dashboard test 事件或 listen **真投递**（TT-9618 §3.1 步 7 **不** 替代步 4） |

### 1.3 ② 验收出口（草案 · **未启动**）

| 项 | 期望 |
|----|------|
| PaymentIntent | **ONB-P2-001** · test 卡支付 · **`client_secret`** 非 null |
| Checkout | **ONB-P2-002** · **`checkout_url`** 回跳 **`/me/onboarding`** |
| 真收单 | **ONB-P2-004** · **`amount_minor` = computed**（如 provider US **29900** minor） |
| 对拍 | **ONB-P2-005** · 机读断言脚本 **exit 0** on staging |

---

## 2 · 测试网合约部署（Protocol Convergence · A 轨）

**Runbook：** [TT-9630](../runbook/TT-9630-protocol-convergence-testnet-pregate.md) · [TT-9629](../runbook/TT-9629-protocol-convergence-steward-stake-testnet.md)  
**① 前置证据：** [GO_phase2_protocol_convergence_testnet_pregate](../../frontend/evidence/GO_phase2_protocol_convergence_testnet_pregate/README.md)

### 2.1 启动条件

| # | 条件 |
|---|------|
| S-CHAIN-1 | **序 0 绿**：`check-protocol-convergence-pregate.sh` + `smoke-protocol-quote-parity-local.sh` **exit 0** |
| S-CHAIN-2 | **`registry/protocol-convergence-deployments.v1.yaml`** 中 **`content_sha256`** 与当前 SSOT yaml 一致 |
| S-CHAIN-3 | **测试网 RPC**：`CHAIN_RPC_URL` · `CHAIN_ID` · **`GOVERNANCE_TOKEN_ADDRESS`** · 部署 **`PRIVATE_KEY`**（**勿提交**） |
| S-CHAIN-4 | **Forge broadcast 窗口**：`deploy-steward-stake-pool-testnet.sh` **DRY_RUN=1** 通过 |
| S-CHAIN-5 | **Country pool（CN 试点）**：`CountryPoolRedemptionEpochV0` 部署计划与 **registry** 地址槽对齐 |

### 2.2 阻塞项

| ID | 阻塞 | 说明 |
|----|------|------|
| B-CHAIN-1 | **测试网凭据未就绪** | 无 RPC / 无 gas 钱包 → **不能** broadcast |
| B-CHAIN-2 | **ABI / SSOT 漂移** | yaml bump 未同批更新 **`content_sha256`** → 四相等式无法验 |
| B-CHAIN-3 | **API 未加载链上地址** | 部署后须 **`REGION_STEWARD_STAKE_POOL_ADDRESS`** 等写入 staging **`.env` 并重启 API** |
| B-CHAIN-4 | **LEGAL / 84 法务签字** | [GO_local_steward §诚实边界](../../frontend/evidence/GO_local_steward_protocol_convergence/README.md) — **R4/R5** 未签 **不** 宣称生产经济 |
| B-CHAIN-5 | **① Anvil smoke 未绿** | `smoke-steward-stake-anvil.sh` 是 **② 切片预演**，**不** 替代 testnet 部署，但 **建议** 先绿 |

### 2.3 ② 验收出口（草案 · **未启动**）

| 项 | 命令 / 证据 |
|----|-------------|
| 部署登记 | 根 `.env` + **registry** 填地址 |
| 只读对拍 | `smoke-steward-stake-testnet-readonly.sh` |
| HTTP 对拍 | `check-protocol-quote-parity.sh` · `PROTOCOL_QUOTE_HTTP=1` |
| Sepolia 证据包 | [GO_phase2_steward_stake_sepolia](../../evidence/GO_phase2_steward_stake_sepolia/README.md)（**待填**） |

---

## 3 · 链上 stake 对拍（A 轨 vs B 轨 · 主理人）

**硬边界：** **B 轨 `fee_schedule_v1`**（准入费 USD）与 **A 轨 protocol-ssot**（TTG 质押 bps）**解耦** — **②** 须 **分别** 验，**禁止** 用 B 轨 paid 冒充 stake 完成。

### 3.1 启动条件

| # | 条件 |
|---|------|
| S-STAKE-1 | **§2 合约已部署**（或 **Anvil ② 切片** 作为 staging 前置） |
| S-STAKE-2 | **`GET /api/v1/steward/stake-quote`** 与链上 **`minStakeAmount(jurisdiction)`** 四相等式（TT-9630） |
| S-STAKE-3 | **Admin approve** 后用户可发起 **stake tx**（钱包已 verify · application **approved**） |
| S-STAKE-4 | **`GET /api/v1/steward/stake-status`** 读链与 PG / 内存投影一致 |
| S-STAKE-5 | **Hub** `/me/identities` 主理人卡：**paid（B 轨）** 与 **stake 完成（A 轨）** 阶段 **可区分** |

### 3.2 阻塞项

| ID | 阻塞 | 说明 |
|----|------|------|
| B-STAKE-1 | **仅 ① full-chain smoke** | webhook/mark-paid + role-confirm **不含** 链上 stake |
| B-STAKE-2 | **测试网 TTG 余额** | 用户钱包须有 testnet TTG 或 faucet 流程未文档化 |
| B-STAKE-3 | **API `CHAIN_RPC_URL` staging 未配** | stake-status 读链 **503 / skipped** |
| B-STAKE-4 | **Sepolia fork smoke 未纳入总闸** | `smoke-steward-stake-sepolia-fork.sh` 为 **预演**，非 **② GO** |
| B-STAKE-5 | **双轨验收混淆** | 对外写「主理人 onboarding 完成」须标明 **B 轨 paid** vs **A 轨 staked** |

### 3.3 ② 验收出口（草案 · **未启动**）

| 序 | 动作 | SSOT |
|----|------|------|
| 1 | Anvil 全链 | `smoke-steward-stake-anvil.sh` |
| 2 | Testnet 部署 + 只读 | TT-9629 §2～§5 |
| 3 | Staging HTTP + 链上对拍 | TT-9630 序 2 |

---

## 4 · Webhook 回调（内网 JSON vs Stripe 公网）

**Runbook：** [TT-9618 §2 · §3.2 · §3.1 步 3～7](../runbook/TT-9618-onboarding-local-testnet.md)

### 4.1 启动条件

| # | 条件 |
|---|------|
| S-WH-1 | **内网 JSON**（**① 已验**）：`INTERNAL_API_SECRET` + **`onboarding-webhook-local.sh`** 在 staging **网络策略允许** 的主机可执行 |
| S-WH-2 | **Stripe 公网**：Dashboard 或 **`stripe listen`** 指向 **`https://<staging>/api/v1/hooks/stripe/onboarding`** |
| S-WH-3 | **`whsec`** 与 **当前** listen / Dashboard 端点 **一对一**（**禁止** 多环境共用一个 secret） |
| S-WH-4 | **PI metadata**：`traveltrust_idempotency_key` 与 **Idempotency-Key** 同源（**ONB-P2-003**） |
| S-WH-5 | **边缘闸**（若启用）：HMAC · allowlist CIDR · **`X-Forwarded-Proto: https`** 与 Ingress 一致 |

### 4.2 阻塞项

| ID | 阻塞 | 说明 |
|----|------|------|
| B-WH-1 | **① internal webhook 冒充 ② Stripe** | Playwright optional internal 路径 **不能** 替代 **Stripe-Signature** 证据 |
| B-WH-2 | **`stripe trigger` 合成事件** | 通常 **无** `traveltrust_idempotency_key` — TT-9618 §3.2 步 5 |
| B-WH-3 | **staging 无公网入站** | 须 **listen 转发机** 或 **API 网关** 路由；**未决则 ONB-P2-003 阻塞** |
| B-WH-4 | **异步队列镜像** | `ONBOARDING_WEBHOOK_ASYNC_QUEUE=1` 时须 **Admin** 查 **`webhook-jobs`/`dlq`**（§3.3） |
| B-WH-5 | **合规审计** | denylist / list_file 在 **staging PG** 须 **`matrix_93_b_onb_006*`** 复跑（§3.1 步 6） |

### 4.3 ② 验收出口（草案 · **未启动**）

| 路径 | 证据 |
|------|------|
| Internal JSON on staging | §3.1 步 3 · 脱敏 curl 日志 |
| Stripe **`payment_intent.succeeded`** | §3.2 步 4 · Dashboard 事件 ID |
| PG·IT 窄切片（**非充分**） | `matrix_93_d_onb_005_f036_ext` on **staging DATABASE_URL** |

---

## 5 · Staging smoke（② 总烟测 · 待建）

**现状：** **①** 有 [`smoke-onboarding-full-chain-local.sh`](../../scripts/dev/smoke-onboarding-full-chain-local.sh) 等；**②** [`smoke-onboarding-testnet.sh`](../../scripts/dev/smoke-onboarding-testnet.sh) **已建**（**ONB-P2-006**）— **须** [`check-phase2-onboarding-staging-ready.sh`](../../scripts/dev/check-phase2-onboarding-staging-ready.sh) **exit 0** + staging 真 Stripe/webhook 后方可宣称窄 ② 验收。

### 5.1 启动条件

| # | 条件 |
|---|------|
| S-SMOKE-1 | **§1～§4** 对应环境变量在 **staging** 已配置清单（**96-10** Owner 域） |
| S-SMOKE-2 | **`API_BASE=https://<staging-api>`** · **`TRAVELTRUST_ALLOW_INSECURE_HTTP_BASE` 未开**（仅 HTTPS） |
| S-SMOKE-3 | **测试账号策略**：`SEED_TEST_ACCOUNTS` / admin mint **仅** staging · **非** 生产 |
| S-SMOKE-4 | **脚本模板**：以 **①** full-chain 为蓝本，替换为 **Stripe test 支付** + **公网 webhook** + **非零 amount** |
| S-SMOKE-5 | **TT-9627 段 1～2**（可选）：[`tt-9627-testnet-segment12-smoke-pack.sh`](../../scripts/gates/tt-9627-testnet-segment12-smoke-pack.sh) 与 onboarding 烟测 **分工明确** |

### 5.2 阻塞项

| ID | 阻塞 | 说明 |
|----|------|------|
| B-SMOKE-1 | **staging smoke 未跑绿** | **ONB-P2-006** — [`smoke-onboarding-testnet.sh`](../../scripts/dev/smoke-onboarding-testnet.sh) + 预检 |
| B-SMOKE-2 | **ISS-007 / R-002 窄切片 GO** | **`PARTIAL_GO` ≠ staging 全矩阵 GO**（[evidence/GO_local_r002_verify](../../evidence/GO_local_r002_verify/README.md)） |
| B-SMOKE-3 | **Playwright full matrix 未在 staging 调度** | **①** chromium full matrix **≠** **②** 主机 |
| B-SMOKE-4 | **收购 / 商家 / 主理人 多垂直线** | PD-009 **§8.2**、provider register **②** 须 **分别** 列 staging 证据，**不** 并入单一 onboarding smoke |
| B-SMOKE-6 | **`/` Web3 创新行程（宽 ②）** | **WEB3-P2-001～012** — [`WEB3-HOME-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) · **不** 并入窄 onboarding smoke |
| B-SMOKE-7 | **`/traveltrust` 网络叙事（宽 ②）** | **TTNET-P2-001～008** — [`TRAVELTRUST-NETWORK-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) |
| B-SMOKE-8 | **真自由市场三页筛选（宽 ②）** | **MKT-FILT-P2-001～012** — [`MARKET-SUBSITE-FILTER-PHASE2-BACKLOG`](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) |
| B-SMOKE-5 | **CI 远端不可用** | 以 **本地自留 exit 0** 为准（[solo-dev-rhythm §6.5](../solo-dev-rhythm.md)） |

### 5.3 ② 验收出口（草案 · **未启动**）

建议 staging 烟测包 **至少** 覆盖：

| # | 流 | ① 对照 |
|---|-----|--------|
| 1 | 商家：register → wallet → application → **Stripe PI** → webhook → role-confirm → listing | `smoke-provider-onboarding-local.sh` |
| 2 | 主理人：application → admin → **B 轨 PI** → webhook → **A 轨 stake** | `smoke-steward-onboarding-local.sh` + TT-9629 |
| 3 | Hub / returnUrl / 命名 P3 | Vitest + 可选 Playwright on staging URL |
| 4 | Admin onboarding 台账 | `matrix_93_admin_onb` on staging PG |

**成功末行（待定义）：** 例 `TT_SMOKE_ONBOARDING_TESTNET: OK (② only · Stripe test · no mainnet)`

---

## 6 · 跨域依赖矩阵

| 若先做… | 硬依赖 | 否则阻塞 |
|---------|--------|----------|
| **Stripe PI 支付** | S-PSP-* · S-WH-2 · G-2 | 付了钱 **paid** 不推进 |
| **Stripe 公网 webhook** | S-WH-* · staging HTTPS | ONB-P2-003 |
| **测试网 stake** | S-CHAIN-* · S-STAKE-* | stake-status 读空 |
| **staging smoke 总闸** | §1～§5 最小可用子集 | 假完成 |
| **B 轨 ② 对拍** | **关闭** local-dev 零金额 | amount 对拍无意义 |

**建议规划顺序（仅文档 · 未授权执行）：**

1. **G-0～G-4** 确认 → staging 基础设施  
2. **TT-9630 序 0**（① 已绿则跳过）→ **测试网合约部署**  
3. **Stripe test + webhook**（ONB-P2-001/003）→ **非零 B 轨对拍**（ONB-P2-005）  
4. **链上 stake 对拍**（TT-9629）— **与 B 轨并行但分证据**  
5. **编写并跑通** staging smoke（ONB-P2-006）  
6. **Checkout / return_url**（ONB-P2-002）— 可选次于 PI 路径  

---

## 7 · 明确不在 Phase ② Start 范围（③ · 勿混入）

| 项 | 阶段 |
|----|------|
| Production **`sk_live_`** / 生产 PSP | **③** |
| 主网 **`CHAIN_RPC_URL`** · 真资金 Escrow | **③** |
| **`go-live-checklist` Production GO** | **③** |
| 禁止 staging **`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`** 上生产 | **③**（staging **也应** 关闭） |
| 全站 **93** 每路由 × 每角色 **GO** | **②** 仅垂直切片 + runbook 签字 |

---

## 8 · 互指索引

| 文档 | 用途 |
|------|------|
| [GO_local_phase1](../../frontend/evidence/GO_local_phase1/README.md) | **① 已闭环** 总验收 |
| [PHASE1-ENTERPRISE-CLOSURE-AUDIT](./PHASE1-ENTERPRISE-CLOSURE-AUDIT.md) | ① 垂直 CLOSED vs 全仓 ① 边界 |
| [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) | **② 未启动** 企业级缺口审计 · 防假完成 |
| [PHASE2-G1-ENV-ISOLATION-DECISION](./PHASE2-G1-ENV-ISOLATION-DECISION.md) | **G-1** 环境隔离签字模板 |
| [`check-phase2-onboarding-staging-ready.sh`](../../scripts/dev/check-phase2-onboarding-staging-ready.sh) | G-0～G-4 机读预检 |
| [`smoke-onboarding-testnet.sh`](../../scripts/dev/smoke-onboarding-testnet.sh) | ONB-P2-006 窄 ② 烟测 |
| [onboarding-fee-schedule.v1 §8.2](../spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施) | ONB-P2 backlog |
| [WEB3-HOME-PHASE2-BACKLOG](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-HOME-PHASE2-BACKLOG.md) | **`/`** Web3旅行 **②** WEB3-P2-001～012 |
| [TRAVELTRUST-NETWORK-PHASE2-BACKLOG](../../frontend/evidence/GO_local_web3_pages_closure/TRAVELTRUST-NETWORK-PHASE2-BACKLOG.md) | **`/traveltrust`** **②** TTNET-P2-001～008 |
| [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) | **三页筛选** **②** MKT-FILT-P2-001～012 · **③** MKT-FILT-P3-001～005 |
| [WEB3-LANDING-MARKET-LOCAL-REMAINING](../../frontend/evidence/GO_local_web3_pages_closure/WEB3-LANDING-MARKET-LOCAL-REMAINING.md) | **`/` + 三页市场** ① 剩余诚实清单 |
| [TT-9618](../runbook/TT-9618-onboarding-local-testnet.md) | ①② onboarding · Stripe · PG 证据 |
| [TT-9630](../runbook/TT-9630-protocol-convergence-testnet-pregate.md) | 合约部署前置 |
| [TT-9629](../runbook/TT-9629-protocol-convergence-steward-stake-testnet.md) | stake ② 顺序 |
| [acquisition-publish-trust-rules §8.2](../spec/artifacts/acquisition-publish-trust-rules.v1.md#82-第二阶段--②-测试网--待验backlog) | 收购垂直 **②** backlog |
| [96-18-未完成 · #9618-one-page-priority](../spec/96-18-未完成清单与多维检查.md#9618-one-page-priority) | 工作台账 |

---

## 9 · 变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：Phase ① 闭环后 **② Start Checklist**；**NOT STARTED**；五域启动条件 + 阻塞项 |
| 2026-05-28 | 互指 [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) |
| 2026-05-28 | 总态 [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · Prepared/Not Started |

---

**End of PHASE2-START-CHECKLIST · ② Prepared / Not Started · [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md)**
