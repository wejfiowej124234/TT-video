# `/me/onboarding` — 商家/主理人准入费（96-18 · ① · Identity 波 1）

> **Phase ① Freeze（2026-05-28）：** **仅** bugfix · 证据 · 注释；**无** 新功能。**②** 链上 `OnboardingFeePaid` 索引 · **③** 生产另闸 → [PHASE2-START-CHECKLIST](../../../../docs/runbook/PHASE2-START-CHECKLIST.md)

**B 轨 USDC SSOT：** [`lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md`](../../../lib/onboarding/ONBOARDING-B-TRACK-USDC-SSOT.md)

**全链 SSOT：** [`/provider/register` README](../../provider/register/README.md) · [`/steward/register` README](../../steward/register/README.md)

## 收款（写死 · 2026-06-12）

| 项 | 实现 |
|----|------|
| **币种** | **USDC**（非 PSP 美元默认路径） |
| **收款** | **官方地址** `ONBOARDING_FEE_RECEIVER_ADDRESS` / `OnboardingFeeReceiver` |
| **性质** | 平台运营费 · **原则上不退** |
| **≠** | 身份质押（可赎回）· Escrow · TTG 质押（A 轨） |
| **UI** | `MeOnboardingUsdcFeePayment`（钱包 `transfer` USDC） |
| **遗留 Stripe** | 仅当未配置 USDC 收款且 `TRAVELTRUST_ONBOARDING_STRIPE_ENABLED=1`（**②** 旁路） |

## 现行路由

| 项 | 实现 |
|----|------|
| 入口 | **`page.tsx`** → **`MeOnboardingPageMain.tsx`** |
| **B 轨披露** | **`bTrackDisclosure*`**：USDC 官方收款 · **不退** |
| **与质押分工** | 本页 **仅 B 轨**；向导无本页 → [`GUIDE-ONBOARDING-STAKING-FLOW`](../../lib/guide/GUIDE-ONBOARDING-STAKING-FLOW.md) |
| API | `GET /api/v1/onboarding/quote` · `POST …/payment-intents` · `GET …/entitlements/me` · `POST …/role-confirm` |
| 价目 | `docs/spec/artifacts/onboarding-fee-schedule.v1.yaml` · **`currency: USDC`** |

## 环境（①）

| API | `ONBOARDING_FEE_RECEIVER_ADDRESS` |
| 前端 | `NEXT_PUBLIC_ONBOARDING_FEE_RECEIVER_ADDRESS` · `NEXT_PUBLIC_USDC_TOKEN_ADDRESS` |
| 本地 dev | `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` · `NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1` |

烟测：`bash scripts/dev/smoke-onboarding-full-chain-local.sh` · `bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh`
