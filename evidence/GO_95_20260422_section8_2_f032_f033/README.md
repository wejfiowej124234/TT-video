# GO_95 · §8.2 · F-032～F-033 审计复跑 · 2026-04-22

对应 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`** **§3**、**§8.2**。**F-TPL** 为模板行 — **本批不执行四验**。**不**宣称 **93 PASS** / **E2E 闭证** / **行完成** / **§3.1**（**ISS-007**）。

## 1 · 环境

| **`DATABASE_URL`** | `postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust` |

## 2 · 机读命令与结果

| 命令 | 结果 |
|------|------|
| `bash scripts/run-check-04-routes.sh` | **exit 0** |
| `cargo test -p traveltrust-api trust_growth_api_tests -- --test-threads=1` | **6 passed**（**F-032**：**503**/**400** 子集；**2** 条 **PG** 路径 **`missing_moment`/`unknown_event`**） |
| `cargo test -p traveltrust-api trust_growth_autopilot -- --test-threads=1` | **2 passed**（纯算法/UT，**非** Admin HTTP） |
| `cargo test -p traveltrust-api itinerary_custom_draft -- --test-threads=1` | **8 passed**（**F-033** 草稿） |
| `cargo test -p traveltrust-api itinerary_custom_http -- --test-threads=1` | **3 passed**（**`POST …/custom`** **503/401/400**） |
| `cargo test -p traveltrust-api 'routes::itineraries::tests::' -- --test-threads=1` | **11 passed**（**8+3** 合并枚举，与 **95** 脚注一致） |

## 3 · 四验诚实结论

- **F-032**：**`trust_growth::router`** **ingest/config** 与 **`trust_growth_api_tests`** 对齐；**Admin `…/admin/trust-growth/*`** **仍无** **`auth_register_*` 风格** PG·HTTP 专母（**§8.2 API·IT `[ ]]`**）；**ingest** 幂等 **`missing_idempotency_key`** 归 **F-028** **`idempotency_http_contract_tests`**。
- **F-033**：**`itineraries::router`** **`/custom`** + **`/custom/drafts*`** 与 **04** 机读一致；本轮 **11** 测均为 **503/401/400/database_required** 等 — **不**声称 **`POST …/custom` 成功路径 PG·HTTP** 闭证（**§3 PARTIAL** / **§8.2 API·IT `[ ]]`**）；与 **F-012** **`POST /api/v1/itineraries`** 分轨。

## 4 · §8.2 五格（与母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| F-032 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |
| F-033 | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

## 5 · §9

不另开 **ISS**（**ISS-007**）。
