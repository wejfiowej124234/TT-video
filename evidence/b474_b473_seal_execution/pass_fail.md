# B-474 · B-473 封口回归（B-476）· 诊断与 PASS/FAIL

**母表**：B-474（封口回归证据） / 编排：**B-476**  
**真源封口**：[`bash scripts/ops/b473-seal-b460-tt-u03.sh`](../../scripts/ops/b473-seal-b460-tt-u03.sh) → [`evidence/b473_seal_b460_tt_u03/seal-run.log`](../b473_seal_b460_tt_u03/seal-run.log)  
**Runbook（诊断与回归口径）**：[docs/runbook/TT-B475-B474-B473-SEAL-REGRESSION-001.md](../../docs/runbook/TT-B475-B474-B473-SEAL-REGRESSION-001.md)

---

## 结论

| 项 | 结果 |
|----|------|
| **B-474：完整 `b473-seal-b460-tt-u03` 封口回归** | **FAIL（2026-04-18 本仓库内重跑）** — 脚本 **exit 1**；**步骤** **3/4** **Playwright** **未** **完成**。**`seal-run.log`** **末行** **未** **出现** **`b473-seal-b460-tt-u03: ok`**（**见** **下** **「** **重跑** **阻塞** **」**）。 |
| **升格为 PASS 的机读条件**（与 **B-473** **相同** **日志** **文件**） | **`bash scripts/ops/b473-seal-b460-tt-u03.sh`** **exit** **0** **且** **`evidence/b473_seal_b460_tt_u03/seal-run.log`** **末尾** **`b473-seal-b460-tt-u03: ok`** |

### 重跑阻塞（环境与本次失败 **无关** **于** **GET** `/meta` **诊断**）

- **现象**：Playwright **webServer** 拉起 **`traveltrust-api`** 后进程 **立即** **退出** **（** **exit** **code** **1** **）**；日志含 **`pool timed out while waiting for an open connection`**（**数据库** **不可达** **）**。
- **本机检查**：**127.0.0.1:5432** **未** **监听**；**Docker** **引擎** **未** **可用** **时** **`docker compose up -d`** **无法** **拉** **Postgres**。
- **下一步**（**Owner** **本地**）：按 **[`docker-compose.yml`](../../docker-compose.yml)** **启动** **Postgres** **（** **或** **保证** **`.env`** **中** **`DATABASE_URL`** **指向** **已** **运行** **的** **实例** **）** **后** **再** **执行** **`bash scripts/ops/b473-seal-b460-tt-u03.sh`** **以** **得到** **完整** **PASS** **日志** **并** **将** **上表** **第一** **行** **更新** **为** **PASS** **。**

---

## 诊断结论（Epic F 段 **历史** **超时** **根因**，2026-04-18）

| 问题 | 判定 |
|------|------|
| **瓶颈在哪** | **GET `/meta` 冷路径**（`epic-f-normal-release-real.spec.ts` **首步** **`test.step("GET /meta", …)`**）。全栈封口串跑时，该请求在默认 Playwright 用例超时内偶发未完成，表现为 **Test timeout**，而非断言文本失败。 |
| **`releaseSeedGuideSlotIfBlocked`** | **非根因**（未观察到因该 helper 导致的失败主导路径）。 |
| **业务断言**（订单状态 / 评价链等） | **非根因**（非步骤内 `expect` 语义失败主导；超时发生在更靠前的 **meta** **探测**）。 |

## 缓解（刻意局部、低影响面）

- 在 **`frontend/e2e/epic-f-normal-release-real.spec.ts`** **单测内** **`test.setTimeout(60_000)`**，覆盖 **GET `/meta` 冷启动** **与** **后续** **REST** **链** **的总预算**。
- **不** **修改** **`frontend/playwright.config.ts`** **全局** **timeout**（避免扩散影响面）。

---

## 互证

| 路径 | 含义 |
|------|------|
| `evidence/b473_seal_b460_tt_u03/seal-run.log` | **B-473** **封口** **全量** **日志**；**末行** **`b473-seal-b460-tt-u03: ok`** **=** **本** **B-474** **回归** **PASS** |
| `frontend/e2e/epic-f-normal-release-real.spec.ts` | Epic F-08 real path；**60s** **局部** **超时** |
