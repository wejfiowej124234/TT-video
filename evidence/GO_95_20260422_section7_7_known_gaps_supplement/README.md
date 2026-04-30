# GO_95 · §7.7 已知缺口 — 机读复验（补充 · v1.4.171）

## §1 命令与退出码（仓库根 · Git Bash）

| # | 命令 | 退出码 / 摘要 |
|---|------|---------------|
| 1 | `bash scripts/check-07-version-triple.sh` | `0` |
| 2 | `bash scripts/run-check-04-routes.sh` | `0` |
| 3 | `cargo test -p traveltrust-api idempotency` | **4 passed**（含 `idempotency_http_contract_tests` 与 `health_meta` 幂等键序等过滤命中） |
| 4 | `cargo test -p traveltrust-api key_hash_tests` | **1 passed** |
| 5 | `cargo test -p traveltrust-api schedule_engine::` | **1 passed**（**不**闭 **ISS-009** / **不**将 **§7.7·多实例 SSOT** **`[ ]`→`[x]`**） |
| 6 | `cargo test -p traveltrust-api "routes::governance::tests::governance_pool" --` | **2 passed** |
| 7 | `cargo test -p traveltrust-api "routes::governance::tests::governance_rewards" --` | **2 passed** |
| 8 | `cargo test -p traveltrust-api governance_pool_meta_alignment_b177` | **1 passed** |

## §2 诚实边界（非生产闭证）

- **不**表示 **§7.7** 未勾子项（**多实例内存 SSOT** / **§9 ISS-009**）已落地或可将清单 **`[ ]`→`[x]`**。
- **不**替代 **[270](270-阶段文件媒体证据存储系统.md)** **§11.3** 全 **Implemented**、**[120](120-阶段开发观测告警日志与审计链路.md)** 全文人签、**83/84**/**S-4** 治理终局、**双实例 API·IT** 竞态归档。
- 与 **`evidence/GO_95_20260422_section7_7_known_gaps/README.md`**/**`…section7_7_partial_baseline/`**（**v1.4.113**）/**`…governance_pool_rewards_preview/`**（**v1.4.126**）/**`…section7_7_multinstance_ssot_reaudit/`**（**v1.4.138**）**并列**；**不**改 **§7.7** **`4/5 [x]`** / **U/C/总%**。

## §3 互指（95 正文）

- **§7.7** 块首 **blockquote（v1.4.171）**
- **§0.2 最后刷新** / **§12.4** / **§6** 变更日志
