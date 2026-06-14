# 商家（provider）· 多重身份入驻

**阶段：** **① 本地**（**不**冒充 **②③**）

**全链 SSOT：** [`register/README.md`](register/README.md)

| Step | 路由 | 文档 |
|------|------|------|
| 1 | `/auth/register?role=provider` | [`auth/register/README.md`](../auth/register/README.md) |
| 2 | `/provider/register?step=1..3` | [`register/README.md`](register/README.md) |
| 3 | `/me/onboarding` | **B 轨准入费**（**USDC** · 官方地址）· [`me/onboarding/README.md`](../me/onboarding/README.md) |
| 4 | `/admin/provider-applications` → **`/admin/users/[id]`** 审核 | [`admin/provider-applications/README.md`](../admin/provider-applications/README.md) |
| 5 | `/provider` · `/market/provider` | 工作台 [`page.tsx`](page.tsx) · 橱窗 [`market/provider/README.md`](../market/provider/README.md) |

**UI 冻结（step 1–2 L5）：** [PROVIDER-REGISTER-UI-FREEZE.md](../../evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md)

**① API 烟测：** `bash scripts/dev/smoke-provider-onboarding-local.sh`

**① 工作台 L5 冻结（2026-06-12）：** [PROVIDER-WORKBENCH-L5-FREEZE.md](../../evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md) · [企业审计](../../evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-ENTERPRISE-CODE-AUDIT-20260612.md) · `bash scripts/dev/smoke-provider-workbench-l5-local.sh` · 种子 **`merchant@test.com`** / **`Test123!`**

**多维文档互指（完整表）：** [`register/README.md` §8](register/README.md#8-文档互指多维)
