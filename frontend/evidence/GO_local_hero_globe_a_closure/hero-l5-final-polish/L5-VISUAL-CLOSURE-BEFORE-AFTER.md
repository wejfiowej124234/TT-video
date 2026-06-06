# Hero L5 视觉收口 — Before / After（① 本地 · 未提交）

**批次**：`TT-HERO-L5-VISUAL-CLOSURE-2026-05`  
**约束**：**不**再提亮地球（Pass A 1.30 保持）；**不**恢复 DOM overlay / Canvas CSS `filter` / 前雾；未改坐标 / P0·P1·P2 / Pass A·B。

## Before

| 维度 | 表现 |
|------|------|
| 核心标签 | 10 个目的地标签可同时出现在前半球 → 聚焦走廊时叠字拥挤 |
| 非核心 P3 节点 | 已无文字（仅光点）— OK |
| WebGL 航线 | `travelArcOpacity` 0.74 · 管径 `travelArcTubeRadiusMul` 全量 → 弧线偏亮、压地球 |
| 聚焦时 | 10 标签 50% 淡化，仍占屏 |

## After

| 维度 | 表现 |
|------|------|
| 核心标签 | **同时最多 4 个**（`pickHeroL5VisibleLabelIds`：焦点 + 走廊 + tier + 边缘可见度） |
| 聚焦走廊 | 优先显示焦点枢纽 + 同走廊 2–3 个；其余核心枢纽 **不渲染文字**（WebGL 针脚仍在） |
| WebGL 航线 | `ARC_OPACITY_MUL` / `ARC_RADIUS_MUL` **0.88**（约 −12% 亮度与线宽） |
| 地球 | `earthDisplayBrightness` **1.30** 不变；Pass A 材质微调不变 |

## 真源

- `frontend/lib/traveltrustHeroL5FinalPolish.ts` — `TRAVELTRUST_HERO_L5_MAX_VISIBLE_LABELS`
- `frontend/lib/traveltrustHeroL5LabelPick.ts`
- `frontend/lib/traveltrustGlobeHeroTuning.ts` — 弧线 mul
- `frontend/components/traveltrust/cinematic/TravelTrustHeroDestinationLabels.tsx`
- `frontend/components/traveltrust/cinematic/TravelTrustPhase1TravelArcs.tsx`（仅乘 tuning mul）

## P0 / P1 / P3 回归（①）

```bash
cd frontend
npm run test -- traveltrustHeroL5LabelPick traveltrustHeroL5FinalPolish traveltrustHeroGlobeBrighten traveltrustGlobeHeroTuning
npm run e2e:hero-globe-closure
```

| 轨 | 探针 / 单测 | 预期 |
|----|-------------|------|
| **P0** | `traveltrust-hero-p0-globe-acceptance` | 零遮挡 · WebGL 地球/弧绘制 · `dom-video=0` |
| **P1** | `traveltrust-hero-p1-linkage` | focus / `#start?region=` 联动不变 |
| **P3** | `traveltrust-hero-p3-network-decor` | 24 节点 · 标签 **≤4** · `data-tt-traveltrust-hero-l5-visual-closure` |
| **层审计** | `traveltrust-layer-kill-audit`（若 closure 脚本含） | 无 sky-wash / veil 回归 |

DOM 验收：

- `data-tt-traveltrust-hero-l5-label-max="4"`
- `data-tt-traveltrust-hero-l5-label-rendered` ≤ 4
- 聚焦 `cn` 时仍 ≤ 4，且含北京标签

## 目视（①）

`npm run clean && npm run dev:webpack` → `/traveltrust` 硬刷新：左半球陆地轮廓仍可读；弧线略退后；标签不再成排叠在走廊上。
