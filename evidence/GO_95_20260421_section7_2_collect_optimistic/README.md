# GO_95 · §7.2 收藏（社区）（乐观更新 · API 失败回滚）· 2026-04-21

## 实现面（双路径 · 与 **§7.1 域 G** / **F-017** 互证）

| 路径 | 文件 | 行为摘要 |
|------|------|----------|
| **Feed**（**`/community`**、**`/community/topic/[tag]`**） | **`frontend/components/community/useCommunityFeed.ts`** **`handleCollect`** | 先 **`setCollectedPostIds`** 乐观切换；**`rollbackCollect`** 在 **`status !== "ok"`** 与 **`catch`** 两条路径均调用；Toast **`community_collect_failed`** + **`mapApiReadError`** / **`messageForCommunityActionResponse`**。 |
| **非 Feed**（卡片/抽屉/作者页等复用） | **`frontend/components/community/useCommunityPostLikeCollect.ts`** **`handleCollect`** | 先 **`setCollectedIds`** 乐观切换；**`status !== "ok"`** 与 **`catch`** 均对称 **`setCollectedIds` 回滚**；**`showToast`** 同源错误映射。 |

## API

- **`postCollect`** / **`deleteCollect`**：**`frontend/lib/apiClient/community.ts`**（**04** **`POST|DELETE …/collect`** 与 **§7.1 域 G**/**§3 · F-017** 已登记）。

## 离线闸

- 两路径均在 **`!navigator.onLine`** 时 **不**发请求、**不**改乐观态（Toast **`community_interaction_offline`**）。

## 未登录（401）与文案

- 写路径经 **`fetch`** + **`communityJsonBody`** 解析 **`status !== "ok"`** 的 JSON；失败回滚后 **`messageForCommunityActionResponse`** / **`mapApiReadError`**（含 **`login_required`**/**`unauthorized`** 等 **`core.ts`** 401 分流语义）落到 **`community_collect_failed`** 或 **`api_*`** 键位（与 **点赞** 同源模式）。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**替代 **§8.2 · F-017**/**93 D** 全量回归；**不**声称已覆盖 **市场星标**/**Feed degraded**/**F-031** 等 **§7.2** 余条。
