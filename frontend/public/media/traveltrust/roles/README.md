# 角色剧场视频（`/traveltrust` · ① 本地 / ② 部署）

**没有**「角色视频上传」HTTP 接口。素材走 **静态文件** 或 **`NEXT_PUBLIC_*` 环境变量**（与 `GET /api/v1/traveltrust/page-brief` → `media.role_video_env_keys` 同源）。

## Owner 投放与替换（推荐 · 持久可换）

1. 把成品 MP4 放进仓库根目录 **`首页角色宣传片/`**（中文文件名）：

| 投放文件 | 运行时文件 | 角色 |
|----------|------------|------|
| `旅行者.mp4` | `traveler.mp4` | 游客 |
| `向导.mp4` | `guide.mp4` | 向导 |
| `商家.mp4` | `merchant.mp4`（并写 `provider.mp4` 别名） | 商家 |
| `旅行收购.mp4` | `acquisition.mp4` | 旅行收购 |

2. 在仓库根执行：

```bash
node scripts/dev/sync-traveltrust-role-promo-videos.cjs
```

3. 清单写入本目录 `PROMO-MANIFEST.json`（含 sha256）。**随时替换**：覆盖投放目录文件后重新跑同步即可。

- `npm run media:traveltrust-tier1` **不会**覆盖已存在的大体积宣传片（≥100 KiB）。
- 宣传片为本地 / 部署制品，**不**作为 git 二进制真源；区域主理人本批未提供时保留原 `region_steward.mp4`。

## 推荐文件名（本目录）

| 角色 | MP4 | 封面（可选） |
|------|-----|----------------|
| 游客 | `traveler.mp4` | `traveler.poster.jpg` 或沿用 `traveler.poster.svg` |
| 向导 | `guide.mp4` | `guide.poster.*` |
| 商家 | `merchant.mp4`（`provider.mp4` 别名由同步脚本维护） | `merchant.poster.*` |
| 旅行收购 | `acquisition.mp4` | `acquisition.poster.*` |
| 区域主理人 | `region_steward.mp4` | `region_steward.poster.*` |

建议：**H.264**；宽度 ≤ 1920px。本批 Owner 宣传片约 50–75 MiB/支，本地与 Staging bake 可承载；CDN/外链仍可用 env。

## 环境变量（CDN / 外链时）

在 `frontend/.env.local` 或部署环境设置（键名与 API page-brief 一致）：

```env
NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=tier1-playback
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER=/media/traveltrust/roles/traveler.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE=/media/traveltrust/roles/guide.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT=/media/traveltrust/roles/merchant.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION=/media/traveltrust/roles/acquisition.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD=/media/traveltrust/roles/region_steward.mp4
```

可选封面：`NEXT_PUBLIC_TRAVELTRUST_ROLE_POSTER_<ROLE>`（`TRAVELER` / `GUIDE` / `MERCHANT` / `ACQUISITION` / `REGION_STEWARD`）。

改 env 后需 **重启 `next dev` / 重新 build**。Staging 烤入实拍片：部署前先跑同步脚本，使 `public/media/traveltrust/roles/*.mp4` 为宣传片。

## 当前 ① 行为

- 未同步宣传片且未设 production env：暖色占位或 tier-1 短占位。
- 已同步 + `THEATER_MEDIA_MODE=tier1-playback`（或 ROLE_VIDEO_* 指向本目录）：卡内静音预览；用户点 ▶ 进入 **L5 Cinema 剧场**（站内展开动画）。

## 交接给维护者

把成品 MP4 丢进 **`首页角色宣传片/`** 后跑同步脚本即可；**无需**走 `POST /api/v1/guides/upload-doc`。
