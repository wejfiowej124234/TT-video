# GO_95 · §8.2 · F-026 生产级四验证据 · 2026-04-21

**95 台账版本**：**v1.4.72**（**§6** 登记 **§4** 机读）；历史批次 **v1.4.51**。与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93 §7.1** / **R-001**。

---

## 1 · §3 对读

| F | 能力 | 前端 / 入口 | API（摘要） | §3 就绪 |
|---|------|-------------|-------------|---------|
| **F-026** | 订单消息 | Escrow 聊天 | **`GET|POST /api/v1/orders/:id/messages`** | READY* |

---

## 2 · 四验与命令（登记日）

| F | 锚点 | 命令 | 结果 |
|---|------|------|------|
| **F-026** | **`routes::messages::tests`** | **`cargo test -p traveltrust-api routes::messages::tests`** | **13 passed** |

**路由**：**`bash scripts/run-check-04-routes.sh`** → **exit 0**。

**代表用例**（与 **95 §8.2** 脚注 **F-022～026** 一致）：**`get_order_messages_without_chain_off_returns_503_chain_off_unavailable`**、**`post_order_message_without_chain_off_returns_503_chain_off_unavailable`**；另有 **401**/**403**/**400**/**404**/**200** happy path 等（见 **`crates/api/src/routes/messages.rs`** **`mod tests`**）。

---

## 3 · §8.2 五格（诚实结论）

| 列 | F-026 |
|----|--------|
| **UT** | **[x]**（与母表一致） |
| **API·IT** | **`[ ]`**（无对标 **`auth_register_login_logout_db_api_tests`** 之 **Router+PG** 专文件） |
| **93** | **`[ ]`**（**93 · B**；须 **`report.json` PASS** 或 **CI `e2e` 绿存档**；**ISS-007** 仍开至归档） |
| **E2E** | **`[ ]`** |
| **负例** | **[x]** |
| **行完成** | **`[ ]`** |

---

## 4 · **v1.4.72** 机读复跑（本机 · `DATABASE_URL` 已设 · 2026-04-21）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api routes::messages::tests`** | **13 passed**（**`get_order_messages_without_chain_off_returns_503_chain_off_unavailable`**/**`post_order_message_without_chain_off_returns_503_chain_off_unavailable`**/**`post_then_get_order_messages_happy_path_200`** 等） |

**注**：**13 passed** **不**单独升格 **§8.2** **API·IT**/**93**/**行完成**（仍 **无** **`auth_register_*` 风格** **Router+PG** 专文件母表闭证；**ISS-007** 未闭）。

---

## 5 · Agent 本机复跑（2026-04-22 · Cursor · Windows）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api routes::messages::tests`** | **13 passed** |

**§8.2 边界不变**（**ISS-007**）；**§3.1** **禁勾** **F-026**。

---

## 6 · Cursor agent 复跑（**2026-04-22** · 本对话 · **F-026**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。**F-027～F-031** 与本批**同会话**汇总见 **`evidence/GO_95_20260421_section8_2_f027_f031/README.md` §7**。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api routes::messages::tests`** | **13 passed** |

**结论**：与 **§5** 同日机读**同结果**；**不**升格 **§8.2** **API·IT**/**93**/**E2E**/**行完成**（**ISS-007**）。
