# ADM-U01 · Phase ② Admin Console Personas · RBAC Staging 矩阵

**身份体系：** **Admin Console Personas** 与 **Business Personas** **独立** — 矩阵 [§10](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-admin-console-personas) · **唯一身份来源** [§0.1](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-single-source-of-identity) · **Admin 最高原则** [§10.0](TT-LOCAL-TEST-ACCOUNTS-MATRIX.md#tt-admin-rbac-supreme-principle)。

> **Admin 最高原则（永久 · 矩阵 §10.0）：** Admin RBAC 验收对象是 **Permission Matrix（角色 × 权限 × 资源）**，不是固定账号集合。新增控制台角色/模块/审批权限 → 更新 RBAC Matrix + ADM-U01/U02 + 跑矩阵 — **无需** `xxx@test.com`。

**ADM-U01 证据：** 历史 PASS 为 **② 流程旁证**；宣称**当前版本**矩阵已验须**复跑**本脚本并留存新 `report.json`（见矩阵 §10.5）。

**当前 HEAD 证据（2026-07-01 · persistent_host）：**

| 项 | 值 |
|----|-----|
| **run_id** | `run_20260701T092450Z` |
| **latest** | `evidence/GO_staging_admin_rbac_matrix/latest/` |
| **release_gate** | **GO** |
| **API 矩阵** | **102/102** · `deployment_kind: persistent_host` |
| **Playwright Shell** | **54/54** · 六角色 × 九 Shell 组 · `playwright-shell-matrix.json` |
| **复跑命令** | `ADM_U01_STRICT=1 ADM_U01_REQUIRE_PERSISTENT_HOST=1 STAGING_FE_BASE=https://tt-web-staging.fly.dev bash scripts/dev/record-adm-u01-staging-evidence.sh` |
| **Registry** | [`registry/admin-platform-production-readiness.v1.yaml`](../../registry/admin-platform-production-readiness.v1.yaml) |

**阶段口径：** **② 测试网 / 独立 Staging** → **③ 生产**（禁止用 **①** `127.0.0.1:8080` 或 `smoke-admin-rbac-matrix-local.sh` 冒充本闸 **GO**；禁止用 C2 `tourist@test.com` SuperAdmin 捷径冒充六角色 GO）。

**目标：** SuperAdmin、Ops、CS、Risk、Finance、Auditor 在 **六大 Shell 域**（工作台 / 入驻 / 经营 / 社区 / 资金 / 治理 / 更多）及 **核心写操作**（审批、入驻、争议、资金、配置）上 **deny/pass** 与机读证据一致。

**SSOT 探针表：** [`registry/admin-rbac-staging-probes.v1.yaml`](../../registry/admin-rbac-staging-probes.v1.yaml)  
**权限真源：** [`crates/api/src/routes/admin/admin_rbac.rs`](../../crates/api/src/routes/admin/admin_rbac.rs)

---

## 0 · 前置（G-1 / G-2）

| # | 条件 |
|---|------|
| G-2 | Staging API **HTTPS** 可达，`sqlx migrate` 含 `admin_console_roles` |
| G-1 | Staging DB 与生产密钥 **零混用** |
| — | **`ADM_U01_STRICT=1`** 时 `STAGING_API_BASE` **不得** 为 localhost |

---

## 1 · 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `STAGING_API_BASE` | 是 | 例 `https://api.staging.traveltrust.example` |
| `STAGING_FE_BASE` | Playwright 时 | 例 `https://admin.staging.traveltrust.example` |
| `STAGING_DATABASE_URL` | 二选一 | 自动注册六账号并写入 `admin_console_roles` |
| `TRAVELTRUST_ADMIN_TOKEN_SUPER` … `_AUDITOR` | 二选一 | 预置六角色 Bearer（与 DB console_role 一致） |
| `ADM_U01_STRICT` | 推荐 `1` | 缺 staging → **FAIL**（非 SKIP） |
| `ADM_U01_REQUIRE_PERSISTENT_HOST` | Fly 收口 `1` | 禁止 `*.loca.lt` / localhost；探针默认走 `STAGING_API_BASE`；禁止本地 FE fallback |
| `ADM_U01_EVIDENCE_DIR` | 可选 | 默认 `evidence/GO_staging_admin_rbac_matrix/latest` |

---

## 2 · 一键证据（推荐）

```bash
export STAGING_API_BASE=https://your-staging-api.example
export STAGING_FE_BASE=https://your-staging-web.example
export STAGING_DATABASE_URL=postgresql://...
export ADM_U01_STRICT=1

bash scripts/dev/record-adm-u01-staging-evidence.sh
```

**Fly 持久 Staging（与 ADM-U02 同序）：** [`PHASE2-ADMIN-STAGING-ADM-U01-U02.md`](PHASE2-ADMIN-STAGING-ADM-U01-U02.md)

```bash
export ADM_U01_REQUIRE_PERSISTENT_HOST=1
export STAGING_API_BASE=https://<fly-api>
export STAGING_FE_BASE=https://<fly-fe>
bash scripts/dev/record-adm-u01-staging-evidence.sh
```

**出口：**

- `evidence/GO_staging_admin_rbac_matrix/<run_id>/matrix-api-results.json` — API deny/pass
- `evidence/GO_staging_admin_rbac_matrix/<run_id>/playwright-shell-matrix.json` — Shell 机读
- `evidence/GO_staging_admin_rbac_matrix/<run_id>/report.json` — `release_gate: GO`
- 末行 **`TT_ADM_U01_EVIDENCE: PASS`** · **`TT_ADMIN_RBAC_STAGING_MATRIX: OK`**

---

## 3 · 分项

### API 矩阵 only

```bash
export STAGING_API_BASE=...
export STAGING_DATABASE_URL=...   # 或六 token
export ADM_U01_STRICT=1
bash scripts/gates/smoke-admin-rbac-staging-matrix.sh
```

### Playwright Shell only

```bash
export ADM_U01_STAGING=1
export STAGING_FE_BASE=...
export PLAYWRIGHT_API_BASE_URL=$STAGING_API_BASE
export TRAVELTRUST_ADMIN_TOKEN_SUPER=...
# … OPS CS RISK FINANCE AUDITOR
export ADM_U01_EVIDENCE_DIR=evidence/GO_staging_admin_rbac_matrix/manual_pw

cd frontend && npx playwright test e2e/admin-rbac-staging-six-roles.spec.ts --project=chromium
```

---

## 4 · 合法宣称

| 可宣称 | 不可宣称 |
|--------|----------|
| **② ADM-U01 槽 PASS**（本证据目录 `release_gate=GO`） | **③ Production GO** |
| Staging 六角色 RBAC 矩阵已验 | ① 本地 `run-admin-l5-green.sh` = ② GO |
| | 全站 93 矩阵 Admin 深批（另跑 `93-matrix-admin-deep-batch`） |

---

## 5 · 与 ① 对照

| 脚本 | 阶段 |
|------|------|
| `scripts/dev/smoke-admin-rbac-matrix-local.sh` | **①** |
| `scripts/gates/smoke-admin-rbac-staging-matrix.sh` | **②** |

任务台账：[`frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-AUDIT-TASKS.md`](../../frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-AUDIT-TASKS.md)
