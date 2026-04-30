# GO_95 · §8.2 · F-021～F-025 审计复跑 · 2026-04-22

对应 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**、**§8.2**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成** / **§3.1**（**ISS-007**）。

## 1 · 环境

| **`DATABASE_URL`** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`（本批多数用例为 **503/401/契约体**；**不**依赖 PG 争议列表真读） |

## 2 · 机读命令与结果

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api market_subsite::tests -- --test-threads=1` | **10 passed**（**F-021/F-022**） |
| `cargo test -p traveltrust-api 'routes::guides::tests::' -- --test-threads=1` | **7 passed**（**F-023/F-024** HTTP 负例 + 规范化/上传闸） |
| `cargo test -p traveltrust-api p21_guides_create_list_get_stake -- --test-threads=1` | **1 passed**（**F-023/F-024** **`guide_stake_impl`** 内存链） |
| `cargo test -p traveltrust-api 'routes::disputes::tests::' -- --test-threads=1` | **5 passed**（**F-025**） |

## 3 · 四验诚实结论

- **路由 / 代码**：**`market_subsite::router`**（**`/api/v1/market/provider|acquisition/...`**）、**`guides::router`**（**`/api/v1/guides`**、**`…/stake`**）、**`disputes::router`**（**`GET /api/v1/disputes*`**、**`POST …/orders/:id/dispute`**）与 **04** 机读一致。
- **F-021～022**：**10** 测以 **chain_off 缺失 →503**、**草稿需登录**、**400 UUID** 为主 — **非** **`market_listings` PG 全链路** 终验。
- **F-023～024**：**`p21_guides_create_list_get_stake`** 使用 **`ChainOffState { db_pool: None, … }`** — **内存态**向导/质押语义；**`guide_stake_without_chain_off_is_503`** 等为 **HTTP 负例**。**真链 tx + PG 侧一致** 仍 **§3 PARTIAL** / **§8.2 API·IT `[ ]]`**。
- **F-025**：**503/400** Router 测 + **`b118_*`** **JSON 契约体**单元测；**`POST …/dispute` 开争议全路径 PG·IT** 仍 **§8.2 API·IT `[ ]]`**（与 **95** 脚注一致）。

## 4 · §8.2 五格（与母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F-021～025 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

## 5 · §9

- **ISS-007**：**93/E2E/行完成** 仍开。
- **ISS-009**（向导档期多副本）：与 **F-023** 相关运维边界；**本批机读不闭**。
