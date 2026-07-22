# TT · PSG · Staging Public Page Surfaces（LATEST）

**阶段：** ② Staging · **≠** Reality Closure PASS · **≠** Production GO  
**Machine：** `TT_STAGING_PAGE_SURFACES`  
**Gate script：** `node scripts/dev/check-staging-public-page-surfaces.cjs`（已挂 `deploy-tt-web-staging.sh` post-deploy）  
**关联：** [10×4 Lock](./TT-PSG-PUBLIC-DISPLAY-10X4-LOCK-LATEST.md) · [Deploy Freshness](./TT-PSG-DEPLOY-FRESHNESS-GATE-LATEST.md) · [Wallet Drift Audit](./TT-PSG-STAGING-DISPLAY-WALLET-DRIFT-AUDIT-LATEST.md)

---

## 0 · Owner 写死（以后都以本页 + Gate 为准）

| 页面 / 面 | 真源 | 部署后必须 |
|-----------|------|------------|
| 首页 Ambient / 定制旅行国图 | Catalog `landing_ambient` + COS Tigris | count=10 · **0 Unsplash** · 无双刷 |
| 首页公告 / Pulse | `GET /api/v1/public/announcements` · `/pulse` | HTTP 200 · 非空运营面（允许数量随 CMS） |
| 自由市场主 `/market` | Discover + 子站入口 | HTML 200 · 0 Unsplash |
| 商家 `/market/provider` | OCS 10 provider | **恰好 10** · COS cover |
| 旅行收购 `/market/acquisition` | OCS 10 acquisition | **恰好 10** · COS cover · 角标暖金 |
| 向导公开列表 | OCS 10 guides | **恰好 10** · 中文城/title · 无 mojibake |
| TT 社区 `/community` | OCS 10 posts | **恰好 10** · COS media |
| 排行榜 `/did-rank` | `did-rank/guides` | HTTP 200 · 可读榜（现行抽样 10） |
| 钱包顶栏 | ① 下拉 SSOT | JS 含 `wallet-header-dropdown` · **禁止** tip 弹窗 `createPortal z-[320]` |
| Web/API tip | bake.json + secrets sync | **同 SHA** · `identity_source=docker-bake` |

**禁止：** clean tip 部署覆盖未提交 UI · Fly 钉死旧 `TRAVELTRUST_GIT_SHA` · showcase re-seed · Catalog bake=0 · 用 redeploy「碰运气」修展示。

---

## 1 · 命令

```bash
# 只读深检
node scripts/dev/check-staging-public-page-surfaces.cjs

# 展示锁（数据面乱时先跑这个，不要先部署）
STAGING_RC_BASELINE_ALIGNING=1 bash scripts/dev/run-lock-public-display-10x4-staging.sh

# 部署（自动：tip SHA · secrets sync · no-cache · post 10×4 · post page surfaces）
DEPLOYMENT_STATE=sync bash scripts/dev/deploy-tt-web-staging.sh
```

证据：`evidence/GO_public_display_10x4_lock/STAGING-PAGE-SURFACES-LATEST.json`

---

## 2 · 与 PSG Archive

| 项 | 口径 |
|----|------|
| PSG Archive `v1.1.0-psg-go.20260717` | **不可变** · **不是** Staging 展示内容库 |
| 本页 | Staging 公开展示 + 顶栏钱包 UI 防污染 **活 SSOT** |
| Reality Closure / GO | **另闸** · 本页 PASS ≠ Closure PASS ≠ Production GO |

---

## 3 · 2026-07-22 全站探针（修复后）

| 面 | 结果 |
|----|------|
| Web/API tip | `a9730cda` 对齐 · docker-bake |
| 10×4 | LOCKED |
| announcements | 10 · pulse 4 · 无 Unsplash |
| landing_ambient | 10 COS |
| did-rank guides | 10 |
| 各主路由 HTML | 200 · 首页/社区 COS · **0 Unsplash** |
| Discover orders | 0（OCS 公开展示不依赖发现流种子 · **非**旧包污染） |

钱包：**须 tip 含下拉**（本轮 commit 钉死）后再验 `wallet_dropdown_in_js=true`。
