# B12 · Runtime Event Record（Closed · Non-blocking）

**Classification:** **Runtime Event (Non-blocking)** — **not** Business Finding · **not** Quality Finding  
**Status:** **CLOSED** — do not carry into subsequent batches  
**Recorded:** 2026-07-10

| Field | Value |
|-------|-------|
| **Event** | `P3_CHAIN_OFF=1` API restart exited with code **1** |
| **Cause** | B12 session rebuilt/restarted API; prior long-running process replaced |
| **Current state** | New API `GET /health` = **200** (no `P3_CHAIN_OFF=1` on active process) |
| **Impact on B12** | **None** — certification verdict unchanged |
| **Action** | **None** unless a later batch explicitly requires `P3_CHAIN_OFF=1` |

---

## Taxonomy（FPC 统一四类 · SSOT）

| 类型 | 是否影响 Batch | 示例 |
|------|----------------|------|
| **Business Finding** | ✅ 影响 | 功能错误 · 流程断裂 · 权限错误 |
| **Quality Finding** | ✅ 影响 | UX · 性能 · 安全 · 数据质量 |
| **Runtime Event** | ⚠️ 视影响而定 | API/Docker 重启 · 端口占用 · 进程替换 |
| **Infrastructure Event** | ⚠️ 通常不影响 | CI 故障 · 网络波动 · GitHub/SSH 超时 |

**本事件 = Runtime Event (Non-blocking)** → 不是产品 Bug。

---

## When `P3_CHAIN_OFF=1` is needed again

```bash
PORT=8080 SEED_TEST_ACCOUNTS=1 P3_CHAIN_OFF=1 cargo run -p traveltrust-api
node scripts/dev/check-fpc-runtime-preflight.cjs --expect-env P3_CHAIN_OFF=1
```

Then re-run mock-pay / chain-off gates and refresh evidence for **that** batch only.

---

**Related:** [`FPC-CERTIFICATION-GOVERNANCE-v1.md`](../../FPC-CERTIFICATION-GOVERNANCE-v1.md) §0.2 · `FPC-100-BATCH-B12-LATEST.json` (Overall PASS)
