# `/auth/login` · ① 本地 UI 冻结（2026-05-26 · L5 暖金暗玻璃 · 硬闸）

**阶段：① 本地** — 以**当前仓库 `frontend/`** 中登录页实现为**唯一 UI SSOT**；**不**表示 ② 测试网、③ 公网 Production GO、**93** 全矩阵已闭。

**互指：** [本目录 README](./README.md) · [`app/auth/login/README.md`](../../app/auth/login/README.md) · [五主路由冻结](../GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)（五主路由仍独立冻结）· [88 §一 `/auth/*`](../../../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)

---

## 冻结结论

| 项 | 状态 |
|----|------|
| **路由** | `/auth/login`（含 `?returnUrl=`） |
| **视觉族** | Auth L5 · 暖金深色玻璃 · `data-tt-auth-visual="l5"` |
| **冻结日** | **2026-05-26** |
| **其它 `/auth/*`** | **`/auth/register` 已另锁** → [AUTH-REGISTER-UI-FREEZE](./AUTH-REGISTER-UI-FREEZE.md)；找回/验证等见 [README](./README.md) |

**产品口径（写死）：** 登录页 **UI 已封口**；后续默认 **仅数据链路 / 文案 i18n / 无障碍与错误态逻辑**；**禁止**结构或视觉回流（Console 浅壳、注册摄影底、原生 checkbox、青色 market  chrome 等）。

---

## 读序（禁止文档分叉）

| 顺序 | 真源 |
|------|------|
| ① | **本文件** |
| ② | [`frontend/app/auth/login/README.md`](../../app/auth/login/README.md) |
| ③ | 代码 + 下文 **① 机读绿集** |
| ④ | [GO_local_auth_l5](./README.md)（全 `/auth/*` 族验收，含未冻结路由） |

**非 SSOT：** `frontend/archive/ui-v1/`、旧 Console 截图、带 `bg-bg-main` / `AuthShellCrossNav` 的历史 spec 段落。

---

## 页面结构锁（DOM / 组件 · 不得重排）

自上而下（`app/auth/login/page.tsx`）：

1. `<main>` — `TT_AUTH_LOGIN_L5.pageShell` · `data-tt-auth-root` · `data-tt-auth-route="login"` · `data-tt-auth-visual="l5"` · **`data-tt-auth-login-ui-frozen="1"`**
2. `AuthL5PageBackdrop`（`bg-auth-login-l5-atmosphere`，**无**市场摄影底）
3. `pageColumn` → `AuthLoginSearchParamsSuspense` → **`LoginForm`**
4. **`LoginForm` 内** `AuthL5Card`：`headerBlock` → wallet callout → `formSection`（邮箱 · 密码+显隐 · `AuthL5Checkbox` 记住邮箱 · 错误 · 主 CTA）→ 页内 footer links（注册 / 忘记密码）
5. `AuthL5CrossNavFooter`（站点十字导航）

**Loading / error：** `LoginRouteLoading.tsx` · `loading.tsx` · `error.tsx` → `AuthRouteErrorShell`；须保持 L5 暗壳，**禁止**浅灰 Console 整页闪屏。

---

## 文件边界（路由目录）

仅允许下列文件存在于 `frontend/app/auth/login/`（增删改文件名 **须** 同批更新本表 + `authLoginUiFreeze.contract.test.ts`）：

| 文件 | 角色 |
|------|------|
| `page.tsx` | 页身 SSOT |
| `layout.tsx` | metadata / canonical |
| `loading.tsx` | 段级 loading |
| `LoginRouteLoading.tsx` | L5 骨架 |
| `LoginPasswordVisibilityToggle.tsx` | 密码显隐 |
| `LoginPageBackdrop.tsx` | → `AuthL5PageBackdrop` 再导出 |
| `error.tsx` | 段错误 L5 壳 |
| `README.md` | 路由读序 |

**共享依赖（动则须跑绿集）：** `components/auth/AuthL5*` · `lib/auth/loginL5.ts` · `lib/auth/authL5Form.ts` · `app/globals.css` 内 `[data-tt-auth-visual="l5"]` 块。

---

## 后续变更边界

| 允许（链路 / 合规） | 禁止（UI 回流） |
|---------------------|-----------------|
| `postLogin` / `mapAuthLoginSubmitError` / `safeInternalReturnPath` / session 写入 | 删除或替换 `AuthL5Card` / `AuthL5Checkbox` / `AuthL5PageBackdrop` |
| i18n 键值、错误文案、**诚实化**提示（非改壳） | 恢复 `type="checkbox"`、白底 Console 卡、`bg-bg-main` 整页 |
| 提交中 `aria-busy`、禁用表单、清错重试（**B-001～B-004** 已封口） | 引入 `MarketDarkRouteSceneDecor` / `REGISTER_BG_SRC` / `ref-cyan` 登录 chrome |
| a11y：`aria-invalid` / `role="alert"` / 44px 触控（**不**改布局块序） | 重排 header / form / footer 区块或去掉 `AuthL5CrossNavFooter` |
| Contract 测试 **对齐真值**（不放宽冻结断言） | 以「小修」名义改 `TT_AUTH_LOGIN_L5` 视觉 token 或 inline Tailwind 色板 |

**未冻结（同族其它路由）：** `/auth/forgot-password` · `/auth/reset-password` · `/auth/verify-email` — 合并前 **必须** 跑登录 + 注册绿集（`/auth/register` → [AUTH-REGISTER-UI-FREEZE](./AUTH-REGISTER-UI-FREEZE.md)）。

---

## ① 机读绿集（提交前 · `exit 0`）

```bash
cd frontend
npm run test -- authLoginUiFreeze loginPageL5 authL5FullScore uiSystem --run
```

**动到 `app/auth/login/` 或 `lib/auth/loginL5.ts` 或登录依赖的 `AuthL5*` / `globals.css` L5 块时：** 默认须上命令全绿；失败 **视为 UI 回流**，回滚视觉 diff，仅保留允许的链路改动。

---

## 机读锚点（grep）

| 锚点 | 含义 |
|------|------|
| `data-tt-auth-login-ui-frozen="1"` | 页面已声明 UI 冻结 |
| `data-tt-auth-visual="l5"` | L5 视觉族 |
| `data-tt-auth-surface="login_*"` | 登录表单子面（submit / footer / cross_nav） |
| `auth-l5-glass-surface` | 玻璃卡 SSOT class |
| `AUTH_LOGIN_REMEMBER_EMAIL_KEY` | 记住邮箱 localStorage 键 |

**Vitest：** `lib/auth/authLoginUiFreeze.contract.test.ts` · `lib/auth/loginPageL5.contract.test.ts` · `lib/auth/authL5FullScore.contract.test.ts`

---

## 人工 30s（① 目视）

1. 硬刷新 `/auth/login`（`Ctrl+Shift+R`）
2. 暖金玻璃卡 + 暗输入 + 方角勾选；**无**浅蓝 autofill、**无**白顶栏 Console
3. 点「记住邮箱」文字可切换；Tab 焦点暖金 ring
4. 切到 `/auth/register` 再返回：登录页视觉**不变**

---

## 文档同步清单（2026-05-26）

| 文档 | 要点 |
|------|------|
| **本文** | 登录 UI 冻结 SSOT |
| [`GO_local_auth_l5/README.md`](./README.md) | 登录已锁；其它 auth 路由状态 |
| [`app/auth/login/README.md`](../../app/auth/login/README.md) | 路由索引 |
| [`AGENTS.md`](../../../AGENTS.md) | Agent 硬闸一句 |
| [`.cursor/rules/traveltrust-ai-collab.mdc`](../../../.cursor/rules/traveltrust-ai-collab.mdc) | Cursor 硬闸 |

**未改：** `docs/spec/04` / `07` 版本表（非「台账同批」）；②③ 真链验收另闸。
