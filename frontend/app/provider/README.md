# 商家（provider）· 多重身份入驻

**阶段：** **① 本地**（**不**冒充 **②③**）

**全链 SSOT：** [`register/README.md`](register/README.md)

| Step | 路由 | 文档 |
|------|------|------|
| 1 | `/auth/register?role=provider` | [`auth/register/README.md`](../auth/register/README.md) |
| 2 | `/provider/register?step=1..3` | [`register/README.md`](register/README.md) |
| 3 | `/me/onboarding` | [`me/onboarding/README.md`](../me/onboarding/README.md) |
| 4 | `/admin/provider-applications` → **`/admin/users/[id]`** 审核 | [`admin/provider-applications/README.md`](../admin/provider-applications/README.md) |
| 5 | `/market/provider` | [`market/provider/README.md`](../market/provider/README.md) |

**UI 冻结（step 1–2 L5）：** [PROVIDER-REGISTER-UI-FREEZE.md](../../evidence/GO_local_provider_register_closure/PROVIDER-REGISTER-UI-FREEZE.md)

**① API 烟测：** `bash scripts/dev/smoke-provider-onboarding-local.sh`

**多维文档互指（完整表）：** [`register/README.md` §8](register/README.md#8-文档互指多维)
