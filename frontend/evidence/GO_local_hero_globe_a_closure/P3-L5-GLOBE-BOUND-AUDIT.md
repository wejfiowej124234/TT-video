# Hero L5 · P3 装饰层不符合项审计（①）

**审计日**：2026-05-21  
**范围**：`/traveltrust` Hero · P3-A/B 装饰（节点 / 标签 / 走廊弧）  
**约束**：不改冻结 WebGL mesh；不恢复 P0 遮挡层；不新增全屏背景板。

## 结论摘要

| 项 | 审计前 | 本轮升级后 |
|----|--------|------------|
| 投影模型 | 屏幕固定 equirectangular `%` | **地球绑定**（lat/lon × spin 矩阵 × camera） |
| 随地球自转 | 否 | **是**（读 `TravelTrustTourismGlobeSpin` 世界矩阵） |
| 背面隐藏 | 否 | **是**（`facingDot` 与 Phase1 针脚同源阈值） |
| 边缘淡出 | 否 | **是**（`edgeFade` · NDC + 朝向） |
| 走廊弧 | 静态 SVG pathD | **端点随投影更新**（hub 对连线） |

## 不符合项清单（审计前 · NC）

| ID | 严重度 | 不符合描述 | 证据 |
|----|--------|------------|------|
| **NC-01** | 阻断 L5 | P3 节点/标签使用 `latLonToHeroP3ScreenPercent` 平面展开，与 WebGL 球体自转无关 | `traveltrustHeroP3ScreenProjection.ts` |
| **NC-02** | 高 | 装饰层挂在 `data-tt-traveltrust-hero-globe-viewport` 上 `absolute %`，不读 camera / rig | `TravelTrustCinematicHero.tsx` |
| **NC-03** | 高 | 无背面剔除；背半球枢纽仍显示，破坏球体感 | 目视 + 无 `facingDot` |
| **NC-04** | 中 | 无地平线/边缘淡出；贴边标签像 HUD 贴条 | 固定 opacity |
| **NC-05** | 中 | 走廊弧为固定 `viewBox` 贝塞尔，不随 hub 运动 | `traveltrustHeroP3CorridorPaths.ts` `pathD` |
| **NC-06** | 低 | 与冻结 Phase1 针脚（真 3D）视觉语义不一致，双轨叠加 | `TravelTrustPhase1GlobeHighlights.tsx` vs P3 DOM |

## 已实施升级（地球绑定投影 · ①）

| 模块 | 职责 |
|------|------|
| `TravelTrustHeroGlobeProjectionPublisher` | Canvas `useFrame` 采样 spin 组 `matrixWorld` + camera，写入 store |
| `traveltrustHeroGlobeProjectionMath` | lat/lon → 世界坐标 → NDC → hero viewport `%` |
| `traveltrustHeroGlobeProjectionStore` | 帧快照 · `useSyncExternalStore` |
| `useHeroP3GlobeBoundProjection` | P3 装饰消费；WebGL 不可用时回退 equirect |
| `TravelTrustHeroGlobeNetworkDecor` / `TravelTrustHeroDestinationLabels` | `data-tt-traveltrust-hero-p3-projection=globe-bound` |

**未触碰**：`traveltrustHeroGlobeFrozenManifest` 所列 mesh / 针脚 / 弧线实现；P0 `data-tt-traveltrust-hero-dom-video=0` 与 blocker 探针不变。

## 验收建议（①）

1. 硬刷新 `/traveltrust`，观察地球慢转时 **6 个核心标签与光点同步漂移**。
2. 背对相机的枢纽 **消失**（非透明度作弊的全屏遮罩）。
3. 机读：`data-tt-traveltrust-hero-p3-projection="globe-bound"` 且 `projection-revision` 递增。
4. `npm run e2e:hero-globe-closure` · P3 探针仍 PASS。
