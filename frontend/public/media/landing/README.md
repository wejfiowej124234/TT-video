# `/` 首页背景 · Phase B 视频（后补）

**Phase A（当前）**：仅用 `lib/landingAmbientByCountry.ts` 的 HD 静图 + CSS Ken Burns，**无需**本目录文件。① 冻结见 **[FIVE-MAIN-ROUTES-PHASE1-FREEZE.md](../../../evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)** §`/`.

## Phase B 启用步骤

1. 按国别放入循环 MP4（建议 1080p、H.264、3～6s、无缝、&lt;3MB）：

   | 国家 | 文件名 |
   |------|--------|
   | 中国 | `china.mp4` |
   | 日本 | `japan.mp4` |
   | … | 见 `lib/landingHomeAmbientVideo.ts` → `LANDING_AMBIENT_COUNTRY_SLUG` |

2. `frontend/.env.local`：

   ```env
   NEXT_PUBLIC_LANDING_HOME_AMBIENT_USE_LOCAL_VIDEO=1
   ```

3. 重启 `npm run dev`；组件将接线 `<video>`（失败仍回退 Ken Burns）。

**勿**使用 Pexels / Mixkit 等浏览器热链（易 403）。
