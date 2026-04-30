# GO_95 · §8.2 · F-021～F-025 生产级四验证据 · 2026-04-21

**95 台账版本**：**v1.4.71**（**§6** 登记 **§4** 机读）；历史批次 **v1.4.50**。与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93 §7.1** / **R-001**。

---

## 1 · §3 对读

| F | 能力 | 前端 / 入口 | API（摘要） | §3 就绪 |
|---|------|-------------|-------------|---------|
| **F-021** | 市场 provider 橱窗 | `/market/provider` | `…/market/provider/*` | **PARTIAL**（与 **95 §3** 主矩阵一致） |
| **F-022** | 市场 acquisition | `/market/acquisition` | `…/market/acquisition/*` | **PARTIAL** |
| **F-023** | 向导列表/注册 | `/guide/register`、`/guides` | `GET|POST /api/v1/guides*` 等 | **PARTIAL** |
| **F-024** | 向导质押 | `/staking`、向导 stake | `POST …/guides/:id/stake` + **chain_off** | **PARTIAL** |
| **F-025** | 争议 | `/disputes` | `GET /api/v1/disputes*` | **PARTIAL** |

---

## 2 · 四验与命令（登记日）

| F | 锚点 | 命令 | 结果 |
|---|------|------|------|
| **F-021** | **`routes::market_subsite::tests`** | **`cargo test -p traveltrust-api market_subsite::tests`**（与 **F-022** 同源 **10** 测） | **10 passed**（**provider** **503**/**401**/**400** 等） |
| **F-022** | 同上 | 同上 | 同上 |
| **F-023** | **`routes::guides::tests`** | **`cargo test -p traveltrust-api routes::guides::tests`** | **7 passed** |
| **F-024** | **`chain_off::tests_guides_me_orders`** + **`routes::guides::tests`** | **`cargo test -p traveltrust-api p21_guides_create_list_get_stake`**；**`cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable`**（单测名过滤） | **1 passed** + **1 passed** |
| **F-025** | **`routes::disputes::tests`** | **`cargo test -p traveltrust-api routes::disputes::tests`** | **5 passed** |

**路由**：**`bash scripts/run-check-04-routes.sh`** → **exit 0**。

---

## 3 · §8.2 五格（诚实结论）

| 列 | F-021～F-025 |
|----|----------------|
| **UT** | **[x]**（与母表一致） |
| **API·IT** | **`[ ]`**（无对标 **`auth_register_login_logout_db_api_tests`** 之 **Router+PG** 专文件；**disputes** 另有 **b099/b118** 契约体，**不**单独升格 **94** **PG** 主路径） |
| **93** | **`[ ]`**（**93 · B**/**94**；须 **`report.json` PASS** 或 **CI `e2e` 绿存档**；**ISS-007** 仍开至归档） |
| **E2E** | **`[ ]`** |
| **负例** | **[x]**（**503 `chain_off_unavailable`**/**401**/**400 `invalid_cursor`** 等，与 **§8.2** 脚注 **F-017～026** 一致） |
| **行完成** | **`[ ]`** |

**E2E 旁证**：**`frontend/e2e`** 市场/向导/争议路径 — **不**闭 **§8.2 E2E** 列。

---

## 4 · **v1.4.71** 机读复跑（本机 · `DATABASE_URL` 已设 · 2026-04-21）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api market_subsite::tests`** | **10 passed**（**F-021**/**F-022** 同源 **`routes::market_subsite::tests`**） |
| **`cargo test -p traveltrust-api routes::guides::tests`** | **7 passed**（**F-023**） |
| **`cargo test -p traveltrust-api p21_guides_create_list_get_stake`** | **1 passed**（**F-024** **chain_off** 内存主路径） |
| **`cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable`** | **1 passed**（**F-024** HTTP **503**） |
| **`cargo test -p traveltrust-api routes::disputes::tests`** | **5 passed**（**F-025**；含 **`b099_*`**/**`b118_*`**/**`get_disputes_without_chain_off_*`**） |

**注**：**`routes::disputes::tests`** 内含 **`b118_*_pg_success_*`**；本机 **`DATABASE_URL`** 已设时 **5 passed** 全绿，**不**单独升格 **§8.2** **API·IT**/**93**/**行完成**（仍 **无** **`auth_register_*` 风格** 专文件母表闭证）。

---

## 5 · Agent 本机复跑（2026-04-22 · Cursor · Windows）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api market_subsite::tests`** | **10 passed**（**F-021** / **F-022**） |
| **`cargo test -p traveltrust-api routes::guides::tests`** | **7 passed**（**F-023**；含 **`guide_stake_without_chain_off_is_503_chain_off_unavailable`**） |
| **`cargo test -p traveltrust-api p21_guides_create_list_get_stake`** | **1 passed**（**F-024** **chain_off**） |
| **`cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable`** | **1 passed**（**F-024** **HTTP 503**，与上 **`routes::guides::tests`** 内单测重复计数仅作显式旁证） |
| **`cargo test -p traveltrust-api routes::disputes::tests`** | **5 passed**（**F-025**） |

**§8.2 边界不变**：**API·IT**/**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾**。

---

## 6 · Cursor agent 复跑（**2026-04-22** · 本对话 · **F-021～F-025**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与前几批证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api market_subsite::tests`** | **10 passed**（**F-021** / **F-022**） |
| **`cargo test -p traveltrust-api routes::guides::tests`** | **7 passed**（**F-023**；内含 **`guide_stake_without_chain_off_is_503_chain_off_unavailable`**） |
| **`cargo test -p traveltrust-api p21_guides_create_list_get_stake`** | **1 passed**（**F-024** **`chain_off`**） |
| **`cargo test -p traveltrust-api guide_stake_without_chain_off_is_503_chain_off_unavailable`** | **1 passed**（**F-024** **HTTP 503** 显式旁证） |
| **`cargo test -p traveltrust-api routes::disputes::tests`** | **5 passed**（**F-025**） |

**结论**：与 **§5** 同日机读**同结果**；**`b118_*_pg_success_*`** 在 **`DATABASE_URL`** 已设时仍绿，**不**单独升格 **§8.2** **API·IT**/**93**/**行完成**（**ISS-007** 母规则）。
