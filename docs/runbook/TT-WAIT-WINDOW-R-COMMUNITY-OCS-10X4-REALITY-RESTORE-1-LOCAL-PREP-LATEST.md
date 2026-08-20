# TT · Wait Window · R-COMMUNITY-OCS-10X4-REALITY-RESTORE-1（LATEST）

**STATUS:** `RUNTIME_VERIFIED`  
**Stamp:** `2026-08-11T10:58:00Z`  
**Strategy:** `MAXIMIZE_PRE_ETA_REMEDIATION · TRACK1_MONEY_PATH_FROZEN`  
**Machine:** [`TT-WAIT-WINDOW-R-COMMUNITY-OCS-10X4-REALITY-RESTORE-1-LOCAL-PREP-LATEST.json`](./TT-WAIT-WINDOW-R-COMMUNITY-OCS-10X4-REALITY-RESTORE-1-LOCAL-PREP-LATEST.json)

**`TT_PRODUCTION_GO`:** `NO_GO` · **`blocks_track1_finalize`:** `false`  
**Evidence:** `evidence/GO_r_community_ocs_10x4_reality_restore/20260811T105240Z/`

---

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## 0 · Owner 写死

```text
设计真源 = data/official-cold-start/dataset.v1.json 10× community_post（按 cover 文件名对账）
禁止新造另一套「看起来像 10 条」的假帖
只恢复既有 Production identity · Track1 隔离 · 可回滚（unpublish）
```

## 1 · 对账结论（Production DB 只读）

| 类 | 数量 | 说明 |
|----|------|------|
| **STATUS_DRIFT_DRAFT** | **10/10** | `visibility=public` · `data_origin=production` · **`display_status=draft`** → 被 `governed_community_posts_v1` 排除 |
| MISSING_RECORD | 0 | 未缺记录 |
| 媒体 | 10/10 cover HEAD **200** | `ocs-*-community-cover.jpg` |
| private 双胞胎 | 每链 1 | **未删**（非破坏） |

**Staging ACTIVE UUID ≠ Production UUID**（预期）· Production 以 cover 文件名为 identity。

## 2 · 根因

1. **Feed/Detail：** 10 条 OCS 帖 `display_status=draft` → governed 视图 0 命中 → 瀑布只剩 Owner 3 视频。  
2. **Campaign 横幅：** 仅 2× `guide_post` 解析；`community_post` item_type **不被 consumer resolve**（`_ => None`）。  
3. **非 Track1** · 非抹库。

## 3 · 最小恢复（已 APPLY）

| 步 | 动作 |
|----|------|
| A | Admin `publish` + `setSurfaces` + priority/featured · **既有 10 public UUID** |
| B | Campaign：rollback 误试后 → SQL 激活 **10× 既有 `ops_official_guide_posts`**（`guide_post`）并 `deployed` |
| C | Gate：`scripts/dev/check-official-ocs-10x4-reality.py` 接入 `check-official-public-gates-regression.sh`（硬闸 · `TT_SKIP_OCS_10X4_REALITY=1` 逃生） |

**未做：** 新建帖 · 对象存储批处理 · 删 private 双胞胎 · Money Path。

## 4 · Official RV

| 面 | 结果 |
|----|------|
| Guides / Provider / Acquisition | **10 / 10 / 10** |
| Community feed OCS covers | **10/10**（feed 总 13 = 10 OCS + 3 Owner 视频） |
| Post detail | **10/10** `post != null` |
| Campaign `community_feed` | **10/10** guide_post → community_post_id |
| Probe 泄漏 | **0** |
| Track1 pin | `readyAt=1786491935` · `done=false` · USDC `10000000` · `isEscrow=false` |

**`PASS_OCS_10X4_REALITY`** · ≠ Seal · ≠ `TT_PRODUCTION_GO`

## 5 · 回滚

```text
Admin unpublish 10 public UUIDs → 回到 draft / 出 governed
Campaign：可将 guide_post items 标 rolled_back（保留行）
```

## 6 · ETA

`2026-08-11T23:45:35Z` → STOP → Track1 fresh Preflight
