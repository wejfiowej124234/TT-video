# `/me/onboarding` — 商家/主理人准入费（96-18 · ① · Identity 波 1）

> **Phase ① Freeze（2026-05-28）：** **仅** bugfix · 证据 · 注释；**无** 新功能。**②** Stripe/PSP/staging → [PHASE2-START-CHECKLIST](../../../../docs/runbook/PHASE2-START-CHECKLIST.md) **G-0～G-4** · [PHASE1-FREEZE-ONBOARDING-HUB](../../evidence/GO_local_phase1/PHASE1-FREEZE-ONBOARDING-HUB.md)

**阶段：** **① 本地**。**全链 SSOT：** [`/provider/register` README](../../provider/register/README.md) · [`/steward/register` README](../../steward/register/README.md)

## 现行路由（代码 · 2026-05-28）

| 项 | 实现 |
|----|------|
| 入口 | **`page.tsx`** → **`MeOnboardingPageMain.tsx`**（Suspense + `loading.tsx`） |
| URL **`?role=region_steward`** | **`useMeOnboardingPage`** · **`parseOnboardingQuoteRoleParam`**；切换角色同步 `history.replaceState` |
| 进度条 | **Console L5** → **`MeOnboardingConsoleProgress`** step=3（浅色可折叠；**非** Auth 暗色 `Provider/StewardOnboardingProgress`） |
| 信息展示 | **`MeOnboardingSummaryGrid`** + 金额 Hero + **`MeOnboardingNextStep`** / 完成 **`MeOnboardingDonePanel`**；JSON 仅 dev 折叠 |
| 壳 | Console 浅色 · **`TT_MARKETING_ACCOUNT_PAGE_SHELL`** · **`data-tt-me-onboarding-console-l5`**（**非** Auth L5 暗玻璃） |
| API | `GET /api/v1/onboarding/quote` · `POST …/payment-intents` · `GET …/entitlements/me` · `POST …/role-confirm` |
| **访客门禁（企业级）** | 无账号会话且 URL **无**合法 `from=` / Stripe 回跳 → **`/auth/login?returnUrl=…`**；允许未登录只读报价：`from=steward_pending` \| `steward_register` \| `provider_register` \| `provider_pending` \| `identities_hub`（见 **`meOnboardingGuestAccess.ts`**） |

## 与入驻五步的关系

| 角色 | 本页在链路中 |
|------|----------------|
| **商家** | **step 3（准入费）** ← `/provider/register` 提交后 |
| **主理人** | **step 3（准入费 · 身份确认）** ← `/steward/register` 提交后 |

## 环境（①）

见 [TT-9618 §1](../../../../docs/runbook/TT-9618-onboarding-local-testnet.md)：`DATABASE_URL` · `INTERNAL_API_SECRET` · 可选 `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` · `NEXT_PUBLIC_ONBOARDING_LOCAL_DEV_TOOLS=1`。

**① 全链路烟测（无 PSP）：** [`scripts/dev/smoke-onboarding-full-chain-local.sh`](../../../../scripts/dev/smoke-onboarding-full-chain-local.sh) · **总验收 SSOT** [`GO_local_phase1`](../../evidence/GO_local_phase1/README.md) · [`GO_local_onboarding_fee_schedule_v1`](../../evidence/GO_local_onboarding_fee_schedule_v1/README.md) · **② Stripe/PSP 暂停**（backlog §8.2）。

## 验收（Identity 波 1 · ① · Console L5 已锁）

```bash
cd frontend && npm run test -- meOnboardingUiFreeze meOnboardingPage meOnboardingViewModel meIdentitiesCoreCardModel onboarding.http authLoginUiFreeze authRegisterUiFreeze loginPageL5 authRegisterL5 authFlowL5 authRouteL5 authL5FullScore meIdentitiesUiFreeze meIdentitiesL5 meIdentitiesPage providerRegisterL5 stewardRegisterL5 stewardRegisterUiFreeze --run
bash scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh
bash scripts/dev/smoke-onboarding-full-chain-local.sh
bash scripts/dev/smoke-provider-onboarding-local.sh
bash scripts/dev/smoke-steward-onboarding-local.sh
```

**Console L5 冻结 SSOT：** [`ME-ONBOARDING-CONSOLE-L5-FREEZE.md`](../../evidence/GO_local_auth_l5/ME-ONBOARDING-CONSOLE-L5-FREEZE.md)
