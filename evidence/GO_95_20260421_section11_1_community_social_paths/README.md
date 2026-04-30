# GO_95 · §11.1 · **社区延伸（DM / 好友 / 关注 / 反馈）** · 2026-04-21

## 结论（与 **95 §11.1**「社区延伸」勾选口径一致）

- **`crates/api/src/routes/community/router.rs`** 为 **`/api/v1/community/*`** 的 **SSOT 挂载表**：**`conversations`**、**`conversations/:id/messages`**、**`users/:user_id/follow`**、**`me/following`** / **`me/followers`** / **`me/likes-received`**、**`friends/*`**、**`GET|POST /api/v1/community/feedback`** 等均在此 **单文件** 声明（与 **`dm_social`** / **`feedback_reports`** 处理器对应）。
- **[04-后端与API.md](../../docs/spec/04-后端与API.md)** **§3.4** 已登记上列 HTTP 契约（约 **505～525** 行段：**会话**、**关注/取关**、**好友**、**反馈**）。
- **`frontend/lib/api.ts`** **`community`** 对象已暴露 **`conversations`**、**`conversationMessages`**、**`userFollow`**、**`meFollowing`** / **`meFollowers`** / **`meLikesReceived`**、**`friendsRequest`** 等，前缀均为 **`/api/v1/community/`**（与 **订单** **`orderMessages`** **路径正交**，见 **`…section11_1_messages_order_chat/`**）。

## 与 **F-014～019** / **93·D** 边界

- **F-014～019** 母表行覆盖 **Feed / 发帖 / 赞 / 藏 / 举报 / me 帖子·赞·藏**；本证据包仅闭 **`§11.1` 卫星行**「**非仅帖/赞/藏**」的 **router 子路径清点 + 04 + 门禁**。
- **不**替代 **§8.2** **F-014～019** **行完成**、**93 D** 全量人工矩阵或 **域 G** 深测结论。

## 命令（仓库根）

```bash
cargo test -p traveltrust-api routes::community::
```

- **结果**：**43 passed**（含 **`get_me_likes_received_no_db_returns_database_required`**、举报/赞/藏等 **`routes/community/tests`** 与 **`tests_create_post_commerce_db`**）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04 ↔ router ↔ `api.ts`**）。
