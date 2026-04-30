# GO_95 · §8.2 · F-032～F-033 审计复跑 · 2026-04-27

对应 **[`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`](../../docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md)** **§3**/**§8.2**。**不**替代 **93** / **R-001** / **ISS-007**。

---

## 1 · 机读命令与结果（本轮）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api --no-run`** | **`Finished` `test` profile**（可执行测例已链接） |
| **`cargo test -p traveltrust-api trust_growth`** | **2 passed** — **`trust_growth_autopilot::tests`**（**`recompute_emits_all_moments`**、**`caps_renormalize`**）；**非** **`routes::trust_growth`** **HTTP** **独占**子集 |
| **`cargo test -p traveltrust-api itinerary_custom_draft`** | **8 passed**（**F-033** **草稿子集**） |

---

## 2 · 四验

### F-032 · Trust growth

| 验 | 结论 |
|----|------|
| **代码** | **`routes/trust_growth.rs`** **`POST /api/v1/trust-growth/ingest`**、**`GET …/config`**；**`routes/admin/trust_growth_obs.rs`**；**`db/trust_growth.rs`**；**`api_router()`** **`.merge(trust_growth::router())`**（**`routes/mod.rs`** **L106**） |
| **路由** | **`run-check-04-routes.sh` exit 0** |
| **状态** | **ingest** 依赖 **`chain_off` + `db_pool`**；缺库 **503** `database_unavailable`（见 **`trust_growth.rs`**） |
| **mock / 真** | **Autopilot** **2 passed**；**ingest HTTP** 负例 **不**在本批独占计数（**F-028** **`idempotency_http_contract_tests`** 曾用 **`/trust-growth/ingest`** 作 **`missing_idempotency_key`** 探针 — **95** 规定 **不**借 **F-028** 勾 **F-032·UT/负例**） |

### F-033 · 行程自定义 + PG 草稿

| 验 | 结论 |
|----|------|
| **代码** | **`routes/itineraries.rs`** 文件头 + **`itinerary_custom_draft`** / **`get_itinerary_custom_draft`** / **`itinerary_custom_create`**；路由 **L220–L227** |
| **路由** | **`run-check-04-routes.sh` exit 0** |
| **状态** | **8** 测覆盖 **503**/**401**/**400**/**无池**/**非 object payload**；**`POST …/custom`** 全链 **无** 对标 **PG·IT** 母文件 |
| **mock / 真** | **`itinerary_custom_draft` 8 passed**（与 **§8.2** **UT/负例** 同源子集） |

---

## 3 · §8.2 五格（与 **95** 母表一致 · 不升格）

| F | UT | API·IT | 93 | E2E | 负例 | 行完成 |
|---|:---:|:------:|:--:|:---:|:----:|:------:|
| **F-032** | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| **F-033** | [x] | [ ] | [ ] | [ ] | [x] | [ ] |

**旁证（不改母表）**：**`cargo test … trust_growth` → 2 passed** 仅覆盖 **`trust_growth_autopilot`**，**不**满足 **95 · `…f032`** 所述「**`routes::trust_growth::tests`** 或 Admin 专测」之 **F-032·UT `[x]`** 口径。

---

## 4 · §3.1

**F-032**、**F-033** **均不得**勾选。

---

## 5 · §9

**ISS-007**（**93** / **E2E** / **行完成**）；**ISS-002**（**§3.1**）。

**缺口建议（可后续升格 ISS）**：为 **F-032** 增加 **`routes::trust_growth` `Router::oneshot` + PG** 之 **UT/API·IT**（ingest/config/Admin obs），避免长期仅依赖 **autopilot** 与 **F-028** 探针。

---

## 6 · **F-001～F-033** 本轮台账小结

至 **2026-04-27**，**§8.2** **行完成** 仍为 **0/33**；**UT/API·IT/93/E2E/负例** 列以 **`docs/spec/95-…` §8.2 表** 为 SSOT；本仓库 **`evidence/GO_95_2026042*_section8_2_f*`** 系列已分批机读归档 **F-001～F-033**（与 **ISS-007** 未闭并存）。
