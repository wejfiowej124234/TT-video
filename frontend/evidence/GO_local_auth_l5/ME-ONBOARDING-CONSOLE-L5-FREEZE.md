# `/me/onboarding` · Console L5 UI 收口锁（2026-05-28 · ①）

**阶段：① 本地** — 准入费 Console 页为 **UI SSOT**；**不**表示 ② 测试网、③ 生产 GO；**非**五主路由冻结；**非** Auth L5 暗玻璃族。

**互指：** [路由 README](../../app/me/onboarding/README.md) · [Auth/Identity 绿集](../GO_local_auth_l5/README.md) · [商家注册 FREEZE](../GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md) · [主理人注册 FREEZE](../GO_local_steward_register_closure/STEWARD-REGISTER-UI-FREEZE.md)

---

## 收口结论

| 项 | 状态 |
|----|------|
| **路由** | `/me/onboarding` · **`?role=region_steward`** |
| **视觉族** | **Console L5** · `data-tt-me-onboarding-console-l5="1"` · `TT_MARKETING_ACCOUNT_PAGE_SHELL` |
| **冻结日** | **2026-05-28**（**2026-05-27** 访客预览 / 门禁 / hydration 抛光同批） |
| **进度** | **`MeOnboardingConsoleProgress`**（浅色可折叠；**非** `Provider/StewardOnboardingProgress` 暗条） |
| **信息层** | **`MeOnboardingSummaryGrid`** + **`MeOnboardingTechnicalDetails`**（JSON 仅折叠详情） |
| **机读** | `data-tt-me-onboarding-ui-frozen="1"` · **`meOnboardingUiFreeze`** 绿集必过 |

**默认禁止：** Auth L5 暗壳（`AuthL5PageBackdrop` / `AuthL5Card`）、主视图裸露 `<pre>` JSON、深色入驻进度条回流本页。

**① 抛光（行业标准 91→96，仍属本页 L5）：** 报价/金额/有效期 **SSR 稳定**（`formatOnboardingAmountMinor` · `formatOnboardingQuoteExpiresAtUtc`）；裸链 **`blockedGuest`** 仅 loading + `data-tt-me-onboarding-gate-redirect`；访客 **`guestQuotePreview`** 进度高亮准入费步 + 文案「预览 · 登录继续」；演示价 **`amountHeroDemo`**；Hub **`me_identities_onboarding_console_note`**。

---

## 页面结构锁（不得重排）

1. `<main>` · **`TT_ME_ONBOARDING_L5.pageAttrs`**
2. 标题 · 副标题 ·（可选）本地 dev 提示
3. **`MeOnboardingConsoleProgress`** · **`deriveOnboardingConsoleProgressStep(flowPhase, role)`** · **`MeOnboardingNextStep`** · 完成时 **`MeOnboardingDonePanel`**
4. **报价** · **资格** 双列（`lg:grid-cols-2`）· **写操作**（登录后 **`MeOnboardingWritesStageRail`**；未登录 **`MeOnboardingWritesLoginGate`**）
5. 返回 **`/me/identities`** · **`ProductCrossNav`**（`hideFeeRouterLinks` · Console 暖链）

**进度 L5：** 折叠态 **`OnboardingProgressCompactRail`**（①②③ 迷你徽章）；展开 **`OnboardingProgressStepList`**（竖向连接线）。写入区左轨竖线 **`MeOnboardingWritesStageRail`**。

**段级态：** `loading.tsx` / `error.tsx` → Console 账户壳（**非** Auth 暗底）。

---

## ① 机读绿集

```bash
cd frontend
npm run test -- meOnboardingUiFreeze meOnboardingPage meOnboardingViewModel onboarding.http --run
bash scripts/dev/smoke-provider-onboarding-local.sh
bash scripts/dev/smoke-steward-onboarding-local.sh
```

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| API / trust / Stripe / 本地 dev 工具 / i18n | 删摘要网格改回主视图 JSON |
| 错误码映射 · 限流倒计时 | 接 Auth 暗色进度条或 Auth L5 卡 |
| Admin / 门闸数据链 | 未跑绿集的 layout lock 回流 |
