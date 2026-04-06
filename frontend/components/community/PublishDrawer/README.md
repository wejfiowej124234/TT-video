# PublishDrawer

社区发帖抽屉：选择类型（图文/视频/美食/旅行）、填写内容、上传媒体，提交后作为新帖子出现在 Feed。43 阶段拆分为多文件，单一入口对外。

## 入口与对外

- **入口**：`index.tsx`（抽屉壳、表单区、使用 usePublishForm）
- **对外**：`import PublishDrawer from "@/components/community/PublishDrawer"`
- **使用**：`app/community/page.tsx` 通过 createPortal 挂载到 document.body，由 useCommunityFeed 控制 open/close

## 目录职责

| 文件 | 职责 |
|------|------|
| `index.tsx` | 抽屉 UI、表单项、提交/关闭，消费 usePublishForm |
| `usePublishForm.ts` | 表单 state（type、content、media）、校验、submit 回调 |
| `constants.ts` | 发帖类型选项、文案 key、校验上限等 |
| `types.ts` | 表单类型、props 类型 |

## 依赖方向

- index → usePublishForm、constants、types
- usePublishForm → constants、types
