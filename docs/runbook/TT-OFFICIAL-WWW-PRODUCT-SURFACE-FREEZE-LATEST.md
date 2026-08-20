# Official www · Product Surface FREEZE

**STATUS:** `OFFICIAL_WWW_PRODUCT_SURFACE_FROZEN`  
**Living baseline:** **TravelTrust Official · OPS-2026.08.20-v9** (`TT-OFFICIAL-OPS-20260820-V9`)  
**Role:** **TODAYS_OFFICIAL_STABLE**（2026-08-20）  
**Owner 锁钉：** `2026-08-20 15:20` Asia/Tokyo（`2026-08-20T06:20:00Z`）  
**Live:** `https://www.web3-ttg.com`  
**Machine:** [`TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json`](./TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json)  
**Human SSOT:** [`TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-V9-LATEST.md`](./TT-OFFICIAL-PRODUCT-BASELINE-OPS-20260820-V9-LATEST.md)  
**`TT_PRODUCTION_GO`:** `NO_GO`  
**交付模式：** **个人独立开发（Solo）** · **不开任何 PR** · 见 [`TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST`](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)

> **当前 Official 产品真源 = OPS-2026.08.20-v9（今天稳定版 · 官网优先 · 本窗口暂不可改产品字节）。**  
> **不是** `V01` / 裸 `V1`，**不是** PSG Tag，**不是**误名 `…-v8` 镜像，**不是** M07 overlay，**不是** Production GO。  
> 前代日钉 `TT-OFFICIAL-OPS-20260820`、历史 pin `daa5ae87`（2026-08-16）、M07 `…-m07-unlock` = **SUPERSEDED / ROLLED_BACK** 作为活面。  
> **本项目独立开发：** 远端 push ≠ 开 PR；质量真源是 Gate · Evidence · Freeze · Owner Sign-off，**不是** Pull Request。

---

## Pin（活证据 · 本冻结真源）

| 项 | 值 |
|----|-----|
| Web | `https://www.web3-ttg.com` |
| 对外名称 | **TravelTrust Official · OPS-2026.08.20-v9** |
| `GET /api/release-identity` | `git_sha=3e356617a498b0faac42e4ae457343d36294a770` |
| `build_time` | `2026-08-20T00:51:57Z` |
| Next BUILD | `fnX9UySJrp_w3J4PTApv6` |
| Fly image | `registry.fly.io/tt-web-prod:hybrid-live-auth-pin-nontarget-v9-20260820` |
| Digest | `sha256:b80bccb5f5c8c0e2b6e854c49f83fbbeb2ecefad70290339a8db6105eb608b16` |
| Session | bootstrap **v8**（baked in image tag **v9** · Header 登录水合） |
| Header login | **OWNER_CONFIRMED**（C2 硬刷新） |
| 合成 | live：`/` · `/traveltrust` · `/auth`；视觉 pin：`/market` · `/did-rank` · `/community` |
| API `GET /meta/build` | `git_sha=8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **本冻结不改 API** |

**身份 SHA ≠ 干净 git commit。** 禁止 checkout 当回滚。回滚只许 `fly deploy --image` → **仅 v9 句柄**。

**回滚：**

```bash
bash scripts/dev/restore-tt-web-production-product-pin.sh --check-only
TT_OFFICIAL_WWW_RESTORE_PIN=1 bash scripts/dev/restore-tt-web-production-product-pin.sh
# MUST NOT: hybrid-live-auth-pin-nontarget-v8-20260820
```

**机器闸：** `bash scripts/gates/check-official-www-product-surface-frozen.sh` — `TT_SKIP_OFFICIAL_BASELINE_PIN=1` 不能绕过。

---

## Agent MUST NOT（官网）

- 无 Owner 解锁的 `deploy-tt-web-production.sh` / 整包 bake
- 改五主结构 / 视觉 / layout / 公告 ticker（数据链与 session 除外）
- 把本基线写成 Production GO
- 用 `V01` / 裸 `V1` / PSG Archive Tag / 误名 `…-v8` 冒充本活面
- 把已 SUPERSEDED 的 `daa5ae87` 或前代 OPS（无 v9）重新写成当前活真源

**唯一解锁：** Owner 点名真实错误 + 明确授权新 bake / 新 pin。

---

## Web3 梯子（不因本基线重部署）

Money Path 已部署接线。GO remaining = Owner 书面 **GO** 或 **继续 NO_GO**。CI-02 hop B 仍独立 WAIT / FORBIDDEN.
