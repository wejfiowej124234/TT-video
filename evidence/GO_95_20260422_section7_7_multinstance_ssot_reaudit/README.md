# GO_95 · §7.7 多实例内存 SSOT — 机读复核（非闭证）

**范围**：仅 **95 §7.7** 未勾行「**多实例内存 SSOT 方案落地**」与 **§9 ISS-009** 的工程真值复核。  
**结论**：**不**将 **§7.7** 该行 **`[ ]`→`[x]`**；**不**闭 **ISS-009**。单机 **`schedule_engine::` 1 passed** **不是** 多副本并发一致或分布式锁闭证。

---

## §1 代码锚点（SSOT 边界）

| 主题 | 路径 | 说明 |
|------|------|------|
| 启动时 `init_from_env` + prod safe WARN | `crates/api/src/startup/mod.rs` | **`L392–L404`**：`schedule_engine::init_from_env` 失败仅 `eprintln!`；**`TRAVELTRUST_PRODUCTION_SAFE_DEFAULTS=1`** 且 **`SCHEDULE_SLOTS_PATH` unset** → **`WARN: … slot locks are volatile across process restarts`** |
| 进程内锁 + 可选文件 | `crates/api/src/schedule_engine.rs` | **`OnceLock<Arc<RwLock<LockedSlots>>>`**（**L59–L84**）；**`PERSIST_PATH`**（**L62**）；**无** 跨进程 / 多 API Pod 的 PG 或 Redis 锁 |
| 向导档期读 | `crates/api/src/chain_off/guides.rs` | **`locked_slots_for_guide`**（约 **L636**）→ **`schedule_engine::locked_slots_for_guide`** |

---

## §2 本机命令结果（2026-04-22 · Git Bash · 仓库根）

```text
$ bash scripts/check-07-version-triple.sh
OK: 07 version triple aligned (1.0.858).

$ bash scripts/run-check-04-routes.sh
(… 全套 gates …)
exit 0

$ cargo test -p traveltrust-api schedule_engine:: -- --nocapture
running 1 test
test schedule_engine::tests::load_from_path_valid_json_ok ... ok
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 964 filtered out
```

**判读**：门禁未破坏；**`load_from_path_valid_json_ok`** 验证 **JSON 文件加载** 路径，**不**覆盖 **双 API 进程** 对同一 **`SCHEDULE_SLOTS_PATH`** 或 **无路径（纯内存）** 的竞态终验。

---

## §3 与 95 / §9 的对读

- **95 §7.7** 末条仍为 **`[ ]`**：与 **§7.5** hydrate、**`chain_off`** 内存态、**F-023** 备注一致。  
- **§9 ISS-009**：闭证条件仍为 **(A) 共享卷 + Runbook** / **(B) PG 档期 + 事务锁（可能 F-034）** / **(C) 分布式锁 + 证据**；本包 **不** 满足任一闭证分支。

---

## §4 诚实边界（禁止机读扇面升格）

- **不得**仅凭 **`run-check-04-routes.sh` exit 0** 或 **`schedule_engine::` 1 passed** 宣称 **多实例 SSOT** 已生产就绪。  
- **下一子节**（按用户「每次一个子节」）：**§7** 其余子节此前已 **`[x]`**；余 **§7.7** 本条 **`[ ]`** 为**已知工程余量**（**ISS-009**），后续应转入用户指定的 **§10 / §11 / §12** 下一子节，或推动 **ISS-009** 工程方案 + **Runbook** 登记。
