# 角色剧场视频（`/traveltrust` · ① 本地 / ② 部署）

**没有**「角色视频上传」HTTP 接口。素材走 **静态文件** 或 **`NEXT_PUBLIC_*` 环境变量**（与 `GET /api/v1/traveltrust/page-brief` → `media.role_video_env_keys` 同源）。

## 推荐文件名（放入本目录）

| 角色 | MP4 | 封面（可选） |
|------|-----|----------------|
| 游客 | `traveler.mp4` | `traveler.poster.jpg` 或沿用 `traveler.poster.svg` |
| 向导 | `guide.mp4` | `guide.poster.*` |
| 商家 | `merchant.mp4`（或继续用 `provider.mp4` 作默认路径） | `merchant.poster.*` |
| 旅行收购 | `acquisition.mp4` | `acquisition.poster.*` |
| 区域主理人 | `region_steward.mp4` | `region_steward.poster.*` |

建议：**H.264 · 15–30s · 静音或低音量**；宽度 ≤ 1920px，控制体积便于首屏预取。

## 环境变量（CDN / 外链时）

在 `frontend/.env.local` 或部署环境设置（键名与 API page-brief 一致）：

```env
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER=/media/traveltrust/roles/traveler.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE=/media/traveltrust/roles/guide.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT=/media/traveltrust/roles/merchant.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION=/media/traveltrust/roles/acquisition.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD=/media/traveltrust/roles/region_steward.mp4
```

可选封面：`NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_<ROLE>`（`TRAVELER` / `GUIDE` / `MERCHANT` / `ACQUISITION` / `REGION_STEWARD`）。

改 env 后需 **重启 `next dev` / 重新 build**。

## 当前 ① 占位行为

未配置生产片源时，页面显示「视频待接入」暖色占位（`tier1-placeholder`）；**②** 实拍就绪后，放入 MP4 或设 env 即自动切到 `<video>` 播放。

## 交接给维护者

把成品 MP4（+ 可选 poster）发给维护者即可；由维护者拷贝进本目录或写 env，**无需**走 `POST /api/v1/guides/upload-doc`（该接口仅向导证件，与落地页剧场无关）。
