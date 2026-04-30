# GO_95 · §7.1 域 C（Me）审计证据 · 2026-04-21

## 路由与 **GET/PUT `/api/v1/me`**

| 前端路径 | 实现要点 |
|----------|----------|
| **`/me`** | **`frontend/app/me/page.tsx`**：**`redirect('/community/me')`**；与 **04 §3.4**「与 **`/community/me`** 互通」一致；**`GET /api/v1/me`** 消费在 **`/community/me`** 壳内 **`CommunityMeAccountPanel`** / **`useMePage`**（见 **`frontend/app/community/me/page.tsx`** 注释）。 |
| **`/me/password`** | **`frontend/app/me/password/page.tsx`**：**`putMePassword`**（**`frontend/lib/apiClient`** → **`PUT /api/v1/me/password`**，与 **04** 表同源）。 |

## 头像与 **270**

- **契约路径**：**`frontend/lib/api.ts`** **`routes.meProfileAvatar`** / **`meProfileAvatarPresign`** / **`meProfileAvatarCommit`** / **`uploadsProfileAvatar`** ↔ **04** **`POST …/me/profile-avatar`**、**`…/presign`**、**`…/commit`**、**`GET …/uploads/profile-avatars/:name`**。
- **客户端实现**：**`frontend/lib/apiClient/me.ts`**（presign → PUT 对象存储 → **commit** 叙述与 **04** 一致）。
- **270**：**[270-阶段文件媒体证据存储系统](../../docs/spec/270-阶段文件媒体证据存储系统.md)** §二「用户头像」+ 读前表 **04/14** 互指；本域为**横切对读**，**不**替代对象存储生产终验。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（本轮合入 **04** `/me` 行补注后仍绿）
```

## 边界

**不**替代 **§8.2** **F-004～007** 行完成；**不**替代 **270** 全量落地审计。
