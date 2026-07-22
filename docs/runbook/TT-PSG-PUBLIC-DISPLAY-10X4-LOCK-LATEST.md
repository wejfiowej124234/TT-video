# TT · PSG · Public Display 10×4 Lock（LATEST）

**阶段：** ② Staging 公开展示锁定 · **≠** ③ Production GO · **≠** 变更 PSG Archive `v1.1.0-psg-go.20260717`  
**Machine key：** `TT_PUBLIC_DISPLAY_10X4_LOCK: LOCKED`（对齐后）  
**关联：** SOPCP · OCS · DDG · CMS Ambient 防乱

---

## 0 · Owner 要求（写死）

公开展示面**只允许**：

| 面 | 数量 | 真源 |
|----|------|------|
| 向导 Guides | **10** | OCS `dataset.v1.json` / `state.json` |
| 商家 Provider | **10** | 同上 |
| 旅行收购 Acquisition | **10** | 同上 |
| TT 社区 Community | **10** | OCS `community_posts` |

**禁止：** Unsplash showcase 再种 · Faker/随机生成 · DDG 默认补种商家挂牌 · 用 redeploy「碰运气」清乱 · 改治理/Timelock/链上运营数据冒充内容治理。

**CMS Ambient（十国图）** 走 Catalog+COS，**不计入**上表四类业务卡，但同一套防乱纪律（bake `CATALOG=1` · 禁静默 Unsplash 当绿）。

---

## 1 · 根因（多维）

| 维 | 机制 | 部署清空？ |
|----|------|-----------|
| OCS 10×4 | 正确基线 | 否 |
| API showcase seed | `MARKET_PUBLIC_SHOWCASE` 在 staging 曾可插入 Unsplash 向导 | 否（越积越多） |
| DDG 脚本 step | 对齐后又 `seed-staging-showcase-market-listings` | 否 |
| UAT/smoke 残留 | 公开 catalog 未 unpublish | 否 |
| FE Catalog bake | `ENABLED≠1` → Ambient 回 Unsplash | 否（镜像内回退表） |
| 治理数据 | 无关；禁止动 | — |

**类：** `MULTI_SOURCE_PUBLIC_CATALOG_NOT_DB_WIPE`

---

## 2 · 永久闸（已合入工程）

1. **API：** `RuntimeIdentity::allows_market_showcase_seed()` — staging/prod **硬关**（与 community showcase 同级）。
2. **main.rs：** staging/prod 下 `SEED_TEST_ACCOUNTS=1` **不再**自动打开 showcase 旗。
3. **DDG / ML-DG：** 默认**跳过** showcase re-seed；仅 `OWNER_ALLOW_SHOWCASE_SEED=1`（本地演示）。
4. **seed-staging-showcase-*.cjs：** staging/prod API URL **exit 2** 除非 Owner escape。
5. **deploy-tt-web-staging：** `NEXT_PUBLIC_CATALOG_API_ENABLED` 默认 **1**，且 **≠1 阻断发布**。
6. **Dockerfile.fly-staging：** ARG 默认 **1**。
7. **Attestation tip 强制（防「一部署又旧」）：** Web bake **始终用当前 `git rev-parse HEAD`**；**禁止** `build.env.local` 钉死旧 SHA；默认 `FLY_WEB_NO_CACHE=1`；Docker bake 写 `public/tt-release-identity.bake.json`（优先于 Fly secrets）；每次部署 **同步/覆盖** `TRAVELTRUST_GIT_SHA*` secrets（曾因 secrets 钉死 `7c84ca23` 导致 release-identity 永远旧）。
8. **部署后 10×4 硬验：** `check-public-display-10x4-counts.py` 必须 `LOCKED_10X4`；漂移则 **先跑 lock 脚本**，**禁止**靠再部署碰运气。
9. **向导脏数据：** `archive-and-repair-staging-ocs-guides.cjs`（SQL · OCS 10 + 文案修复）+ API restart 纳入 lock 路径。
10. **OCS 运行时包钉死：** `evidence/GO_official_cold_start_dataset/ACTIVE.json` → **`20260708T121151Z/state.json`**；`findLatestOcsStatePath` **禁止**嵌套 `ocs-surface-expansion-*` 旧包赢 SSOT（曾导致 gate 假报 non-OCS）。
11. **Campaigns：** `lock-staging-campaigns-10-by-dataset.cjs`（按 dataset 名保留 10 · rollback 重复污染）挂入 10×4 lock。
12. **Page Surfaces 深闸：** post-deploy 验 OCS ID 归属 · mojibake · 公告 `title_zh` · campaign 面 · 钱包下拉（见 [Page Surfaces](./TT-PSG-STAGING-PUBLIC-PAGE-SURFACES-LATEST.md)）。

---

## 3 · 操作（修乱 · 不默认 redeploy）

```bash
STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh
# 仅计数：
python scripts/dev/check-public-display-10x4-counts.py
```

全量历史清理（含可选 deploy）仍可用：`run-staging-rc-ssot-alignment-cleanup.sh`（**勿**再开 showcase seed）。

**Owner 写死：** 公开展示乱了 = **数据面问题**，不是「再 deploy 一次」。部署只换 tip 镜像；OCS/Catalog 靠 lock + Freshness。

---

## 4 · PSG 关系（诚实）

| 项 | 口径 |
|----|------|
| PSG Production Baseline Archive | **不可变** · 本锁**不**改 Archive |
| PSG 主线 | Cert / Gates / Evidence — **不**替代 OCS/DDG 内容锁 |
| 本锁归属 | Staging RC SSOT + SOPCP + Display Governance（Public Catalog） |
| 以后 redeploy | tip attestation 强制 + Catalog bake + showcase 硬关 + **post 10×4** → **不应再复发** |
| **任何部署** | 必须过 [Deploy Freshness Gate](./TT-PSG-DEPLOY-FRESHNESS-GATE-LATEST.md)（10×4 + ACTIVE v311 + Catalog bake） |

---

## 6 · Staging 实测（2026-07-22 · Owner display align）

| 面 | 锁后 |
|----|------|
| Guides | **10** · OCS 中文城/title 已修（无 mojibake） |
| Provider | **10** · COS cover |
| Acquisition | **10** · COS cover |
| Community | **10** · OCS posts |

`verdict: LOCKED_10X4` · `python scripts/dev/check-public-display-10x4-counts.py`

**工程补丁（防 redeploy 复发）：**
- Showcase seed staging/prod 硬关
- DDG 默认不再 re-seed Unsplash
- Staging FE Catalog bake 必须 =1
- Web tip SHA **强制覆盖** + 默认 no-cache + post release-identity / 10×4 闸
- Guides SQL archive+repair（`archive-and-repair-staging-ocs-guides.cjs`）
- Ambient 国家切换：禁 TS→Catalog 二次换图；Ken Burns 不因 src remount
- 收购角标：Link/` :visited` 下 `#f9d779 !important` 加严

**禁止用本锁改：** 治理提案 · Timelock · FeeRouter · 链上运营数据 · PSG Archive。

---

## 7 · 验收

`check-public-display-10x4-counts.py` → `verdict: LOCKED_10X4` · `drifts: {}`  
Web `release-identity.git_sha` = API tip（同 SHA）· 首页无 `unsplash.com` · 收购角标可见暖金  
诚实边界：本锁 PASS ≠ Production GO ≠ Reality Closure PASS
① 本地绿 ≠ ② 本锁 ≠ ③ Production GO
