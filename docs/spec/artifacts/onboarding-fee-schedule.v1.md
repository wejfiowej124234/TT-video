# 平台准入费价目表 · fee_schedule_v1（运营 SKU 层 · B 轨）

**Version:** `fee_schedule_v1`  
**Artifact:** `onboarding-fee-schedule.v1`  
**Status:** **Target** — **结构与弱联动规则 LOCKED**；**USDC 标价** 为 **运营草案**（须财务 / 法务书面后改为 **Locked**）；**① 本地** API 仍可 **`amount_minor: 0`**（见 **§7**），**不** 冒充 **②③** 生产价。**收款 SSOT：** [`ONBOARDING-B-TRACK-USDC-SSOT`](../../../frontend/lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md)。  
**阶段：** **① 本地**（**USDC → 官方地址** · 见 **`ONBOARDING-B-TRACK-USDC-SSOT`**) → **② 测试网**（`OnboardingFeePaid` 索引 · 可选 Stripe 旁路） → **③ 生产主网收款**（另闸）。

**硬边界（双轨）：**

- **本文件 = B 轨唯一写入口**（`fee_schedule_version`、Tier、辖区、**USDC 金额**、多国增购、续费、退款政策）。  
- **protocol-ssot = A 轨唯一写入口**（`steward_stake_bps`、`fee_route_bps`、锁仓、供应）。  
- **禁止** 在本文件出现 **`steward_stake_bps` / TTG 枚数 / 质押池地址**；**禁止** 在 protocol-ssot 写准入费 **USDC 金额**（金额 **只** 在本表）。

**客户可见 UI 命名（2026-06-12 · 工作台 / Hub · 与本 spec 内部 A/B 不同）：**

| 客户/UI | 含义 | 代码 SSOT |
|---------|------|-----------|
| **A 轨** | 平台 **USDC 准入费** + 身份确认 | 商家：`/me/onboarding` · 主理人：[`stewardAdmissionNav.ts`](../../../frontend/lib/steward/stewardAdmissionNav.ts) |
| **B 轨** | **TTG 链上质押**（主理人工作台） | `/governance?view=region#steward-ttg-stake` |
| **本 spec B 轨** | USDC SKU（运营层） | 本节 §3 |
| **本 spec A 轨** | protocol / TTG bps | protocol-ssot |

**机读镜像：** [onboarding-fee-schedule.v1.yaml](onboarding-fee-schedule.v1.yaml)  
**流程 SSOT：** [96-18 §3.5～§3.6](../96-18-商家与主理人准入费用与治理币兑换设计.md) · [04-附录](../04-附录-商家主理人准入费HTTP契约草案-配96-18.md) · **96-18 §3.5 [双轨弱联动](../96-18-商家与主理人准入费用与治理币兑换设计.md#9618-dual-track-weak-linkage)**

---

## §0 读前摘要

| 你要定什么 | 本节 |
|------------|------|
| **版本号字符串** | **`fee_schedule_v1`**（DB `onboarding_entitlements.fee_schedule_version`、quote 响应） |
| **Tier 从哪来** | **只读对齐** [protocol-ssot §4](../governance-token/protocol-ssot.v1.md) 的 **`tier` 标签**（S/A/B），**不** 复制 bps |
| **商家价** | **§3.1** |
| **主理人多国价** | **§3.2** |
| **续费** | **§4**（v1 **未启用**） |
| **退款** | **§5** |
| **① 本地 $0** | **§7** |
| **HTTP 字段** | **§6** |

---

## §1 命名与版本纪律

| 键 | 值 | 说明 |
|----|-----|------|
| **`fee_schedule_version`** | **`fee_schedule_v1`** | 对外 API / DB **稳定版本串**；改价目 **结构或规则** → bump **`fee_schedule_v2`** |
| **`refund_policy_version`** | **`fee_schedule_v1_refund_policy`** | 与价目 **同批** 变更；quote 须返回 |
| **`renewal_policy_version`** | **`fee_schedule_v1_renewal_none`** | v1 **无续费 SKU** |

**改 B 轨 checklist（不涉及 protocol-ssot）：**

1. 改本文件 + **yaml 镜像**  
2. bump **`fee_schedule_version`**（若 breaking）  
3. **04 §3.4** / Admin 价目 / 实现 **`GET …/onboarding/quote`** 计价器  
4. **08-4** 对外一句价（若变更）  
5. **不** 改 `steward_stake_bps` **除非** 单独立项改 A 轨  

---

## §2 Tier 与辖区（弱联动 · 只借标签）

**规则：** `jurisdiction_tier_map` **必须与** protocol-ssot **§4 表** 中 **`tier` 列一致**（增删辖区时 **先** 改 protocol-ssot，**再** 在本表补一行 **tier 标签**，**禁止** 在本表自造 tier）。

| jurisdiction | tier（标签） | 用途 |
|--------------|--------------|------|
| CN, US, FR, ES | **S** | 战略 / 高合规成本市场 |
| JP, TH, SG, KR | **A** | 成长市场 |
| AU, AE | **B** | 试点 / 较低运营档位 |

**禁止：** 用 tier 推导 `steward_stake_bps` 或反推准入费 **百分比**。

---

## §3 一次性准入费（SKU）

金额单位：**`amount_minor`**（**USDC** 两位小数标价，如 **29900 = 299.00 USDC**）；默认币种 **`USDC`**。链上收款至 **`ONBOARDING_FEE_RECEIVER_ADDRESS`**（官方地址 / `OnboardingFeeReceiver`）。**原则上不退**（平台运营费 · 与可赎回身份质押分路径）。以下标价为 **Target 草案**，上线前须运营 / 财务确认。

### §3.1 商家 `provider`

| SKU | `provider_onboarding_default` |
|-----|-------------------------------|
| 计费 | **一次性**；默认 **单辖区** 商家橱窗叙事 |
| **S** 档 | **29,900** minor（**299.00 USDC**） |
| **A** 档 | **19,900** minor（**199.00 USDC**） |
| **B** 档 | **14,900** minor（**149.00 USDC**） |
| 辖区 | 若未来按 ISO 覆写，写在 yaml **`jurisdiction_override`**，**不** 改 protocol-ssot |

### §3.2 区域主理人 `region_steward`

| SKU | `region_steward_onboarding_default` |
|-----|-------------------------------------|
| 计费 | **一次性** + **多国增购**（与质押 **bps 累加** 正交） |

**首国（按该国 tier 全价）：**

| tier | amount_minor（草案） |
|------|----------------------|
| **S** | **49,900**（**499.00 USDC**） |
| **A** | **34,900**（**349.00 USDC**） |
| **B** | **24,900**（**249.00 USDC**） |

**增国（`tiered_additive`）：**

- 第 2 国起：每增加一国，加收 **该国 tier 基价 × 35%**（**3500 bps**）。  
- **例：** US(S) 首国 **49,900** + FR(S) 增国 **round(49,900×35%) = 17,465** → 合计 **67,365** minor（**$673.65**）；与链上质押 US+FR **bps 累加**无关。  
- **上限：** 最多 **5** 国；总价不超过 **首国基价 × 250%**（**25000 bps** cap，防异常组合）。

**报价分解（quote 可选字段）：** `jurisdiction_breakdown[]`：`{ jurisdiction, tier, line_amount_minor }` — **仅 B 轨**，**不含** TTG。

---

## §4 续费（v1 未启用）

| 项 | v1 结论 |
|----|---------|
| **年续费 / 席位费** | **未启用**（`renewal.enabled: false`） |
| **未来启用** | 新建 **`renewal_sku`** 或 **`fee_schedule_v2`**；**须** 96-18 + 04 同批；**不得**  sneak 进 v1 quote |

---

## §5 退款规则（`fee_schedule_v1_refund_policy`）

| ID | 事件 | 准入资格状态 | 退款 |
|----|------|--------------|------|
| **R1** | 申请 **审核拒绝** 且 **未** `role-confirm` | `paid` | **原则上不退**（平台 USDC 运营费）；个案退款须运营/法务书面政策（**非**自动链上退还） |
| **R2** | 幂等重放同一 `idempotency_key` | 不变 | **不退**（**409** 叙事见 04-附录） |
| **R3** | 拒付 / 争议败诉 | → `revoked` | **不退**；资格撤销 |
| **R4** | ① `local_dev` 模拟已付 | — | **不适用**（非真实扣款） |

**明确不退：** 主理人 **已完成 role-confirm** 后的「主观退出」——须走 **治理 / 合同** 通道，**不** 由本价目表自动承诺链上 TTG 退还。

---

## §6 HTTP / DB 消费（与 A 轨分离）

| 路径 / 表 | 消费本价目表 | 禁止 |
|-----------|--------------|------|
| **`GET /api/v1/onboarding/quote`** | `fee_schedule_version=fee_schedule_v1` → 计价 | 返回 `steward_stake_bps` |
| **`POST …/payment-intents`** | 持久化 **`fee_schedule_version` + `sku` + `amount_minor`** | 写入质押状态 |
| **`GET …/entitlements/me`** | 回显 **`fee_schedule_version`** | 代替 `stake-status` |
| **`GET …/steward/stake-quote`** | — | **只读 A 轨** protocol-ssot |

**当前实现（①）：** **`GET /api/v1/onboarding/quote`** 与 **`POST /api/v1/onboarding/payment-intents`** 默认 **`fee_schedule_version=fee_schedule_v1`**，共用 **`fee_schedule_v1.rs`** 计价；**`metadata.fee_schedule`** 持久化对拍字段；**`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`** 时 **`amount_minor=0`**。**证据闸：** [`frontend/evidence/GO_local_onboarding_fee_schedule_v1/README.md`](../../../frontend/evidence/GO_local_onboarding_fee_schedule_v1/README.md) · **`bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh`** · **`cargo test -p traveltrust-api matrix_93_b_onb_008_f035_fee_schedule_v1`**。

---

## §7 ① 本地开发覆盖（非生产价）

当 **`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`**（API）时：

- Quote / PaymentIntent 可走 **`amount_minor: 0`** **覆盖**（流程联调），**仍须** 响应 **`fee_schedule_version: fee_schedule_v1`**（或显式 `stub-v0` 直至计价器接线）。  
- **`refund_policy_version`** 仍返回 **`fee_schedule_v1_refund_policy`**，避免前端分支漂移。  
- **禁止** 在 **③ 生产** 保留该覆盖。

---

## §8 验收分阶（① CLOSED · ②③ backlog）

### 8.1 第一阶段 · **① 本地 — 全链路（2026-05-28 · CLOSED · Freeze）**

> **Phase ① Freeze（2026-05-28）：** onboarding / Hub 准入轨 / **`fee_schedule_v1`** — **仅** bugfix · 证据 · 注释；**②** 见 [PHASE2-START-CHECKLIST](../../runbook/PHASE2-START-CHECKLIST.md) **G-0～G-4**。  
> **SSOT：** [PHASE1-FREEZE-ONBOARDING-HUB](../../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md)

**范围：** **① 默认** **USDC**（`MeOnboardingUsdcFeePayment` · 官方地址；**无 env 时** 仅披露 + 内网闭环）；**无** 测试网真链索引 / **无** Stripe 出网；资格推进仍靠内网 webhook 或 **`local-dev/mark-paid`**。

| 步骤 | 路径 / 机制 |
|------|-------------|
| 1 报价 | `GET /api/v1/onboarding/quote` |
| 2 支付意图 | `POST /api/v1/onboarding/payment-intents` |
| 3 资格 | `GET /api/v1/onboarding/entitlements/me`（**pending**） |
| 4 模拟已付 | `POST /api/v1/internal/onboarding/payments/webhook` **或** `POST …/local-dev/mark-paid` |
| 5 身份确认 | `POST /api/v1/onboarding/role-confirm` |
| 6 Hub / 完成态 | `GET /me` **role** + Hub **`payment_pending` → `confirm_pending` → `active`**（[`meIdentitiesCoreCardModel`](../../../frontend/lib/me/meIdentitiesCoreCardModel.ts) 同源烟测） |

**① 证据闸（须 exit 0）：**

```bash
cargo test -p traveltrust-api matrix_93_b_onb_008_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_011_f035_fee_schedule_v1_full_chain
bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh
bash scripts/dev/smoke-onboarding-full-chain-local.sh
```

**SSOT 证据包：** [`frontend/evidence/GO_local_phase1/README.md`](../../../frontend/evidence/GO_local_phase1/README.md) · [`GO_local_onboarding_fee_schedule_v1`](../../../frontend/evidence/GO_local_onboarding_fee_schedule_v1/README.md)

**诚实边界：** 主理人 **TTG 链上质押**（A 轨）**不**在本闸；见 **`/me/onboarding` 质押段** 与 **`smoke-steward-stake-anvil.sh`**（**②** backlog）。

### 8.2 第二阶段 · **② 测试网 — 待验（backlog · 暂停实施）**

> **状态：暂停。** 在 **§8.1 ① 全链路** 稳定 **exit 0** 前 **不** 开 **②** 测试网真链索引 / Stripe 出网。  
> **产品默认：** **USDC → `ONBOARDING_FEE_RECEIVER_ADDRESS`**（**非** Stripe 美元 SKU）。  
> **② 开工前清单：** [PHASE2-START-CHECKLIST](../../runbook/PHASE2-START-CHECKLIST.md)

| ID | 项 | 说明 |
|----|-----|------|
| **ONB-P2-USDC-001** | **USDC 链上收款（默认）** | 部署 **`OnboardingFeeReceiver`** · **`ONBOARDING_FEE_RECEIVER_ADDRESS`** · **`indexer-tick`** → **`onboarding_fee_paid_events`** |
| **ONB-P2-USDC-002** | 前端 **`pay()` / transfer` 对拍** | quote **`amount_minor`** ↔ 链上 **`OnboardingFeePaid`** ↔ entitlement **`paid`** |
| **ONB-P2-001** | Stripe PaymentIntent（**可选旁路**） | `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1` · 金额读 **`metadata.fee_schedule.amount_minor`**（**USDC minor**） |
| **ONB-P2-002** | Stripe Checkout | `TRAVELTRUST_ONBOARDING_STRIPE_CHECKOUT=1` · **`return_url`** 闭环 |
| **ONB-P2-003** | 公网 webhook | `POST /api/v1/hooks/stripe/onboarding` · 验签 · **`payment_intent.succeeded`** |
| **ONB-P2-004** | 测试网 PSP 真收单 | staging **`DATABASE_URL`** + Stripe test mode · **非** ① local-dev 零金额 |
| **ONB-P2-005** | ② 对拍回归 | quote / PI / entitlement 与 **Stripe 对象 amount** 三方对拍 |
| **ONB-P2-006** | staging 烟测 | `smoke-onboarding-*-testnet.sh`（**待建**） |

**互指：** [TT-9618 §3.2](../../runbook/TT-9618-onboarding-local-testnet.md) · [04-附录 §2](04-附录-商家主理人准入费HTTP契约草案-配96-18.md) · [96-18 §12.5](96-18-商家与主理人准入费用与治理币兑换设计.md)

### 8.3 第三阶段 · **③ 公网生产 — 待验（backlog）**

| ID | 项 |
|----|-----|
| **ONB-P3-001** | 主网 **`ONBOARDING_FEE_RECEIVER_ADDRESS`** + **`go-live-checklist`** |
| **ONB-P3-002** | 禁止 **`TRAVELTRUST_ONBOARDING_LOCAL_DEV=1`** 与零金额覆盖 |
| **ONB-P3-003** | **`fee_schedule_v1_refund_policy`** 运营披露（**原则上不退**；**非** PSP 自动原路退） |

---

## §9 变更记录

| Version | Date | Note |
|---------|------|------|
| `fee_schedule_v1` | 2026-05-28 | **Phase ① Freeze** · [PHASE1-FREEZE-ONBOARDING-HUB](../../../frontend/evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md) |
| `fee_schedule_v1` | 2026-05-28 | §8.2 互指 [PHASE2-START-CHECKLIST](../../runbook/PHASE2-START-CHECKLIST.md) |
| `fee_schedule_v1` | 2026-05-28 | §8.1 ① 全链路证据闸；§8.2 **② Stripe/PSP backlog（暂停）** |
| `fee_schedule_v1` | 2026-05-28 | 初版：B 轨价目 SSOT；双轨解耦；多国增购；退款；续费占位 |
| `fee_schedule_v1` | 2026-06-12 | **产品对齐**：B 轨默认 **USDC** 官方收款 · **原则上不退**；§8.2 增 **ONB-P2-USDC**；互指 **ONBOARDING-B-TRACK-USDC-SSOT** |

---

**End of onboarding-fee-schedule.v1**
