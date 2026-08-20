# Official Living Pin Index（唯一入口）

**STATUS:** `TODAYS_OFFICIAL_STABLE` · **Wave-0→D1/D2 closure track**  
**Living baseline:** **TravelTrust Official · OPS-2026.08.20-v9**  
**Machine:** [`TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json`](./TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json)  
**Human:** [`TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-V9-LATEST.md`](./TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-V9-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`  
**交付模式：** **个人独立开发（Solo）** · **不开任何 PR** · Owner Self Review + push + Evidence / Gate / Archive — SSOT [`TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST`](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)

> 凡写「当前 Official www / 官网产品真源 / living www pin」→ **只认本页 + Freeze JSON**。  
> 本 pin = **Final Truth Baseline 的 Product Truth 平面**（全系统唯一 SSOT 之下 · 禁止另起第二套）。  
> Web3/链/API 地址真源仍是 [FTB](./TT-FINAL-TRUTH-BASELINE-LATEST.md) Web3 Active Truth（**≠** 本 pin 的镜像字节）。  
> **OPS-v9 本窗口暂不可改产品字节**；矩阵/文档对齐本真源，不以 M07 overlay 冒充 OPS-v9。  
> **本项目 = 个人独立开发。禁止**把 GitHub「Create a pull request」提示、团队 Reviewer、双人 Approver 写成默认流程或硬闸。

## Pin card

| 项 | 值 |
|----|-----|
| 对外名 | TravelTrust Official · OPS-2026.08.20-v9 |
| 机读 ID | `TT-OFFICIAL-OPS-20260820-V9` |
| Web | `https://www.web3-ttg.com` |
| Identity `git_sha` | `3e356617a498b0faac42e4ae457343d36294a770` |
| `build_time` | `2026-08-20T00:51:57Z` |
| Fly image | `registry.fly.io/tt-web-prod:hybrid-live-auth-pin-nontarget-v9-20260820` |
| Digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Session bootstrap | **v8**（baked in image tag **v9**） |
| Header login | **OWNER_CONFIRMED**（C2 硬刷新 · 用户菜单正常） |
| Hybrid tip | `/` · `/traveltrust` · `/auth` |
| Hybrid visual pin | `/market` · `/did-rank` · `/community` |
| API | `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **untouched by www freeze** |

## Forbidden as living Official

| Handle | Why |
|--------|-----|
| `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` | 08-16 pin · **SUPERSEDED** |
| `hybrid-live-auth-pin-nontarget-v8-20260820` | Misnamed · bootstrap **v7** · breaks Header login |
| `TT-OFFICIAL-OPS-20260820`（无 `-V9`） | Pre-v9 day stamp · **SUPERSEDED** |
| `2551fafd…` / `hybrid-…-v9-m07-unlock-20260820` | M07 Unlock overlay · **ROLLED_BACK** · **≠** OPS-v9 |
| Dirty git tip / isolation bake trees | Not restore handles |
| `4495d68e…` / `release/m07-unlock-ops-v9-ready` | M07 bake-tree tip · **NOT** Official Runtime identity · **DELETED worktree** · **≠** OPS-v9 |

## Restore

```bash
bash scripts/dev/restore-tt-web-production-product-pin.sh --check-only
TT_OFFICIAL_WWW_RESTORE_PIN=1 bash scripts/dev/restore-tt-web-production-product-pin.sh
```

## Plan track (this closure)

Wave-0 **FULLY_CLOSED**（含 Owner Header 登录确认）→ A living docs → B registry/modules → C workspace inventory → D1/D2 Staging narrative+probes.  
**M07「TTG 公开窗口」:** **NOT living Official**（曾 bake 后已回滚到 OPS-v9）· registry 保持 `LOCAL_ONLY_PENDING` / Ready 轨 · **禁止**把 M07 写成 OPS-v9。

**Wave-0 stamp:** `WAVE_0_FULLY_CLOSED` · evidence [`WAVE-0-TO-D-OPS-V9-CONVERGENCE-20260820.md`](../evidence/GO_official_www_product_surface/WAVE-0-TO-D-OPS-V9-CONVERGENCE-20260820.md)

## Web3 plane（本 pin 边界）

- 本页 = **Product Truth only**（官网产品/UI/UX/Runtime）。
- **Web3 / 合约 / 资金路径** 真源仍是 [FTB Web3 Active Truth](./TT-FINAL-TRUTH-BASELINE-LATEST.md)；**本轮不改**链上地址与 `/meta` 合约字段。
- Owner 已声明：**后续 Web3 轨将以 Official V9 产品基线为准做对齐更新**（独立会话 · 另闸）· **≠** 本窗口自动改链 · **≠** `TT_PRODUCTION_GO`。

## 交付模式（写死）

| 项 | 口径 |
|----|------|
| 形态 | **个人独立开发（Solo）** |
| PR | **不开任何 PR** |
| 远端 | `git push` 更新仓库即可；**不是**发 PR |
| 人控 / 质量 | Owner Self Review · Evidence · Gate · Archive · Sign-off |
| SSOT | [`TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST`](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md) |

## Local / Staging / Repo 一比一映射（写死）

**产品身份必须一致：** `git_sha=3e356617a498b0faac42e4ae457343d36294a770`（对外名 = 本页 OPS-v9）。

| 平面 | 映射 | 禁止 |
|------|------|------|
| **Repo** | `main` == `release/official-ops-v9-product-ssot` tip（工程 SSOT） | 旧 tip / `2ba08bd4` / `daa5` 当活工程线 |
| **Local** | Release WT cite = `3e356617…`；本地开发对照本 pin | 用 Staging 旧针反推 Official；声称 checkout = 官网像素 |
| **Staging www** | `release-identity.git_sha` = `3e356617…`（cite 重编 · staging env） | 把官网生产镜像原样钉进 Staging；`2ba08bd4` 当活面 |
| **Official www** | Fly 镜像 `hybrid-…-v9-20260820` · `build_time=2026-08-20T00:51:57Z` | 无解锁 bake / M07 冒充 |

**Expected Difference：** Staging 新 bake 的 `build_time` / image tag 可 ≠ 官网冻结墙钟。  
**本波实测（2026-08-20）：** Official `build_time=2026-08-20T00:51:57Z` · Staging `build_time=2026-08-20T10:50:46Z` · 双方 `git_sha=3e356617…`。  
**本波不并入：** Staging API · Candidate Web3 · FTB 地址对齐（另闸）。

**机读闸：** `bash scripts/gates/check-official-v9-local-staging-repo-1to1.sh` → `TT_OFFICIAL_V9_1TO1_MAP: PASS`  
**证据：** `evidence/GO_official_www_product_surface/OFFICIAL-V9-LOCAL-STAGING-REPO-1TO1-MAP-20260820.{json,md}`  
**Staging 对齐：** `TRAVELTRUST_STAGING_V9_ALIGN_OK=1 FLY_WEB_REMOTE_BUILD=1 bash scripts/dev/align-staging-www-official-v9.sh`

