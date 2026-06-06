# Phase ② · Admin ADM-U01 → ADM-U02（持久 Fly Staging）

**阶段口径：** ① 本地 → **② 持久 Staging（Fly HTTPS）** → ③ 生产。**禁止**用 tunnel（`*.loca.lt`）、`127.0.0.1` 或 ① 绿集冒充 **② 已绿**。

## Admin Phase ② 合法宣称闸（写死）

**仅当**持久 Fly/Staging 就绪后，**严格按下列顺序**执行编排，且出现 **`TT_PHASE2_ADMIN_STAGING: PASS`**，**才允许**将 Admin Phase ② 标为通过：

| 步 | 内容 | 子证据 |
|----|------|--------|
| 1 | U01 持久 RBAC 矩阵 | `TT_ADM_U01_EVIDENCE: PASS` · `adm-u01-report.json` → `release_gate: GO` |
| 2 | U02 Staging 2FA/审批链 | `TT_ADM_U02_STAGING_EVIDENCE: PASS` · `adm-u02-report.json` → `GO` |
| 3 | 合并 closure | `closure-report.json` → `release_gate: GO` · `mark_phase2_allowed: true` |
| 4 | 编排末行 | **`TT_PHASE2_ADMIN_STAGING: PASS`** |

**禁止：** 跳过 U01 直跑 U02；tunnel/① 绿；无 PASS 行即改 `ADMIN-L5-AUDIT-TASKS.md` 为 **② 已绿**。

标台账**前**机读复验：

```bash
bash scripts/gates/validate-phase2-admin-staging-closure.sh
# → TT_PHASE2_ADMIN_STAGING_VALIDATE: PASS
```

证据根目录：`evidence/GO_phase2_admin_staging_closure/latest/`（`STATUS.txt` · `closure-report.json` · `orchestrator-*.log`）。

## 何时可标 Phase ②

| 条件 | 说明 |
|------|------|
| Fly API + FE URL 就绪 | `STAGING_API_BASE` / `STAGING_FE_BASE` 为 HTTPS，非 localhost |
| 同一 Staging DB | `STAGING_DATABASE_URL` 与 API 部署一致，已 `sqlx migrate` |
| 顺序 | **U01 持久 RBAC** → **U02 2FA/审批** → **merge**（`record-phase2-admin-adm-u01-then-u02.sh` 内固定） |
| 全绿 | 上表四步 + `validate-phase2-admin-staging-closure.sh` PASS |
| 台账 | **仅**在 `TT_PHASE2_ADMIN_STAGING_VALIDATE: PASS` 后更新 [`ADMIN-L5-AUDIT-TASKS.md`](../../frontend/evidence/GO_local_admin_workspace_closure/ADMIN-L5-AUDIT-TASKS.md) |

## 一键（推荐）

```bash
export STAGING_API_BASE=https://<fly-api-host>
export STAGING_FE_BASE=https://<fly-fe-host>
export STAGING_DATABASE_URL=postgresql://<user>:<pass>@<host>:5432/<db>
export ADM_U01_REQUIRE_PERSISTENT_HOST=1
export ADM_U02_REQUIRE_PERSISTENT_HOST=1

# 可选：scripts/dev/.env.staging-onboarding.local（勿提交 loca.lt 当 Fly 真源）
bash scripts/dev/record-phase2-admin-adm-u01-then-u02.sh
```

**证据目录：**

- `evidence/GO_staging_admin_rbac_matrix/<adm_u01_run_id>/` — U01 `report.json` · `release_gate: GO`
- `evidence/GO_staging_admin_adm_u02/<adm_u02_run_id>/` — U02 `report.json` · `release_gate: GO`
- `evidence/GO_phase2_admin_staging_closure/<run_id>/` — 编排汇总

## 分项

### 1 · ADM-U01 only

见 [`ADM-U01-staging-rbac-matrix.md`](ADM-U01-staging-rbac-matrix.md)。持久闸：

```bash
export ADM_U01_REQUIRE_PERSISTENT_HOST=1
export ADM_U01_NO_LOCAL_FE_FALLBACK=1   # 编排脚本已设
bash scripts/dev/record-adm-u01-staging-evidence.sh
```

### 2 · ADM-U02 only（须 U01 已绿或同轮编排）

```bash
export ADM_U02_REQUIRE_PERSISTENT_HOST=1
bash scripts/dev/record-adm-u02-staging-evidence.sh
```

分项 smoke：`bash scripts/dev/smoke-admin-adm-u02-staging.sh`（末行 `TT_ADM_U02_STAGING: PASS`）。

## Staging API 前置

| 项 | 要求 |
|----|------|
| `SEED_TEST_ACCOUNTS` | Staging API 须 `1`（smoke 注册 + promote）或改用手动 token（U02 smoke 仍要 DB psql） |
| 迁移 | `admin_console_roles` · approvals · `admin_audit_logs` · TOTP 表 |
| ② ≠ ③ | 本闸 **非** Production GO / 真 PSP / 主网 |

## 与 tunnel 预演区分

`evidence/GO_staging_admin_rbac_matrix/run_adm_u01_close_20260603/` 为 **tunnel + 本机探针**（`deployment_kind: tunnel_ephemeral`），**不**等于持久 Fly **② 已绿**。Fly 就绪后须用本 runbook 重跑。

## 真源互指

- U01：[`registry/admin-rbac-staging-probes.v1.yaml`](../../registry/admin-rbac-staging-probes.v1.yaml)
- U02 ①：[`ADM-U02-admin-permissions-2fa-approval.md`](ADM-U02-admin-permissions-2fa-approval.md)
- 阶段闸：[`PHASE2-REPOSITORY-STATUS.md`](PHASE2-REPOSITORY-STATUS.md)
