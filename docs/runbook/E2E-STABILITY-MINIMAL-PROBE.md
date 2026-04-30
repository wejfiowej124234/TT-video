# E2E 稳定性专项（最小复现 · 三次本地 gate 失败对照）

**目的**：在全量 `run-production-gate-local.sh` 之前，用 **2 条** Playwright 用例验证 **API 环境变量、Postgres、`DATABASE_URL` 进 API 子进程、登录限流关闭、Next `:3012` 存活**。

**最小命令**（仓库根）：

```bash
bash scripts/gates/e2e-stability-probe.sh
```

**代码向修复**：`frontend/playwright.config.ts` 中 **`apiServer.env` 显式 `...process.env`**，与 `feServer` 对齐，降低 Windows 下 WebServer 拉起 `traveltrust-api` 时 **丢失 `DATABASE_URL`** 的概率（表现为直连 `http://127.0.0.1:8080/auth/login` 返回 **`database_required`**）。

---

## 1. 三次 `run-production-gate-local` 失败日志对照（Cursor 终端归档）

| 日志文件 | 首个 HTTP 429（API / WebServer） | 首个 Playwright `database_required` | 3012 失效前可见模式 |
|----------|-----------------------------------|-------------------------------------|---------------------|
| **749138** | 约 **04:02:08**，`/auth/login` **429**，`auth_login_rate_limited` / `per_email_rate_limited`（`guide@test.com`）；此前多轮 **200** 登录成功 | 本日志 **未** 作为首错出现；同轮后段另有 cookie/超时 | **235～238** 附近：`smoke-governance` / `smoke.spec` 连续 **ERR_ABORTED / 超时**；**238** **`/community`** 出现 **`ERR_CONNECTION_RESET`**，随后 **`ERR_CONNECTION_REFUSED`** 连片 |
| **612123** | **E2E 极早**（`[WebServer]` 数行内即 **`/auth/login` 429**），同为 per-email 限流 | 未在首屏摘录 | 与 749138 类似：中后期 **3012 refused** |
| **821776**（含 cargo test） | Playwright 侧首记：**`orders-b-domain-request.spec.ts`** **`tourist register HTTP 429`**（约 **[128/380]**） | **`93-matrix-path-f1-f4.spec.ts`** **`apiLogin` → `DATABASE_URL is not configured; durable writes are disabled`**（约 **[16/380]**，在 **`F1 登录页 → F2…F4 治理`** 用例） | 同轮后段大量 **3012 refused**；另见 **`gen-r002` Windows GBK** 线程异常（已在脚本侧改为 UTF-8 解码） |

---

## 2. 「Next dev 退出前最后 100 行」说明

三次日志里 **`[WebServer]`** 多为 **API 请求日志**（`path=/meta`、`/auth/login` 等），**未捕获**独立的 **`next dev` stderr**（无 `Next.js`、`npm ERR!`、`ELIFECYCLE` 等关键字）。

可操作的**间接证据**（以 **749138** 为例，约行 **4585～4814**）：

- 多条 **`page.goto` … `ERR_ABORTED` / 超时**（治理与首页）；
- 随后 **`http://localhost:3012/community` → `ERR_CONNECTION_RESET`**；
- 再后 **`ERR_CONNECTION_REFUSED`** 连发 → **监听进程已不在**。

若需**精确**崩溃栈，请在本地复现时把 Playwright **WebServer** 输出重定向到文件，或对 **`npm run dev`** 单独开终端保留完整控制台。

---

## 3. 探针通过标准

1. **`e2e/smoke.spec.ts`「首页可访问」**：Next **:3012** 可响应。
2. **`93-matrix-path-f1-f4`「F1 登录页 → … F4 治理」**：**8080** 上 **`/auth/login` 成功**且 **`database_required` 不出现**。

然后可恢复：

```bash
bash scripts/gates/run-production-gate-local.sh --base main
```

---

## 4. 可选加深（仍非全量）

- **429 专项**：在探针 env 中确认 **`API_RATE_LIMIT_PER_MINUTE=0`**（脚本默认已设）。
- **B 域注册**：`e2e/orders-b-domain-request.spec.ts` 首条曾在 **821776** 上 **429**，限流关闭后单独 `--grep "F-008"` 复跑。
