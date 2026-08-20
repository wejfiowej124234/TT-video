> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 overlay ROLLED_BACK · **≠** Candidate v2 · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)
> **GO 资格（Cycle2 overlay · 不改 freeze 8）：** `READY_FOR_OWNER_PRODUCTION_GO_VERDICT` · freeze unique entry `STOP` `required_before_go=8` · `current_required_before_go=0` · 下一步 = Owner 书面 **GO** 或 **继续 NO_GO**（`NOT_THIS_TURN`）· `TT_PRODUCTION_GO=NO_GO` · **禁止自动签发** · **禁止 bake www**

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
