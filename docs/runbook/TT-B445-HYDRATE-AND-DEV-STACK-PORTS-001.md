# TT-B445-HYDRATE-AND-DEV-STACK-PORTS-001 · `hydrate` 用户/会话 + 全栈端口契约

**母表**：**[B-445](../任务母表.md)**

---

## 1. 验收（封口条件）

### 1.1 持久化真值（users / sessions → hydrate）

1. **环境**：**`DATABASE_URL`** **（** **无** **则** **跳过** **）** **。**
2. **机读**：

   ```bash
   DATABASE_URL=postgres://… cargo test -p traveltrust-api hydrate_from_db_roundtrips_user_and_session_after_insert -- --nocapture
   ```

3. **实现**：`crates/api/src/startup/hydrate.rs` **`b445_hydrate_users_sessions_contract_tests`** **。**

### 1.2 全栈端口约定（Unix / Windows 对齐）

1. **Unix**：根 `.env` **仅** **`PORT=3012`** **时** **`scripts/dev/_dev_stack_ports.sh`** **解析** **`BACKEND_PORT=8080`** **（** **WARN** **可** **见** **）** **。**
2. **机读**：

   ```bash
   bash scripts/dev/check-b445-dev-stack-ports-contract.sh
   ```

3. **Windows**：**`scripts/dev/start-api-with-seed.bat`** **在** **从** **`.env`** **读得** **`API_PORT=3012`** **或** **`3000`** **时** **覆盖** **`API_PORT=8080`** **并** **打印** **`[B-445] WARN`** **；** **若** **`API_PORT`** **与** **`FRONTEND_PORT`** **相同** **则** **失败** **退出** **（** **`[B-445] ERROR`** **）** **。**

---

## 2. 非目标

- **不** **替代** **完整** **HTTP** **`/auth/register`** **→** **重启** **进程** **的** **人工** **E2E** **（** **本** **卡** **以** **`hydrate_from_db`** **机读** **锚** **持久化** **真值** **）** **。**

---

**文档版本**：1.0 · 2026-04-17
