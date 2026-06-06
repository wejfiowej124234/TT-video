# `/auth/register` · ① 本地 UI 收口锁死（2026-05-26 · L5 暖金暗玻璃 · 硬闸）

**阶段：① 本地** — 以**当前仓库 `frontend/`** 游客/向导/商家/主理人注册壳为 **UI SSOT**；**不**表示 ② 测试网、③ 生产 GO。

**互指：** [本目录 README](./README.md) · [`app/auth/register/README.md`](../../app/auth/register/README.md) · [登录 UI 冻结](./AUTH-LOGIN-UI-FREEZE.md) · [五主路由冻结](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

---

## 收口结论（写死 · 2026-05-26）

| 项 | 状态 |
|----|------|
| **产品** | `/auth/register` **UI 已锁死**；进入 **链路验证期**（仅数据 / i18n / 实验权重，**非**壳改版） |
| **视觉** | L5 暖金暗玻璃 · `titleLogin` · 信任条 **默认折叠摘要** |
| **机读** | `data-tt-auth-register-ui-frozen="1"` · `authRegisterUiFreeze` **绿集必过** |
| **与登录** | 同族；登录 → [AUTH-LOGIN-UI-FREEZE](./AUTH-LOGIN-UI-FREEZE.md) |

**默认禁止：** 改块序、换壳、Console 浅 UI、摄影底、`titleCompact` 回流、信任条改回默认全展开。

---

## 冻结结论

| 项 | 状态 |
|----|------|
| **路由** | `/auth/register`（`?role=` · `?returnUrl=`） |
| **视觉族** | Auth L5 · 暖金深色玻璃 · `data-tt-auth-visual="l5"` |
| **冻结日** | **2026-05-26** |
| **信任条** | `TrustGrowthMomentBanner` · **默认折叠摘要**（实验 v2 · `preferCollapsedSummary`） |
| **标题** | `TT_AUTH_L5_FORM.titleLogin`（与登录同级渐变主标题） |

**产品口径：** 注册壳 **UI 已封口**；允许 **POST 注册 / i18n / returnUrl / 实验埋点**；**禁止** Console 浅壳、摄影底、原生 checkbox、结构重排。

---

## 页面结构锁（游客壳 · `RegisterTouristForm`）

1. `<main>` · `data-tt-auth-route="register"` · `data-tt-auth-register-ui-frozen="1"`
2. `AuthL5PageBackdrop`
3. `AuthL5Card` → 返回 → （可选 role `banner`）→ **`headerBlock` + `titleLogin`** → **信任条（折叠）** → 表单字段 → 页内链（登录 / 首页）→ `AuthL5CrossNavFooter`

**向导壳（`RegisterGuideForm`）：** 同上；`maxWidth="wide"` · 账户/资质分节 · `AuthL5Checkbox` 协议行。

**路由入口：** `page.tsx` → **`RegisterPageMain`** → `useRegisterPage`（**必须**传 `loginHref`）。

---

## 文件边界（`app/auth/register/`）

| 文件 | 角色 |
|------|------|
| `page.tsx` | Suspense 入口 → `RegisterPageMain` |
| `RegisterPageMain.tsx` | 角色分流 |
| `useRegisterPage.ts` | 状态 · `loginHref` · 提交 |
| `RegisterTouristForm.tsx` | 游客/商家/主理人壳 |
| `RegisterGuideForm.tsx` | 向导壳 |
| `RegisterGuideFormAccountSection.tsx` | 向导账户段 |
| `RegisterGuideFormDidProfileSection.tsx` | 向导资质段 |
| `registerPageModel.ts` | 角色/错误码 |
| `registerBackgrounds.ts` | L5 壳 class |
| `registerGuideFormTypes.ts` | 向导 props |
| `constants.ts` · `utils.ts` | 校验/文件 |
| `layout.tsx` · `loading.tsx` · `error.tsx` | 段级态 |
| `RegisterPageBackdrop.tsx` | 再导出 backdrop |
| `README.md` | 路由读序 |

**共享依赖（动则须跑绿集）：** `AuthL5*` · `authL5Form.ts` · `TrustGrowthMomentBanner` · `config/trustGrowthExperiments.ts`（register v2）· `globals.css` L5 块。

---

## 后续变更边界

| 允许 | 禁止 |
|------|------|
| `postRegister` · `registerApiCatch` · `safeInternalReturnPath` · `loginHref` | 删除 `AuthL5Card` / 摄影底 / 白卡 |
| i18n · 诚实化文案 · P-GROW 实验权重（不破坏折叠默认真值） | `titleCompact` 回流顶替 `titleLogin` |
| 向导表单 **字段**增删（不改编排块序） | 信任条改回默认全展开占半屏 |
| 契约对齐真值 | 未跑绿集的视觉 diff |

**未冻结：** `/auth/forgot-password` · `/auth/reset-password` · `/auth/verify-email`。向导申请见 [GUIDE-REGISTER-UI-FREEZE](./GUIDE-REGISTER-UI-FREEZE.md)。

---

## ① 机读绿集

```bash
cd frontend
npm run test -- authRegisterUiFreeze authRegisterL5 registerPage loginPageL5 authL5FullScore uiSystem --run
```

**动 `app/auth/register/**` 或上表共享依赖时：** 须 **exit 0**；失败视为 UI 回流。

---

## 机读锚点

| 锚点 | 含义 |
|------|------|
| `data-tt-auth-register-ui-frozen="1"` | 注册 UI 冻结 |
| `data-tt-auth-register-submit="1"` | 主提交 |
| `preferCollapsedSummary` | 信任条折叠 |
| `titleLogin` | 主标题 token |

**Vitest：** `lib/auth/authRegisterUiFreeze.contract.test.ts` · `lib/auth/authRegisterL5.contract.test.ts` · `app/auth/register/registerPage.contract.test.ts`

---

## 人工 30s

1. `/auth/register` 硬刷新：大渐变标题 · 信任条**一行摘要**（点开才展开要点）  
2. 顶栏「注册」胶囊有暖金 ring；「登录」非当前态  
3. 页脚「已有账号 → 登录」可点且无 console 报错  
4. `?role=guide`：宽卡 · 分节 · 协议勾选仍为 L5 方框  

---

## 文档同步清单（2026-05-26 · 收口）

| 文档 | 要点 |
|------|------|
| **本文** | 注册 UI **收口锁死** SSOT |
| [`GO_local_auth_l5/README.md`](./README.md) | Auth L5 双路由冻结索引 |
| [`app/auth/register/README.md`](../../app/auth/register/README.md) | 路由读序 |
| [`AGENTS.md`](../../../AGENTS.md) · [`.cursor/rules/traveltrust-ai-collab.mdc`](../../../.cursor/rules/traveltrust-ai-collab.mdc) | Agent 硬闸 |
| [`config/trustGrowthExperiments.ts`](../../config/trustGrowthExperiments.ts) | `register` v2 · 默认折叠 |

**未改：** `docs/spec/04` / `07`（非台账同批）；②③ 真链另闸。
