# GO_local_phase1 · ① 本地总验收证据包

> **仓库总态（2026-05-28）：** **[Phase ① Freeze + Phase ② Prepared / Not Started](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)** — onboarding / Hub / **`fee_schedule_v1`** **仅维护**；**G-1/G-2 未清** 前 **不** 新增该三域功能 · **不** 启动 ② 实施（Stripe / staging / 测试网部署 / 链上 stake）。  
> **① 企业收口：** **[PHASE1-ENTERPRISE-CLOSURE-AUDIT](../../../docs/runbook/PHASE1-ENTERPRISE-CLOSURE-AUDIT.md)** — **本包垂直已闭环** · **全仓第一阶段 ≠ 100%** · **禁止** local/mock/窄切片冒充 staging GO。  
> **阶段治理（2026-05-29）：** **① 封版留痕已齐** — [`acceptance.latest.log`](./acceptance.latest.log) · **`TT_GO_LOCAL_PHASE1: OK`**；[`site10.acceptance.latest.log`](./site10.acceptance.latest.log) · **`TT_ENTERPRISE_SITE_10_LOCAL: OK`**。维护后复跑 §7e / §7g。长期 **Freeze 维护** + **② Prepared / Not Started** — [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)。  
> **合法宣称：** ② **严格 Not Started** — staging / Stripe / 测试网 / 链上 **实施或 GO** 须待 **G-1/G-2 清闸**（[START-CHECKLIST · §0](../../../docs/runbook/PHASE2-START-CHECKLIST.md#0--总入口闸phase-②-任何工作流开工前)）。
> **冻结 SSOT：** [PHASE1-FREEZE-ONBOARDING-HUB.md](./PHASE1-FREEZE-ONBOARDING-HUB.md)  
**① 维护者签字（2026-06-03）：** [PHASE1-OWNER-SIGNOFF-SEBASTIAN-WARD-20260603.md](./PHASE1-OWNER-SIGNOFF-SEBASTIAN-WARD-20260603.md) · **统一索引** [SOLO-MAINTAINER-SIGNATURE-INDEX.md](./SOLO-MAINTAINER-SIGNATURE-INDEX.md)（**Sebastian Ward · 塞巴斯蒂安·沃德** · **非 ②③ GO**）

**阶段：① 本地** — Identity 波 1 · 96-18 准入费全链路 · Hub · returnUrl · 社区资料命名 · **B 轨 `fee_schedule_v1`**。

**非本闸：** **②** Stripe / 测试网 PSP / 公网 webhook 真收单；**②③** TTG **链上真质押**（Anvil / testnet stake smoke **不**计入本包 **GO**）。

**子包 SSOT（分域细节）：**

| 域 | 路径 |
|----|------|
| **①.5 S1–S4 IT** | **`bash scripts/dev/run-phase15-s1-s4-it-green.sh`** · **`phase15_identity_s*`** + **`role_identity_dual_write_*`** |
| B 轨价目 + 对拍 | [`GO_local_onboarding_fee_schedule_v1`](../GO_local_onboarding_fee_schedule_v1/README.md) |
| 创新行程 · `/escrow/[id]` 订单页（① 已收口） | [`GO_local_web3_itinerary_l5`](../GO_local_web3_itinerary_l5/README.md) · [`ESCROW-ORDER-PAGE-PHASE1-CLOSURE`](../GO_local_web3_itinerary_l5/ESCROW-ORDER-PAGE-PHASE1-CLOSURE.md) |
| Auth / Hub / 命名 P3 | [`GO_local_auth_l5`](../GO_local_auth_l5/README.md) · [`ACCOUNT-NAV-NAMING-P3`](../GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) |
| 价目 spec §8 分阶 | [`onboarding-fee-schedule.v1 §8.1`](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md#81-第一阶段--①-本地--全链路2026-05-28) |
| ② PSP backlog（暂停） | [`onboarding-fee-schedule.v1 §8.2`](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施) |

---

## 1 · 全链路（B 轨 USDC · ① 资格闭环）

```
GET  quote (USDC · amount_minor)
  → POST payment-intents          (Idempotency-Key · jurisdictions)
  → GET  entitlements/me          (pending)
  → [产品] MeOnboardingUsdcFeePayment → 官方地址（须 env；① 可跳过）
  → POST internal/webhook           或  POST local-dev/mark-paid
  → GET  entitlements/me          (paid)
  → POST role-confirm
  → GET  /me                      (role = provider | region_steward)
  → Hub core card                 (payment_pending → confirm_pending → active)
```

**收款 SSOT：** [`ONBOARDING-B-TRACK-USDC-SSOT`](../../lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md) · **≠** ② `OnboardingFeePaid` 已验 · **≠** Stripe 默认路径。

| Hub 阶段（商家轨） | 条件 |
|--------------------|------|
| `payment_pending` | entitlement **pending** |
| `confirm_pending` | entitlement **paid** · `user.role` ≠ provider |
| `active` | `user.role` = provider |

**模型 SSOT：** `frontend/lib/me/meIdentitiesCoreCardModel.ts` · 烟测同源：`scripts/dev/assert-onboarding-hub-phase.mjs`

**主理人轨：** 须 **wallet verify** → steward application → admin approve → 同上 B 轨 onboarding；**Admin approve 后** Hub 可能已 `active`（role 先于 paid）；全链路烟测仍验 **paid + role-confirm**。**链上 stake** 见 [`smoke-steward-stake-anvil.sh`](../../../scripts/dev/smoke-steward-stake-anvil.sh)（**② · 不在本闸**）。

---

## 2 · returnUrl / return_url（① 契约 · 不出网 Stripe）

| 场景 | 行为 | SSOT |
|------|------|------|
| **登录门禁** | 未登录访问 `/me/onboarding` → `/auth/login?returnUrl=…` | `MeOnboardingPageMain.tsx` · `meOnboardingGuestAccess.ts` |
| **访客只读报价** | `from=steward_pending` \| `steward_register` \| `provider_register` \| `provider_pending` \| `identities_hub` | [`app/me/onboarding/README.md`](../../app/me/onboarding/README.md) |
| **登录/注册默认落点** | 无 `returnUrl` → **`/community` 动态** | `lib/auth/postAuthReturnPath.ts` · `loginPostAuthDefaultReturn.contract.test.ts` |
| **裸 `/community/me` 登录** | 无 `?tab=` 深链 → 动态（非资料壳） | `normalizeXiaohongshuCommunityReturn` |
| **显式 returnUrl** | onboarding / identities / market 等站内路径 **保留** | `safeInternalReturnPath` |
| **Checkout `return_url`（预留 ②）** | `onboardingReturnUrlForCheckout(role)` → `/me/onboarding` 或 `?role=region_steward` | `meOnboardingPageHelpers.ts` · `meOnboardingPage.contract.test.ts` |
| **① 实际扣款** | **无** Stripe Checkout；`psp.checkout_url` / `client_secret` 为 **null** | `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` 或内网 webhook |

**Vitest（returnUrl 机读）：** `meOnboardingPage` · `onboarding.http` · `loginPostAuthDefaultReturn`

---

## 3 · `/me/identities` 多重身份 Hub

| 项 | SSOT |
|----|------|
| 路由 | `/me` → redirect **`/me/identities`**（`app/me/page.tsx`） |
| UI 冻结 | [`ME-IDENTITIES-UI-FREEZE.md`](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md) |
| 核心卡阶段 | `meIdentitiesCoreCardModel.ts` · `useMeIdentitiesCoreCardSignals.ts` |
| 已开通 CTA | 商家 → `/market/provider` · 主理人 → `/governance?view=region` |
| 收购 PD-009 | 「进入子站」→ `/market/acquisition`（**非** region_steward 准入费） |
| 文档 | [`app/me/identities/README.md`](../../app/me/identities/README.md) |

**不改写** login `returnUrl` 语义；Hub 只读 entitlements + application 信号驱动阶段 pill。

---

## 4 · 社区资料命名（P3 · 禁止「个人中心」回漂）

| 入口 | 路由 | zh | en | i18n 键 |
|------|------|----|----|---------|
| **社区资料** | `/community/me` | 社区资料 | Community profile | `me_title` · `nav_community_profile` |
| **多重身份 Hub** | `/me/identities` | 多重身份 / 角色与入驻 | Multiple roles & onboarding | `header_multiIdentity` · `me_identities_hub_title` |
| **登录默认** | → `/community` | （动态 Feed） | （Feed） | `POST_AUTH_DEFAULT_RETURN_PATH` |

**机读：** `accountNavNamingP3.contract.test.ts` · `npm run test:i18n:ci` · E2E `communityMeLegacyAccessibleNameRe`

**文档：** [`ACCOUNT-NAV-NAMING-P3.md`](../GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md) · [`app/community/me/README.md`](../../app/community/me/README.md)

---

## 5 · B 轨 `fee_schedule_v1` 对拍

| 字段 | quote · payment-intent · entitlement 三方一致 |
|------|-----------------------------------------------|
| `fee_schedule_version` | `fee_schedule_v1` |
| `sku` | 价目表 SKU |
| `computed_amount_minor` | YAML 真值 |
| `amount_minor` | 扣款面（① local-dev 可为 `0`） |
| `jurisdictions[]` | ISO2 列表 |
| `refund_policy_version` | `fee_schedule_v1_refund_policy` |
| `renewal_policy_version` | `fee_schedule_v1_renewal_none` |

**Rust：** `crates/api/src/routes/onboarding/fee_schedule_v1.rs` · **YAML：** `docs/spec/artifacts/onboarding-fee-schedule.v1.yaml`

---

## 6 · 环境前置（①）

| 变量 | 用途 |
|------|------|
| `DATABASE_URL` | PG 迁移库 |
| `INTERNAL_API_SECRET` | 内网 webhook 烟测 |
| `SEED_TEST_ACCOUNTS=1` | steward admin approve |
| `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` | ① 零金额 + `local-dev/mark-paid` |
| `NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1` | FE「模拟已支付」按钮（可选） |

**API 须为当前代码构建**（旧进程 quote 可能仍 `stub-v0`）。见 [TT-9618 §1](../../../docs/runbook/TT-9618-onboarding-local-testnet.md)。

---

## 7 · 推送前总闸命令（须自留 exit 0）

### 7a · Rust · B 轨 + 全链路 PG

```bash
cargo test -p traveltrust-api fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_008_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_009_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_010_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_011_f035_fee_schedule_v1_full_chain
```

### 7b · API 烟测（全链路 · 无 PSP）

```bash
bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh
bash scripts/dev/smoke-onboarding-full-chain-local.sh
MARK_PAID_MODE=local_dev bash scripts/dev/smoke-onboarding-full-chain-local.sh   # 可选 · 须 API TRAVELTRUST_ONBOARDING_LOCAL_DEV=1
bash scripts/dev/smoke-provider-onboarding-local.sh
bash scripts/dev/smoke-steward-onboarding-local.sh
```

### 7c · Frontend · Console L5 + Hub + returnUrl + 命名 P3

```bash
cd frontend
npm run test:i18n:ci
npm run test -- \
  accountNavNamingP3 loginPostAuthDefaultReturn \
  meOnboardingUiFreeze meOnboardingPage meOnboardingViewModel meOnboardingPageHelpers \
  meIdentitiesCoreCardModel meIdentitiesUiFreeze meIdentitiesL5 meIdentitiesPage \
  onboarding.http authLoginUiFreeze authRegisterUiFreeze loginPageL5 authRegisterL5 \
  authFlowL5 authRouteL5 authL5FullScore uiSystem \
  providerRegisterL5 stewardRegisterL5 stewardRegisterUiFreeze meTrust \
  --run
```

### 7d · 一键编排（可选 · 仅 onboarding + Hub 切片）

```bash
bash scripts/dev/run-go-local-phase1-acceptance.sh
```

### 7e · G-0 封版留痕 · Phase1 总闸（**已落盘**）

```bash
bash scripts/dev/record-go-local-phase1-acceptance-log.sh
# → ./acceptance.latest.log（须含 TT_GO_LOCAL_PHASE1: OK）
```

### 7g · 全站企业 10 分（① 本地 · L5 全链路全矩阵 · **高于** §7d/§7f）

**定义 SSOT：** [ENTERPRISE-SITE-10-L5-MATRIX](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md)

```bash
bash scripts/dev/record-enterprise-site-10-acceptance-log.sh
# → ./site10.acceptance.latest.log（须含 TT_ENTERPRISE_SITE_10_LOCAL: OK）
# 或直跑：bash scripts/dev/run-enterprise-site-10-local.sh
# 前置：API :8080 · DATABASE_URL · P3_CHAIN_OFF=1（收购 mock-pay / 走廊 E2E）
# 可选长跑 E2E：ENTERPRISE_SITE_10_FULL_E2E=1
```

| 末行 | 含义 |
|------|------|
| `TT_ENTERPRISE_SITE_10_LOCAL: OK` | ① **全站**机读 10（含 Phase1 + A+B + 垂直烟测 + **订单走廊** + **走廊 10**） |
| `TT_ORDERS_CORRIDOR_LOCAL: OK` | 子步骤 · `/orders` 列表 L5 + 烟测 + 可选 E2E（[GO_local_orders_l5](../GO_local_orders_l5/README.md)） |
| `TT_ENTERPRISE_LOCAL_10: OK` | 子步骤 · Web3 走廊 only |
| `TT_GO_LOCAL_PHASE1: OK` | 子步骤 · onboarding/Hub |

**② 测试网 / ③ 生产 / 公网：** 同 runbook **§2～§3**（**非** 本闸可宣称范围）。

### 7f · 可选 · Web3 创新行程走廊「10 分」（**非** `TT_GO_LOCAL_PHASE1` 子集）

Landing → 解锁 → Escrow 保存发布 → Market `bindGuideToOrder`。**独立总闸**，与 §7d onboarding/Hub 正交。

```bash
bash scripts/dev/run-enterprise-local-10.sh
# 无浏览器：SKIP_E2E=1 bash scripts/dev/run-enterprise-local-10.sh
```

| 末行 | 含义 |
|------|------|
| `TT_ENTERPRISE_LOCAL_10: OK` | ① 走廊机读 10 分（含 E2E 时须 API :8080） |
| `TT_WEB3_ITINERARY_L5_GREEN: OK` | 子步骤 · L5 vitest |
| `TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK` | 子步骤 · API 全链 |

SSOT：[GO_local_enterprise_10](../GO_local_enterprise_10/README.md) · [GO_local_web3_itinerary_l5](../GO_local_web3_itinerary_l5/README.md)

---

## 8 · 烟测 / 闸末行 grep

| 脚本 | 成功末行 |
|------|----------|
| `smoke-onboarding-fee-schedule-v1-local.sh` | `TT_SMOKE_ONBOARDING_FEE_SCHEDULE_V1: OK alignment (① only)` |
| `smoke-onboarding-full-chain-local.sh` | `TT_SMOKE_ONBOARDING_FULL_CHAIN: OK (① local · no PSP · no on-chain)` |
| `smoke-provider-onboarding-local.sh` | `TT_SMOKE_PROVIDER_ONBOARDING: OK` |
| `smoke-steward-onboarding-local.sh` | `TT_SMOKE_STEWARD_ONBOARDING: OK full local chain (① only)` |
| `run-go-local-phase1-acceptance.sh` | `TT_GO_LOCAL_PHASE1: OK (① local total gate · no Stripe · no testnet · no on-chain stake)` |
| `run-enterprise-local-10.sh` | `TT_ENTERPRISE_LOCAL_10: OK`（**可选** · 走廊 10 · **非** Phase1 总闸） |
| `run-enterprise-site-10-local.sh` | `TT_ENTERPRISE_SITE_10_LOCAL: OK`（**全站 10** · ① only · 见 [ENTERPRISE-SITE-10-L5-MATRIX](../../../docs/runbook/ENTERPRISE-SITE-10-L5-MATRIX.md)） |
| `run-orders-corridor-local.sh` | `TT_ORDERS_CORRIDOR_LOCAL: OK`（**订单走廊** · [GO_local_orders_l5](../GO_local_orders_l5/README.md)） |
| `record-orders-corridor-acceptance-log.sh` | 写入 `GO_local_orders_l5/acceptance.latest.log` |
| `record-enterprise-site-10-acceptance-log.sh` | 写入 `site10.acceptance.latest.log`（须含上列末行） |

---

## 9 · 诚实边界（禁止跳阶 · 禁止假完成）

| 项 | 阶段 | 说明 |
|----|------|------|
| Stripe PI / Checkout / 公网 webhook | **② backlog** | [`§8.2`](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施) **暂停** · 开工前读 **[Phase ② Start Checklist](../../../docs/runbook/PHASE2-START-CHECKLIST.md)** |
| 测试网 PSP 真收单 | **②** | 非 local-dev 零金额 |
| TTG 链上 stake 真值 | **②** | `smoke-steward-stake-anvil.sh` / testnet readonly |
| Production GO | **③** | `go-live-checklist` |
| 本包 **GO** | **① 本地** | 文档 + 矩阵 + 烟测 **exit 0** **不得**冒充 **②③** |

---

## 10 · Phase ②（未启动 · 仅清单）

**Phase ① 封版留痕已齐。** 下一步 **不** 写新功能、**不** 启动 ②，仅 **Freeze 维护** 与 ② 规划：

→ **[Phase ② Start Checklist](../../../docs/runbook/PHASE2-START-CHECKLIST.md)**（Stripe/PSP · 测试网合约 · 链上 stake 对拍 · webhook · staging smoke · 启动条件与阻塞项）  
→ **[Phase ② 企业级缺口审计](../../../docs/runbook/PHASE2-ENTERPRISE-GAP-AUDIT.md)**（**② 未启动** · 宽/窄 ② 从属 · 防 ① mock 冒充 staging GO）  
→ **G-0 日志：** §7e `acceptance.latest.log` · §7g `site10.acceptance.latest.log`

---

## 11 · 路由 README 互指

| 路由 | README |
|------|--------|
| `/me/onboarding` | [`app/me/onboarding/README.md`](../../app/me/onboarding/README.md) |
| `/me/identities` | [`app/me/identities/README.md`](../../app/me/identities/README.md) |
| `/community/me` | [`app/community/me/README.md`](../../app/community/me/README.md) |
| `/auth/login` | [`app/auth/login/README.md`](../../app/auth/login/README.md) |

---

**End of GO_local_phase1 · ① local total acceptance**
