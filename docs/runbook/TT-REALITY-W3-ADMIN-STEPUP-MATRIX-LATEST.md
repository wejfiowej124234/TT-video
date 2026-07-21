# Reality-W3 · Admin Step-up 矩阵（PCR-SEC-ADMIN-STEPUP）

**STATUS:** ACTIVE  
**Machine key:** `TT_REALITY_W3_ADMIN_STEPUP_MATRIX`  
**机制：** Admin Console **TOTP / `admin_2fa_policy.enforced`**（`admin_2fa_required`）

## 闸点

| 层 | 行为 |
|----|------|
| `require_admin_actor` | 须 Admin Bearer |
| `admin_2fa_blocks_actor` | `enforced=true` 且无有效 2FA session → **403** `admin_2fa_required` |
| `TRAVELTRUST_ADMIN_2FA_SKIP=1` | 仅非生产调试；Staging/Prod 禁止当验收绕过 |

## 高危面（抽样）

| 面 | 受 Admin 闸 | Step-up |
|----|:----------:|:-------:|
| CMS 发布 / 治理写 | ✅ | 2FA 策略开时 ✅ |
| DSAR update | ✅ SuperAdmin | 同上 |
| 2FA policy PATCH | ✅ | 同上 |
| 业务 C1–C4 账号 | ❌（非 Admin） | N/A |

## Staging 证据

见 `REALITY-W3-SEC-USER-ADM-STAGING-UAT-LATEST.json` · `admin_stepup` 步。

Solo Owner：当前可 `enforced=false` 于 Staging 便于运维；**生产开启强制**须另闸，但 **代码路径已存在**（本 Wave 验收 = 表面可证，非强制已开）。
