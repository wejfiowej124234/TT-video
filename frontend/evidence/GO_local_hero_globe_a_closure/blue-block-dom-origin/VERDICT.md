# 蓝块 DOM 溯源结论（① 本地 · 2026-05-21）

**探针中心（50vw × 35vh）**：`(768, 336)` @ 1536×960  
**视口截图像素**：`rgb(8, 7, 60)`～`rgb(8, 7, 77)`（≈ `#08074d` 系；随下层合成略变）

## 1. `elementsFromPoint(552, 450)` 栈（上→下）

| i | 节点 | z-index | backgroundColor | backgroundImage |
|---|------|---------|-----------------|-----------------|
| 0 | `div` · hero content shell | 12 | `rgba(0,0,0,0)` | none |
| 1 | `section#hero` | 10 | `rgba(0,0,0,0)` | none |
| 2 | `canvas`（固定电影 Canvas） | auto | **`rgb(12, 10, 9)`** | none |
| 3–12 | main / layout / body / html | … | 多为 `#0c0a09` | none |

**注意**：栈里**没有** `<video>`（父级 `pointer-events-none`，不参与 hit-test，故 DevTools 栈与肉眼合成不一致）。

## 2. 全文档 `computed backgroundColor === rgb(8, 7, 77)`

**0 个节点** — 蓝块不是某层 CSS 纯色 `background-color` 直接写出。

## 3. WebGL 帧缓冲（同一点）

`drawImage(canvas)` 采样：`rgb(0,0,0)` **alpha=0** — 该像素 WebGL **未绘制** opaque 色，不是 Three.js clearColor / sky shader 实心填充。

## 4. 首个「关掉即消蓝」的节点（display:none 验证）

| 选择器 | kill 前像素 | kill 后像素 | 结论 |
|--------|-------------|-------------|------|
| **`#hero video`** | `rgb(8,7,77)` | **`rgb(12,10,9)`** | **根因** |
| `[data-tt-traveltrust-page-cinematic-3d]` | `rgb(8,7,77)` | `rgb(8,7,77)` | 无关 |
| `[data-tt-traveltrust-hero-sky-wash-l5]` | `rgb(8,7,77)` | `rgb(8,7,77)` | 无关 |
| `[data-tt-traveltrust-hero-dom-sky-veil-unified]` | `rgb(8,7,77)` | `rgb(8,7,77)` | 无关 |
| `#hero`（整段） | `rgb(8,7,77)` | `rgb(19,20,23)` | 含 video 在内的整段 |

### 根因节点属性

- **元素**：`#hero` → `div.pointer-events-none.absolute.inset-0.z-0` → `video`
- **src**：`/media/traveltrust/hero-loop.mp4`
- **class**：`mix-blend-screen` + `object-cover`
- **computed**：`mix-blend-mode: screen`，`opacity: 0.28`，`pointer-events: none`
- **几何**：全屏级矩形（约 1634×958，略溢出视口）— 视觉上像规则色块

蓝紫来自 **Hero 背景视频 + `mix-blend-mode: screen` 与下层（Canvas/暖墨底）的合成**，不是 WebGL sky / shader。

**修复（仅 DOM · ①）**：`TravelTrustCinematicHero.tsx` — `UNIFIED_PAGE_3D` 下不再挂载 `showFullHeroVideo`（与文内「不叠 DOM 视频」一致）。

## 5. 复现命令

```bash
cd frontend && PLAYWRIGHT_REUSE_FE_SERVER=1 npx playwright test traveltrust-blue-block-dom-origin --config=playwright.scene-debug.probe.config.ts
```

机读报告：`dom-origin-report.json` · 截图：`baseline.png`
