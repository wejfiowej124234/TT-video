# B-461 / TT-A01 · PASS/FAIL（Runbook §1）

**执行时间**：2026-04-17（本机 Windows）

## 命令与 exit 码

| 命令 | exit |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **0** |
| `cd frontend && npx tsc --noEmit` | **0** |
| `cargo test -p traveltrust-api` | **0**（**996** passed） |

**可选（与 TT-B446 互证）**：`DATABASE_URL=… cargo test -p traveltrust-api b446_`（本批次未单独跑；见 Runbook）。

## §1 表（逐项）

| 项 | 结果 | 说明 |
|----|------|------|
| **`/me` 与 `/me/stats` 的 `stats` 同源** | **PASS** | **`chain_off::me_stats_value_for_user`**（**`crates/api/src/chain_off/me.rs`**）；**`routes/me.rs`** **`get_me_stats`** 与 **`get_me`** 共用。 |
| **04 / 14 路由与字段边界** | **PASS** | **`run-check-04-routes`** **exit** **0**；对齐见 **`align_auth_table.md`**。 |
| **机读三门**（routes + tsc + api tests） | **PASS** | **上表** **三命令** **均** **0** **。** |

---

## 实现与 Runbook 对齐

- **对齐表**：[`align_auth_table.md`](./align_auth_table.md)（会话、**`/me`**、错误码、§5 机读命令）。
- **Runbook**：[`docs/runbook/TT-A01-FRONTEND-API-DB-ALIGN-AUTH-001.md`](../../docs/runbook/TT-A01-FRONTEND-API-DB-ALIGN-AUTH-001.md) **§1** **。**
