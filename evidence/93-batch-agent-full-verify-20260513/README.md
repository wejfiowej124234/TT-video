# Local verification attempt (2026-05-13) — phase ① only

See user-facing summary in Cursor chat. Key facts:
- docker compose up -d postgres: FAILED (Docker Desktop engine pipe missing)
- pg_tcp_check: FAILED
- env -u DATABASE_URL cargo test -p traveltrust-api: PASS (1329 tests)
- forge test (contracts): PASS (99 tests)
- CI_LOCAL_SKIP_MARKET_COMMUNITY_E2E=1 bash scripts/gates/local-delivery-expanded.sh: PASS
- bash scripts/gates/e2e-stability-probe.sh: FAILED (Postgres TCP)
- CHAIN_ID vs NEXT_PUBLIC_CHAIN_ID: both 11155111; RPC URLs match (Sepolia publicnode)

Full matrix Playwright and staging/production parity NOT executed (no DB; no staging credentials).

## Matrix status (this run)

| Slice | Status | Notes |
|-------|--------|-------|
| cargo test -p traveltrust-api (DATABASE_URL unset) | PASS | 1329 passed |
| forge test | PASS | 99 passed |
| local-delivery-expanded (skip Playwright tail) | PASS | ci-local + frontend + Vitest slices |
| e2e-stability-probe | BLOCKED | Postgres unreachable |
| Playwright full tail / CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX | NOT RUN | requires DATABASE_URL + migrated PG |
| Staging/production parity | NOT RUN | read-only probe script added (`scripts/ops/read_only_staging_prod_probe.py`); real ②③ URLs/RPC/creds not supplied — no live probe |

---

## 2026-05-13 follow-up — Docker / Postgres unblocked (①)

Commands run (repo root):

1. `docker compose up -d postgres` — OK (`traveltrust-postgres` healthy on 5432)
2. `docker compose ps` — OK
3. `export DATABASE_URL="$(python scripts/gates/read_dotenv_value.py .env DATABASE_URL)"` + `python scripts/gates/pg_tcp_check.py` — OK
4. `cd crates/api && sqlx migrate run` (with DATABASE_URL) — OK (exit 0)
5. `bash scripts/gates/e2e-stability-probe.sh` — OK (`e2e-stability-probe: OK`)
6. `export DATABASE_URL=... && bash scripts/gates/local-delivery-expanded.sh` (full, no skip) — OK (`OK: local-delivery-expanded`, Playwright tail 44 passed)
7. `CI_LOCAL_FULL_CHROMIUM_E2E_MATRIX=1 bash scripts/gates/local-delivery-expanded.sh` — **FAIL** Playwright exit non-zero: **294 passed**, **19 failed**, 3 flaky, 9 skipped, 8 did not run (~48m). Fail list includes B-466, B-467, B-469 slice, epic F, multiple `f0xx-request` specs. Logs: `/tmp/local-delivery-expanded-full-chromium-matrix.log` (local Git Bash).

**Conclusion:** Infrastructure block is cleared. Full chromium matrix red is **test-level**, not DB/TCP — next step is triage via `frontend/playwright-report/` or re-run failing slices (user asked no business code change in this step).

---

## 2026-05-13 — Chromium 全矩阵 19 失败修复与复跑（①）

### 失败类型归类（原 19 项）

| 类型 | 用例 | 说明 |
|------|------|------|
| 环境 / 契约与观测误导 | epic-f mock-pay、B-466/B-467、F-010/F-029 等 | 日志为 **HTTP 408** 或 **501**；Epic 断言文案误写「须 P3_CHAIN_OFF=1」；根 `.env` **`P3_CHAIN_OFF=0`** 经 `e2e-align-env-from-root` 进入 Playwright 父进程后，与 **`chromium`** mock-pay 矩阵契约冲突 |
| 数据双写 / FK 级联 | F-014～F-031、F-020、F-025、F-026、F-027、B-469 等 | **`guide_stake` DB affected 0 rows** 仍 200、`sessions_user_id_fkey`、`orders_guide_id_fkey` — 内存成功、PG 未落或缺行 → `login_required` / `bookmark_target_not_found` 级联 |
| 时序 / 稳定性 | market-subsite studios / community media（原 flaky） | 随主因修复后本轮 **未**再红 |

### 修复清单（代码）

1. **`frontend/scripts/run-e2e-default.mjs`**：在 `alignPlaywrightProcessEnvFromRootDotenv` 之后，若未设 **`PLAYWRIGHT_PRESERVE_CHAIN_RPC_URL=1`** 且未设 **`PLAYWRIGHT_PRESERVE_ROOT_P3_CHAIN_OFF=1`**，则强制 **`P3_CHAIN_OFF=1`**（与 `start-api-for-playwright` 链下矩阵一致；Sepolia 仍走 `run-e2e-sepolia.mjs` + preserve）。
2. **`frontend/playwright.config.ts`**：`apiServer.env` 在 **fullStack** 且非 Sepolia 保留 RPC 时注入 **`P3_CHAIN_OFF: "1"`**；有 **`DATABASE_URL`** 且非 preserve 链上时注入 **`TRAVELTRUST_STRICT_AUTH_DB_WRITE` / `STRICT_GUIDE` / `STRICT_ORDER`**，避免 PG 双写静默失败级联。
3. **`frontend/e2e/epic-f-normal-release-real.spec.ts`**：mock-pay 断言消息改为带 **HTTP 状态码** 与体摘要（不误导读成仅 P3）。
4. **`frontend/scripts/e2e-align-env-from-root.mjs`**：头注释与 **`run-e2e-default`** 对拍。

### 重跑命令

```bash
# 定向（示例，已在本机执行通过）
export DATABASE_URL="$(python scripts/gates/read_dotenv_value.py .env DATABASE_URL)"
cd frontend && node ./scripts/run-e2e-default.mjs --project=chromium \
  e2e/epic-f-normal-release-real.spec.ts e2e/b466-browser-chain-off-pay-complete.spec.ts …

# 全矩阵
cd /path/to/TravelTrust && export DATABASE_URL="$(python scripts/gates/read_dotenv_value.py .env DATABASE_URL)"
bash scripts/gates/local-e2e-chromium-full-matrix.sh
```

### 重跑结果（全矩阵）

- **323 passed**, **10 skipped**, **0 failed**, ~38.6m  
- 日志：`/tmp/full-chromium-matrix-rerun.log`（本机 Git Bash `tee`）

### 是否达到全矩阵绿

**是（① 本地 · `chromium` 项目 333 条中可运行项全部通过；skipped 为预期跳过，非 fail）**。


---

## 2026-05-13 — ② / ③ staging 与 production 只读对拍（探针脚本落盘）

**阶次：** 本段为 **② staging / ③ production** 的 **只读 HTTP + 可选 JSON-RPC** 对拍 **工具与口径**；**本轮未收到** 真实 staging/prod base URL、RPC、合约清单、凭据、允许的只读 GET 清单，因此 **未对线上环境发起探测**，**无** `TT_PROBE_OUT` 落盘报告可附。

**探针脚本：** `scripts/ops/read_only_staging_prod_probe.py`  
**允许动作：** `GET /health`、`GET /meta`、`GET /meta/build`；`TT_PROBE_EXTRA_GET_PATHS` 中由运维 **自行确认只读** 的路径；`eth_chainId` 的 **HTTPS JSON-RPC POST**（仅当设置 `TT_STAGING_RPC_URL` 与 `TT_PRODUCTION_RPC_URL`）。  
**禁止：** 下单、支付、发消息、写 DB、写链、触发 webhook（脚本本身不包含 POST 业务体；**额外路径由操作者保证 GET 安全**）。

### 探针命令（模板）

```bash
cd /path/to/TravelTrust
export TT_STAGING_API_BASE="https://<staging-api-host>"
export TT_PRODUCTION_API_BASE="https://<prod-api-host>"
export TT_STAGING_RPC_URL="https://<staging-https-json-rpc>"
export TT_PRODUCTION_RPC_URL="https://<prod-https-json-rpc>"
# 逗号分隔；须事先核对为 GET 且只读
export TT_PROBE_EXTRA_GET_PATHS="/api/v1/governance/protocol-reference"
# 可选：仅对已确认只读的受保护 GET 使用
# export TT_PROBE_BEARER="<readonly-token>"
export TT_PROBE_OUT="evidence/93-batch-agent-full-verify-20260513/staging_prod_probe_<UTC_TS>.md"
python scripts/ops/read_only_staging_prod_probe.py
```

输出 Markdown：**Bucket** 列为 **一致 / 不一致 / 无法验证**（脚本表头为同名语义）；Stripe mode、webhook 摘要等 **本仓库 `GET /meta` 不暴露** 的项在表中显式标 **无法验证**，须走 **ops 面板或脱敏 runbook**，**禁止**把密钥写进证据库。

### 环境摘要（填表用，勿提交密钥）

| 项 | staging | production | 本轮 |
|----|---------|------------|------|
| API base | （由你方填） | （由你方填） | **未执行** |
| RPC（HTTPS） | （由你方填） | （由你方填） | **未执行** |
| Bearer 用于样本 GET | 可选 | 可选 | 未使用 |

### staging / prod diff

**无**（未跑探针）。

### 风险清单

- 在未核对 **额外 GET 路径** 前运行探针，可能误触 **非只读** 路由（操作者责任）。
- **仅凭 `/meta` 与 `/health`** 不能推出 **Stripe live/test**、**webhook 端点与签名配置** 与生产一致；缺证据即 **无法验证**。
- **CORS** 以单次无 `Origin` 的响应头为快照；真实浏览器跨域仍以浏览器网络面板为准。

### 是否可进入封口（②③）

**否（本轮）**：缺少真实 **② / ③** 探测输出与人工复核（含 PSP、WAF、webhook、组织 runbook）。**不得**据此宣称「已对齐生产行为」。

