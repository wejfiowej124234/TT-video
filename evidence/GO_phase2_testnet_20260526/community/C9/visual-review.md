# C9 · Community Staging Shell Visual Sign-off

**Generated:** `20260605T151358Z` (UTC)
**Phase:** ② testnet · **C9 slot only** — NOT Phase ② GO · NOT Production GO
**API:** `https://tt-api-staging.fly.dev` · **Frontend:** `http://127.0.0.1:3012`
**Showcase profile:** `/community/user/00000000-0000-4000-8000-000000000401`

**SSOT refs:** [FOUNDER-REVIEW-REPORT](../docs/runbook/FOUNDER-REVIEW-REPORT.md) · [31 §18.7](../docs/spec/31-TT社区页面设计.md) · [88 §三](../docs/spec/88-五主路由页身实现快照与UX缺口审计-20260330.md)

## 1. Executive verdict

| Item | Result |
|------|--------|
| **C9 slot verdict** | **PASS** |
| Feed production density | `30` posts · automation_leak `0` |
| Shell token vitest | exit 0 |
| Browser sign-off | OK |
| Required screenshots | 8/8 |

## 2. Page matrix (Founder Review + 88 §18.7)

| Surface | Route | Staging standard | Sign-off | Screenshot |
|---------|-------|------------------|----------|------------|
| Community Feed | `/community` | L1 Tab + premium shell + travel UGC | PASS | `c9-feed-desktop.png` |
| Explore | `/community/explore` | 发现壳 + 话题/目的地分区 | PASS | `c9-explore-desktop.png` |
| Friends | `/community/friends` | 空态/登录 CTA 或列表 | PASS | `c9-friends-desktop.png` |
| Messages | `/community/messages` | 会话壳 + 空态 | PASS | `c9-messages-desktop.png` |
| Activity | `/community/activity` | 通知/动态壳 | PASS | `c9-activity-desktop.png` |
| Profile (public) | `/community/user/00000000-0000-4000-8000-000000000401` | 作者主页 + Feed 卡片 | PASS | `c9-profile-user-desktop.png` |
| Profile (me) | `/community/me` | DID/钱包预览 + 资料卡 | PASS | `c9-profile-me-desktop.png` |
| Trust/DID rank | `/did-rank` | 信誉榜入口 + 壳 | PASS | `c9-did-rank-desktop.png` |
| Mobile Feed | `/community` | 390×844 可读 + FAB | PASS | `c9-feed-mobile.png` |

## 3. Product consistency checklist

| Check | Status | Notes |
|-------|--------|-------|
| 品牌字标 TravelTrust | **PASS** | L0 wordmark 一致；Nav 子项仍含历史文案见 §4 |
| Feed 卡片层级 | **PASS** | 标题/正文/目的地/标签/作者行/互动行分层可读 |
| 媒体展示 | **PASS** | C4/C5 staging 已验 MP4 + 多图；HLS/production CDN pending |
| Staging CDN next/image host | **PASS** | `cdn-staging.example.test` added to `next.config.js` remotePatterns (C9 data-link; fixes /community error boundary) |
| Trust/DID 可见性 | **PASS (staging)** | Feed 作者 role pill + wallet/DID short（有数据时）；`/community/me` DID 标签；numeric trust score → C12 |
| 空状态 | **PASS** | Friends/Messages 未登录 CTA；Explore 有引导 |
| 加载状态 | **PASS** | Feed/子路由 domcontentloaded 内壳可见；did-rank SSR 慢加载 → C12 |
| 错误状态 | **PASS** | Friends 开发 hint 环境门控；API 健康时无阻断错误页 |
| 通知/社交反馈 | **PASS** | C6 staging 社交图 + Activity 壳；Toast 一致性 → C10 宽路径 |
| 移动端适配 | **PASS** | 390 宽 Feed 单列 + FAB；密度优化 → B-03 plan |

## 4. Founder Review · B 类整改

| ID | Issue | C9 status | Plan / owner |
|----|-------|-----------|--------------|
| **B-01** | Feed Trust/Reputation/DID 徽章 | PARTIAL → acceptable staging | role + escrow + wallet short 已展示；numeric trust 分 → **C12** did-rank 互链 |
| **B-02** | 社交冷启动 | DONE | **C6 PASS** · follow/DM/activity |
| **B-03** | 移动 Feed 密度 | PLANNED | staging 可接受；compact 列表需产品批准（壳冻结评估） |
| **B-04** | did-rank 首屏 loading | PLANNED | **C12** SSR 骨架 / SWR |
| **B-05** | traveltrust 用户向 copy | PLANNED | 测试网保留协议说明 + 一行价值 — ③ 前 |
| **B-06** | 商家入驻价值主张 | OUT OF C9 | provider/register — 独立槽 |
| **B-07** | me/identities 交叉链 | PLANNED | Hub → 社区资料 data-link |
| **B-08** | Logo mark | PLANNED | 品牌 sprint · 不动五主 layout |
| **B-09** | Steward Nav | PLANNED | 强化 /traveltrust 信任区 CTA |
| **B-10** | 视频 CDN | PARTIAL | **C4 PASS** MP4 · HLS-CDN pending |
| **A-06** | Nav 命名 Web3旅行/TT 社区/排行榜 | PLANNED | i18n-only SSOT · 五主壳冻结下仅文案；**C10/C12 前** product sign-off |

## 5. C1–C8 evidence traceability

- **C1:** `PASS`
- **C2:** `PASS`
- **C3:** `PASS`
- **C4:** `PASS`
- **C5:** `PASS`
- **C6:** `PASS`
- **C7:** `PASS`
- **C8:** `PASS`

## 6. Boundaries (不可宣称)

- **C9 PASS** ≠ Phase ② GO ≠ C10–C12 GO ≠ full-site 93 GO
- Shell **layout lock** 仍受 [FIVE-MAIN-ROUTES-PHASE1-FREEZE](../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) 约束
- Production CDN/HLS · Nav 全量 rename · numeric trust 全 Feed 覆盖 → 后续槽位

## 7. Re-run

```bash
API_BASE=http://127.0.0.1:8080 PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 \
  bash scripts/dev/record-community-c9-evidence.sh
```

**Logged-in /community/me:** `c6-author-1780670465@example.com`

**Screenshots directory:** `screenshots/` (9 files)
