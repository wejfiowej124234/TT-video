# Pass A · Step 7（旋转海光）— Before / After（① · 未提交）

**批次**：`TT-GLOBE-PASS-A-PLAN-A-STEP-7-GLINT-2026-05`  
**问题**：大西洋等大洋正对镜头时，太阳向 `oceanSunGlint` 径向过大，读成球心白斑

| 参数 | Step 6 | Step 7（当前） |
|------|--------|----------------|
| `oceanSunGlintPeakAlpha` | 0.10 | **0.085** |
| `oceanSunGlintRadiusScale` | 0.38 | **0.30** |
| 其余 | 同 Step 6 | 同 Step 6 |

**未动**：`saturate` 0.91、北非 multiply、hemi、rim

撤回：`ACTIVE_STEP = 6`
