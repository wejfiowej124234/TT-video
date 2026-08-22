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
| **2 · Admin/Auth** | Auth/Admin HTTP · STRICT_SESSION · login→me · OCS admin · RBAC | BA-01～BA-06 | **CLOSED** `POST_PARITY_FIX_QUEUE_BATCH2_ADMIN_AUTH_PASS_STOP` (`2026-08-22T09:17:58Z`) |
| **3 · UI/UX** | FIVE-MAIN 已冻结 · 仅数据链/门闸 | UX-01～UX-06 | **CLOSED** `POST_PARITY_FIX_QUEUE_BATCH3_UI_UX_PASS_STOP` (`2026-08-22T09:35:40Z`) |
| **4 · 功能缺陷** | M8-07 等 | M8-07 · FD-01～FD-05 | **CLOSED** `POST_PARITY_FIX_QUEUE_BATCH4_FUNCTIONAL_DEFECTS_PASS_STOP` (`2026-08-22T09:46:34Z`) |
| **5 · Assets/i18n** | M8-08 等 | M8-08 | **ACTIVE** |

---

## Batch 4 · 功能缺陷（CLOSED）

| ID | 检查项 | 修复/验证 |
|----|--------|-----------|
| **M8-07** | `/me/payments` · `/legal/*` GAP 与 Official AS-IS 对拍 | Official PRODUCT SSOT · staging 同码 |
| **FD-01** | GAP 路由 staging：`/me/payments` `/legal/privacy` `/legal/terms` `/legal` = 404 | HTTP no-redirect 探针 |
| **FD-02** | 规范路由 staging：`/privacy` `/terms` `/help` = 200 | HTTP 探针 |
| **FD-03** | Official live spot-check 与 frozen baseline 一致 | 只读探针 · 不改 Production |
| **FD-04** | 产品树无内部 `href` 指向 GAP 路径 | `app/` `components/` `lib/` 静态扫描 |
| **FD-05** | ① API auth 回归（可选本地） | `cargo test -p traveltrust-api auth_placeholder_strict_gate_tests` |

**Disposition：** M8-07 = `REGISTER_DEFECT_ALIGN_AFTER_PARITY_GATE` — Official 当前 AS-IS 为 GAP 404；canonical `/privacy` `/terms` 200；**未**新增页面/重定向（Production 不动 · FIVE-MAIN 未动）。

**Local：**

```bash
python scripts/gates/run-post-parity-fix-queue-batch4-functional-defects.py --web http://127.0.0.1:3000
```

**Staging（② only）：**

```bash
bash scripts/dev/official-first-staging-post-parity-batch4-functional-defects.sh
```

---

## Batch 3 · UI/UX（CLOSED）

| ID | 检查项 | 修复/验证 |
|----|--------|-----------|
| **UX-01** | FIVE-MAIN 五路由 HTTP 200 | staging web 探针 |
| **UX-02** | `release-identity` = Official OPS `3e356617` | pin 对拍 |
| **UX-03** | `tt-session-cookie-bootstrap.js` + chunk recovery 接线 | 五主 + `/auth/login` |
| **UX-04** | 首页 `<title>` 可见性 | capture 对拍 |
| **UX-05** | FIVE-MAIN antiregression vitest | `five-main-routes-ui-antiregression-gate.sh` |
| **UX-06** | landing/market data-link contracts | vitest 子集 |

**Local：**

```bash
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
python scripts/gates/run-post-parity-fix-queue-batch3-ui-ux.py --web http://127.0.0.1:3000
```

**Staging（② only）：**

```bash
bash scripts/dev/official-first-staging-post-parity-batch3-ui-ux.sh
```

---

## Batch 2 · Admin/Auth（CLOSED）

| ID | 检查项 | 修复/验证 |
|----|--------|-----------|
| **BA-01** | `/api/v1/me` unauth=401 · admin/capabilities 受 STRICT_SESSION 保护 | Official capture 对拍 |
| **BA-02** | `GET /admin` → 307 `/auth/login?returnUrl=%2Fadmin` · `/auth/login`/`register` 200 | 门闸脚本 no-redirect 探针 |
| **BA-03** | `STRICT_SESSION_GATE=1` 时 `X-User-Id`  alone 不得 bypass | `/meta` + orders 探针 |
| **BA-04** | registry test account `login→me`（含 `Idempotency-Key`） | `seed-test-accounts` + Bearer |
| **BA-05** | OCS super admin `login→capabilities` | `adm-10x4-…@traveltrust.test` |
| **BA-06** | ADM-U01 六角色 RBAC staging 矩阵 | `run-admin-rbac-staging-matrix.py` |

**Local：**

```bash
cargo test -p traveltrust-api auth_placeholder_strict_gate_tests
python scripts/gates/run-post-parity-fix-queue-batch2-admin-auth.py --api http://127.0.0.1:8080
```

**Staging（② only · 含 fly proxy DSN + seed）：**

```bash
bash scripts/dev/official-first-staging-post-parity-batch2-admin-auth.sh
```

---

## Batch 1 · CMS/OCS（CLOSED）

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
