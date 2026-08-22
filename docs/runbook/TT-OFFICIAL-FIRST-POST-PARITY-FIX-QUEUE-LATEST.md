# Official-First · POST_PARITY_FIX_QUEUE（产品优化 · ② Staging 验证）

**STATUS:** `ACTIVE`  
**Baseline:** `PRODUCT_AND_DOCUMENTATION_RUNTIME_PARITY_PASS` **ISSUED** (`2026-08-22T07:50:56Z`)  
**Prior track:** [`TT-OFFICIAL-FIRST-CLEAN-REBUILD-CONVERGENCE-LATEST`](TT-OFFICIAL-FIRST-CLEAN-REBUILD-CONVERGENCE-LATEST.md) · Schema + Runtime parity **PASS**  
**`TT_PRODUCTION_GO`:** NO_GO · **禁止**直接改 Production  

Machine: [`POST_PARITY_FIX_QUEUE_20260822.json`](../../evidence/GO_official_product_reality_capture/POST_PARITY_FIX_QUEUE_20260822.json) · Registry: [`official-first-post-parity-fix-queue.v1.yaml`](../../registry/official-first-post-parity-fix-queue.v1.yaml)

---

## 原则（写死）

| # | 规则 |
|---|------|
| 1 | **基线** = Runtime Parity PASS；本队列只做 Parity 后产品优化，不重开考古/Production 漂移修 |
| 2 | **顺序：** CMS/OCS → Admin/Auth → UI/UX → 功能缺陷 → Assets/i18n |
| 3 | **每批：** Local 修复 → Staging 验证 → 非目标 **0-drift** 证据 |
| 4 | **禁止：** Production DDL/DML · Candidate Solidity 语义变更 · Mainnet/`TT_PRODUCTION_GO` 偷跑 |
| 5 | **Web3 正交：** Sepolia Reality → Audit #2 → Periphery Security Gate → Compiler/English → Exact-Match → Audit #3 → Owner Mainnet 授权 |

---

## 批次

| Batch | 范围 | Items | Gate |
|-------|------|-------|------|
| **1 · CMS/OCS** | 公告公开路由 · OCS 媒体可读 | M7-07 · M7-08 | **CLOSED** `POST_PARITY_FIX_QUEUE_BATCH1_CMS_OCS_PASS_STOP` (`2026-08-22T08:48:33Z`) |
| **2 · Admin/Auth** | （ACTIVE） | — | TBD |
| 3 · UI/UX | FIVE-MAIN 已冻结 · 仅数据链/门闸 | — | TBD |
| 4 · 功能缺陷 | M8-07 等 | M8-07 | TBD |
| 5 · Assets/i18n | M8-08 等 | M8-08 | TBD |

---

## Batch 1 · CMS/OCS（ACTIVE）

| ID | 缺陷 | 修复 |
|----|------|------|
| **M7-08** | `GET /api/v1/cms/public/announcements` 401（路径名 public 但 STRICT_SESSION） | 与 `/api/v1/public/announcements` 同源 handler + auth 白名单 |
| **M7-07** | OCS 社区媒体 URL 404（卷/对象未落盘） | `bootstrap-ocs-official-assets.cjs` + cold-start 本地/bootstrap |

**Local：**

```bash
cargo test -p traveltrust-api strict_on_cms_public_announcements_get_public_without_auth
node scripts/dev/bootstrap-ocs-official-assets.cjs  # OCS_ASSETS_LOCAL_ONLY=1
python scripts/gates/run-post-parity-fix-queue-batch1-cms-ocs.py --api http://127.0.0.1:8080
```

**Staging（API 部署含 M7-08 后）：**

```bash
API=https://tt-api-staging.fly.dev FLY_APP=tt-api-staging \
  node scripts/dev/bootstrap-ocs-official-assets.cjs
python scripts/gates/run-post-parity-fix-queue-batch1-cms-ocs.py --api https://tt-api-staging.fly.dev
```

---

## Web3（独立 · 不阻塞本队列）

```
Sepolia Reality → Audit #2 → Periphery Security Gate → Compiler/English
→ Exact-Match → Audit #3 → Owner Mainnet 授权
```

Candidate `b19b85810…` protected · Token Scanner closure **≠** skip ladder.

---

## Related

- [Clean Rebuild Convergence](TT-OFFICIAL-FIRST-CLEAN-REBUILD-CONVERGENCE-LATEST.md)  
- [M5–M9 Alignment Plan](TT-OFFICIAL-FIRST-M5-M9-ALIGNMENT-PLAN-LATEST.md)  
- [TTG Token Scanner Closure](TT-TTG-TOKEN-SCANNER-EVIDENCE-CLOSURE-LATEST.md)
