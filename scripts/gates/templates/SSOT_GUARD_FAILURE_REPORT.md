# SSOT Guard CI v2 — 统一失败报告说明

**Gate ID**：`ssot-guard-ci-v2`（`scripts/ssot-guard-ci-v2.py`）  
**机器可读报告路径**：`target/ssot-guard-ci-v2-report.json`（失败或成功均写入；**`target/`** 通常已被 `.gitignore`）

## JSON 字段（模板）

| 字段 | 说明 |
|------|------|
| `schema_version` | 当前为 **`2.0`** |
| `gate_id` | 固定 **`ssot-guard-ci-v2`** |
| `passed` | 本编排器是否全部阶段通过 |
| `generated_at` | UTC ISO8601 |
| `stages[]` | 顺序执行的三阶段：`static_b097_escrow`、`static_b110_pool`、`response_contract_snapshots` |
| `stages[].stage_id` | 阶段标识 |
| `stages[].script` | 相对仓库根的脚本路径 |
| `stages[].exit_code` | 子进程退出码 |
| `stages[].passed` | 该阶段是否通过 |
| `stages[].output_tail` | 子进程合并 stdout/stderr 尾部（便于 CI 日志对照） |
| `remediation_links` | 固定建议：本模板、**`SSOT_GUARD_NEW_ENDPOINT.md`**、**`evidence/GO_20260407_SSOT_GUARDS.md`** |

## 典型失败含义

| `stage_id` | 常见根因 |
|------------|----------|
| `static_b097_escrow` | **`escrow_*` SSOT `m.insert` 外溢**、**`merge_escrow_*` 误读 `order.*`**、**`chain_read`/`true` 字面破坏**、**12 键聚合断言缺失** |
| `static_b110_pool` | **池键 `m.insert` 外溢**、**merge 内假零**、**Σ 体误嵌根级池键**、**`pool_balance` 链上块语义破坏** |
| `response_contract_snapshots` | **契约快照与不变量漂移**：更新 **`scripts/ssot-guard-fixtures/v2/*.snapshot.json`** 须同步 **04** 与静态 guard 语义；**禁止**用快照「合法化」错误契约 |

## 与「实时 HTTP」的关系

当前 v2 的 **contract test** 为 **提交快照 JSON** 校验（**低依赖、PR 必跑**）。若将来增加 **LIVE_URL** 类实时探针，须 **单开 TT**，且**不得**替代本快照层（双轨：快照保形状、实时保环境）。
