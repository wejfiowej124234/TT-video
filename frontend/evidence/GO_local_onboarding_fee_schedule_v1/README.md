# B 轨 · fee_schedule_v1 · ① 本地证据闸

**总验收包：** [`GO_local_phase1`](../GO_local_phase1/README.md)（Identity 波 1 · ① 本地总闸）

**阶段：① 本地** — quote / payment-intent / entitlement **对拍** + **全链路**（**USDC 产品叙事** · 资格仍靠 webhook / local-dev；**无** ② indexer）；**②** `OnboardingFeePaid` / 可选 Stripe **暂停** — 见 [onboarding-fee-schedule.v1 §8.2](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施) · [`ONBOARDING-B-TRACK-USDC-SSOT`](../../lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md)

**SSOT：** [onboarding-fee-schedule.v1.md](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md) · [onboarding-fee-schedule.v1.yaml](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.yaml) · `crates/api/src/routes/onboarding/fee_schedule_v1.rs`

---

## ① 全链路（USDC 叙事 · 资格闭环无 ② 真链）

```
quote (currency=USDC) → payment-intent → entitlements(pending)
  → [可选] MeOnboardingUsdcFeePayment transfer（须 env）
  → webhook 或 local-dev/mark-paid → entitlements(paid)
  → role-confirm → GET /me(role) → Hub active
```

| Hub 阶段 | 条件（商家轨） |
|----------|----------------|
| `payment_pending` | entitlement **pending** |
| `confirm_pending` | entitlement **paid**，`user.role` ≠ provider |
| `active` | `user.role` = provider |

主理人 **Admin approve** 后可能已是 `region_steward`；全链路烟测仍验 **paid + role-confirm**，**链上质押** 不在本闸。

---

## 对拍字段（三方须一致）

| 字段 | 说明 |
|------|------|
| `fee_schedule_version` | `fee_schedule_v1` |
| `sku` | 价目表 SKU |
| `computed_amount_minor` | YAML 计价真值 |
| `amount_minor` | 扣款面（local-dev 可为 `0`） |
| `jurisdictions` | ISO2 列表 |
| `refund_policy_version` | `fee_schedule_v1_refund_policy` |
| `renewal_policy_version` | `fee_schedule_v1_renewal_none` |

---

## 推送前命令（须自留 exit 0）

```bash
# B 轨对拍（单元 + PG）
cargo test -p traveltrust-api fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_008_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_009_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_010_f035_fee_schedule_v1
cargo test -p traveltrust-api matrix_93_b_onb_011_f035_fee_schedule_v1_full_chain

# ① 烟测（API + DATABASE_URL + INTERNAL_API_SECRET）
bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh
bash scripts/dev/smoke-onboarding-full-chain-local.sh

# 可选：local-dev mark-paid 路径（API TRAVELTRUST_ONBOARDING_LOCAL_DEV=1）
MARK_PAID_MODE=local_dev bash scripts/dev/smoke-onboarding-full-chain-local.sh

# 前端 onboarding 页 + Hub（Console L5 绿集）
cd frontend && npm run test -- meOnboardingPage meOnboardingViewModel meIdentitiesCoreCardModel onboarding.http --run
```

**烟测成功末行：**

- `TT_SMOKE_ONBOARDING_FEE_SCHEDULE_V1: OK alignment (① only)`
- `TT_SMOKE_ONBOARDING_FULL_CHAIN: OK (① local · no PSP · no on-chain)`

**local-dev UI：** API `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` + FE `NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1` → `/me/onboarding` **模拟已支付** 按钮（等同 `local-dev/mark-paid`）。

---

## Phase ② backlog（暂停 · 勿跳阶）

| ID | 项 |
|----|-----|
| ONB-P2-001～006 | Stripe PI / Checkout / webhook / 测试网真收单 / ② 对拍 / staging 烟测 |

详见 [onboarding-fee-schedule.v1 §8.2](../../../docs/spec/artifacts/onboarding-fee-schedule.v1.md#82-第二阶段--②-测试网--待验backlog--暂停实施) · **② 开工前** [PHASE2-START-CHECKLIST](../../../docs/runbook/PHASE2-START-CHECKLIST.md)（**未启动**）。

---

## 机读辅助

| 路径 | 用途 |
|------|------|
| `fee_schedule_v1::assert_fee_schedule_v1_alignment_triple` | Rust PG·IT |
| `scripts/dev/assert-fee-schedule-v1-alignment.mjs` | B 轨字段对拍 |
| `scripts/dev/assert-onboarding-hub-phase.mjs` | Hub 阶段断言 |
