# §6.2 全页电影 L5 截图步骤（① 本地 · maintainer）

**真源：** [`docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md`](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md#71-62-截图步骤maintainer--①)

**入口：** `http://127.0.0.1:3012/traveltrust`（或本地 dev 等价端口）  
**视口：** 桌面 **≥1280×800**，硬刷新（Ctrl+Shift+R）

## 产出文件（本目录）

| 文件名 | 操作 |
|--------|------|
| `hero-scroll-handoff-l5.png` | 自 Hero **慢滚** 至 `#roles` 中段：decor 收束、暖走廊环、章节字幕可见 |
| `roles-theater-l5.png` | `#roles`：Tab + 暖 SVG 标签 + 视频区；可切换 2 个角色确认无青闪环 |
| `start-steps-l5.png` | `#start`：三步 pill 与示意动线卡 **同步高亮**（约 2.8s 一轮） |
| `faq-trust-l5.png` | C6（可选）· `#trust`→`#faq` 暖板；**不**纳入 verify 必检 |
| `settlement-liquidity-l5.png` | C7（可选）· `#settlement` + `#liquidity` 氛围层；**不**纳入 verify 必检 |

**C1** 复用 [`../GO_local_hero_globe_a_closure/hero-globe-l5-desktop.png`](../GO_local_hero_globe_a_closure/hero-globe-l5-desktop.png)。

## 勾选（runbook §6.2）

入库三图后，在 runbook **§6.2** 勾选 C1～C6，并将 **TT-PH1-197** 升为 **closed ①**（仅当 maintainer 目视满意）。

## 自检清单（截图前 · 与 2026-05-20 审计批对齐）

- [x] 右下浮层：滚动 chrome **左下**；间距调试仅 dev / `?tt_spacing=1`（代码）
- [x] Pulse inline 慢速 marquee（`data-tt-traveltrust-pulse-scroll-mode="marquee"`；减动效 `static`）
- [x] 顶栏无「全部章节」下拉（`data-tt-traveltrust-landing-nav-no-more="1"`）
- [x] `/traveltrust` L0 四链已隐藏（`data-tt-marketing-header-site-nav="0"` · 章节 nav 仅在 LandingChrome）
- [x] 顶栏 **双行固定**：上行 **LIVE** + 章节 nav（`data-tt-traveltrust-landing-chrome-live-row-l5`）· 下行 **项目动态**（`data-tt-traveltrust-pulse-label-l5` · `data-tt-traveltrust-landing-chrome-pulse-row-l5`）
- [x] L1 公告标签簇对比度 **closed ①（2026-06-03）** — 暖金 **`rgba` + globals** · [`L1-PULSE-LABEL-CONTRAST-FREEZE.md`](./L1-PULSE-LABEL-CONTRAST-FREEZE.md)
- [x] tier-1 剧场占位含 **旅游叙事** 眉标（`data-tt-traveltrust-role-video-tourism-hint-l5`）
- [x] Hero→剧场 handoff 多层 scrim 已软化（token）
- [x] 剧场顶留白、视频 **暖占位**（路线框/照片框示意，剧场弧线 **无** 低对比气泡字）
- [x] 信任卡整链 `Link` + focus ring；**信任暖板**（`data-tt-traveltrust-trust-warm-plate-l5`）；FAQ 列表 `divide-y` inset + **FAQ 暖板**
- [x] `#start` 第三步 `upcomingClass` 可读；主 CTA **纯暖** 渐变（无冷青描边）
- [x] 稳定币 USDC/USDT 品牌色；免责声明收敛为预览条 + 底注
- [ ] **Maintainer 硬刷新目视** 上述项仍满意
- [x] 三 PNG 已入库本目录（机读；`verify-cinematic-l5-local.sh`）
- [ ] runbook §6.2 C1～C6 已勾选

**不**用 Vitest 绿代替本目录 PNG。

## 可选：Playwright 一键导出（dev 已起）

```bash
cd frontend
bash scripts/gates/capture-cinematic-l5-evidence.sh
# 或：CAPTURE_CINEMATIC_L5=1 npx playwright test e2e/cinematic-l5-evidence-capture.spec.ts --project=chromium
# ① 工程闸（Vitest + C1 地球 + C2–C5 三 PNG）：bash scripts/gates/verify-cinematic-l5-local.sh
# 重导并校验：CAPTURE_CINEMATIC_L5_REFRESH=1 bash scripts/gates/verify-cinematic-l5-local.sh
```

产出写入本目录 **C2–C5** 三文件名（**C6** `faq-trust-l5.png` 可选）；**仍须**你硬刷新目视满意后再勾 runbook §6.2。Maintainer 一页见 [`MAINTAINER-ONE-PAGE.md`](./MAINTAINER-ONE-PAGE.md)。
