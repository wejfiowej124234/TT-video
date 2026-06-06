# ② 本地准备 · 剧场 MP4 + 社媒 env

**阶段：② 测试网 / 本地真素材预览** — **不**等同 ③ 主网或 Production GO。

## 一键

```bash
bash scripts/gates/traveltrust-phase2-local-prep.sh
cd frontend && npm run dev   # 须重启以读 .env.local
```

## 行为

| 配置 | 剧场 UI |
|------|---------|
| 无 `THEATER_MEDIA_MODE`（① 默认） | 暖色「视频待接入」占位 |
| `NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=tier1-playback` + tier-1 MP4 | 播 `public/media/traveltrust/roles/*.mp4`（静音预览） |
| 各 `NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_*` 指向实拍/CDN | `production`  tier，暖 grade 播真片 |

## 社媒（页脚）

在 `frontend/.env.local` 设置（须 **https**）：

- `NEXT_PUBLIC_TRAVELTRUST_SOCIAL_DOUYIN_URL`
- `NEXT_PUBLIC_TRAVELTRUST_SOCIAL_X_URL`
- `NEXT_PUBLIC_TRAVELTRUST_SOCIAL_INSTAGRAM_URL`
- `NEXT_PUBLIC_TRAVELTRUST_SOCIAL_YOUTUBE_URL`

模板见 [`frontend/.env.traveltrust-media.example`](../../.env.traveltrust-media.example)。

## Hydration（剧场视频）

`TravelTrustRoleVideoPlayer` 使用 `useRoleMediaUrlsHydrated`：SSR/首屏固定暖占位，**hydration 后**再读 `THEATER_MEDIA_MODE`。避免 dev 下 env 与客户端 bundle 不一致导致 React hydration 报错。改 `.env.local` 后仍须 **重启 `npm run dev`**。

## 验收（② 本地）

- [ ] `#roles` Tab 切换可播 MP4（或显示播放钮后播）
- [ ] 页脚社媒：已配 URL 为实线图标可点
- [ ] 可选：重导 `roles-theater-l5.png`

## 仍属 ② defer

- 实拍 B-roll 替换 tier-1 静音短片
- TTG 测试网真兑换
- staging E2E 全矩阵
