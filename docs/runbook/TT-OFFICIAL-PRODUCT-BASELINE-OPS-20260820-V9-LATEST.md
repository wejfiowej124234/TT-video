# TravelTrust Official · OPS-2026.08.20-v9

**STATUS:** `OFFICIAL_PRODUCT_BASELINE_LOCKED` · **TODAYS_OFFICIAL_STABLE**  
**对外名称（推荐）：** **TravelTrust Official · OPS-2026.08.20-v9**  
**机读 ID：** `TT-OFFICIAL-OPS-20260820-V9`  
**Owner 锁钉墙钟：** `2026-08-20 15:20` Asia/Tokyo（`2026-08-20T06:20:00Z`）  
**活面：** `https://www.web3-ttg.com`  
**`TT_PRODUCTION_GO`：** `NO_GO`（本基线 ≠ Production GO）  
**交付模式：** **个人独立开发（Solo）** · **不开任何 PR** · Owner Self Review · push · Evidence — [`TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST`](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)

> **本包 = 今天（2026-08-20）Official 稳定活面。**  
> 产品身份仍是 `3e356617…` / `2026-08-20T00:51:57Z`；**耐久镜像句柄 = `hybrid-live-auth-pin-nontarget-v9-20260820`**（内嵌 session bootstrap **v8**，右上角登录可水合）。  
> **不是** `V01` / 裸 `V1`，**不是** PSG Archive Tag，**不是**误名 `…-v8` 标签。  
> **本项目 = 个人独立开发。默认不开任何 Pull Request / Merge Request；** GitHub 推送后的「Create a pull request」提示 **不是**本仓工作流。

Machine JSON：[`TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json`](./TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json)  
前代（已 SUPERSEDED）：[`TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-LATEST.md`](./TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-LATEST.md)

---

## 交付纪律（写死 · Solo）

| 项 | 口径 |
|----|------|
| 开发形态 | **个人独立开发**（Solo Owner = 唯一维护者） |
| PR | **不开任何 PR**（含发版 PR / 合入 PR / 形式 Review PR） |
| 合入替代 | Owner commit · 按需 `git push` · 引用 Tag / SHA / Evidence |
| 人控 | Owner Self Review（正式 Release 另加时间隔离复检 + Sign-off） |
| 质量真源 | Gate · Evidence · Freeze · Certification · Archive · Owner Sign-off — **不是** PR |
| 禁止 | 以「缺 PR / 缺 Reviewer / 缺 Approver」阻塞合法 Solo 推进 |

---

## 对外怎么称呼（写死）

| 场合 | 用法 |
|------|------|
| **对外 / 投资人 / 合作方** | **TravelTrust Official · OPS-2026.08.20-v9** |
| **中文对外** | **TravelTrust 官网产品基线 OPS-2026.08.20-v9** |
| **工程机读** | `TT-OFFICIAL-OPS-20260820-V9` |
| **禁止** | `V01` · 裸 `V1` · 把本基线写成 Production GO · 与 PSG Tag 混称 · 把误名 `…-v8` 当稳定版 |

**OPS** = Official Product Surface。**v9** = 本日耐久 Fly 镜像标签（bootstrap v8 已 bake）。

---

## 三平面（禁止混读）

| 平面 | 名称 | 角色 |
|------|------|------|
| **A · Official 活面（本基线）** | **OPS-2026.08.20-v9** | **今天稳定版 · 官网优先** |
| **B · 前代 OPS 日钉** | `TT-OFFICIAL-OPS-20260820`（曾钉误名 `…-v8`） | **SUPERSEDED** |
| **C · 历史 Official pin** | `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` / 2026-08-16 | **SUPERSEDED** |
| **D · PSG Archive** | Tag `v1.1.0-psg-go.20260717` | 不可变 GO Archive · **≠** 本 Official 活面 |

---

## Pin（活证据）

| 项 | 值 |
|----|-----|
| Web | `https://www.web3-ttg.com` |
| Owner 锁钉 | `2026-08-20T15:20:00+09:00` |
| `GET /api/release-identity` `git_sha` | `3e356617a498b0faac42e4ae457343d36294a770` |
| `build_time` | `2026-08-20T00:51:57Z` |
| Next BUILD 注释 | `fnX9UySJrp_w3J4PTApv6` |
| Fly image | `registry.fly.io/tt-web-prod:hybrid-live-auth-pin-nontarget-v9-20260820` |
| Image digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Session bootstrap | **v8**（在镜像标签 **v9** 内；`__TT_PUBLIC_SKIP_ME_FETCH="0"`） |
| Header login | **OWNER_CONFIRMED**（Official C2 硬刷新 · Header 用户菜单正常） |
| 合成说明 | live tip：`/` · `/traveltrust` · `/auth`；pin 视觉：`/market` · `/did-rank` · `/community/*`（08-16） |
| API `/meta/build` | `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **本基线不改 API** |

**身份 SHA ≠ 干净 git checkout。** 回滚只许：

```bash
bash scripts/dev/restore-tt-web-production-product-pin.sh --check-only
TT_OFFICIAL_WWW_RESTORE_PIN=1 bash scripts/dev/restore-tt-web-production-product-pin.sh
```

**禁止** restore 误名 `hybrid-live-auth-pin-nontarget-v8-20260820`（内仍是 bootstrap v7 → 右上角登录后 Header 不水合）。

---

## Agent / 工程 MUST

- 以 **OPS-2026.08.20-v9** 为今天 Official 稳定 SSOT；冲突时 **官网活面优先**
- 五主结构 / 视觉 / layout 继续冻结（仅数据链 · session · i18n · a11y · 真错误）
- 新 bake / 覆盖本 pin → 须 Owner 点名真实错误 + 显式解锁

## Agent MUST NOT

- 把本基线写成 **Production GO** / 翻 `TT_PRODUCTION_GO`
- 用 `V01` / 裸 `V1` / PSG Tag / 误名 `…-v8` 冒充本稳定活面
- 无授权 `deploy-tt-web-production.sh` bake
- 把 08-16 `daa5ae87` 或前代 OPS（无 v9）重新写成当前活真源
