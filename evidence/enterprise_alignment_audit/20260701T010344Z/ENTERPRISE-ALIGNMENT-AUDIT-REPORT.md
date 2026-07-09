# 企业对齐审计报告 · Phase ① 本地 vs Phase ② 测试网

**生成 UTC:** `2026-07-01T01:12:08Z`  
**证据根目录:** `evidence/enterprise_alignment_audit/20260701T010344Z/`  
**审计范围:** API · ABI · 数据库 · 测试账号 · 前端 UI · ①↔② 一致性  
**边界:** 本报告 **不** 等于 Production GO · 仅支撑人工测试前对齐确认

---

## 执行摘要

| 维度 | Phase ② Staging | Phase ① Local | ①↔② 一致性 |
|------|-----------------|---------------|------------|
| **ABI** | ✅ 仓库内 contracts↔frontend 字节一致 | ✅ 同左（静态） | ✅ 同仓库 SSOT |
| **API /meta·合约** | ✅ SSOT parity PASS | ⏸ 本地 API 未启动 | ⚠️ 链/地址 **按设计不同** |
| **前端 env↔API** | ✅ build.env ↔ /meta 全对齐 | ✅ .env ↔ .env.local 对齐 | ⚠️ chain_id 31337 vs 11155111 |
| **测试账号 C1–C4/E2** | ✅ 5/5 登录 + 21/21 FE 路由 | ⏸ 本地未启动 | ✅ 邮箱/密码 SSOT 一致 |
| **UI 路由可达** | ✅ C1–E2 走廊 PASS | ⏸ 需先起栈 | ✅ staging 可开测 |
| **数据库迁移** | ⚠️ 未拉 live migration 列表 | 116 本地 migration 文件 | ⚠️ 需本地起栈后对照 |

### 人工测试建议

- **测 Staging（推荐）：** 直接用 `https://tt-web-staging.fly.dev` + 账号 C1–C4/E2 · 密码 `Test123!` → **可开始，无需先修对齐**
- **测 Local：** 先执行 `start-api-with-seed.bat`（或等价栈）→ 再跑 `verify-seed-test-accounts-login.ps1` + `probe-manual-uat-checklist-routes.sh`
- **勿混用：** 本地 `.env.local` 指向 Anvil `31337` · staging 为 Sepolia `11155111` — 同一浏览器 session 不要混切

---

## 1 · ABI 对齐

| 检查 | 结果 | 证据 |
|------|------|------|
| `check-55-s13.sh` | **PASS** | `evidence\enterprise_alignment_audit\20260701T010344Z/check-55-s13.log` |
| Escrow + 6 协议 ABI 字节一致 | PASS | contracts/abi ↔ frontend/dapp/abis |
| CPNP ABI freeze manifest | PASS | Gate-2.4 |

**结论:** ABI 层 **无冲突** · 发版前仍须人工确认部署合约版本与 ABI 一致（55-S13 提示项）。

---

## 2 · API 对齐（Staging）

| 检查 | 结果 |
|------|------|
| `/health` | 200 |
| CORS（web→api） | PASS |
| `/meta` chain_id | 11155111 Sepolia |
| 核心合约 trio + gov/stake | PASS |
| Testnet signoff probes T-ENV/T-CHAIN/T-ID | **PASS** |
| 四角色 P2HA API 探针 | **PASS**（0 P0） |

**Staging API SHA:** `f99958fa88294ccc624e2bd93ad39d85758784a9`  
**Repo HEAD:** `987bc260cd4c4d409c317ddbf3c70d4c3d212a70` → **LOCAL_AHEAD_UNDEPLOYED**（非 runtime drift）

---

## 3 · 前端 UI 对齐（Staging）

| 检查 | 结果 |
|------|------|
| `check-staging-web-alignment.sh` | **PASS** (14 PASS / 2 WARN) |
| `verify-staging-ssot-parity.sh` | **PASS** |
| `verify-staging-per-final.sh` | **PASS** |
| C1–E2 清单路由探针 | **21/22 PASS** |

### C1–E2 测试账号（Staging · 密码 `Test123!`）

| ID | 邮箱 | API 登录 | 关键 FE 路由 |
|----|------|----------|--------------|
| C1 | multi-demo@test.com | ✅ | /me/identities · /governance · /market/acquisition |
| C2 | tourist@test.com | ✅ | / · /market · /community · /orders · /admin |
| C3 | guide@test.com | ✅ | /guide · /market?view=guides |
| C4 | merchant@test.com | ✅ | /provider · /me/identities/merchant/settings |
| E2 | provider-did-rank-demo@test.com | ✅ | /did-rank |
| E1 | tg_guide_main@trustgate-e2e.local | ❌ 401 | **仅本地 TrustGate** · staging 不测 |

**WARN:** Stripe test 模式无法从 `/meta` 单独确认 — 支付相关手测前建议 Owner 确认 `sk_test_*` 已配置。

---

## 4 · 数据库

| 项 | 状态 |
|----|------|
| 本地 migration 文件 | 116 个（最新含 `20260613120000_guide_exit_requests.sql`） |
| Staging live migration 列表 | 本次未授权 admin 拉取 · 历史 resample 37/37 API 探针 PASS |
| 一致性判定 | Staging **运行时** 与已部署 SHA 一致 · 本地需起栈后 `verify-root-env-vs-meta` |

---

## 5 · Phase ① vs Phase ② 一致性矩阵

| 字段 | Phase ① Local | Phase ② Staging | 是否应对齐 |
|------|---------------|-----------------|------------|
| chain_id | 31337 (Anvil) | 11155111 (Sepolia) | **否** · 环境设计 |
| API_BASE | http://127.0.0.1:8080 | https://tt-api-staging.fly.dev | **否** |
| 合约地址 | Anvil 部署 | Sepolia 部署 | **否** · 各自 /meta SSOT |
| ABI 文件（仓库） | 同 HEAD | 同 HEAD | **是** ✅ |
| C1–C4/E2 邮箱密码 | Test123! | Test123! | **是** ✅ |
| FE NEXT_PUBLIC_* | 对齐 local .env | 对齐 staging /meta | **各自环内** ✅ |
| Git SHA 运行时 | N/A（未启动） | f99958fa | HEAD 领先 · S5 部署前预期 |

**runtime_drift:** `false`（staging 非祖先漂移 · 仅 local ahead undeployed）

---

## 6 · 发现项（人工测试前须知）

### 🟢 不阻塞 Staging 手测

1. HEAD 领先 staging SHA — 本地新提交尚未 S5 部署
2. Deep Gate 未在当前 HEAD 复跑 PASS — staging 已部署 SHA 仍绿
3. 07 文档版本三元组不一致（1.0.842 vs 1.0.858）— 文档 SSOT · 不影响 staging 运行时
4. Phase ③ WIP 文件在 worktree — 与 ①② 手测隔离

### 🟡 手测时注意

1. **Stripe WARN** — 支付流手测前确认 test key
2. **E1 TrustGate** — 仅本地 · staging 用 C1–C4/E2
3. **本地栈当前 DOWN** — 测 local 必须先起 API+FE

### 🔴 阻塞项

**Staging 人工测试：无 P0 对齐 BLOCKER**  
**Local 人工测试：需先启动本地栈（当前 API/FE 均不可达）**

---

## 7 · 证据索引

| 文件 | 说明 |
|------|------|
| `check-55-s13.log` | ABI |
| `check-staging-web-alignment.log` | FE/CORS/meta |
| `verify-staging-ssot-parity.log` | build.env ↔ meta |
| `probe-testnet-signoff.log` | T-ENV/T-CHAIN |
| `p2ha/p2ha-findings.json` | 四角色 API |
| `staging-checklist-probes.jsonl` | C1–E2 路由 |
| `alignment-audit/audit.json` | HEAD vs staging SHA |
| 历史 resample | `evidence/manual-uat/sessions/staging-business-resample-20260701T003201Z/` |

---

## 8 · 机读裁决

```text
TT_ENTERPRISE_ALIGNMENT_AUDIT: STAGING_READY
TT_LOCAL_STACK: NOT_RUNNING
TT_STAGING_SSOT_PARITY: PASS
TT_STAGING_ROUTE_PROBE_C1E2: PASS (E1 excluded)
TT_ABI_ALIGNMENT: PASS
TT_PHASE1_PHASE2_RUNTIME_DRIFT: NONE
non_blocking_gaps: LOCAL_AHEAD_UNDEPLOYED, DEEP_GATE_STALE_AT_HEAD, DOC_07_VERSION_TRIPLE
```

**签字边界:** 本报告支撑 **② Staging 人工测试** · ③ Production GO 须独立 gate。
