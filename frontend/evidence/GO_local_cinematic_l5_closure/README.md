# Full-page cinematic L5 (`TT-CINEMATIC-L5-2026-05`)

**验收阶段：① 本地**（`/traveltrust` 电影动画；非 ②③）

**收口真源（标准 · 全模块清单 · 闭卷勾选）：**  
[`docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md`](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md)

**问题台账：** [`docs/runbook/issues-phase1-ui-ux-traveltrust-v6.md`](../../../docs/runbook/issues-phase1-ui-ux-traveltrust-v6.md#四电影动画-l52026-05-) · **TT-PH1-197**～**205**

Complements Hero globe closure [`TT-GLOBE-L5-2026-05`](../GO_local_hero_globe_a_closure/README.md).

**除真实数据外 ① 收口：** [`HOMEPAGE-NON-DATA-CLOSURE.md`](./HOMEPAGE-NON-DATA-CLOSURE.md)  
**营销前台（`/` + L0 + L1/兑换）：** [`../GO_local_marketing_front_closure/README.md`](../GO_local_marketing_front_closure/README.md)（2026-05-21）  
**② 本地媒体准备：** [`PHASE2-LOCAL-PREP.md`](./PHASE2-LOCAL-PREP.md) · `bash scripts/gates/traveltrust-phase2-local-prep.sh`

**代码完成度对照表：** [`COMPLETION-STATUS.md`](./COMPLETION-STATUS.md)（① 代码 vs 目视/§6.2 签字）。**§6.2 勾选：** [`SECTION-6-2-CHECKLIST.md`](./SECTION-6-2-CHECKLIST.md)。**Maintainer 一页：** [`MAINTAINER-ONE-PAGE.md`](./MAINTAINER-ONE-PAGE.md)。**工程锁：** [`ENGINEERING-LOCK.md`](./ENGINEERING-LOCK.md)。**索引 / ① 收口声明：** [`AUDIT-INDEX.md`](./AUDIT-INDEX.md) · [`CODE-CLOSURE-STATEMENT.md`](./CODE-CLOSURE-STATEMENT.md) · [`ISSUES-ENGINEERING-SYNC.md`](./ISSUES-ENGINEERING-SYNC.md)。

---

## Status（2026-05-20）

| Track | Status |
|-------|--------|
| `TT-GLOBE-L5`（地球） | **closed ①** — 见 sibling folder |
| `TT-CINEMATIC-L5`（全页电影） | **closed ①**（A–W 工程锁 + §6.2 maintainer 签字 **2026-05-20** · PNG 已刷新） |

---

## Code landed（P0 + P1 + 截图审计批 · 2026-05-19）

| Item | Change |
|------|--------|
| P0-1 | `PageTravelCorridorRing`: hub markers + flight chord + mobile mul |
| P0-2 | `TravelTrustRouteArc`: corridor text labels |
| P0-3 | `PageCinematicEnvironment` hide + horizon fog |
| P0-4 | `resolveCinematicCanvasCyanMul` on overlay |
| P1-1 | `TravelTrustStartRoutePreview` mini map card |
| P1-2 | Theater kicker warm; role video warm play ring |
| P1-3 | Trust/FAQ warm hover; liquidity kicker warm |
| P2 | `TravelTrustLandingChrome` heroT warm shadow |
| L5+ | Scroll chapter narrative · Hero trust chips · corridor hub labels · Bloom token · Pulse/Nav warm |
| L5+ | Letterbox warm overlay · `#start` step cycle sync · liquidity `l5-defer` scope note |
| **Rhythm batch** | `TT_PAGE_VERTICAL_RHYTHM_L5` — 全页 `sectionY` / FAQ 项距 / 剧场顶留白 / handoff 高度 |
| **G batch（2026-05-20）** | 顶栏再压 · 窄屏左下 scroll chrome · `TT_SCROLL_CHROME_PILL_L5` 与 Hero 提示统一 · handoff/环境/letterbox · 启程·费路由·页脚 · 稳定币间距 · WebGL 降级可读 |
| **H batch（2026-05-20）** | 全页截图审计 · O1–O12：Hero 卡/CTA/scroll pill · 剧场暖 grade · 信任四图标 · FAQ · 启程 lg 双栏 · 页脚 pending 虚线框 |
| **I batch（2026-05-20）** | tier-1 **强制暖占位**（禁冷青 poster/mp4）· 顶栏/Hero 再压 · FAQ/结算/稳定币 · 治理天平图标 · `capture-cinematic-l5-evidence.sh` |
| **J batch（2026-05-20）** | 「向下」移出 Hero 卡 · `SECTION-6-2-CHECKLIST.md` · capture 断言暖占位 · `prefersTheaterWarmPlaceholder` |
| **K batch（2026-05-20）** | 稳定币眉题/标题移出预览卡 · 信任 2×2 居中 · `verify-cinematic-l5-local.sh` · 合约测 scroll `outside-card` · [`DEFER-02-ROLE-MEDIA.md`](./DEFER-02-ROLE-MEDIA.md) |
| **L batch（2026-05-20）** | xl 顶栏单行 · Hero xl 顶距 · 结算区加宽 · 剧场旅游占位 i18n · WebGL 降级条可交互 · 左下省电提示对比度 |
| **M batch（2026-05-20）** | 合规/嵌入 nav 对比度 · 低画质钮单次脉冲 · Pulse 可读 · `#start` caption · `verify` 可选刷新 · [`DEFER-03-LIGHTHOUSE-WCAG.md`](./DEFER-03-LIGHTHOUSE-WCAG.md) |
| **N batch（2026-05-20）** | `verify` 校验 C1 地球 PNG · page-brief 暖 focus · `AUDIT-INDEX` / `CODE-CLOSURE-STATEMENT` · ① 代码清单正式收口 |
| **O batch（2026-05-20）** | `maybe-run-cinematic-l5-verify-on-diff` · `local-delivery-expanded` 自动挂钩 · `package.json` `test/verify:cinematic-l5` · solo-dev 专条 |
| **P–S batch（2026-05-20）** | FAQ/氛围去青 · 双顶栏 merged（suppress L0 nav）· handoff/剧场/启程/页脚 · Hero CTA 脉冲 · 结算/稳定币氛围 · C6 可选 PNG · `capture:cinematic-l5` |
| **T batch（2026-05-20）** | 信任暖板 · Pulse 可读 · verify 含 closure+contract · maybe-run 路径扩 |
| **U batch（2026-05-20）** | 工程锁 `A-U` · CONTRIBUTING 推送前 · E2E merged chrome · `MAINTAINER-ONE-PAGE` |
| **V batch（2026-05-20）** | 模块台账机读 · runbook §7 · maybe-run 扩 · 可选 C7 结算/稳定币 PNG · 批次 **A–V** |
| **W batch（2026-05-20）** | `traveltrustCinematicL5LocalGate` 契约 · issues/runbook §6.2 互指 · `capture:cinematic-l5:stable` · **A–W** |
| **X batch（2026-06-03）** | L1 公告标签簇对比度 **closed ①** — portal 继承 **`text-ink-900`** + **`text-ref-sun/NN` 失效** → **`TT_PULSE_TICKER_L5` rgba + globals** · [`L1-PULSE-LABEL-CONTRAST-FREEZE.md`](./L1-PULSE-LABEL-CONTRAST-FREEZE.md) |
| **P2 batch** | Horizon/Stars/Role poster 单次脉冲 · `TT_SECTION_CONTENT` 接 rhythm · Hero split feather · Trust 图标 · FAQ 答案区内边距 · 合规区 `max-w-3xl` |
| **Pulse P0** | 跑马灯 `flex-nowrap`、槽宽、`min-w` viewport、项间距；inline 64s |
| **Theater** | 顶负 margin 收敛；游客隐藏冗余 tag；`roleMetaPanel` 底 padding |
| **Hero** | 文案卡 gap、首屏 shell 高度略降、免责声明对比度 |
| **Liquidity** | `max-w-2xl` 降权；预览条间距；暖色 Escrow CTA |
| **Footer** | `xl:grid-cols-3` + `xl:contents` 三列（社媒｜产品｜信任） |
| **Audit B–F（2026-05-20）** | 顶栏压缩 · Hero/走廊胶囊 · 剧场占位/无剧场弧线气泡 · 信任/FAQ/启程/页脚 · 稳定币品牌色与免责合并 · Runbook Pulse 文案 |
| Tokens | `traveltrustCinematicPageL5.ts` · **非地球** `traveltrustCinematicNonGlobeL5.ts` |

**硬约束（本批）：** 未改地球 mesh / 自转 / `traveltrustGlobeEarthAsset` / `TravelTrustPageCinematicScene` 球体 rig。

**§6.2 截图：** 见 runbook [§7.1](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md#71-62-截图步骤maintainer--①)（`hero-scroll-handoff-l5.png` · `roles-theater-l5.png` · `start-steps-l5.png`）。

---

## Evidence files（maintainer）

| File | When |
|------|------|
| `hero-globe-l5-desktop.png` | 见 `GO_local_hero_globe_a_closure/` |
| `hero-scroll-handoff-l5.png` | 慢滚 0→#roles（C2） |
| `roles-theater-l5.png` | Tab 切换 + 暖环（C3/C4） |
| `start-steps-l5.png` | `#start` 三步 pill（C5） |
| `faq-trust-l5.png` | `#trust`→`#faq` 暖板（C6 可选） |
| User screenshots（2026-05-19） | 预审用；**不**替代 §6.2 正式三图入库 |
| [`CAPTURE.md`](./CAPTURE.md) | §6.2 截图步骤与自检清单 |

---

## Tests

```bash
cd frontend && npm run test -- --run traveltrustCinematicNonGlobeL5 traveltrustCinematicNonGlobeL5.closure traveltrustNetworkPage.contract
cd frontend && npm run check:e2e:tsc
```

## 可选：导出 §6.2 三图（dev 已起）

```bash
cd frontend
CAPTURE_CINEMATIC_L5=1 npx playwright test e2e/cinematic-l5-evidence-capture.spec.ts --project=chromium
```

见 [`CAPTURE.md`](./CAPTURE.md)；导出后仍须硬刷新目视再勾 runbook §6.2。

**闭卷：** 完成 [runbook §6.2](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md#62-全页电影tt-cinematic-l5) 全部勾选后，将 **TT-PH1-197** 升为 **closed ①**。
