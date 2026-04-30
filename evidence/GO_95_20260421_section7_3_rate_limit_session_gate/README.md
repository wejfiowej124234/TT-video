# GO_95 · §7.3 · **Rate limit / `STRICT_SESSION_GATE` 与部署文档一致** · 2026-04-21

## 口径（SSOT 三角）

| 主题 | 部署/运维叙述 | 实现 |
|------|----------------|------|
| **全局限流** | **[ops/RUNBOOK.md](../../ops/RUNBOOK.md)** §1（**`API_RATE_LIMIT_PER_MINUTE`** 默认 **120**）；**[08-3-参数与门禁表.md](../../docs/spec/08-3-参数与门禁表.md)** 限流行 | **`crates/api/src/middleware/rate_limit.rs`** **`rate_limit_layer`** + **`meta_rate_limits_snapshot()`** → **`GET /meta`** **`rate_limits.*`** |
| **关键写限流** | 同上 **BB5** / **Runbook §1**（**`CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE`** 默认 **15**） | **`critical_write_rate_limit_layer`** + **`GET /meta`** 同源字段 |
| **`/auth/*` POST 桶** | **04 §7.8** 表行；根 **`.env.example`** **`AUTH_*_PER_MINUTE`** / 窗口变量（与 **`GET /meta.rate_limits`** **非**同一机读表，见 `.env.example` 注释） | **`auth_post_rate_limit_layer`** |
| **证据/评价分钟桶** | **`.env.example`** **`EVIDENCE_MAX_*`** / **`REVIEW_MAX_*`** / **`REVIEW_LOW_SCORE_*`**（双写段附近） | **`meta_rate_limits_snapshot`** + **`chain_off`** evidence/reviews 路径 |
| **严格会话门** | **`.env.example`** **`STRICT_SESSION_GATE=1`**；**[04-后端与API.md](../../docs/spec/04-后端与API.md)** **§7.8**；**Runbook §12.3**（**`curl …/meta \| jq '.strict_mode.strict_session_gate'`**） | **`middleware/auth_pause_metrics/mod.rs`** **`auth_placeholder_layer`**；**`GET /meta`** **`strict_mode.strict_session_gate`** = **`STRICT_SESSION_GATE=1`**（**`handlers.rs`**） |
| **生产 profile** | **`.env.example`** **`TRAVELTRUST_DEPLOYMENT_PROFILE=production`** 段须 **`STRICT_SESSION_GATE=1`** 等 | **`startup/mod.rs`** 校验 |

## 仓库修订（对齐 Runbook 命名）

- 根 **`.env.example`**：在 **关键写限流** 段**之上**补 **`API_RATE_LIMIT_PER_MINUTE`** 注释块（此前 Runbook/08-3 已写变量名，样例中仅 **`CRITICAL_WRITE_*`** 显式出现，易造成「部署文档≠样例」漂移）。

## 命令结果（仓库根）

```bash
cargo test -p traveltrust-api auth_placeholder_strict_gate -- --nocapture
```

- **结果**：**5 passed**（**`STRICT_SESSION_GATE=1`**：**Bearer** / 拒 **空 Bearer** / 拒**仅 `X-User-Id`** / **社区 GET** 豁免 / **`=0`** 仍允 **`X-User-Id`**）。

```bash
cargo test -p traveltrust-api middleware::rate_limit::tests -- --nocapture
```

- **结果**：**4 passed**（**`auth_post_path_classification_*`**、**`admin_critical_write_paths_*`**、**`meta_rate_limits_snapshot_has_stable_shape`**）。

```bash
bash scripts/run-check-04-routes.sh
```

- **结果**：**exit 0**（契约链不断）。

## 边界

- **不**替代 **staging** 上按 **Runbook §12.3** 做的 **`curl`** 401/429 **生产验收**全记录。
- **不**替代 **§8.2** 任一行 **「行完成」**。
