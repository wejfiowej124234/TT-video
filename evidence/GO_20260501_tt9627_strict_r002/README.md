# Evidence · TT-9627 / TT-9626 — strict ISS-007 + segment 12 pack (2026-05-01)

**Owner:** solo iteration · **Commit recorded:** `e1ddff2` · **UTC:** 2026-05-01T11:08Z

**Scope:** **① 本地** 可复现闭环；**② 测试网（HTTPS 宿主）** 在本目录仅给出 **命令模板**（仓库内无托管测试网 URL 真值 —— 由部署环境注入 `BASE` 后再跑并另落证）。

---

## 1. Strict R-002 prereport chain（段 3 · DATABASE_URL + migrations）

**Prereq:** Docker Postgres 与本仓库 `docker-compose.yml` 一致（`traveltrust/traveltrust@127.0.0.1:5432/traveltrust`）。

**Commands（须 exit 0）：**

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export P3_CHAIN_OFF=1
export TRAVELTRUST_LOCAL_R002_EVIDENCE_DIR=evidence/GO_20260501_tt9627_strict_r002
bash scripts/gates/local-verify-r002-prereport-chain.sh
```

**Outputs:**

- `r002_iss007_prereport/report.json` — `release_gate=PARTIAL_GO`, `cases=43`, strict path asserts `NOT_RUN==0`
- `e2e_core_report.json` — `passed=true`

**机读复验：**

```bash
python scripts/validate-regression-report.py \
  evidence/GO_20260501_tt9627_strict_r002/r002_iss007_prereport/report.json \
  --fail-on-no-go --fail-on-case-not-run
bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh \
  evidence/GO_20260501_tt9627_strict_r002/r002_iss007_prereport/report.json
```

**阶次说明：** ISS-007 窄切片 **PARTIAL_GO** 为设计如此；勿单独 `--require-go` 冒充 staging 全矩阵 GO（`evidence/GO_local_r002_verify/README.md`、TT-9628）。

---

## 2. Narrow local report.json（段 3 辅助指针）

**Path:** `frontend/evidence/GO_20260426_local_final_truth/report.json`

```bash
python scripts/validate-regression-report.py frontend/evidence/GO_20260426_local_final_truth/report.json --fail-on-no-go
bash scripts/gates/vertical-slice-tt9627-segment3-r002-validate.sh frontend/evidence/GO_20260426_local_final_truth/report.json
```

---

## 3. tt-9627-testnet-segment12-smoke-pack.sh（段 1～2 编排）

**本轮执行（① 回环 + 显式放行）：** `TRAVELTRUST_ALLOW_LOCAL_BASE=1 BASE=http://127.0.0.1:8080` — **exit 0**。

**语义：** `127.0.0.1` 仅为 **①** 机读编排复验；**不等价于** **②** 测试网宿主已验收（见脚本头注释）。

**真 ②：** `BASE=https://<your-testnet-api>` **勿**设 `TRAVELTRUST_ALLOW_LOCAL_BASE`，跑通后另留 **环境指纹 + commit**。

---

## 4. 96-15

本轮无对外深度审计/DPA 义务 → **§3 P0 全表 N/A**。B-421：`bash scripts/check-runbook-golive-doclink-gate.sh`。

---

## 5. TT-9618 PostgreSQL 机读（本地 Postgres · 与 TT-9618 / 96-18 同源）

**本轮「不跑公网」下：** 用 **①** 本机 `DATABASE_URL`（docker-compose Postgres）跑 **`scripts/gates/tt-9618-onboarding-pg-evidence.sh`** **exit 0**（`matrix_93_admin_onb` … `matrix_93_d_onb_012` 全过；**未**要求远端 HTTPS `BASE`）。

```bash
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
unset INTERNAL_API_SECRET  # 或 export INTERNAL_API_SECRET=
bash scripts/gates/tt-9618-onboarding-pg-evidence.sh
```

**可选：** 安装 `promtool` 后同脚本会多跑 Prometheus example 校验；`CHECK_FRONTEND_NPM_BUILD=1` 会串 `npm run build`（需 Node）。

---

## 6. 04 路由机读

```bash
bash scripts/run-check-04-routes.sh
```

本轮：**exit 0**。

---

## 7. 「不跑公网」与 **②** 阶次（本轮收口句）

本轮**未**对任何 **`BASE=https://…` 外网宿主**执行 `tt-9627-testnet-segment12-smoke-pack.sh`（无出站/无预发 URL 时不冒充 **②**）。

**已在 ① 内尽量对齐「测试网前」机读：** strict ISS-007 + **TT-9618** PG 矩阵（与 **TT-9618** / **96-18** 同源）+ 段 12 编排（`TRAVELTRUST_ALLOW_LOCAL_BASE=1` 回环）。

**允许外连后补一行证据：** `BASE=https://<testnet-api> bash scripts/gates/tt-9627-testnet-segment12-smoke-pack.sh` **exit 0** 的终端节选 + 日期 + commit → 追加本文件或新建 `evidence/GO_*_testnet_segment12/`。

---

## 8. `ci-local-delivery-minimum.sh`（solo 本地三连 + TT-9627 可选闸）

**本轮（不跑 CI / 跳过 AI 索引 diff 闸）：**

```bash
export BASE=http://127.0.0.1:8080
export SKIP_AI_TASK_CARD_INDEX_OVERVIEW=1 CI_LOCAL_SKIP_AI_TASK_CARD_INDEX=1
export TT9627_SEGMENT456_SPEC_PRESENCE=1
export TT9627_SEGMENT1_API_SMOKE=1 TT9627_SEGMENT2_API_SMOKE=1
export TT9627_SEGMENT3_R002_VALIDATE=1
export REPORT_JSON=evidence/GO_20260501_tt9627_strict_r002/r002_iss007_prereport/report.json
bash scripts/gates/ci-local-delivery-minimum.sh
```

**结果：** **exit 0**（含 `cargo test -p traveltrust-api`、`run-check-04-routes`、`check-pr-crates-needs-metadata.sh main HEAD`、段 1～2 API smoke、段 3 validate、段 4～6 spec presence）。

**说明：** 跳过 AI 任务卡索引仅适用于**未改** `docs/AI任务卡索引.md` 的提交；若本轮动到该文件，应 **unset** 跳过变量并重跑 `check-ai-task-card-index-overview.sh`。

---

## 9. AI 任务卡索引一览（工作区已改索引时 **勿** 跳过）

因 **`docs/AI任务卡索引.md`** / **`docs/AI任务卡索引.from-stash.md`** 相对 **HEAD** 有改动，须 **unset** `SKIP_AI_TASK_CARD_INDEX_OVERVIEW` / `CI_LOCAL_SKIP_AI_TASK_CARD_INDEX` 后执行：

```bash
bash scripts/check-ai-task-card-index-overview.sh "docs/AI任务卡索引.md"
bash scripts/check-ai-task-card-index-overview.sh "docs/AI任务卡索引.from-stash.md"
```

**本轮：** 两脚本均 **exit 0**。

---

## 10. Registry + B-421

```bash
python registry/validate-spec-path-dependencies-registry.py
bash scripts/check-runbook-golive-doclink-gate.sh
```

**本轮：** 均 **exit 0**。

---

## 11. `ci-local-delivery-minimum.sh`（**不**跳过 AI 索引闸 · 完整版）

```bash
export BASE=http://127.0.0.1:8080
unset SKIP_AI_TASK_CARD_INDEX_OVERVIEW CI_LOCAL_SKIP_AI_TASK_CARD_INDEX
export TT9627_SEGMENT456_SPEC_PRESENCE=1
export TT9627_SEGMENT1_API_SMOKE=1 TT9627_SEGMENT2_API_SMOKE=1
export TT9627_SEGMENT3_R002_VALIDATE=1
export REPORT_JSON=evidence/GO_20260501_tt9627_strict_r002/r002_iss007_prereport/report.json
bash scripts/gates/ci-local-delivery-minimum.sh
```

**本轮：** **exit 0**（含 `maybe-run-ai-task-card-index-overview-on-diff` 触发的两路 `check-ai-task-card-index-overview`）。

---

## 12. 本地全收敛 Runbook（Phase A→D 一页纸）

**入口：** [docs/runbook/TT-LOCAL-CONVERGENCE-PHASE-AD-001.md](../../docs/runbook/TT-LOCAL-CONVERGENCE-PHASE-AD-001.md)（**96-20** 同序 + 机读命令 + **Phase D** UI/数据排查）。
