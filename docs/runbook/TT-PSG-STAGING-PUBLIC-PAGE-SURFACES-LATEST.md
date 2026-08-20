# TT · PSG · Staging Public Page Surfaces（LATEST）

> **Official Product Truth（活面）：** TravelTrust Official · **OPS-2026.08.20-v9** (`3e356617` / `2026-08-20T00:51:57Z` / `hybrid-…-v9`) · API `8df2ab21…` · historical `daa5ae87` SUPERSEDED · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)


**阶段：** ② Staging · **≠** Reality Closure PASS · **≠** Production GO  
**Machine：** `TT_STAGING_PAGE_SURFACES`  
**Gate：** `node scripts/dev/check-staging-public-page-surfaces.cjs`（已挂 `deploy-tt-web-staging.sh` post-deploy）  
**关联：** [10×4 Lock](./TT-PSG-PUBLIC-DISPLAY-10X4-LOCK-LATEST.md) · [Deploy Freshness](./TT-PSG-DEPLOY-FRESHNESS-GATE-LATEST.md) · [Wallet Drift](./TT-PSG-STAGING-DISPLAY-WALLET-DRIFT-AUDIT-LATEST.md)

---

## 0 · Owner 写死（以后都以本页 + Gate 为准）

| 页面 / 面 | 真源 | 部署后必须 |
|-----------|------|------------|
| **OCS UUID 包** | `evidence/GO_official_cold_start_dataset/ACTIVE.json` → **`20260708T121151Z/state.json`** | **禁止** lexicographic 误选 `ocs-surface-expansion-*` 等嵌套旧包 |
| 首页 Ambient / 定制旅行国图 | Catalog `landing_ambient` + COS | count=**10** · **0 Unsplash** · 无双刷 |
| 首页公告 / Pulse | `public/announcements` · `/pulse` | HTTP 200 · `title_zh` 非空 · Pulse 可读 |
| 首页 Campaign 面 | cold-start surfaces（`home_hero`/`home_feed`/`landing_promo`…） | 各面有 campaign · **deployed campaigns = 10**（dataset 名锁 · 禁 127 重复污染） |
| 自由市场主 `/market` | Discover + 子站入口 | HTML 200 · 0 Unsplash · discover 公开订单 **0** |
| 商家 `/market/provider` | OCS 10 provider | **恰好 10** · **ID ∈ OCS** · 0 mojibake · COS |
| 旅行收购 `/market/acquisition` | OCS 10 acquisition | **恰好 10** · **ID ∈ OCS** · 角标暖金 |
| 向导公开列表 | OCS 10 guides | **恰好 10** · **ID ∈ OCS** · 中文城/title · 0 mojibake |
| TT 社区 `/community` | OCS 10 posts | **恰好 10** · **ID ∈ OCS** · COS media |
| 排行榜 `/did-rank` | `did-rank/guides` | HTTP 200 · 可读榜 |
| 定制旅行 `/traveltrust` | 五主冻结页 | HTML 200 · 0 Unsplash |
| 钱包顶栏 | ① 下拉 SSOT | JS 含 `wallet-header-dropdown` · **禁止** tip 弹窗 `z-[320]` |
| Web tip | bake.json + secrets sync | **= 本次 deploy HEAD** · `identity_source=docker-bake`（FE-only 时 API tip 可落后） |

**禁止：** clean tip 覆盖未提交 UI · Fly 钉死旧 `TRAVELTRUST_GIT_SHA` · showcase re-seed · Catalog bake=0 · 嵌套 OCS 实验包当运行时 SSOT · 用 redeploy「碰运气」修展示。

---

## 1 · 命令

```bash
# 只读深检（OCS ID + campaign 面 + 公告 + 钱包）
EXPECT_GIT_SHA=$(git rev-parse HEAD) node scripts/dev/check-staging-public-page-surfaces.cjs

# 展示锁（数据面乱时先跑这个，不要先部署）
STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh
# 含：guides/market/community SQL + campaigns dataset-10 rollback
# OCS UUID SSOT：evidence/GO_official_cold_start_dataset/ACTIVE.json

# 部署（自动：tip SHA · secrets sync · no-cache · post 10×4 · post page surfaces）
DEPLOYMENT_STATE=sync bash scripts/dev/deploy-tt-web-staging.sh
```

---

## 2 · 2026-07-22 全站复扫（redeploy `2868bbf7` 后）

| # | 面 | 旧数据/污染？ | 状态 |
|---|----|---------------|------|
| 1 | Web tip / bake | 否 | `2868bbf7` · docker-bake |
| 2 | 首页公告 10 + Pulse 4 | 否 | `title_zh` 有内容 |
| 3 | Ambient 10 | 否 | Catalog · 0 Unsplash |
| 4 | Campaigns | 否（曾 127 → 已锁 10） | dataset 名锁 |
| 5 | Guides / Provider / Acquisition / Community | 否 | 各 10 · ID ∈ OCS 20260708 |
| 6 | Discover 公开订单 | 否 | **0** |
| 7 | `/` `/market*` `/did-rank` `/community` `/traveltrust` | 否 | HTML 200 · 0 Unsplash |
| 8 | 钱包下拉 | 否 | `wallet_dropdown_in_js=true` |

证据：`evidence/GO_public_display_10x4_lock/STAGING-PAGE-SURFACES-LATEST.json` · `STAGING-FULL-PAGE-RESCAN-LATEST.json`

**诚实边界：** `PAGE_SURFACE_OK` ≠ Reality Closure PASS ≠ Production GO · Inventory 未就绪域仍阻塞 Closure。
