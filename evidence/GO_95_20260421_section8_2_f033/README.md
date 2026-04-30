# GO_95 · §8.2 · F-033 行程自定义与 PG 草稿 · 2026-04-21



**95 并入批次**：**v1.4.81**（**§6** **`…f033`** 行）；仓库 **95** **Version** 若已前进（如 **v1.4.83** **§11.1 社区延伸旁证**），以 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` 文首** 为准。**§11.1** **行程自定义与草稿** 已并入 **§3 F-033** / **§8.2**；**不**替代 **93** / **R-001**。



---



## 1 · §3 / §8.2 对读



| F | 能力 | 锚点 |

|---|------|------|

| **F-033** | **`POST /api/v1/itineraries/custom`**（49 A 自定义行程订单）+ **`POST|GET /api/v1/itineraries/custom/drafts*`**（**`itinerary_custom_drafts`** **PG**） | **`crates/api/src/routes/itineraries.rs`** 文件头 + **`itinerary_custom_create`** / **`itinerary_custom_draft_*`**；**`db/itinerary_custom_drafts.rs`** |



**与 F-012 边界**：**F-012** 主路径 **`POST /api/v1/itineraries`**（**`chain_off::tests_events_itinerary`**）；**F-033** **`routes::itineraries::tests`**：**草稿** **`itinerary_custom_draft_*`** **8** + **`POST …/custom`** **`itinerary_custom_http_*`** **3**（**v1.4.88**；见 **`evidence/GO_95_20260422_section8_2_f033_post_custom_http_ut/README.md`**）；**成功路径**/**PG·HTTP IT** 仍 **§8.2** **API·IT `[ ]`**。



**前端旁证（非 §8.2 闭证）**：**§7.1 域 E** **`frontend/lib/api.ts`** **`routes.itinerariesCustomDrafts`** / **`itineraryCustomDraftById`**。



---



## 2 · 路由与编译（登记日）



| 验 | 命令 | 结果 |

|---|------|------|

| **路由** | **`bash scripts/run-check-04-routes.sh`** | **exit 0** |

| **UT（草稿子集）** | **`cargo test -p traveltrust-api itinerary_custom_draft`** | **8 passed** |



---



## 3 · §8.2 五格（诚实结论 · F-033）



| 列 | F-033 |

|----|--------|

| **UT** | **`[x]`** — **`routes::itineraries::tests`**：**`itinerary_custom_draft_*`** **8** + **`itinerary_custom_http_*`** **3**；**`cargo test … itinerary_custom_draft`** **8** + **`itinerary_custom_http`** **3**（**母文件** **`routes::itineraries::tests`** **11 passed**）；**不**声称 **`/custom`** 成功路径 **PG·HTTP** 闭证。 |

| **API·IT** | **`[ ]`** — **无** 对标 **`auth_register_login_logout_db_api_tests`** 之 **`Router::oneshot`+PG** **custom/drafts** 专母文件。 |

| **93** | **`[ ]`**（**ISS-007**） |

| **E2E** | **`[ ]`** |

| **负例** | **`[x]`** — **11** 测：**草稿** **503/401/400** + **`/custom`** **503/401/400**（**`invalid_creator_type`**）；**不**重复闭 **行完成**。 |

| **行完成** | **`[ ]`** |



---



## 4 · 机读表（本包 · v1.4.81）



| 命令 | 结果 |

|------|------|

| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |

| **`cargo test -p traveltrust-api itinerary_custom_draft`** | **8 passed** |
| **`cargo test -p traveltrust-api itinerary_custom_http`** | **3 passed** |
| **`cargo test -p traveltrust-api routes::itineraries::tests`** | **11 passed** |



**注**：**`POST …/custom`** **`Router::oneshot`**（**负例子集**）已并入 **v1.4.88** / **`…f033_post_custom_http_ut`**；**PG·`auth_register_*` 风格 API·IT** 仍缺则须回填 **95 §8.2**。

---

## 5 · Agent 本机复跑（2026-04-22 · **F-033**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api itinerary_custom_draft`** | **8 passed** |
| **`cargo test -p traveltrust-api itinerary_custom_http`** | **3 passed** |
| **`cargo test -p traveltrust-api routes::itineraries::tests`** | **11 passed**（**8+3** 母文件汇总） |

**§8.2 边界不变**：**API·IT**/**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾** **F-033**。

---

## 6 · Agent 本机复跑（2026-04-22 · **v1.4.133** · **F-033**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api itinerary_custom_draft`** | **8 passed** |
| **`cargo test -p traveltrust-api itinerary_custom_http`** | **3 passed** |
| **`cargo test -p traveltrust-api routes::itineraries::tests`** | **11 passed** |

**§8.2 边界不变**：**API·IT**/**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾** **F-033**。


