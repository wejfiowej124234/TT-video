# ② 测试网 · 五角色旅游实拍（U1）

**阶段：** **②** — **不**在 **①** 用冷青 poster/mp4 冒充 L5-1 叙事闭卷。

## 当前 ① 行为

- `prefersTheaterWarmPlaceholder()`：**tier-1** 角色强制 **暖棕旅游占位**（`TravelTrustRoleVideoPlayer`）。
- 真 mp4/poster 路径保留在代码中，**②** 资产就绪后切换策略（见 runbook **TT-PH1-197** / issues **TT-PH1-150**）。

## ② 本地一键（已落地）

见 **[`PHASE2-LOCAL-PREP.md`](./PHASE2-LOCAL-PREP.md)**：`bash scripts/gates/traveltrust-phase2-local-prep.sh` + `NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=tier1-playback`。

## ② 交付清单（maintainer）

| 角色 | 建议素材 | 验收 |
|------|----------|------|
| traveler | 15–30s 旅游 B-roll + poster | 剧场 Tab 切换无冷闪；`roles-theater-l5.png` 更新 |
| guide | 同上 | 暖 grade 与 `TT_ROLE_VIDEO_L5` 一致 |
| merchant | 同上 | 无满屏雷达 demo 感 |
| region_steward | 同上 | 琥珀叙事，非冷绿 |

## 导出

```bash
bash scripts/gates/capture-cinematic-l5-evidence.sh
```

**签字前：** 硬刷新目视 + [`SECTION-6-2-CHECKLIST.md`](./SECTION-6-2-CHECKLIST.md)。
