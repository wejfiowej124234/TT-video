# Hero 地球 · 真实世界一致性 · 多维审计（①）

**审计日**：2026-05-21  
**结论**：**不符合** GIS / 导航级「1:1 真实地球标准」；**可符合** 装饰页「枢纽落在海陆轮廓附近 + 标签跟球转」产品标准（须 **globe-bound 投影生效**）。

---

## 维度矩阵

| 维度 | 真实世界 / 行业标准 | 本仓库现状 | 判定 |
|------|---------------------|------------|------|
| **D1 数据** | WGS84 城市坐标 | `traveltrustHubGeo.ts` 24 枢纽（北京/东京/纽约等） | **通过**（数据真） |
| **D2 语义** | 标签名 = 锚点地名 | Phase1 十国标签 **国名 · 城市**（如「中国 · 北京」） | **通过**（示意） |
| **D3 球面数学** | 经纬度 → 单位球 | `latLonToUnitVector` 与 Three.js 球面 UV `atan2(z,x)` 与 `(lon+180)/360` **一致**（机读验证上海 u≈0.837） | **通过** |
| **D4 贴图** | 等距圆柱海陆 | NASA 系 `globe-earth-equirect-2k.jpg` + Pass A 调色 | **部分**（轮廓真、对比弱、2K 糊） |
| **D5 针脚/弧线** | 与 D3 同半径 | mesh / 针脚 / Publisher 均 `×0.998` | **通过**（Pass B） |
| **D6 屏幕标签** | 随球转 + 相机透视 | **须** `useHeroP3GlobeBoundProjection`；平面 `%` 不随 `heroYawOffset`（≈0.52 rad） | **曾失败** → 已禁 fallback 显示 |
| **D7 产品声明** | 测绘/导航 | `GLOBE_EARTH_TEXTURE_LICENSE.md`：**Not** navigation/geodesy | **不适用** |
| **D8 目视 1:1** | 与 Google Earth 同屏 | 艺术化、分栏镜头、非全屏球 | **不通过**（非设计目标） |

---

## 你看到的「不在一块」通常来自

1. **标签用了平面世界地图 %**（`latLonToHeroP3ScreenPercent`）  
   - 例如东京 139°E → 固定约在视口宽 88% 处  
   - 地球因 `heroYawOffset` + 自转，东亚在屏幕上可能是 35% 处  
   - **视觉上就像国名漂在太平洋**  
2. **globe-bound 未生效**（Canvas 未就绪、`hero-globe-viewport` 量不到）→ 回退平面 %  
3. **国名 vs 城市锚点** → 「中国」不在中国大陆几何中心  
4. **贴图过暗/偏褐**（Pass A 仍偏艺术）→ 难用肉眼对照海岸  

---

## 机读验收（①）

```bash
cd frontend
npm run test -- traveltrustHubGeoAlignment traveltrustGlobePinDisplay traveltrustHeroGlobeProjectionMath traveltrustGlobeGeoRealWorldStandard --run
```

浏览器 DevTools：  
`[data-tt-traveltrust-hero-p3-labels]` 上 **`data-tt-traveltrust-hero-p3-projection-active="1"`** 才表示标签跟球绑定。

---

## 若要接近「真实世界目视标准」的路线图（①）

| 优先级 | 动作 | 冻结？ |
|--------|------|--------|
| P0 | 标签/光点 **仅 globe-bound**（已做） | 否 |
| P1 | Phase1 **10** 国标签 **国名 · 城市** i18n | **已做**（2026-05-21） |
| P2 | 默认 Hero 截图对照 [natural earth 参考图] ±0.5° 目视 | 否 |
| P3 | 减轻贴图褐化 / 提高海陆对比（Pass A 微调） | **须解锁** `TT-GLOBE-L5-FROZEN` |
| P4 | 可选 `GLOBE_TEXTURE_LON_OFFSET_DEG` 若换贴图后仍有系统偏差 | 可能须解锁 mesh |

**不构成** 1:1 测绘：分辨率 2K、装饰云/夜灯、协议页叙事镜头。
