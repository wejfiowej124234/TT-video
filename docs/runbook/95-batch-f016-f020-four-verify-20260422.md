# 95 · §3 批次 F-016～F-020 · 四验 + §8.2 对齐（2026-04-22）

> 与 **`../spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**/**§8.2**/**§9** 对读；**不**宣称 **93 PASS** / **E2E 归档** / **§8.2「行完成」** / **§3.1 `[x]`**（**ISS-007**/**ISS-002**）。

## 1. 环境

- **`DATABASE_URL`**（与 **`docker compose` · postgres** 一致，前几批同）：`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`  
- 本批 **`community::tests::tests`** / **`market_bookmark_route_tests`** 在 **`db_pool=None`** 路径上主要断言 **401/503/database_required**，**不**依赖 **`DATABASE_URL`** 写入成功路径。

## 2. 路由验证

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
bash scripts/run-check-04-routes.sh
```

**结果**：**exit 0**（**178** 路径 **`api.ts`↔04**）。

## 3. 机读命令与结果

```bash
cargo test -p traveltrust-api community::tests::tests:: -- --test-threads=1
cargo test -p traveltrust-api market_bookmark_route_tests -- --test-threads=1
```

| 过滤串 | passed | failed |
|--------|--------|--------|
| `community::tests::tests::` | **18** | 0 |
| `market_bookmark_route_tests` | **6** | 0 |

**F-016～019 与 18 测**：含 **点赞/收藏/举报/me-*/Feed/tag** 辅测（**多于** 95 脚注 **「like/collect/report/me-*」12** 的窄计数；**核心门禁子集**均绿）。

**F-020 与 6 测**：**`routes/me.rs`** **`mod market_bookmark_route_tests`** — **`GET|POST|DELETE …/me/market-bookmarks`** **401/400/503/database_required/chain_off_unavailable** 等。

## 4. 分 F 四验（§3）

| F | 代码 | 路由 | 状态 | mock·PG |
|---|------|------|------|---------|
| **F-016** | **`dm_social`** **`post_like`/`delete_like`**；**`community/tests.rs`** | **`POST/DELETE …/like`** | 无会话 **401**；无池写 **503** | **`post_like_*`/`delete_like_*`** |
| **F-017** | **`post_collect`/`delete_collect`** | **`POST/DELETE …/collect`** | 同上 | **`post_collect_*`/`delete_collect_*`** |
| **F-018** | **`feedback_reports`** | **`POST …/reports`** | 同上 | **`post_community_report_*`** |
| **F-019** | **`get_me_posts`/`get_me_*`** | **`GET …/me/posts|likes|collects`** | 无池 **database_required** | **`get_me_*_no_db_*`** |
| **F-020** | **`me.rs`** **`get_me_market_bookmarks` 等** | **`…/me/market-bookmarks`** | **≠** **F-017** **`postCollect`**（**§7.1 域 F**） | **6** 路由测 |

## 5. §8.2 / §9

- **§8.2**：**UT**/**负例** 母表已为 **`[x]`**；**API·IT**/**93**/**E2E**/**行完成** 仍 **`[ ]`**（**无** **`Router+PG`** 专母 / **ISS-007**）。
- **§9**：**不**新增 **ISS**。
