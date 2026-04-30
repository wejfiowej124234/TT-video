# GO_95 · §8.2 · F-016～F-020 生产级四验证据 · 2026-04-21

与 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2** 对读；**不**替代 **93 §7.1** / **R-001**。

---

## 1 · §3 对读

| F | 能力 | 前端 / 入口 | API（摘要） | §3 就绪 |
|---|------|-------------|-------------|---------|
| **F-016** | 点赞 | 帖子 | `POST/DELETE …/like` | READY* |
| **F-017** | 收藏 | 帖子 | `POST/DELETE …/collect` | READY* |
| **F-018** | 举报 | 流/帖 | `POST …/reports` | READY* |
| **F-019** | 我的帖子/赞/藏 | `/community/me/*` | `GET …/me/posts` 等 | READY* |
| **F-020** | 市场星标 | `/market` | `…/me/market-bookmarks` | READY* |

---

## 2 · 四验与命令（登记日）

| F | 锚点 | 命令 | 结果 |
|---|------|------|------|
| **F-016** | **`routes::community::tests`** | **`cargo test -p traveltrust-api post_like_without_session_returns_401`**；**`delete_like_without_session_returns_401`** | 各 **1 passed** |
| **F-017** | 同上 | **`post_collect_without_session_returns_401`**；**`delete_collect_without_session_returns_401`** | 各 **1 passed** |
| **F-018** | 同上 | **`post_community_report_without_session_returns_401`** | **1 passed** |
| **F-019** | 同上 | **`get_me_posts_no_db_returns_database_required`**；**`get_me_collects_no_db_returns_database_required`**；**`get_me_likes_no_db_returns_database_required`**；**`get_me_likes_received_no_db_returns_database_required`** | 各 **1 passed** |
| **F-020** | **`routes::me::market_bookmark_route_tests`** | **`cargo test -p traveltrust-api market_bookmark_route_tests`** | **6 passed** |

**路由**：**`bash scripts/run-check-04-routes.sh`** → **exit 0**。

---

## 3 · §8.2 五格（诚实结论）

| 列 | F-016～F-020 |
|----|----------------|
| **UT** | **[x]**（与母表一致） |
| **API·IT** | **`[ ]`**（无对标 **`auth_register_login_logout_db_api_tests`** 之 **Router+PG** 专文件；**F-015** 外 **社区 me 列表** 仍以 **503 `database_required`** 类单测为主） |
| **93** | **`[ ]`**（**93 · D**；须 **`report.json` PASS** 或 **CI `e2e` 绿存档**；**ISS-007** 仍开至归档） |
| **E2E** | **`[ ]`** |
| **负例** | **[x]**（与 **95 §8.2** **F-017～021** 脚注一致） |
| **行完成** | **`[ ]`** |

**E2E 旁证**：**`frontend/e2e/smoke-community.spec.ts`** 等 — **不**闭 **§8.2 E2E** 列。

---

## 4 · **v1.4.69** 机读复跑（本机 · 2026-04-21）

**环境**：**`DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与 **`…f001_f005`/`…f011_f015`** 同口径；**`get_me_*_no_db_*`** 用例名含 **no_db**，在**有**进程级 **`DATABASE_URL`** 时仍 **1 passed** — 以 harness 内 **无 pool** 分支为准）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api post_like_without_session_returns_401`** | **1 passed**（**F-016**） |
| **`cargo test -p traveltrust-api delete_like_without_session_returns_401`** | **1 passed**（**F-016**） |
| **`cargo test -p traveltrust-api post_like_with_x_user_id_no_db_returns_database_required_write`** | **1 passed**（**F-016** 写路径负例） |
| **`cargo test -p traveltrust-api post_collect_without_session_returns_401`** | **1 passed**（**F-017**） |
| **`cargo test -p traveltrust-api delete_collect_without_session_returns_401`** | **1 passed**（**F-017**） |
| **`cargo test -p traveltrust-api post_collect_with_x_user_id_no_db_returns_database_required_write`** | **1 passed**（**F-017** 写路径负例） |
| **`cargo test -p traveltrust-api post_community_report_without_session_returns_401`** | **1 passed**（**F-018**） |
| **`cargo test -p traveltrust-api post_community_report_with_x_user_id_no_db_returns_database_required_write`** | **1 passed**（**F-018** 写路径负例） |
| **`cargo test -p traveltrust-api get_me_posts_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api get_me_collects_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api get_me_likes_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api get_me_likes_received_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api market_bookmark_route_tests`** | **6 passed**（**F-020**，内含 **`delete_me_market_bookmark_invalid_target_type_returns_400`** 等） |

**§2 表增量**：相对登记日初稿，本批补登 **`post_*_with_x_user_id_no_db_*`**/**`delete_me_market_bookmark_invalid_target_type_returns_400`** 机读行（与 **95 §8.2** **F-017～021** 脚注 **X-User-Id**/**400** 叙事互证）。

---

## 5 · Agent 本机复跑（2026-04-22 · Cursor · Windows）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与前几批证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api post_like_without_session_returns_401`** | **1 passed** |
| **`cargo test -p traveltrust-api delete_like_without_session_returns_401`** | **1 passed** |
| **`cargo test -p traveltrust-api post_like_with_x_user_id_no_db_returns_database_required_write`** | **1 passed** |
| **`cargo test -p traveltrust-api post_collect_without_session_returns_401`** | **1 passed** |
| **`cargo test -p traveltrust-api delete_collect_without_session_returns_401`** | **1 passed** |
| **`cargo test -p traveltrust-api post_collect_with_x_user_id_no_db_returns_database_required_write`** | **1 passed** |
| **`cargo test -p traveltrust-api post_community_report_without_session_returns_401`** | **1 passed** |
| **`cargo test -p traveltrust-api post_community_report_with_x_user_id_no_db_returns_database_required_write`** | **1 passed** |
| **`cargo test -p traveltrust-api get_me_posts_no_db_returns_database_required`** | **1 passed** |
| **`cargo test -p traveltrust-api get_me_collects_no_db_returns_database_required`** | **1 passed** |
| **`cargo test -p traveltrust-api get_me_likes_no_db_returns_database_required`** | **1 passed** |
| **`cargo test -p traveltrust-api get_me_likes_received_no_db_returns_database_required`** | **1 passed** |
| **`cargo test -p traveltrust-api market_bookmark_route_tests`** | **6 passed** |

**§8.2 边界不变**：**API·IT**/**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾**。

---

## 6 · Cursor agent 复跑（**2026-04-22** · 本对话 · **F-016～F-020**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**（与前几批证据包同源）。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`post_like_without_session_returns_401`** / **`delete_like_without_session_returns_401`** / **`post_like_with_x_user_id_no_db_returns_database_required_write`** | 各 **1 passed**（**F-016**） |
| **`post_collect_without_session_returns_401`** / **`delete_collect_without_session_returns_401`** / **`post_collect_with_x_user_id_no_db_returns_database_required_write`** | 各 **1 passed**（**F-017**） |
| **`post_community_report_without_session_returns_401`** / **`post_community_report_with_x_user_id_no_db_returns_database_required_write`** | 各 **1 passed**（**F-018**） |
| **`get_me_posts_no_db_returns_database_required`** 等 **4** 测 | 各 **1 passed**（**F-019**） |
| **`delete_me_market_bookmark_invalid_target_type_returns_400`** | **1 passed**（**F-020** **负例**） |
| **`cargo test -p traveltrust-api market_bookmark_route_tests`** | **6 passed**（**F-020**） |

**结论**：与 **§5** 同日机读**同结果**，并**显式**复跑 **`delete_me_market_bookmark_invalid_target_type_returns_400`**；**不**升格 **§8.2** **API·IT**/**93**/**E2E**/**行完成**/**§3.1**（**ISS-007**）。
