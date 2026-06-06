# Hero 地球提亮阶梯（可撤回 · ① 未提交）

**真源**：`frontend/lib/traveltrustHeroGlobeBrightenLadder.ts`  
**生效**：`TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP` → `traveltrustHeroGlobeBrighten.ts` 导出常量

## 撤回（一行）

在 `traveltrustHeroGlobeBrightenLadder.ts` 把：

```ts
export const TRAVELTRUST_HERO_GLOBE_BRIGHTEN_ACTIVE_STEP = 8;
```

改为上一档 `1` 或 `0`，保存后硬刷新 `/traveltrust`。

DOM 探针：`data-tt-traveltrust-hero-globe-brighten-step`（Hero `#hero`）与 WebGL `data-tt-traveltrust-hero-globe-brighten-step`（地球 group）。

## 阶梯表

| Step | ID | 相对上一档 | 目标 |
|------|-----|------------|------|
| **0** | Pass A 基线 | — | 收口参考 |
| **1** | PLAN-A | 云 0.38→0.32、shadow fill、glint/rim、陆地 multiply | 通透 · 无白斑 |
| **2** | PLAN-A-STEP-2 | `hemiGround` **#2e261e**、针脚 **×0.9** | 暗部略抬 |
| **3** | PLAN-A-STEP-3 | 北非 0.14、glint/rim、hemi 1.20 | 首版截图微调 |
| **4** | PLAN-A-STEP-4 | 北非 0.155+半径、hemi 1.22 | 北非仍亮·暗部仍闷 |
| **5** | PLAN-A-STEP-5（4b） | 北非 multiply **0.168** | 压撒哈拉—中东 |
| **6** | PLAN-A-STEP-6 | `earthMapSaturate` **0.91** | 海蓝层次 |
| **7** | PLAN-A-STEP-7-GLINT | 海光峰 0.085、半径 0.30 | 大西洋改善 |
| **8** | **PLAN-A-STEP-8-GLINT-7B**（当前） | 海光峰 **0.08**、半径 **0.28** | 太平洋正对再收 |

## Step 2 · Before → After（相对 Step 1）

| 参数 | Step 1 | Step 2 |
|------|--------|--------|
| `hemiGround` | #2a221a | **#2e261e** |
| `ambIntensity` | 0.48 | **0.50** |
| `pinDecorMul` | 1 | **0.9** |
| 其余 | 同 Step 1 | 同 Step 1 |

**冻结未动**：`saturate` 0.9、`brightness` 1.02、`earthDisplayBrightness` 1.30、`oceanHighlightPeakAlpha` 0。

## 10 分路线图（与你截图迭代）

1. **Step 2**（本批）— 暗部抬起、针脚退后 → 请发新截图  
2. **Step 3** — 太阳向海光 + rim 半档（仍无屏心）  
3. **Step 4** — 可选 `saturate` 0.91（需你确认解冻半档）  
4. **Step 5** — 缘壳 opacity 微调（`TT_HERO_GLOBE_WARM_LIMB_SHELL_L5`）若仍闷

每步只改 1–2 个把手，你确认后再进下一档。
