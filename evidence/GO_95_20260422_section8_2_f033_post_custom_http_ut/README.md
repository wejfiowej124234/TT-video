# GO_95 · §8.2 · F-033 · `POST /api/v1/itineraries/custom` HTTP UT · 2026-04-22

**母表**：**`docs/spec/95-全链路生产就绪检查清单与完成度矩阵.md`**（**Version 1.4.88**）。**§8.2 F-033** **UT/负例** 含 **`POST …/custom`** 子集；**API·IT** / **93** / **E2E** / **行完成** 仍 **`[ ]`**（**ISS-007**）。

**与** **`evidence/GO_95_20260421_section8_2_f033/README.md`**：该包为 **v1.4.81** 基线；**v1.4.88** 起 **`/custom`** **HTTP** 机读以本 README 为准。

---

## 1 · 四验

| 验 | 结论 | 锚点 |
|---|------|------|
| **代码** | **`itinerary_custom_http_*`** **3** **`Router::oneshot`** | **`crates/api/src/routes/itineraries.rs`** **`mod tests`** |
| **路由** | **`POST /api/v1/itineraries/custom`** | **`itinerary_custom_create`** |
| **状态** | 无 **`chain_off`** → **503** **`chain_off_unavailable`**；未登录 → **401**；**`creator_type`** 非法 → **400** | 同 **`trust_growth_api_tests`** 模式：**`api_meta_state`** |
| **真 / mock** | **`cfg(test)`** 下 **`ensure_durable_writes_available`** **不**挡无池；故本包**未**对 **`/custom`** 断言 **`database_required`**（与 **`chain_off::tests_events_itinerary`** **`itinerary_custom_create_impl_*`** 一致） | **`chain_off/persistence_gate.rs`** |

---

## 2 · 机读命令与摘录

### 2.1 · **`POST …/custom`** 子集（**3**）

```text
cargo test -p traveltrust-api itinerary_custom_http -- --nocapture
```

**摘录**（本机）：

```text
running 3 tests
test routes::itineraries::tests::itinerary_custom_http_post_custom_requires_login ... ok
test routes::itineraries::tests::itinerary_custom_http_post_custom_invalid_creator_type_returns_400 ... ok
test routes::itineraries::tests::itinerary_custom_http_post_custom_without_chain_off_returns_503 ... ok
test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; ...
```

### 2.2 · **草稿** 子集（**8**，不变）

```text
cargo test -p traveltrust-api itinerary_custom_draft -- --nocapture
```

**期望**：**8 passed**。

### 2.3 · **`routes::itineraries::tests` 全量（11）**

```text
cargo test -p traveltrust-api routes::itineraries::tests -- --nocapture
```

**期望**：**11 passed**。

### 2.4 · 路由闸

```bash
bash scripts/run-check-04-routes.sh
```

**期望**：**exit 0**。
