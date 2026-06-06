# PublishDrawer

社区发帖抽屉：类型（图文/视频/纯文字）、话题、本机媒体与封面，提交后进入 Feed。**① 部分 L5 收口** 见 [`COMMUNITY-L5-CLOSURE.md`](../../../evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md)。

## 入口与对外

- **入口**：`index.tsx`（组合子节 + `usePublishForm`）
- **对外**：`import { PublishDrawer } from "@/components/community/PublishDrawer"`
- **挂载**：`CommunityFeedMain` / `?publish=1` · **`useCommunityFeed` → `useCommunityFeedPublishSubmit`**

## 目录职责

| 文件 | 职责 |
|------|------|
| `index.tsx` | 抽屉壳、capabilities 横幅、组合各 Section |
| `usePublishForm.ts` | 表单 state、tags UTF-8、multipart、persist、封面 |
| `PublishDrawerVideoSection.tsx` | 视频选文件 + **本机封面** picker |
| `PublishDrawerPhotoSection.tsx` | 多图预览/排序 |
| `PublishDrawerTagsFieldSection.tsx` | 结构化话题输入 |
| `publishFormMediaPersistence.ts` | blob → `POST …/upload-media` |
| `publishFormVideoBlobProbe.ts` | 视频时长/体积预检 |
| `constants.ts` · `types.ts` | 上限与 payload 类型 |

## ① 验收

```bash
cd frontend
npx vitest run components/community/PublishDrawer
```

**PI-1 浏览器（发帖 + 封面 · ① · 与 COMMUNITY-L5 同源）：**

```bash
cd frontend
PLAYWRIGHT_REUSE_API_SERVER=0 npm run e2e:pi1-community-all
# 2026-05-30：8 passed（含 cover spec + PH1-FE-01～05）
```

单跑封面子集：`npm run e2e:pi1-community-cover`。详见 [`COMMUNITY-L5-CLOSURE.md`](../../../evidence/GO_local_marketing_front_closure/COMMUNITY-L5-CLOSURE.md) §① 验收命令。
