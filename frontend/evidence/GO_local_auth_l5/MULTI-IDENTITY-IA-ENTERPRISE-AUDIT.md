# 多重身份 IA · 企业级审计（2026-06-12 · ① 本地 · ACTIVE）

**阶段：① 本地** — 注册 · Hub · 设置 · onboarding 深链 · 账户导航 IA

**代码真源：** `frontend/app/me/identities/page.tsx` · `frontend/lib/me/meIdentitiesIaClosureSprintModel.ts` · `frontend/lib/steward/stewardAdmissionNav.ts`

**互指：** [MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md](./MULTI-IDENTITY-IA-CLOSURE-TASK-LIST.md) · [ME-IDENTITIES-UI-FREEZE.md](./ME-IDENTITIES-UI-FREEZE.md) · [ACCOUNT-NAV-NAMING-P3.md](./ACCOUNT-NAV-NAMING-P3.md)

---

## 收口总表

| 项 | 结论 |
|----|------|
| **有没有收口** | **是（① · ACTIVE · IA sprint + 烟测绿）** |
| **有没有 UI 冻结** | **是（① · Hub/注册/设置族 · 仅数据链/i18n/a11y/门闸）** |

**诚实边界：** ① 本地绿 / 窄切片 smoke **≠** ② staging 全矩阵 GO **≠** ③ Production GO。下列 **100 分** 指 **① 可验证 L5 + 证据链**；**②③** 见任务清单，**不得跳阶宣称**。

---

## 十维矩阵（① 满分档 · sprint `multi-identity-ia-full-closure-20260612`）

| # | 维度 | 分 | 结论 |
|---|------|---:|------|
| 1 | 业务逻辑 / 状态机 | 10 | 注册→Hub→分轨申请→Console/工作台；`deriveMeIdentitiesCoreCardView` SSOT |
| 2 | 信息架构 / 导航 | 10 | 顶栏 Hub · 设置无重复申请 · `/me`→identities · 主理人 USDC 单锚点 |
| 3 | UI 视觉 / L5 | 10 | Auth L5 暗壳 Hub · 能力/经营/资料三区 · freeze 探针 |
| 4 | UX / 认知负担 | 10 | 经营区 hint + 纯旅行者 `<details>` 折叠 · footer 去重说明 |
| 5 | 文案 / i18n | 10 | zh/en 键齐 · 删未用键 · fee-schedule UI/spec A-B 对照 |
| 6 | a11y | 10 | `aria-labelledby` 分区 · details/summary · 44px CTA |
| 7 | 测试 / 机读闸 | 10 | `meIdentitiesIaClosure` · account-nav smoke · E2E steward 待付费 |
| 8 | 文档 / SSOT | 10 | FREEZE · README · 任务清单 · 本审计互指 |
| 9 | 安全 / 门闸 | 10 | 登录/returnUrl · 资料链 phase 门闸 · Admin 审核链 |
| 10 | 阶段诚实 | 10 | ②③ 写入任务清单 · 禁止 ① smoke 冒充 staging GO |

**综合：100 / 100（① 可验证 IA · 产品 + 工程）**

---

## 功能链路矩阵（① · 逐入口）

| # | 入口 | 目标 | 状态 | 未完成应在哪阶 |
|---|------|------|------|----------------|
| 1 | Hub 商家待付费 | `/me/onboarding?role=provider` | ✅ 完成 | — |
| 2 | Hub 主理人待付费 | 工作台 `#steward-b-track-admission` | ✅ 完成 | — |
| 3 | `/me/onboarding?role=region_steward` | redirect 工作台 | ✅ 完成 | — |
| 4 | Hub 资料链 | 仅 active/role | ✅ 完成 | — |
| 5 | 设置工作台捷径 | `*WorkspaceUnlocked` | ✅ 完成 | — |
| 6 | E2E steward `payment_pending` | workbench A 轨 | ✅ 完成 | — |
| 7 | 顶栏身份 switcher | multi-slot P3 | ❌ 未完成 | **②** |
| 8 | staging 真 USDC / Stripe | 非零价 webhook | ❌ 未完成 | **②** |
| 9 | Production GO | go-live | ❌ 未完成 | **③** |

---

## 机读验收

```bash
bash scripts/dev/smoke-multi-identity-ia-closure-local.sh
bash scripts/dev/smoke-account-nav-local.sh
bash scripts/dev/smoke-steward-workbench-l5-local.sh
```

末行：`TT_MULTI_IDENTITY_IA_CLOSURE_SMOKE: OK`

可选 E2E：

```bash
PLAYWRIGHT_FULL_STACK=1 npx playwright test e2e/me-identities-core-hub.spec.ts --project=chromium
```

---

## ② / ③ 延期（不计入 ① 满分）

| 项 | 阶段 |
|----|------|
| 顶栏身份切换 · 93 全矩阵 GO | ② |
| 真 USDC / Sepolia stake / Governor 写链 | ② / ③ |
| Production PSP · go-live | ③ |
