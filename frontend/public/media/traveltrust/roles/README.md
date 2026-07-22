# 角色剧场视频（`/traveltrust` · Media Asset SSOT）

**没有**「角色视频上传」HTTP 接口。素材走 **静态文件（Git LFS）** 或 **`NEXT_PUBLIC_*` 环境变量**。

## 正式 SSOT（写死 · bake 依赖）

| 层 | 路径 |
|----|------|
| Registry | `registry/traveltrust-role-promo-media-assets.v1.yaml` |
| Runtime manifest | `frontend/public/media/traveltrust/roles/PROMO-MANIFEST.json` |
| Binaries (Git LFS) | `frontend/public/media/traveltrust/roles/{traveler,guide,merchant,acquisition,provider}.mp4` |
| Gate | `bash scripts/gates/check-traveltrust-role-promo-media-ssot-gate.sh` |

```bash
node scripts/dev/sync-traveltrust-role-promo-videos.cjs --verify
```

**禁止**依赖本地 ignored 投放目录做 clean tip bake。`首页角色宣传片/` 仅可选 ingest。

## 可选替换（ingest）

1. 覆盖 `首页角色宣传片/` 中文文件名 MP4  
2. `node scripts/dev/sync-traveltrust-role-promo-videos.cjs --ingest`  
3. 按新 sha256 更新 registry + manifest  
4. `--verify` PASS 后提交（LFS）

| 投放文件 | 运行时文件 |
|----------|------------|
| `旅行者.mp4` | `traveler.mp4` |
| `向导.mp4` | `guide.mp4` |
| `商家.mp4` | `merchant.mp4`（+ `provider.mp4`） |
| `旅行收购.mp4` | `acquisition.mp4` |

- `npm run media:traveltrust-tier1` **不会**覆盖 ≥100 KiB 宣传片。  
- `region_steward.mp4` 本批仍为 tier-1 占位。

## 环境变量（CDN / 外链时）

```env
NEXT_PUBLIC_TRAVELTRUST_THEATER_MEDIA_MODE=tier1-playback
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_TRAVELER=/media/traveltrust/roles/traveler.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_GUIDE=/media/traveltrust/roles/guide.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_MERCHANT=/media/traveltrust/roles/merchant.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_ACQUISITION=/media/traveltrust/roles/acquisition.mp4
NEXT_PUBLIC_TRAVELTRUST_ROLE_VIDEO_REGION_STEWARD=/media/traveltrust/roles/region_steward.mp4
```

Clean tip worktree：`git lfs pull` 后再 bake。
