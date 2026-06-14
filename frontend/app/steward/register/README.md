# 区域主理人入驻（① 本地 · Protocol Convergence P2 · L5）

**阶段：** **① 本地** — 与 [`/me/identities`](../../me/identities/README.md) Hub、[`/provider/register`](../../provider/register/README.md) **同族 Auth L5 暗玻璃**。

**SSOT：** [protocol-ssot.v1.md](../../../../docs/spec/governance-token/protocol-ssot.v1.md) · [state-machine.v1.md](../../../../docs/spec/governance-token/state-machine.v1.md)

---

## 多重身份链路

| 步 | 路径 | 说明 |
|----|------|------|
| Hub | **`/me/identities`** | 区域主理人卡片 → **`/steward/register?returnUrl=…`** |
| 1（可选） | `/auth/register?role=steward` | 未登录时 Login Gate → 注册后自动跳转本页 |
| 2 | **`/steward/register`** | **3 步 wizard**：辖区多选 → 主体资料 + wagmi 钱包 → 确认提交；TTG quote · stake-status |
| 3 | **`/governance?view=region#steward-b-track-admission`** | **A 轨 USDC 准入费**（官方地址 · **不退**）→ 身份确认 · [`stewardAdmissionNav.ts`](../../../lib/steward/stewardAdmissionNav.ts) |
| 4 | Admin | **`/admin/steward-applications`** |

## API

| 方法 | 路径 |
|------|------|
| GET | `/api/v1/steward/stake-quote` |
| GET | `/api/v1/steward/stake-status` |
| POST | `/api/v1/steward/applications` |
| GET | `/api/v1/me/steward-application` |

## 页面结构（L5 · 2026-05-27 UI 冻结）

**冻结：** [STEWARD-REGISTER-UI-FREEZE.md](../../../evidence/GO_local_steward_register_closure/STEWARD-REGISTER-UI-FREEZE.md)

1. `AuthL5PageBackdrop` + `AuthL5Card`
2. Hub kicker · 返回 Hub · eyebrow · 渐变标题
3. **`StewardOnboardingProgress`**（`variant="compact"`）+ **`StewardRegisterWizardProgress`**
4. 门态 / 表单 · **`AuthL5CrossNavFooter`**（`hideFeeRouterLinks`）
5. **`loading.tsx` / `error.tsx`** L5 段

## 机读绿集

```bash
cd frontend && npm run test -- stewardRegisterUiFreeze stewardRegisterL5 meIdentitiesPage --run
bash scripts/dev/smoke-steward-onboarding-local.sh   # ① 全链
```

**链上 stake（② Anvil）：** `bash scripts/dev/smoke-steward-stake-anvil.sh`

---

## 与 Hub 冻结边界

- **`/me/identities` layout 已锁** — 本页仅改 **href 指向** 与 **卡片状态徽章**（数据链）
- **`/steward/register` UI 已锁（2026-05-27）** — 见 **STEWARD-REGISTER-UI-FREEZE**；**仅允许**数据链路 / i18n / a11y·错误态 / API 门闸；动 **`app/steward/register*`** 须 **`stewardRegisterUiFreeze` + `stewardRegisterL5` exit 0**
