# GO_95 · §8.2 · F-032 Trust growth · 2026-04-21

**95 并入批次**：**v1.4.79**（**§6** **`…f032`** 行）；仓库 **95** **Version** 若已前进（如 **v1.4.80** **§7.4 DID**），以 **`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md` 文首** 为准。**§11.1** **Trust growth** 已并入 **§3 F-032** / **§8.2**；**不**替代 **93** / **R-001**。

---

## 1 · §3 / §8.2 对读

| F | 能力 | 锚点 |
|---|------|------|
| **F-032** | Trust growth（公开 ingest/config + Admin observability/control） | **`crates/api/src/routes/trust_growth.rs`** + **`crates/api/src/routes/admin/trust_growth_obs.rs`** + **`crates/api/src/db/trust_growth.rs`** |

**前端**：**`frontend/app/admin/trust-growth/page.tsx`**（Admin 面；**不**在本包单列 E2E）。

---

## 2 · 路由与编译（登记日）

| 验 | 命令 | 结果 |
|---|------|------|
| **路由** | **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **测试目标编译** | **`cargo test -p traveltrust-api --no-run`** | **Finished**（可执行测例已链接） |

---

## 3 · §8.2 五格（诚实结论 · F-032）

> **v1.4.87 更新**：**UT** / **负例**（**`trust_growth::router`** **`oneshot`**）见 **`evidence/GO_95_20260428_section8_2_f032_trust_growth_http_ut/README.md`**；下表 **v1.4.79** 历史格已过时，以 **95 母表 §8.2** 为准。

| 列 | F-032 |
|----|--------|
| **UT** | **`[x]`** — **`cargo test -p traveltrust-api trust_growth_api_tests`** **6 passed** + **`trust_growth_autopilot`** **2 passed**；与 **95 §8.2** 母表、**`evidence/GO_95_20260428_section8_2_f032_trust_growth_http_ut/README.md`** 一致。 |
| **API·IT** | **`[ ]`** — **Admin** **`…/admin/trust-growth/*`** 仍无 **`auth_register_*` 风格** PG·IT 专母。 |
| **93** | **`[ ]`**（**ISS-007**） |
| **E2E** | **`[ ]`** |
| **负例** | **`[x]`** — **`trust_growth_api_tests`** 内 **503/400** 子集；**`missing_idempotency_key`** 全路由 **`Router::oneshot`** 仍归 **F-028** **`idempotency_http_contract_tests`**（**不**重复闭 **行完成**）。 |
| **行完成** | **`[ ]`** |

---

## 4 · 机读表（本包 · v1.4.79）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api --no-run`** | **Finished** `test` profile |

**注**：若后续新增 **`routes::trust_growth::tests`** 或 **`admin`** 内 **trust-growth** 专测，须回填 **95 §8.2** **F-032** 脚注与本 **§4**，再评估 **UT**/**负例** 是否可 **`[x]`**。

---

## 5 · Agent 本机复跑（2026-04-22 · **F-032**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api trust_growth_api_tests`** | **6 passed** |
| **`cargo test -p traveltrust-api trust_growth_autopilot`** | **2 passed** |

**§8.2**：**API·IT**/**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾** **F-032**。

---

## 6 · Agent 本机复跑（2026-04-22 · **v1.4.133** · **F-032**）

**`DATABASE_URL`** = **`postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`**。（**`cargo test` 单 `TESTNAME`**：**禁**同一命令串 **`trust_growth_api_tests trust_growth_autopilot`** → **`Usage`/`unexpected argument`**。）

| 命令 | 结果 |
|------|------|
| **`bash scripts/run-check-04-routes.sh`** | **exit 0** |
| **`cargo test -p traveltrust-api trust_growth_api_tests`** | **6 passed** |
| **`cargo test -p traveltrust-api trust_growth_autopilot`** | **2 passed** |

**§8.2**：**API·IT**/**93**/**E2E**/**行完成** **`[ ]`**（**ISS-007**）；**§3.1** **禁勾** **F-032**。
