# Official www · Product Surface FREEZE

**STATUS:** `OFFICIAL_WWW_PRODUCT_SURFACE_FROZEN`  
**Stamp:** `2026-08-17T02:36:00Z`  
**Live:** `https://www.web3-ttg.com`  
**Machine:** [`TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json`](./TT-OFFICIAL-WWW-PRODUCT-SURFACE-FREEZE-LATEST.json)  
**`TT_PRODUCTION_GO`:** `NO_GO`

Owner 本轮指令：不管 ABI，**全部回到**「官网活面已钉到 `daa5ae87`」那一版完整部署。  
本包冻结的是 **③ Official 产品活面**，不是 Production GO，也不是 Web3 Timelock 梯子。

---

## Pin（活证据 · 本冻结真源）

| 项 | 值 |
|----|-----|
| Web | `https://www.web3-ttg.com` |
| `GET /api/release-identity` | `git_sha=daa5ae87b8c1af548c6beff6dd3451e5d386acf2` |
| `build_time` | `2026-08-16T15:15:49Z` |
| `identity_source` | `docker-bake` |
| `psg_release_version` | `MAINNET-OFFICIAL-LIVE-PARTIAL` |
| Fly image | `registry.fly.io/tt-web-prod:deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` |
| API `GET /meta/build` | `git_sha=8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **本冻结不改 API** |

**身份 SHA ≠ 干净 git commit，也 ≠ 产品字节。** 线上镜像含 `daa5ae87` 之后未提交的产品字节（公告 5 chip 含「活动」/ ticker / Admin 链上资金圈）。`git checkout daa5ae87` 会掉成已提交的 4 chip（全部 / 产品 / 治理 / 协议）。禁止 checkout 当回滚。回滚只许 `fly deploy --image`。禁止把后来的 ABI bake（`01:11:08Z` / `02:11:29Z`）当活面。

**回滚（无重建）：**

```bash
bash scripts/dev/restore-tt-web-production-product-pin.sh --check-only
TT_OFFICIAL_WWW_RESTORE_PIN=1 bash scripts/dev/restore-tt-web-production-product-pin.sh
```

**机器闸（`TT_SKIP_OFFICIAL_BASELINE_PIN=1` 不能绕过）：** `bash scripts/gates/check-official-www-product-surface-frozen.sh`

| 类 | 脚本 | 冻结默认 |
|----|------|----------|
| `full` | `deploy-tt-web-production.sh` | **FORBIDDEN**（除非 `TT_OFFICIAL_PRODUCT_SURFACE_UNLOCK=1` + Owner 点名真实错误） |
| `web3_overlay` | `deploy-tt-web-production-web3-overlay.sh` | **FORBIDDEN**（Docker `COPY . ./` 会整包替换活面）。另闸 `TT_OFFICIAL_WEB3_OVERLAY_FROM_GIT=1` |
| `restore_image` | `restore-tt-web-production-product-pin.sh` | `fly deploy --image` + `TT_OFFICIAL_WWW_RESTORE_PIN=1` |

Web3 默认走 **链 + API `/meta`**，不 bake www。

已锁子面（继续生效）：

- 五主路由结构：`/` · `/traveltrust` · `/market` · `/did-rank` · `/community/*`
- `/traveltrust/announcements` 项目动态与公告
- 首页滚动公告 / pulse ticker
- Admin 工作台本 bake（今日待办 + 链上资金圈 + Official 地址）

---

## Agent MUST NOT（官网）

- `deploy-tt-web-production.sh` / Fly `tt-web-prod` bake（含 `--check-only` 在冻结期必须 FAIL）
- 用 `TT_SKIP_OFFICIAL_BASELINE_PIN=1` 假装已解锁产品面
- 把 `TRAVELTRUST_GIT_SHA=daa5ae87` 盖在脏树 / overlay 字节上
- 改五主结构 / 视觉 / layout / 公告 / ticker
- 为刷绿重开 BATCH-A Session / BFF / WalletConnect bake
- 从 `ugc-translate` / `batch-a-session` / `r-comm-identity` worktree bake www
- 用 living tree 或别的 worktree 覆盖本 pin
- 把本冻结写成 Production GO
- 把 NEW FeeRouter 写成 Official hop / 改 bake env 切 FR

**唯一解锁：** Owner 本轮写明真实错误（国家错 / 登录断 / 资金错 / 合约不可用）+ 明确授权新 bake。

---

## Web3 梯子（本冻结之后 · 不重复部署）

Money Path **已经部署并接线**。剩下的不是「再部署一遍」，是 Timelock **execute** 与 Reality **核验**。

| 项 | 状态 | 禁止 |
|----|------|------|
| Wired Factory `0xEE0BE3` · SR-FT `0xD1DA` · OLD FR `0x2aF47C` | **OFFICIAL_LIVE** | 重部署 |
| T1 / T2 Timelock | **`done=true`** | 重 schedule / 重 execute |
| GOV-04 PM upgrade | **已生效** · impl `0xB3bC` · **10→10** | 当未升级再升一次 |
| 1 USDC 双边释放 | **L7 PASS** · Indexer 已追上 | **禁止再打一笔真钱** |
| CI-02 A `setSeatRoutingConfig` on NEW FR | **EXECUTED** | 重 execute A |
| CI-02 B Official FR cutover `SR-FT.setFeeRouter(NEW)` | **ABORTED** · 未 schedule | 本波 bake 冒充 cutover |
| PM `$25` impl `0x53d0` | 已部署 · ETA 已过 · **`done=false`** | 重部署 / 与 CI-02 同波 |
| Seat / RegionVault | **NOT_DEPLOYED** · 83 Target | 画成 Official live |
| Proposal #3 | 正交 LONG_WAIT | 并入资金梯子 |

下一步（另授 · 两条独立）：CI-02 B Official FR cutover schedule → 48h → execute → PM `$25` `execute` → Official 收敛 → 1 USDC **投影/UI** 核验（不重打钱）。

---

## Restore verified（2026-08-17T04:12:55Z）

`fly deploy --image` only。www + apex `GET /api/release-identity` 已回到 pin：`git_sha=daa5ae87…` · `build_time=2026-08-16T15:15:49Z`。  
公告 5 chip（含 campaign / 活动）· 首页 ticker · 五主 HTTP 200 · API `8df2ab21…` 未改。  
证据：[`OFFICIAL-WWW-PRODUCT-PIN-RESTORED-STOP`](../../evidence/GO_official_www_product_surface/OFFICIAL-WWW-PRODUCT-PIN-RESTORED-STOP.md)

## STOP

```text
OFFICIAL_WWW_PRODUCT_PIN_RESTORED_STOP
OFFICIAL_WWW_PRODUCT_SURFACE_FROZEN
TT_PRODUCTION_GO=NO_GO
git_sha=daa5ae87b8c1af548c6beff6dd3451e5d386acf2
build_time=2026-08-16T15:15:49Z
fly_image=deployment-01M05JAAXJPTRZJAQEJ4JJWQMK
STOP
```
