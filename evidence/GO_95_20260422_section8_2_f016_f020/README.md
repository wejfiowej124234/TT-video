# GO_95 · §8.2 · F-016～F-020 审计复跑 · 2026-04-22

对应 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**、**§8.2**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成** / **§3.1**（**ISS-007**）。

## 1 · 环境

| **`DATABASE_URL`** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（本批单测**不依赖** PG 成功写路径；多为 **无池/无会话** 负例） |

## 2 · 机读命令与结果

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api 'routes::community::tests::tests::' -- --test-threads=1` | **18 passed**（含 **F-016～019** 相关 **like/collect/report/me-*/tag** 与 **appeal** 子集） |
| `cargo test -p traveltrust-api market_bookmark_route_tests -- --test-threads=1` | **6 passed**（**F-020** **`…/me/market-bookmarks`**） |

## 3 · 四验诚实结论

- **代码 / 路由**：**`community/router.rs`**（**`/posts/:id/like`**、**`/collect`**、**`/reports`**、**`/me/posts|likes|collects|likes-received`**）与 **`me.rs`**（**`/api/v1/me/market-bookmarks`**）与 **04** 机读一致（**`run-check-04-routes.sh`**）。
- **状态 / PG 真写**：本批 **`routes::community::tests`** 以 **`database_required` / `401` / 校验** 为主，**无**对标 **F-015** 的 **`Router::oneshot` + PG 行断言** 的 **like/collect/report 成功落库** 专母文件 → **§8.2 API·IT `[ ]`**（F-016～020）与 **§3 READY\*** 并存时仍以 **ISS-007**/**93·D** 为准。
- **F-020 vs F-017**：星标走 **`me/market-bookmarks`**，**≠** 社区 **`post_collect`**（**§7.1 域 F** 叙事）。

## 4 · §8.2 五格（与母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F-016～020 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

## 5 · §9

不另开 **ISS**（**ISS-007**）。
