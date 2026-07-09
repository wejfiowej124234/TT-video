# 企业对齐审计报告 · Phase ① 本地 ↔ Phase ② 测试网

**生成 UTC:** `2026-07-01T01:24:37Z`  
**证据目录:** `evidence/enterprise_alignment_audit/20260701T012102Z/`  
**分类 SSOT:** [TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md](../../docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)

---

## 执行摘要

| 维度 | Staging（②） | Local（①） | ①↔② 语义一致性 |
|------|-------------|-----------|----------------|
| **ABI** | ✅ PASS | ✅ PASS（仓库静态） | ✅ MUST_MATCH |
| **API Contract / /meta** | ✅ 环内 SSOT PASS | ⏸ 栈未启动 | ✅ 无 DRIFT 证据 |
| **前端 UI env↔API** | ✅ 14 PASS / 2 WARN | ✅ .env↔.env.local 对齐 | ✅ 各自环内 |
| **UI 路由（C1–E2）** | ✅ 21/21 业务走廊 | ⏸ 需起栈复验 | — |
| **测试账号 C1–C4/E2** | ✅ 5/5 登录 PASS | ⏸ 栈 DOWN · 静态 SSOT 一致 | ✅ 邮箱/密码一致 |
| **数据库 migration** | 运行时未 live 拉取 | 116 文件 | ⚠️ 本地起栈后对照 |

### 人工测试裁决

```text
TT_ENTERPRISE_ALIGNMENT_AUDIT: STAGING_READY_FOR_MANUAL_UAT
TT_LOCAL_MANUAL_UAT: BLOCKED_STACK_DOWN
TT_STAGING_DRIFT: NONE
TT_EXPECTED_DIFFERENCE: CONFIRMED
```

**你现在可以在测试网开始人工测试** — Staging API/ABI/账号/UI 已对齐，无 P0 Drift。  
**本地人工测试** — 须先 `start-api-with-seed.bat` 起栈，再复跑账号/路由探针。

---

## 1 · 分类说明（Expected Difference vs Drift）

以下 **不是** 问题，**不要修成一致**：

| 项目 | Local | Staging | 分类 |
|------|-------|---------|------|
| chain_id | 31337 | 11155111 | EXPECTED_DIFFERENCE |
| 合约地址 | Anvil | Sepolia | EXPECTED_DIFFERENCE |
| API/WEB host | 127.0.0.1 | *.fly.dev | EXPECTED_DIFFERENCE |
| Git SHA | HEAD `987bc26` | 运行 `f99958f` | EXPECTED_DIFFERENCE（LOCAL_AHEAD_UNDEPLOYED） |
| E1 TrustGate | 本地专用 | 401 | EXPECTED_DIFFERENCE |

以下 **必须一致**（仓库/账号/环内 SSOT）— 本次 **无 DRIFT**：

- ABI 字节一致 ✅  
- C1–C4/E2 邮箱 + 密码 `Test123!` ✅  
- Staging build.env ↔ `/meta` ✅  
- Local root `.env` ↔ `frontend/.env.local`（chain/合约键）✅  

---

## 2 · ABI

| 检查 | 结果 |
|------|------|
| `check-55-s13.sh` | **PASS** |
| contracts/abi ↔ frontend/dapp/abis | 7 协议字节一致 |
| CPNP ABI freeze | PASS |

---

## 3 · API（Staging）

| 检查 | 结果 |
|------|------|
| `/health` | 200 |
| CORS web→api | PASS |
| `/meta` Sepolia + 13 合约键 | PASS |
| Testnet signoff probes | **PASS** |
| P2HA 四角色 API | **PASS** |
| `TT_STAGING_SSOT_PARITY` | **PASS** |

**WARN（Non-blocking）：** Stripe test 模式无法仅从 `/meta` 确认 — 支付相关手测前建议 Owner 确认 `sk_test_*`。

---

## 4 · 前端 UI（Staging）

| 检查 | 结果 |
|------|------|
| `check-staging-web-alignment.sh` | 14 PASS / 2 WARN |
| C1–E2 清单 FE 路由 | **21/21 PASS** |
| E1 API 登录 | 401（**预期** · TrustGate 仅本地） |

### 测试账号 · Staging（密码 `Test123!`）

| ID | 邮箱 | API 登录 | 代表 UI 路由 |
|----|------|----------|-------------|
| C1 | multi-demo@test.com | ✅ | /me/identities · /governance · /market/acquisition |
| C2 | tourist@test.com | ✅ | / · /market · /community · /orders |
| C3 | guide@test.com | ✅ | /guide · /market?view=guides |
| C4 | merchant@test.com | ✅ | /provider · /me/identities/merchant/settings |
| E2 | provider-did-rank-demo@test.com | ✅ | /did-rank |

**入口：** https://tt-web-staging.fly.dev  
**API：** https://tt-api-staging.fly.dev

---

## 5 · Local（①）

| 检查 | 结果 |
|------|------|
| API `:8080` / FE `:3012` | **DOWN** |
| `frontend/.env.local` chain_id | 31337 ↔ root `.env` ✅ |
| `NEXT_PUBLIC_API_BASE_URL` | http://127.0.0.1:8080 |
| Anvil 合约地址 | 与 local env 自洽 ✅ |
| C1–E2 登录 | **未测**（栈 DOWN） |

**本地起栈后一键复验：**

```bash
powershell -File scripts/dev/verify-seed-test-accounts-login.ps1
API_BASE=http://127.0.0.1:8080 FRONTEND_BASE=http://127.0.0.1:3012   bash scripts/dev/probe-manual-uat-checklist-routes.sh
```

---

## 6 · 数据库

| 项 | 状态 |
|----|------|
| 本地 migration 文件 | **116** |
| Staging schema live 对照 | 需 admin/fly proxy（本次未阻断 Staging 手测） |
| 分类 | 无 **DRIFT** 证据 · 历史 resample 37/37 API PASS |

---

## 7 · Drift / Defect / Risk 清单

### DRIFT（须修复）— **0**

无 ABI/API/账号/环内 meta 失配。

### DEFECT — Open P0: **0** · P1: **0** · P2: **2**（预存 · 不阻断 Staging 手测）

### INFO / EXPECTED_DIFFERENCE — 已确认

- LOCAL_AHEAD_UNDEPLOYED（runtime_drift: **false**）
- chain_id / 部署地址 / host 差异
- E1 仅本地

---

## 8 · 人工测试纪律

1. **Staging 手测** — 只用 `tt-web-staging.fly.dev` + C1–C4/E2  
2. **Local 手测** — 先起栈 · 只用 `127.0.0.1` · 勿与 staging 混 session  
3. **同一仓库** — ABI/API Contract/账号 SSOT 已对齐 · 行为应一致（链上环境不同属设计）

---

## 9 · 证据索引

- `check-55-s13.log` · `staging-web-alignment.log` · `staging-ssot-parity.log`
- `staging-routes.log` · `testnet-probes.log` · `p2ha/p2ha-findings.json`
- `local-env-parity.json` · `alignment-audit/audit.json`
