# GO_95 · §11.1 · **Messages merge 域（订单 `P16` 聊天）** · 2026-04-21

## 结论（与 **95 §11.1** 勾选口径一致）

- **`routes/messages.rs`** **仅** 挂载 **`GET|POST /api/v1/orders/:id/messages`**（**无**第二套订单消息 HTTP 前缀）。
- **社区 DM / 会话** 走 **`/api/v1/community/...`**（与 **`orderMessages`** **路径正交**）。
- **[04-后端与API.md](../../docs/spec/04-后端与API.md)** **§3.4** 表行 **P16** 与 **§二/§三** 散文 **`GET|POST …/orders/:id/messages`** 同源；**04** **§六** 路由映射表 **`messages`** → **`routes/messages.rs`**。

## 工程真值

| 层 | 位置 |
|----|------|
| **Router** | **`crates/api/src/routes/messages.rs`** **`router()`** → **`/api/v1/orders/:id/messages`** |
| **合并** | **`crates/api/src/routes/mod.rs`** **`merge(messages::router())`** |
| **前端契约** | **`frontend/lib/api.ts`** **`orderMessages(id)`** = **`/api/v1/orders/${id}/messages`**；**社区** **`/api/v1/community/conversations/${id}/messages`**（**不同前缀**） |
| **SSOT 散文** | **04** **§3.4**（**247～248**、**444～445**、**570**、**580**）、**§六** **1325** |

## 命令（仓库根）

```bash
cargo test -p traveltrust-api routes::messages::
```

- **结果**：**13 passed**（**401/403/404/503**、参与方校验、**happy path**）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（**04 ↔ router ↔ `api.ts`** 门禁）。

## 边界

- **不**替代 **§8.2 F-026** **「行完成」** 五格全勾 / **93** Escrow 聊天人工回归。
- **不**将 **`chain_off` 未挂载 → 503** 与 **社区消息** 故障混读（**503** 键 **`chain_off_unavailable`** 仅 **`orders/:id/messages`** 路径约定，见 **04** / **`GET /meta.order_messages`**）。
