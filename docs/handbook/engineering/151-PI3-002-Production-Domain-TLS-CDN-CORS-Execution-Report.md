# 151 · PI3-002 Production Domain, TLS, CDN & CORS Execution Report

> **Sprint**：PI3-002 · **Production Domain / TLS / CDN / CORS Execution**（121 审计 → 执行程序）  
> **Scope SSOT**：[148 PI3-005](./148-PI3-005-Production-Scope-Decision-Report.md) · **`PRODUCTION_SCOPE_SEPOLIA`** · `CHAIN_ID=11155111`  
> **冻结基准**：[145 Operations Platform Freeze](./145-Operations-Platform-Release-Freeze-Report.md) · [146 C-S6](./146-C-S6-Catalog-Consumer-OptIn-Cutover-Report.md) · [150 E2E-A-01](./150-E2E-A-01-ColdStart-Campaign-Consumer-Report.md)  
> **审计基线**：[121 PI3-002 Readiness](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md)  
> **日期**：2026-06-08  
> **纪律**：**禁止新增产品功能代码** · **不修改生产 Fly/DNS/secrets**（Owner 动作）  
> **一键 gate**：`bash scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh`  
> **结论**：**`PI3-002 HOLD`** — 执行程序与 Sepolia prod 环境矩阵已交付；**专用 prod 域名 / TLS / CORS 锁定尚未 Owner 闭合**

---

## 1. Executive verdict

| 维度 | 判定 |
|------|------|
| **151 Execution Sprint 交付** | **COMPLETE** — 对齐脚本 · Cookie/CSP 验 · Sepolia env 矩阵 · gate |
| **148 Sepolia scope 对拍** | **LOCKED** — prod 模板 `CHAIN_ID=11155111` · 145/146 flag 冻结 |
| **Staging 边缘（代理）** | **PASS** — 不得回归 · alignment gate green |
| **Production 专用域名** | **NOT_CONFIGURED** — 无 Owner 登记 `app.*` / `api.*` |
| **Production Fly cutover** | **NOT_EXECUTED** — `tt-api-prod` / `tt-web-prod` 仍为模板 |
| **TLS 证书（prod 品牌域）** | **NOT_APPLIED** — 待 `fly certs add` |
| **CORS 生产锁定** | **NOT_APPLIED** — `CORS_ORIGINS` 仍为 example 占位 |
| **NEXT_PUBLIC_* / API_BASE 对拍** | **TEMPLATE_READY** — `build.env.sepolia-prod.example` · live 未验 |
| **Cookie / CSP / 安全头** | **STATIC_PASS** — Next `X-Frame-Options` · API `security_headers_layer` · CSP defer |
| **CDN / HLS** | **NOT_STARTED** — P1 defer（PI3-007）· 不挡 PI3-002 P0 |
| **145/146/150 冻结** | **UNCHANGED** — 无产品功能 diff |

**151 正式裁定：** **`PI3-002 HOLD`**

**升格 `PI3-002 GO` 条件（121 §10 + 本 Sprint §6）：** Owner 完成域名/DNS/Fly certs → 填实 `PROD_*` 与 build.env → 部署 prod apps → `patch-tt-api-prod-cors.sh` → alignment + infra audit 无 INF-P0-004 → execution gate 输出 **`PI3-002_GO`**。

---

## 2. Sprint 范围与纪律

| 项 | 说明 |
|----|------|
| **执行** | 生产域名绑定程序 · Fly prod 配置模板 · TLS/CORS 验收集 · env 对拍 · 矩阵更新 |
| **未执行** | DNS 注册 · `fly certs add` · Fly secrets 写入 · prod 镜像 cutover |
| **禁止** | 新产品功能 · Catalog S6+ 默认开启 · Growth/GOV · Admin CRUD 扩展 |
| **148 约束** | Sepolia-only prod scope · Mainnet **NOT_SELECTED** |

---

## 3. 交付物清单

### 3.1 脚本与 gate

| 资产 | 路径 | 用途 |
|------|------|------|
| Prod alignment | `scripts/dev/check-production-web-alignment.sh` | TLS · CORS · `/meta` chain_id · build.env 对拍 |
| Cookie/CSP | `scripts/dev/verify-production-cookie-csp-headers.sh` | 静态 SSOT + 可选 live 探针 |
| Execution gate | `scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh` | 151 SSOT · staging 回归 + prod 裁定 |
| Gate wrapper | `scripts/gates/pi3-002-production-domain-tls-cdn-cors-execution-gate.sh` | CI/local 入口 |
| Readiness（121） | `scripts/check-pi3-002-production-domain-cdn-cors-readiness.sh` | 只读审计 · 保留 |

### 3.2 环境与矩阵

| 资产 | 路径 |
|------|------|
| Sepolia prod build template | `deploy/fly/tt-web-prod/build.env.sepolia-prod.example` |
| Prod env 矩阵 | `docs/runbook/PRODUCTION-ENV-MATRIX-SEPOLIA-SCOPE.md` |
| API CORS patch | `scripts/dev/patch-tt-api-prod-cors.sh`（121 既有） |
| Web deploy | `scripts/dev/deploy-tt-web-production.sh`（121 既有） |

### 3.3 npm gate

```bash
cd frontend && npm run gate:pi3-002-production-domain-tls-cdn-cors-execution
```

---

## 4. 环境对拍矩阵（148 Sepolia scope）

详见 [PRODUCTION-ENV-MATRIX-SEPOLIA-SCOPE.md](../../runbook/PRODUCTION-ENV-MATRIX-SEPOLIA-SCOPE.md)。

| 平面 | 变量 | Production target |
|------|------|-------------------|
| Web | `NEXT_PUBLIC_SITE_URL` | `https://app.<brand-domain>` |
| Web | `NEXT_PUBLIC_API_BASE_URL` | `https://api.<brand-domain>` |
| Web | `API_REWRITE_TARGET` | 同 API base |
| Web | `NEXT_PUBLIC_CHAIN_ID` | **11155111** |
| API | `PUBLIC_API_BASE_URL` | `https://api.<brand-domain>` |
| API | `CORS_ORIGINS` | **仅** prod FE origin |
| 冻结 | `NEXT_PUBLIC_CATALOG_API_ENABLED` | **0** |
| 冻结 | `CATALOG_SERVER_GEO_VALIDATION` | **0** |

---

## 5. Cookie / CSP / 安全头验证

| 检查 | 结果 | 证据 |
|------|------|------|
| Next `X-Frame-Options` | **PASS** | `frontend/next.config.js` headers |
| API `security_headers_layer` | **PASS** | `crates/api/src/middleware/auth_pause_metrics/mod.rs` |
| Session cookie `traveltrust_user_id` | **WARN→PASS** | FE middleware/lib 引用存在 |
| CSP on Next | **DEFER** | 121 R-CSP-01 · 不挡 PI3-002 P0 |
| Live Set-Cookie / HSTS | **N/A** | `PROD_*` 未配置 |

---

## 6. Owner 闭合序（121 §10 · 151 对拍）

| 步 | 动作 | 验证 |
|----|------|------|
| 1 | 注册品牌域 · DNS → Fly | Registrar + `fly certs show` |
| 2 | 确认 / 创建 `tt-api-prod` · `tt-web-prod` | `fly apps list` |
| 3 | `fly certs add` app + api hosts | TLS verify = 0 |
| 4 | `scripts/dev/.env.production.local` | 自 `.env.production.example` |
| 5 | `deploy/fly/tt-web-prod/build.env.local` | 自 `build.env.sepolia-prod.example` |
| 6 | API deploy + secrets | `phase3-production-fly-deploy-and-sync.sh` |
| 7 | **锁定 CORS** | `PROD_WEB_BASE=… patch-tt-api-prod-cors.sh` |
| 8 | Web deploy | `deploy-tt-web-production.sh` |
| 9 | Prod 对拍 | `check-production-web-alignment.sh` |
| 10 | Cookie/CSP live | `verify-production-cookie-csp-headers.sh` |
| 11 | Infra audit | `run-production-infrastructure-audit.sh` — 无 INF-P0-004 |
| 12 | **Execution gate → GO** | `check-pi3-002-production-domain-tls-cdn-cors-execution.sh` |

---

## 7. Gate 探针摘要（2026-06-08）

| 探针 | 结果 |
|------|------|
| Execution artifacts | **PASS** |
| Staging alignment | **PASS**（`check-staging-web-alignment.sh`） |
| Cookie/CSP static | **PASS** |
| Sepolia env matrix markers | **PASS** |
| Prod domain configured | **FAIL** — `PROD_*` unset / placeholder |
| Prod TLS + `/health` | **N/A** |
| Prod CORS preflight | **N/A** |
| Prod build.env 对拍 | **SKIPPED** |
| CDN HLS | **NOT_STARTED** |

**Gate 输出：** `TT_PI3_002_DOMAIN_TLS_CDN_CORS_EXECUTION: PI3-002_HOLD`  
**Evidence：** `evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-002-exec-20260608T010410Z`  
**Staging：** PASS=14 FAIL=0 WARN=2 · **Cookie/CSP static：** PASS=4 FAIL=0 WARN=2

---

## 8. GO / HOLD 判定表

| 条件 | 状态 | 负责 |
|------|------|------|
| 151 执行程序交付 | **PASS** | Engineering |
| Staging TLS + CORS + meta | **PASS** | 维持 |
| 148 Sepolia scope 矩阵 | **PASS** | 148 + 151 |
| Prod `app.*` / `api.*` DNS→Fly | **FAIL** | Owner |
| Prod TLS + API `/health` 200 | **FAIL** | Owner |
| Prod `CORS_ORIGINS` 仅 prod FE | **FAIL** | Owner |
| `NEXT_PUBLIC_*` ↔ `PROD_*` live 对拍 | **FAIL** | Owner |
| 145/146 prod flag = 0 | **TEMPLATE_PASS** | 冻结 |
| CDN HLS | **DEFER P1** | PI3-007 |
| 本 Sprint 产品功能 diff | **NONE** | 纪律满足 |

**最终结论：`PI3-002 HOLD`**

---

## 9. 与 Phase ③ / Production GO 关系

| Gate | 关系 |
|------|------|
| `PHASE3_ENTRY_GO` | **不** 等同 PI3-002 GO |
| `PRODUCTION_SCOPE_SEPOLIA` | **已决**（148）· infra 路径明确 |
| `PRODUCTION_GO` | **仍为 NO-GO** — PI3-001/003/004/006 并联 |
| `OPERATIONS_E2E_ACCEPTANCE_GO` | **独立** — 150 已 GO · 不解除 PI3-002 |

---

## 10. 证据与复跑

```bash
# 151 Execution（本报告 SSOT）
bash scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh

# Owner 填实后
PROD_WEB_BASE=https://app.<domain> PROD_API_BASE=https://api.<domain> \
  bash scripts/dev/check-production-web-alignment.sh

PROD_WEB_BASE=… PROD_API_BASE=… \
  bash scripts/dev/verify-production-cookie-csp-headers.sh

PROD_API_BASE=… PROD_WEB_BASE=… \
  bash scripts/dev/run-production-infrastructure-audit.sh

# 121 只读审计（保留）
bash scripts/check-pi3-002-production-domain-cdn-cors-readiness.sh
```

---

## 11. 交叉引用

| 文档 | 关系 |
|------|------|
| [121 PI3-002 Audit](./121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md) | 审计基线 · §10 Owner 序 |
| [148 PI3-005 Scope](./148-PI3-005-Production-Scope-Decision-Report.md) | Sepolia prod scope |
| [147 PI3 Closure](./147-PI3-Closure-Program-Audit-Report.md) | PI3-002 仍为 P0 blocker |
| [PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX §4](../../runbook/PHASE3-ENTRY-PRODUCTION-READINESS-MATRIX.md) | 矩阵已登记 execution 状态 |
| [PRODUCTION-ENV-MATRIX-SEPOLIA-SCOPE](../../runbook/PRODUCTION-ENV-MATRIX-SEPOLIA-SCOPE.md) | env 对拍 SSOT |

---

**维护者：** PI3-002 Execution Sprint · 2026-06-08  
**下一动作：** Owner §6 步 1–12 → 复跑 execution gate → 并联 PI3-001 / PI3-003
