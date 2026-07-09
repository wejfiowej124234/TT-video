# 阶段一 · `/traveltrust` v6 UI/UX 问题明细（① 本地）

**Version:** 1.0.0  
**最后更新：** 2026-05-18  
**阶段：** **① 本地**（不宣称 ②③）  
**主审计：** [TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001](TT-PH1-TRAVELTRUST-V6-HOMEPAGE-AUDIT-001.md)  
**PI-1 闭卷表（可签）：** [issues-phase1-local-traveltrust-v6.md](issues-phase1-local-traveltrust-v6.md)  
**证据副本（可选）：** `evidence/GO_20260518/issues-phase1-local.md`（与本文互链，P0 状态须一致）

---

## 图例

| 状态 | 含义 |
|------|------|
| **closed** | ① 代码 + Vitest/E2E 已合入；浏览器硬刷新复验 |
| **partial** | ① 子集完成；余量见 defer 列 |
| **defer** | 明确延期到 ② 或 ③ |
| **open** | 未处理（本表 **无 P0 open**） |

---

## P0（挡 PH-1「可交付首页」口径）

| ID | 现象 | 处置 | 状态 |
|----|------|------|------|
| **TT-PH1-030b** | 生产级 hero/role 短片未入库 | ① **签字接受**：`npm run media:traveltrust-tier1` 占位 MP4 + 线框地球；生产实拍 **② 媒体批** | **closed ①**（接受出口） |
| **TT-PH1-050** | 埋点无生产 ingest | ① `POST /api/traveltrust/analytics` + `lib/analytics.ts` dev beacon；生产 ingest **defer ②** | **closed ①** / ingest **defer ②** |

---

## P1 · 已关闭（①）

| ID | 摘要 | 证据 |
|----|------|------|
| TT-PH1-011 | Trust + FAQ + settlement + footer | 契约 `sections.contract.test.ts` |
| TT-PH1-051 | page-brief 五事件对齐 | `traveltrustPageBrief.test.ts` |
| TT-PH1-060 | Hero 多 connector 钱包 | `TravelTrustHeroWalletConnect` + E2E |
| TT-PH1-073 | 动态 OG/Twitter 1200×630 | `opengraph-image.tsx` / `twitter-image.tsx` |
| TT-PH1-090 | WebGL 省电：标签页隐藏 + **仅 `#hero` IO** → `page-cinematic-power=idle` | `TravelTrustPageCinematicCanvas.tsx` |
| TT-PH1-120/121 | PULSE + 稳定币网关预览 | 页面锚点 + 组件 |
| TT-PH1-130～140 | Quick Explain、Trust、Stats、HUD、3D 章节、Phase1 高亮等 | Vitest 契约 |
| **TT-PH1-141** | FAQ locale 重复键覆盖 v6 文案 | `traveltrust_legacy_faq_*` + `traveltrustFaqV6Copy.test.ts` |
| **TT-PH1-142** | 地球首屏可视区（lower-third + `hero-globe-viewport`） | `TravelTrustCinematicHero` |
| **TT-PH1-143** | 电影上下黑边 | `TravelTrustHeroFilmChrome` letterbox |
| **TT-PH1-144** | 主 CTA + 钱包并排（`hero-cta-dock`） | `traveltrustHeroUi.ts` |
| **TT-PH1-145** | 滚出 hero 后 3D 静帧（非 roles 段误停） | `page-cinematic-inview` on `#hero` |
| **TT-PH1-146** | Quick Explain 两行（标题/详情） | `TravelTrustQuickExplain.tsx` |
| **TT-PH1-147** | 粘性页内 nav 移出 hero；skip → `#hero` | `TravelTrustNetworkPageMain.tsx` |
| **TT-PH1-003** | 13-1 白顶栏 vs traveltrust | **closed ①** — `Header.tsx` 深色顶栏 `#14100d` |
| **TT-PH1-004** | 壳色 vs 85 `#030712` | **closed ①** — v6 电影暖色 `#14100d` 有意；85 脚注待文档批 |
| **TT-PH1-032～035** | 生产 MP4 变体 | 随 **030b** ② 媒体批 |

---

## P1 · defer（不挡 ① PH-1）

| ID | 摘要 | defer |
|----|------|-------|
| TT-PH1-010 | 85 全 17 段 IA | ① 产品 — v6 电影 IA 为 scope |
| TT-PH1-101 | 同 003 文档脚注 | ② 文档批（实现已 closed） |
| TT-PH1-122 | PULSE CMS / API | **②** |
| TT-PH1-123 | 真链兑换路由 | **②③** |
| TT-PH1-073b | 品牌定制 OG 艺术图 / 分语言 PNG | **②** 设计批（机读 PNG 已有） |

---

## P2 / backlog

| ID | 摘要 | 状态 |
|----|------|------|
| TT-PH1-012 | 角色剧场自动播放音轨 | open P2 |
| TT-PH1-020 | 更深 LCP 预算 / 路由级 code-split | open P2 |
| TT-PH1-022 | 全站 hash 深链回归 | open P2 |
| TT-PH1-042 | 移动端 Bloom 默认关（可 env 开） | closed ① 默认桌面开 |
| TT-PH1-062 | view-only 钱包仅顶栏 | closed ① 设计如此 |
| TT-PH1-074 | Twitter card 与 OG 分语言 | defer ② |
| TT-PH1-081 | 3D SR 长描述扩展 | open P2 |
| TT-PH1-092 | 章节视频 `prefers-reduced-motion` 静态帧 | partial ① |
| TT-PH1-111/112 | 融资叙事外链密度 | open P2 |
| PH1-HOME-01 | `/` 行程提交依赖 API | open P2（非 traveltrust） |

---

## ① 浏览器复验（5 点 + 基础）

1. 硬刷新 `http://localhost:3012/traveltrust`  
2. `data-tt-traveltrust-page-cinematic-3d="1"`；`data-tt-traveltrust-hero-scrim="unified-3d"`  
3. 首屏见线框地球；上下 **letterbox** 黑边  
4. Hero **CTA 行**：主按钮 + 全宽「连接钱包」  
5. 滚至 **#roles**：`data-tt-traveltrust-page-cinematic-power="idle"`（DevTools）  
6. FAQ 首条为 v6「什么是 TravelTrust Network」（非 legacy 长文）  
7. `scripts/start-api-with-seed.bat` 后 `data-tt-traveltrust-page-brief-ready="1"`  
8. `/traveltrust/opengraph-image` → PNG 200  

---

## ① 命令

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
cd frontend && npm run dev:clean
# :3012 起后
TRAVELTRUST_PH1_E2E=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
cd frontend && npm run e2e:pi1-traveltrust
```
