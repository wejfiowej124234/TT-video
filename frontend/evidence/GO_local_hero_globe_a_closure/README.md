# Hero tourism globe — Phase A closure (`TT-GLOBE-A-2026-05`)

**Status: CLOSED · FROZEN · P0 VISUAL SIGNED · ① local · 2026-05-21** — `TT-GLOBE-L5-FROZEN-2026-05`；**禁止**再改地球 mesh / 光照 / 弧线针脚 / WebGL 调色，以及 Hero 遮挡栈（见下表）unless explicit unlock.

## P0 目视冻结签收（2026-05-21 · ①）

| 项 | 结论 |
|----|------|
| 机读 | `traveltrust-hero-p0-globe-acceptance` + `traveltrust-layer-kill-audit` **PASS** |
| 目视样张 | [`p0-acceptance/hero-p0-hard-refresh.png`](./p0-acceptance/hero-p0-hard-refresh.png) — 完整地球、大陆、Phase1 航线弧、枢纽、右侧文案卡；无 sky-wash / video / 横条压球 |
| 冻结 ID | **`TT-GLOBE-L5-FROZEN-2026-05`** · `TRAVELTRUST_HERO_GLOBE_FROZEN_LOCKED_AT=2026-05-21` |

**冻结后禁止（Hero 首屏 · 未经书面解除不得恢复）：** 遮罩 / 渐变 / `hero-loop` video / `sky-wash` / `sky-cap` / `dom-veil` / `canvas-warm-base` / copy-scrim / copy-shimmer / warm-band / bridge-shimmer / viewport split-feather / unified grain；**禁止**改 `traveltrustHeroGlobeFrozenManifest` 清单内 WebGL 球面调色与 mesh。

## P1 联动收口（2026-05-21 · ①）

| 轨 | 内容 | 机读 |
|----|------|------|
| A | Roster/紧凑 pill ↔ `data-tt-traveltrust-globe-focused-region` ↔ 弧线强调 | `traveltrust-hero-p1-linkage` |
| B | 主 CTA `href=#start?region=` + `#start` `data-tt-traveltrust-start-prefill-region` | 同上 |
| C | kicker/tagline Web3 叙事 · `data-tt-traveltrust-hero-narrative-l5=web3-network` | 契约 + locale |

```bash
cd frontend && npm run test -- traveltrustHeroGlobeP1Link
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p1-linkage traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
```

**仍禁止：** P0 遮挡层 / WebGL 调色 / 冻结 mesh 改动。

## P1 验收闭环（2026-05-21 · ① · **CLOSED**）

| 链路 | 机读 | 证据 |
|------|------|------|
| 硬刷新 | `traveltrust-hero-p1-linkage` desktop + mobile **PASS** | [`p1-acceptance/`](./p1-acceptance/) |
| Roster | 桌面紧凑 pill hover · 移动 chip hover | `03-*` · `07-*` |
| 针脚 | Canvas 区 hover + click → `#start?region=`（`pinProbe.clickVia` 见 report） | `04-*` · `05-*` |
| CTA hover | dock hover → `globe-focused-region` | `02-*` |
| CTA click | `href=#start?region=` + `#start` prefill | `06-*` + [`acceptance-report.json`](./p1-acceptance/acceptance-report.json) |
| P0 回归 | 遮挡层 0 · `traveltrust-hero-p0-globe-acceptance` | 同批探针 **PASS** |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p1-linkage traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
```

## P2-B 走廊强绑定（2026-05-21 · ① · **CLOSED**）

| 项 | 内容 |
|----|------|
| Hash | `#start?region=&step=plan\|match\|escrow`（Hero CTA / roster / pin 默认 `step=plan`） |
| 绑定 | `traveltrustStartCorridorBinding.ts` → `data-tt-traveltrust-start-corridor` / `data-tt-traveltrust-start-step-id` |
| 机读 | `traveltrust-start-corridor-p2` + P0/P1 回归 **PASS** |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-start-corridor-p2 traveltrust-hero-p1-linkage traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
```

## P3-A/B 全球网络装饰 + Hero 叙事（2026-05-21 · ① · **精修 · 机读待复跑**）

| 项 | 内容 |
|----|------|
| P3-A | 24 光点 · 8 轻量走廊弧 · **仅 6 核心枢纽文字标签**（cn/us/fr/jp/sg/ae）· 装饰权重 `light` |
| P3-B | 一句 lead（`traveltrust_hero_p3_lead`）+ plan/match/escrow 微时间轴 · 去掉走廊实况条/重复 tagline |
| 精修 | 首屏标签 4–6 · 地球主体更清晰 · Hero 卡文案约减 20–30% · 下方仅 L5 间距/ambient 微调 |
| 探针 | `traveltrust-hero-p3-network-decor` + P0/P1/P2 **`npm run e2e:hero-globe-closure`** |

证据：[`p3-acceptance/`](./p3-acceptance/) · 规划：[`P3-PLAN.md`](./P3-PLAN.md)

## P2-C 剧场叙事联动（2026-05-21 · ① · **CLOSED**）

| 项 | 内容 |
|----|------|
| 绑定 | `#roles` ↔ P1 `region` + P2-B `corridor` + `step` |
| 机读 | `data-tt-traveltrust-theater-p2-narrative` / `-corridor` / `-region` / `-step-id` / `-default-role-id` |
| 探针 | `traveltrust-hero-p2-theater` + P0/P1/P2-B 同批回归 **PASS** |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p0-globe-acceptance traveltrust-hero-p1-linkage traveltrust-start-corridor-p2 traveltrust-hero-p2-theater --config=playwright.scene-debug.probe.config.ts
```

证据：[`p2c-acceptance/`](./p2c-acceptance/)

**未做：** P2-A 相机微动。

**P2-B 证据索引：** [`p2b-acceptance/README.md`](./p2b-acceptance/README.md)

## 提交前收口（2026-05-21 · ① · P0/P1/P2-B/P2-C）

| 检查项 | 结论 |
|--------|------|
| 冻结 Hero mesh / WebGL 调色 | `traveltrustHeroGlobeFrozenManifest` 清单路径**本批 P2 未改 mesh**；`TravelTrustCinematicHero` 保持 `data-tt-traveltrust-hero-dom-video="0"` |
| P0 遮挡层 | **未恢复** `hero-loop` video / `sky-wash` / `sky-cap` / `dom-veil`；`heroGlobeUnobstructed=1` 时不渲染 `canvas-warm-base` |
| Vitest | `traveltrustHeroGlobeP1Link` · `traveltrustStartCorridorBinding` · `traveltrustTheaterCorridorBinding` · `traveltrustNetworkPage.contract` → **22/22 PASS** |
| Playwright | `traveltrust-hero-p0-globe-acceptance` · `p1-linkage` · `start-corridor-p2` · `hero-p2-theater` → **8/8 PASS** |
| 未做 | P2-A 相机微动 |

```bash
cd frontend && npm run test -- traveltrustHeroGlobeP1Link traveltrustStartCorridorBinding traveltrustTheaterCorridorBinding traveltrustNetworkPage.contract
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p0-globe-acceptance traveltrust-hero-p1-linkage traveltrust-start-corridor-p2 traveltrust-hero-p2-theater --config=playwright.scene-debug.probe.config.ts
```

**阶段：** ① 本地闭环；**不**宣称 ②③ staging/production GO。

## P0 Hero 主视觉验收闭环（2026-05-21 · ①）

**范围：** 仅拆掉遮挡 Canvas 的 DOM/CSS 与首屏 L5 动效；**不**新增渐变/遮罩/video/WebGL 调色；**不**改冻结地球 mesh（`TT-GLOBE-L5-FROZEN-2026-05`）。

| # | 通过条件 | 机读 |
|---|----------|------|
| P0-1 | 硬刷新后 WebGL 绘制地球+大陆+Phase1 弧/针 | `traveltrust-hero-p0-globe-acceptance` probe |
| P0-2 | 零遮挡层：`sky-wash` / `sky-cap` / `veil` / `#hero video` / `warm-base` / copy-scrim / copy-shimmer / warm-band / bridge-shimmer | 同上 + `traveltrust-layer-kill-audit` |
| P0-3 | `data-tt-traveltrust-hero-globe-unobstructed=1` · shell `opacity:1` · `frameloop=always` | probe |
| P0-4 | 右侧文案卡可见（浮在球上） | probe screenshot `p0-acceptance/hero-p0-hard-refresh.png` |

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-hero-p0-globe-acceptance --config=playwright.scene-debug.probe.config.ts
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-layer-kill-audit --config=playwright.scene-debug.probe.config.ts
npm run test -- traveltrustNetworkPage.contract traveltrustHeroGlobeFrozen
```

**P0 已签收（2026-05-21）：** 上表目视 OK → Hero **已复锁**；进入 **P1** 时仅改联动/叙事，**不得**恢复本节禁止项。

**Frozen ID:** `TT-GLOBE-L5-FROZEN-2026-05` · 清单 [`frontend/lib/traveltrustHeroGlobeFrozenManifest.ts`](../../lib/traveltrustHeroGlobeFrozenManifest.ts) · 契约 `npm run test -- traveltrustHeroGlobeFrozen`

**验收阶段：① 本地**（装饰性 3D，非 ② 航班/订单数据，非 ③ 生产 GIS）

## 锁定说明（maintainer · 不再改动）

| 项 | 内容 |
|----|------|
| **锁什么** | Hero 3D 地球、Phase1 弧线/针脚、大气/光照/贴图增强、Hero 段 Bloom 关闭规则 |
| **不锁什么** | 全页滚动剧场、`#start`、文案卡、Trust/FAQ（见下方 Same page 表） |
| **解除** | 仅当书面「解除地球锁定」+ 更新 manifest `LOCKED_AT` + 新证据图 |
| **样张** | [`p0-acceptance/hero-p0-hard-refresh.png`](./p0-acceptance/hero-p0-hard-refresh.png)（**P0 目视冻结 · 2026-05-21**）；历史 [`hero-globe-l5-desktop.png`](./hero-globe-l5-desktop.png) |

## Definition of done (A)

| # | Criterion | Verify |
|---|-----------|--------|
| 1 | Bundled equirect earth JPEG + `GLOBE_EARTH_TEXTURE_LICENSE.md` | `npm run test -- traveltrustGlobeEarthAsset` |
| 2 | No protocol wireframe node mesh on Hero | Visual: no dense lat/lon grid |
| 3 | Readable continents (NASA-style texture) | Visual: Americas / Eurasia recognizable |
| 4 | Phase1 destination pins + great-circle arcs | Visual: glow pins + cyan/coral arcs |
| 5 | Desktop full arcs / mobile lite / low-quality procedural | Resize + header “低画质” toggle |
| 6 | Reduced motion / WebGL fallback unchanged | `prefers-reduced-motion` → static poster |
| 7 | SR + roster copy say illustrative; desktop pins interactive | `traveltrust_cinematic_sr_desc` |
| 8 | Contract + Vitest green | `npm run test -- traveltrustNetworkPage.contract traveltrustGlobeEarthAsset` |

## P0 polish (2026-05 · ①)

- Removed glass shell + holo grid on Hero; thinner Fresnel (`intensity↓ power↑`)
- Phase1 arcs/pins decoupled from `enableGlow` (`showPhase1Decor`) — visible in low-quality mode
- Stronger arc/pin contrast; Bloom/CSS cyan scrim reduced

## L5 sprint (`TT-GLOBE-L5-2026-05` · ①)

| Track | Done |
|-------|------|
| L4 收口 | Softer arc tubes, pin halos, copy card width, tagline wrap |
| L4+ | `BrightnessContrast` grade, atmosphere haze, earth/cloud tune |
| Phase B | Desktop pin **hover tooltip** + **click → `#start`**; `data-tt-traveltrust-globe-interactive=1` |
| L5 polish | Arc **hover highlight**; **warm globe scrim**; EU pin spread; hub/arc SSOT on land; camera-facing cull (no orphan sea chords) |

**P0 fix (sea-to-sea arc):** hub/arc SSOT on land; **world-space** camera cull; **Atlantic/Asia route bias**; pin facing cull; no `ambientParticles`.

## L5 visual batch 2 (2026-05 · ①)

| Item | Change |
|------|--------|
| Arcs | Softer tubes / lower white core |
| Pins | Stem + S-tier flag disc (map pin) |
| Earth | Arctic pole suppress; warmer fill light; `heroYawOffset` → Eurasia |
| Atmosphere | Warm haze + cool back rim |
| HUD | Left pill follows `routeBias` / visible hubs (`traveltrustGlobeHeroHud`) |

## L5 batch 3 (2026-05 · ①)

| Item | Change |
|------|--------|
| Left pill | Short copy, `line-clamp-2`, links `#start` + `traveltrust_plan_trip_click` |
| Hero kicker / chips | Tourism-first copy (zh/en) |
| Arcs / pins | Softer tubes; S-tier pin + flag disc scale ↑ |
| Evidence | Save `hero-globe-l5-desktop.png` after hard refresh |

## L5 color priority pass (2026-05 · ①)

| P1 | Hero 关闭 Bloom；仅 `FillLight` 照球 |
| P1 | 极薄蓝大气边 `TourismGlobeDaylightAtmosphereRim` |
| P1 | 暖走廊弧加粗；地表 B 略升（海洋偏蓝） |
| P1 | 首屏压 film 冷色层；夜灯减弱 |

## TT-GLOBE-L5 解除锁定 · 暖墨统一 pass 3（2026-05-20 · ①）

**用户书面同意解除** `TT-GLOBE-L5-FROZEN`（见对话 · `TRAVELTRUST_HERO_GLOBE_UNLOCK_PASS`）。

| 层 | 改动 |
|----|------|
| 贴图 | `enhanceTraveltrustGlobeEarthMap` 更强暖乘；程序化海洋 → 褐绿 `#2e2820` 系 |
| 光照 | `TravelTrustTourismGlobeFillLight` 环境/半球压冷、主光暖 key |
| 云层 | `meshStandardMaterial color #ebe3d6` |
| 弧线 | glow 管更细、opacity↓；`glowHalo` 暖杏 |
| 视觉 token | `TT_CINEMATIC_GLOBE_VISUAL` 亮度/弧/针脚/夜灯再收 |
| Bloom | 首屏更早关闭（`heroFocus > 0.48`） |

验收：`set TRAVELTRUST_UI_HANDOFF=1` 后 `scripts/start-api-with-seed.bat` → http://127.0.0.1:端口/traveltrust 硬刷新。

## 排查步骤（2026-05-20 · ① · 按序执行）

| 步 | 验证点 | DevTools / 代码 |
|----|--------|-----------------|
| 1 | 空域 `#0c0a09` | `data-tt-traveltrust-hero-canvas-overlay-empty="1"` 且 overlay `background` 为空 |
| 2 | 非 JPEG 蓝海 | `data-tt-traveltrust-globe-earth-source="procedural"`（首屏 `hero-warm-ink-sky=1`） |
| 3 | 非 Standard 冷反光 | `data-tt-traveltrust-hero-warm-ink-sky="1"` → `litEarth: false` |
| 4 | heroT 同步 | `data-tt-traveltrust-hero-t` 随滚动变化 |

## L5 pass 7 · 排查落地（2026-05-20 · ①）

| 项 | 改动 |
|----|------|
| heroT | Canvas → Scene 传参（R3F 可靠重渲染） |
| 球面 | `resolveHeroWarmInkGlobeTier` · procedural 褐绿海洋 |
| 贴球 veil | 首屏关闭；缘壳减弱 |
| 弧线 | `useSyncExternalStore` 同步 heroT |

## L5 pass 6 · 蓝紫根因收口（2026-05-20 · ①）

| 项 | 改动 |
|----|------|
| 贴图 | `enhanceTraveltrustGlobeEarthMap`：sepia + 暖 hue + 更强 multiply（压蓝海） |
| Hero scrim | `buildHeroGlobeKeepoutMaskImage` 镂空，不再盖球 |
| 弧线 | 首屏 `heroT<0.58` 关闭 glow 外管 |
| 光照 | `PageCinematicLighting` 用 **heroT+pageT** 判首屏 |
| 环境 | 首屏隐藏 `BelowFoldAtmosphere`；雾/场景底 `#0c0a09` |

## L5 pass 5 · 横条叠层修复（2026-05-20 · ①）

| 项 | 改动 |
|----|------|
| 叠层顺序 | `TravelTrustHeroGlobeUnderlayDecor` **z-[8]** → WebGL **z-[9]** → 文案 **z-[12]** |
| Canvas overlay | 首屏剔除全宽 `linear-gradient(to bottom/top)` 地板带 |
| 剧场 handoff | `below-hero-fade` 球区 mask + 减弱 ink bridge |
| mask | `buildHeroGlobeKeepoutMaskImage` 扩大镂空（82%×78%） |

## L5 pass 4 · 可读性 + 暖墨空域（2026-05-20 · ①）

| 项 | 改动 |
|----|------|
| 地球 | `earthDisplayBrightness` ↑；贴球 veil ↓；暖色 `HeroGlobeWarmBacklight` |
| 贴图 | 海洋略提亮；JPEG 暖乘减轻 |
| 空域 | `buildHeroOuterSkyWarmAccentLayer` + 外圈暖墨；雾 `#110f0d` |
| 弧线/pin | opacity / 管径略回升 |
| 布局 | 地球 scale `0.84`；左侧 roster 链接触光增强 |

## L5 sky warm regression (2026-05-20 · ①)

| 项 | 改动 |
|----|------|
| 根因 | 针脚/弧线 L5 批次叠了 **蓝大气边 `#8ecae8`**、**FillLight 冷 hemi `#dce8f0`**、**pin additive 光晕** → 空域发青紫（非页面 `bg` 单行） |
| 大气 | `atmosphereDaylightRim` → 暖 `#e8c4a8`、强度 ↓ |
| 光照 | `hemisphereLight` → `#141210` / `#0c0a09` |
| 地表 | 色乘 R≥B（减海洋青偏） |
| 针脚 | halo/core **NormalBlending**、opacity ↓ |
| 弧线 | glow 管半径/opacity ↓ |
| 空域 CSS | `buildHeroWarmCanvasOverlayLayers` 中心留球、外围高不透明暖墨；`TT_CINEMATIC_SHELL_L5_VIGNETTE` 中心不再 `transparent`；首屏 `hero-sky-wash` + `multiply`  tint |
| 地表贴图 | `enhanceTraveltrustGlobeEarthMap` 降饱和/暖乘色加强 |
| 首屏 | Canvas 首屏不等待 `entered`；`PageCinematicHeroWarmFill` 略加强 |

## L5 hero color pass (2026-05 · ①)

| Item | Change |
|------|--------|
| Page lights | Hero 压冷青点光（`heroCoolBrandLightMul`）；太阳向暖 key |
| Pulses | `RouteTrustPulses` 暖色走廊 |
| Arcs | `NormalBlending` 防_additive 洗白 |
| Bloom | 降强度/提 threshold 防紫边 |
| Earth | 略暖色乘子（R>G>B） |

## L5 atmosphere + arcs pass (2026-05 · ①)

| Item | Change |
|------|--------|
| Atmosphere | Single thin forward haze; no back-shell; Normal blend |
| Arcs | No white core tube; thicker warm tubes |
| Canvas | Skip cyan scrim layers when `cyanMul ≤ 0.14` |
| Hero copy | Wider copy column; title wrap/clamp fix |

## L5 realism pass (2026-05 · ①)

| Item | Change |
|------|--------|
| Lighting | Shared `TRAVELTRUST_GLOBE_SUN_DIR`; lower ambient/hemi; stronger key light |
| Clouds | `cloudOpacity` token (was undefined); softer standard material |
| Texture | Slightly higher contrast/saturation; warm pole suppress |
| Atmosphere | Thinner back haze |

## L5 P0 polish (2026-05 · ①)

| Item | Change |
|------|--------|
| Left pill | `left-4` + `overflow-visible` on globe column — no viewport clip |
| EU pins | Lower-lat FR/ES offsets; halos ×0.5 for fr/es |
| Arcs | Atlantic bias → only `us-fr` + `us-es`; Asia set drops `cn-fr` |

## L5 closure checklist (① · maintainer)

| # | Check | Pass |
|---|--------|------|
| L5-1 | No Pacific orphan arc at default yaw | ☑ |
| L5-2 | Bottom pill full text, centered under globe | ☑ |
| L5-3 | Pill + pin click → `#start` | ☑ (maintainer) |
| L5-4 | Desktop pin hover tooltip | ☑ (screenshot) |
| L5-5 | `hero-globe-l5-desktop.png` saved here | ☑ |

Evidence: [`hero-globe-l5-desktop.png`](./hero-globe-l5-desktop.png).

Manual spot-check if regressing: desktop hover CN/FR pin → tooltip + related arcs brighten; click → scroll to start. Mobile / low-quality / reduced-motion: pins not interactive (SR updated).

**Full-page cinematic L5 (scroll handoff / theater / `#start`):** [`GO_local_cinematic_l5_closure`](../GO_local_cinematic_l5_closure/README.md) · `TT-CINEMATIC-L5-2026-05` · **标准 SSOT：** [`docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md`](../../../docs/runbook/TT-PH1-CINEMATIC-ANIMATION-L5-001.md).

## Same page — other motion (globe-only scope above)

| Layer | What moves | Code |
|-------|------------|------|
| Scroll cinematic | Hero globe **dives into `#roles` theater** on scroll (`UNIFIED_PAGE_3D`) | `TravelTrustPageCinematicCanvas.tsx`, `TravelTrustPageCinematicScene.tsx` |
| Role theater | Tab switch, Framer entrances, optional **local** `TravelTrustTheaterScene3D` ring when unified 3D off | `TravelTrustIdentityTheater.tsx` |
| Role video | MP4 per traveler/guide/operator | `TravelTrustRoleVideoPlayer.tsx` |
| Hero copy | Kicker/title/chips Framer stagger | `TravelTrustCinematicHero.tsx` |
| Below-fold strips | Trust / FAQ / settlement section motion | `TravelTrustBelowFoldSections.tsx`, `traveltrustSectionMotion.ts` |
| Chrome | Scroll progress, film grain, below-fold atmosphere | `TravelTrustScrollProgress.tsx`, `TravelTrustCinematicShell.tsx`, `TravelTrustBelowFoldAtmosphere.tsx` |

## L4+ arc & pin pass (2026-05 · ①)

- Travel arcs: `TubeGeometry` solid light tracks (no dashed `Line`)
- Hero-facing arc culling + flow pulses on S / key A routes
- Pin display offsets for EU / JP / KR / SG (routes unchanged)
- Atmosphere haze shell; cloud/sea roughness tweak

## P0+P1 tourism pass (2026-05 · ①)

- Day-side lighting (camera-side key light); brighter earth JPEG; lower night-light strength
- Hero: **no** `TrustEscrowFilaments` (removes equator dashed lines)
- Travel pins: stem + dot (no Saturn rings); compact roster copy → corridors / custom trip
- Cloud opacity ↑; `heroYawOffset` tuned for daylight hemisphere

## L4+ visual stack (2026-05 · ①)

| Layer | Desktop | Mobile | Low |
|-------|---------|--------|-----|
| Lit earth (terminator) | yes | yes | basic |
| Cloud shell + drift | yes | yes | — |
| Night city lights | yes | — | — |
| Fresnel rim + glass shell | yes | yes | rim only |
| Holo lat/lon grid | yes | — | — |
| Ambient particles | yes | — | — |

Assets: `globe-earth-equirect-2k.jpg`, `globe-clouds-equirect-1k.png` (three.js examples · MIT).

Re-verify DoD rows **3–4** after hard refresh on `/traveltrust` (desktop width).

## Manual screenshot (maintainer)

1. `cd frontend && npm run dev`
2. Open `/traveltrust` (or network landing route), desktop width ≥ 1280px
3. Save `hero-globe-a-closure-desktop.png` in this folder
4. Optional: mobile emulation + `低画质` → `hero-globe-a-closure-mobile-lite.png`

## Out of scope (post-L5)

- Per-country market deep links from globe pins
- Live order / guide density heatmap
- Cesium / Mapbox navigation-grade map

## Code anchors

- `frontend/lib/traveltrustGlobeEarthAsset.ts` — closure id, texture path, render tiers
- `frontend/components/traveltrust/cinematic/TravelTrustTourismGlobe.tsx`
- `frontend/public/media/traveltrust/globe-earth-equirect-2k.jpg`
