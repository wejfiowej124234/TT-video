# GO_95 · §8.2 · F-032 · Trust growth HTTP UT（`trust_growth::router`）· 2026-04-28

**母表**：**`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`**（**Version 1.4.87**）。**§8.2 F-032**：**UT** / **负例** 本包机读；**API·IT** / **93** / **E2E** / **行完成** 仍 **`[ ]`**（**ISS-007** / **Admin** 无 **`auth_register_*` 风格** PG·IT）。

**与** **`evidence/GO_95_20260421_section8_2_f032/README.md`** **关系**：该包登记 **v1.4.79** 路由/编译基线；**v1.4.87** 起 **F-032·UT/负例** 以本 README 为准。

---

## 1 · 四验

| 验 | 结论 | 锚点 |
|---|------|------|
| **代码** | **`trust_growth::router`** 上 **`Router::oneshot`** **6** 测 | **`crates/api/src/routes/trust_growth_api_tests.rs`** |
| **路由** | **`POST /api/v1/trust-growth/ingest`**、**`GET /api/v1/trust-growth/config`** | **`crates/api/src/routes/trust_growth.rs`** |
| **状态** | **`chain_off_unavailable`**（无 **`ChainOffState`**）；**`database_unavailable`**（有 **`ChainOffState`** 无 **`db_pool`**）；**PG** 子集需 **`DATABASE_URL` + 迁移** 才断言 **400** | 同上 + **`api_meta_state`**（**`state::test_support`**） |
| **真 / mock** | **真 PG**（可选）：未设 **`DATABASE_URL`** 时 PG 子测 **early return**，仍 **ok**（**vacuous**）；**503** 路径不依赖 PG | 见 §2 命令 |

**ingest 幂等键**（**`router::app`** 全栈）仍归 **F-028** **`idempotency_http_contract_tests`**，**不**重复计入本包。

---

## 2 · 机读命令与摘录

### 2.1 · 无 **`DATABASE_URL`**（CI / 本地默认）

```text
cargo test -p traveltrust-api trust_growth_api_tests -- --nocapture
```

**摘录**（**2026-04-28**，本机）：

```text
running 6 tests
skip: post_trust_growth_ingest_missing_moment_returns_400_pg (DATABASE_URL unset)
...
skip: post_trust_growth_ingest_unknown_event_returns_400_pg (DATABASE_URL unset)
...
test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; ...
```

### 2.2 · 已设 **`DATABASE_URL`**（迁移后 PG）

**示例**（与仓库常见 dev 一致）：

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
cargo test -p traveltrust-api trust_growth_api_tests -- --nocapture
```

**摘录**（**2026-04-28**，本机）：**6 passed**，**无 skip**；**400** 子集：**`missing_moment_or_variant_id`**、**`unknown_event`**。

### 2.3 · 算法子集（**非** HTTP router）

```text
cargo test -p traveltrust-api trust_growth_autopilot -- --nocapture
```

**摘录**：**2 passed**（**`recompute_emits_all_moments`**、**`caps_renormalize`**）。

### 2.4 · 路由契约闸（登记）

```bash
bash scripts/run-check-04-routes.sh
```

**期望**：**exit 0**（与 **95 §12** 同源）。

---

## 3 · **`routes/` 顶层 `*.rs` 计数**

```bash
find crates/api/src/routes -maxdepth 1 -name '*.rs' | wc -l
```

**登记日**：**33**（含 **`trust_growth_api_tests.rs`**）。
