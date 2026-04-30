# GO_95 · §8.2 · F-016～F-020 审计复跑 · 2026-04-24

对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2**。**不**替代 **93 · D** / **R-001** / **ISS-007** 闭证。

---

## 1 · 机读命令与结果（本轮）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api post_like_without_session_returns_401`** | **1 passed**（**F-016**） |
| **`cargo test -p traveltrust-api delete_like_without_session_returns_401`** | **1 passed**（**F-016**） |
| **`cargo test -p traveltrust-api post_like_with_x_user_id_no_db_returns_database_required_write`** | **1 passed**（**F-016** 写路径） |
| **`cargo test -p traveltrust-api post_collect_without_session_returns_401`** | **1 passed**（**F-017**） |
| **`cargo test -p traveltrust-api delete_collect_without_session_returns_401`** | **1 passed**（**F-017**） |
| **`cargo test -p traveltrust-api post_collect_with_x_user_id_no_db_returns_database_required_write`** | **1 passed**（**F-017** 写路径） |
| **`cargo test -p traveltrust-api post_community_report_without_session_returns_401`** | **1 passed**（**F-018**） |
| **`cargo test -p traveltrust-api post_community_report_with_x_user_id_no_db_returns_database_required_write`** | **1 passed**（**F-018** 写路径） |
| **`cargo test -p traveltrust-api get_me_posts_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api get_me_collects_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api get_me_likes_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api get_me_likes_received_no_db_returns_database_required`** | **1 passed**（**F-019**） |
| **`cargo test -p traveltrust-api market_bookmark_route_tests`** | **6 passed**（**F-020**） |

**合计**：社区相关 **12** 单测 × **1 passed** + 星标子集 **6 passed**。

---

## 2 · 四验摘要

| F | 代码 / 路由 | 数据 / 负例 |
|---|-------------|-------------|
| **F-016** | **`routes/community/router.rs`** **`…/posts/:id/like`** | 无会话 **401**；无池写 **503** 类 |
| **F-017** | 同上 **`…/collect`**；**`GET …/me/collects`** | 同上 |
| **F-018** | **`POST /api/v1/community/reports`** | 同上 |
| **F-019** | **`GET …/me/posts`**、**`…/likes`**、**`…/likes-received`**、**`…/collects`** | **`database_required`** |
| **F-020** | **`routes/me.rs`** **`/api/v1/me/market-bookmarks`** | **401** / **503** / **400** **`invalid_target_type`** 等（**≠ F-017 `postCollect`**） |

---

## 3 · §8.2 五格（与 **95** 母表一致）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:------:|:--:|:---:|:----:|:------:|
| F-016～F-020 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

**§3.1**：**不得**勾选 **F-016～F-020**。

---

## 4 · §9

**ISS-007**（**93** / **E2E** / **行完成**）；**ISS-002**（**§3.1**）。
