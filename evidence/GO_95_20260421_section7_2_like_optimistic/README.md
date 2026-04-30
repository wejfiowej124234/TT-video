# GO_95 · §7.2 点赞（乐观更新 · API 失败回滚）· 2026-04-21

## 实现面（双路径 · 与 **§7.1 域 G** 互证）

| 路径 | 文件 | 行为摘要 |
|------|------|----------|
| **Feed**（**`/community`**、**`/community/topic/[tag]`**） | **`frontend/components/community/useCommunityFeed.ts`** **`handleLike`** | 先 **`setLikedPostIds`** 乐观切换；**`rollbackLike`** 在 **`status !== "ok"`** 与 **`catch`** 两条路径均调用；Toast **`community_like_failed`** + **`mapApiReadError`** / **`messageForCommunityActionResponse`**。 |
| **非 Feed**（卡片/抽屉/作者页等复用） | **`frontend/components/community/useCommunityPostLikeCollect.ts`** **`handleLike`** | 先 **`setLikedIds`** 乐观切换；**`status !== "ok"`** 与 **`catch`** 均 **`setLikedIds` 回滚**；**`showToast`** 同源错误映射。 |

## API

- **`postLike`** / **`deleteLike`**：**`frontend/lib/apiClient/community.ts`**（**04** **`POST|DELETE …/like`** 与 **§7.1 域 G** 已登记）。

## 离线闸

- 两路径均在 **`!navigator.onLine`** 时 **不**发请求、**不**改乐观态（Toast **`community_interaction_offline`**）。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**替代 **§8.2 · F-014**/**93 D** 全量回归；**不**声称已覆盖 **收藏**/**星标**/**Feed degraded** 等 **§7.2** 余条。
