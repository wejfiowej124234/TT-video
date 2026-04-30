# Production gate（96 / 93 / 95 · Enforcement 层）

**Workflow**：`.github/workflows/production-gate.yml`（Actions 显示名一般为 **Production gate**）。

**SSOT（机器）**：`gates/production_gate.yaml` — 首 job 运行 `python3 scripts/gates/verify_production_gate_config.py`，确保路径与脚本存在、**Gate Audit** 清单计数（`gates/gate_audit.machine.json`：**BLOCK 42 + HARDEN 43 = 85**）与 YAML 声明一致，且与 workflow 行为对齐。

### Gate Audit（BLOCK LIST + HARDEN LIST → 机器可读）

| 文件 | 含义 |
|------|------|
| `gates/gate_audit.machine.json` | **block_list**：合并阻断项（对应各 job 失败面）；**harden_list**：韧性/对齐措施（脚本与 CI 加固）。 |
| `gates/production_gate.yaml` | `gate_audit_machine_json`、`gate_audit_block_count`、`gate_audit_harden_count` 与 **E2E 口径**（`ci_e2e_strict_session`、`ci_e2e_grep_invert`）登记在 SSOT。 |

**可直接应用的补丁**：仓库内执行 `git apply patches/gate-audit-enforcement-v1.patch`（若已合入主干则跳过；补丁随发布迭代更新文件名）。

### 验证「42 → 85」机器级 checklist（闭合）

以下 **5 步** 即「SSOT + 85 条机器规则 + 本地同构」的最低验收（不替代人签缺口表）：

1. `python3 scripts/gates/verify_production_gate_config.py` — 通过且打印 `OK traveltrust.production_gate.v1`；同 job 另跑 `bash scripts/gates/check-auth-email-resend-gate.sh`（若 **`TRAVELTRUST_EMAIL_TRANSPORT=resend`**（含 Actions **secrets** 注入）则须 **`TRAVELTRUST_RESEND_API_KEY`** + **`TRAVELTRUST_RESEND_FROM`**；否则 **skip**）。
2. `python3 -c "import json; d=json.load(open('gates/gate_audit.machine.json')); assert len(d['block_list'])==42 and len(d['harden_list'])==43"` — 静默退出 0。
3. 对照 `gates/production_gate.yaml` 中 `ci_e2e_grep_invert` 与 `.github/workflows/production-gate.yml` 中 **E2E** 步骤的 `--grep-invert` 一致。
4. `bash scripts/gates/run-production-gate-local.sh --base main` — 结束行仅关注三项结论：`LOCAL_SMOKE_GATE`、`REPORT_VALIDATE`、`PRODUCTION_GATE_LOCAL`（由 EXIT trap 打印）。
5. `MANIFEST.local.json` 中 `local_smoke_gate` / `report_validate` / `production_gate_local` 与上述三行一致。

**Policy**：合并到 **`main`** 若宣称 **Production GO**（与 `docs/go-live-checklist.md` 并联），除 **人签 / 缺口表** 外，须将 **Production gate (trinity) — gate closed**（`production-gate-summary`）列为 **branch protection 必过**，使下列项在 **同一 `run_id`** 下默认不可绕过：

| 维度 | Job | 说明 |
|------|-----|------|
| SSOT | `verify-gate-config` | `gates/production_gate.yaml` + `verify_production_gate_config.py`；同 job **`check-auth-email-resend-gate.sh`**（**`resend`** 时 **fail-closed** 缺 **`TRAVELTRUST_RESEND_*`**） |
| 96 · B-421 | `b421-doclink` | `scripts/check-runbook-golive-doclink-gate.sh` |
| 既有 batch | `broadcast-all` | `broadcast-batch-all-required.sh` |
| 95 · API | `traveltrust-api-tests` | `cargo test -p traveltrust-api` |
| 96-15 机跑 | `tier-96-15` | `verify_96_booklets_registry` + `run_96_15_orchestration.py`（Tier A 使用 `gates/tier_a_ci/*`）；可用 **`gates/waivers/96-15.waiver.json`** 豁免（见 `gates/waivers/README.md`） |
| report policy | `report-policy` | 任意 **变更** 的 `**/report.json`：1) 若 `release_gate=PARTIAL_GO`，须含 **`partial_go_expires_utc`**（未来 UTC）；2) 变更集合中必须且仅能有一个文件 `is_final_truth=true` |
| 93 / R-002 | `e2e-r002-93` | Playwright（**`STRICT_SESSION_GATE=1`**，**排除** **`@e2e-sepolia-deferred`**；链上套件见 `run-production-gate-chain-deferred.sh`）+ `validate-regression-report.py --fail-on-no-go --fail-on-case-not-run`（ISS-007 窄片） |

## 必过 check（branch protection）

**Repository → Settings → Rulesets**（或 **Branches → `main` → Require status checks**，经典分支保护）中配置 **Required status checks**：

| 建议勾选（与 Actions 检查运行名称一致） | Workflow / 说明 |
|----------------------------------------|-----------------|
| **Production gate (trinity) — gate closed** | Job id：`production-gate-summary`（workflow `production-gate.yml`） |

勾选 **汇总 job** 即强制 **同一 workflow** 内 `needs` 所列 **全部** 子 job 成功（`verify-gate-config`、`b421-doclink`、`broadcast-all`、`traveltrust-api-tests`、`tier-96-15`、`report-policy`、`e2e-r002-93`）。**无需**再逐子 job 勾选，除非要在 PR 上分列展示。

**GitHub UI 操作摘要**：Settings → Rules → Rulesets → 目标分支 `main` → **Require status checks** → 搜索并添加 **`Production gate (trinity) — gate closed`**（名称以仓库 Actions 实际显示为准，若重命名 workflow 需同步更新 ruleset）。

**Fork / 个人仓库**：若无 Team/Enterprise rulesets，使用 **Branch protection rule** → **Require status checks to pass before merging** → 在列表中勾选上述检查名。

## 与 Broadcast batch blockers

- **`broadcast-all`** 与 **Broadcast batch blockers** workflow 同源脚本。
- 迁移：见 `.github/CI-REQUIRED-BROADCAST-BATCHES.md`（可仅保留 `production-gate-summary` 必过以避免 batch 双跑）。

## Evidence（发布证据）

- **`production-gate-manifest-<run_id>`** — `MANIFEST.json`（含 `gate_ssot`、`jobs_required`、`commit_sha`）。
- **`production-gate-e2e-r002-<run_id>`** — ISS-007 `report.json` 与 notes。
- **`production-gate-96-15-<run_id>`** — `release_orchestration.json` 等（豁免时不生成）。

## PARTIAL_GO 与 `report.json`（统一口径：变更集，不要求 PR）

- **合并/推送**时：若 diff 修改了某 `**/report.json` 且其中 **`release_gate` 为 `PARTIAL_GO`**，必须增加顶层字段 **`partial_go_expires_utc`**（ISO-8601，建议 `…Z`），且时间须 **晚于** workflow 运行时刻；否则 gate 失败。
- **single truth**：若一次变更修改了一个或多个 `**/report.json`，其中必须且仅能有一个顶层字段 **`is_final_truth: true`**，作为该次变更最终真值报告；否则 gate 失败。
- **critical-change truth requirement**：若一次变更修改了关键路径（`.github/workflows/`、`crates/api/`、`frontend/`、`contracts/`、`scripts/`），即使未改任何 `report.json`，也必须在该次变更中包含至少一个 `is_final_truth: true` 的 `report.json`；脚本：`scripts/gates/check_pr_final_truth_presence.py`。
- **未修改**的历史 `report.json` 不要求补字段。

## 其他 workflow

- **`regression-report-validate`**：保留 **`workflow_dispatch`**；对 **`main` 的 PR** 且 paths 命中 `**/report.json` 时，自动跑 **`check_pr_partial_go_expiry.py`**（与 Production gate 同源）。
- **`96-15-orchestration-gate`**：仍以 **`workflow_dispatch`** 做可选全量（含可选 merged report）；**PR 默认** 由 **Production gate · tier-96-15** 覆盖（见该 workflow 头注释）。
- **`production-release-require-go`**：`push tags: v*` 与 `workflow_dispatch`，强制最终真值报告通过 `--require-go --fail-on-case-not-run`，并要求 `summary.FAIL/BLOCKED/NOT_RUN == 0`；tag 触发默认读取 `gates/final_truth_report_path.txt`。

## 单人开发 / CI 欠费本地封口

可不走 PR，直接在仓库根执行本地同构门禁（推荐单人默认流程）：

`bash scripts/gates/run-production-gate-local.sh --base main`

常用参数：

- `--skip-e2e`：跳过本地 Playwright + R-002（只做结构封口）
- `--skip-api-tests`：跳过 `cargo test -p traveltrust-api`

成功后会写入：

- `frontend/evidence/production-gate-local-*/MANIFEST.local.json`（当前 Windows 本地默认路径）
- （若仓库根 `evidence/` 可写）`evidence/production-gate-local-*/MANIFEST.local.json`

该方式适用于单人开发的**本地验收封口**；若后续恢复 CI，仍建议在 Actions 上再跑一次 `Production gate` 作为远端佐证。

## Build workflow 与 E2E

- **`build.yml`** 中 **`e2e` job** 已设为 **`continue-on-error: false`**，使 E2E 失败在 Build 时间线显红（合并阻断仍以 branch protection 所选 check 为准）。

## 边界

- 本 gate **不**替代 **缺口官方总表**、**15 附录〇** 等人签。
- **ISS-007 窄片** **不**等同于 **93 全矩阵**；全量 staging `report.json` 仍以 **R-002** 为准。
- 单人独立开发场景可采用**自签**：在缺口表/附录中同一人签字并保留时间戳即可，不额外强制第二审批人；但 CI 门禁（`production-gate-summary` 必过）仍不得绕过。

## 相关路径

- `gates/production_gate.yaml`、`gates/tier_a_ci/`、`gates/waivers/README.md`
- `scripts/gates/verify_production_gate_config.py`、`resolve_96_15_waiver.py`、`check_pr_partial_go_expiry.py`
- `scripts/check-runbook-golive-doclink-gate.sh`、`scripts/gates/broadcast-batch-all-required.sh`
- `scripts/validate-regression-report.py`、`docs/go-live-checklist.md`
