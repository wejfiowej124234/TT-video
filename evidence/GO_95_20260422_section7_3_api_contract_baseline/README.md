# GO_95 · §7.3 后端 API 与契约基线重验（2026-04-22）

## 1. 目的

在 **《95》§7.3**（**04↔router**、**`api.ts`↔04**、**`GET /meta`**、**Rate limit / `STRICT_SESSION_GATE`**）已 **`[x]`** 的前提下，重跑**路由闸**与 **§7.3 旁证子集** `cargo test`，确认机读链仍绿。  
**不**替代 **`evidence/GO_95_20260421_section7_3_*`** 各子包全文；**不**替代 **staging `curl /meta`** / **§8.2** 行完成。

## 2. 命令与结果（仓库根）

### 2.1 路由与 **04** / **`api.ts`** / **13-1** 闸

```bash
bash scripts/run-check-04-routes.sh
# → exit 0（含 check-04-api-ts-routes-vs-doc-34：**178** 路径）
```

### 2.2 **`GET /meta`** 与运行时（子集）

```bash
cargo test -p traveltrust-api health_meta::
# → 60 passed; 0 failed
```

### 2.3 **`STRICT_SESSION_GATE`**（子集）

```bash
cargo test -p traveltrust-api auth_placeholder_strict_gate
# → 5 passed; 0 failed
```

### 2.4 **Rate limit**（子集）

**注意**：`cargo test` **单次**仅接受**一个**名称过滤串；**勿**将 **`auth_placeholder_strict_gate`** 与 **`middleware::rate_limit::tests`** 并到同一命令行（会 **Usage error**）。

```bash
cargo test -p traveltrust-api middleware::rate_limit::tests
# → 4 passed; 0 failed
```

## 3. 与 §7.3 子条互证（仍以前序证据为主证）

| §7.3 子条 | 主证目录（2026-04-21） |
|-----------|-------------------------|
| **04↔router** | `run-check-04-routes.sh` 首步（本包 §2.1） |
| **`api.ts`↔04** | `evidence/GO_95_20260421_section7_3_api_ts_vs_04/` |
| **`GET /meta`** | `evidence/GO_95_20260421_section7_3_meta_runtime/` |
| **Rate limit / gate** | `evidence/GO_95_20260421_section7_3_rate_limit_session_gate/` |

## 4. 诚实边界

- **69** 条测试通过（**60+5+4**）为**窄扇面**；**不**覆盖 **04** 全写体 JSON、**不**等价 **§8.2** 母表行完成。
- 首轮脚本若将**两个** `cargo test` 过滤子串并列，会得到 **cargo** **参数错误**（**exit 1**）；**不代表** **`run-check-04`** 或 **`health_meta::`** 失败 — 以**分命令**重跑为准。
