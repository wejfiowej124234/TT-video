# `/steward/register` · ① 本地 UI 冻结（2026-05-27 · L5 暖金暗玻璃 · 硬闸）

**阶段：① 本地** — 以**当前仓库 `frontend/app/steward/register`** 为**唯一 UI SSOT**；**不**表示 ② 测试网、③ Production GO。

**互指：** [`app/steward/register/README.md`](../../app/steward/register/README.md) · [`/me/identities` UI 冻结](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)（Hub 已锁，仅数据链）· [PROVIDER-REGISTER-UI-FREEZE](../GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md)（同族 L5）

---

## 冻结结论

| 项 | 状态 |
|----|------|
| **路由** | `/steward/register`（含 `?step=1..3` · `?returnUrl=`） |
| **视觉族** | Auth L5 · 暖金深色玻璃 · `data-tt-auth-visual="l5"` |
| **冻结日** | **2026-05-27** |
| **双层进度** | **入驻总进度** `StewardOnboardingProgress` · **本页 wizard** `StewardRegisterWizardProgress` |

**产品口径：** 页面 **UI 已封口**；默认 **仅数据链路 / i18n / a11y·错误态 / API 门闸**；**禁止**结构或 L5 视觉 token 回流。

---

## 页面结构锁（不得重排）

1. `<main>` — `TT_STEWARD_REGISTER_L5.pageShell` · `data-tt-steward-register-ui-frozen="1"`
2. `AuthL5PageBackdrop` → `AuthL5Card`（`maxWidth="wide"`）
3. Hub kicker · 返回 Hub · header（eyebrow / title / intro）
4. **`StewardOnboardingProgress`**（`variant="compact"` 于表单期 · step=2）
5. 门态 / **`StewardRegisterMainForm`**（内嵌 **`StewardRegisterWizardProgress`** 1–3）
6. **`AuthL5CrossNavFooter`**（`hideFeeRouterLinks` · 无费路由运维链）
7. **`loading.tsx` / `error.tsx`** — L5 段级壳（`AuthRouteLoading` / `AuthRouteErrorShell`）

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| stake-quote / stake-status / applications API 接线 | 删除 `AuthL5Card` / 进度双轨 / wizard 三步 |
| i18n、校验、Admin 审核工具 | Console 浅壳、market 摄影底、`ref-cyan` chrome |
| wagmi 钱包数据链（`GuideRegisterWalletStepFlow` 行为） | 合并为单进度条导致 step 语义冲突 |
| 契约测试对齐真值 | 未解冻改 `TT_STEWARD_REGISTER_L5` layout token |

---

## ① 机读绿集

```bash
cd frontend && npm run test -- stewardRegisterUiFreeze stewardRegisterL5 meIdentitiesPage --run
bash scripts/dev/smoke-steward-onboarding-local.sh   # ① API 全链（非 ②③ GO）
```
