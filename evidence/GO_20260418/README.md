# R-003 · staging 首轮实战（`evidence/GO_20260418`）

**唯一目标**：在 **真实 staging** 上按 **[R-003 Runbook](../../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)** 完成 **阶段 0 → 阶段 1（仅 A 域 100% PASS + DB 佐证）→ 门禁 → 阶段 2（B 域 §2.0 五连）**，产出本目录 **`report.json`** 与 **`release_gate` ∈ { GO, PARTIAL_GO, NO_GO }**。

## 从 LOCAL 链切到 staging 首轮（当前唯一目标）

已在 **`evidence/R003_local_evidence_chain/`** 用 **`R003_LOCAL_CHAIN=1`** 跑通链路的，按序只做下面几步（与 **[Runbook §3](../../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md)** 一致）：

1. 编辑 **`scripts/dev/.env.r003.local`**：**删除或注释** **`R003_LOCAL_CHAIN=1`**。  
2. 填写 **`R003_API_BASE`**（`https://…`，无尾斜杠）、**`R003_A_PASSWORD`**（staging A 域账号口令）、**`R003_EXECUTOR`**；保持 **`R003_ENVIRONMENT_NAME=staging`**、**`R003_OUT=evidence/GO_20260418`**。  
3. 在**能访问该 staging 网络**的环境执行：  
   `python scripts/dev/run_r003_staging_evidence_chain.py --from-env`  
   终端核对 **`GET /meta fingerprint`** 与 **`api_base`** 为目标环境。  
4. **`validate` 为 `GO` / `PARTIAL_GO`** 后：由具备 **staging PostgreSQL** 权限的人**立即**补全本目录 **`ENV-DB-PROOF/notes.md`**（铁律① 写后读），再按 **[§3.1 冻结与会签](../../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md#r003-go-freeze-signoff)** 放行。

## 前置

- Staging API 已部署 **含会话删除的 `POST /auth/logout`**（与仓库 `auth_logout` + `delete_session` 一致）。
- 准备 **`--a-email` / `--a-password`**（A 域账号，常为种子 `tourist@test.com` / `Test123!`，以 staging 配置为准）。
- **禁止**用 `localhost` 冒充 staging：传 **`--environment-name staging`** 且 **`--api-base https://<staging-host>`**；若强测本机须加 **`--warn-localhost`**（**不**作为首轮交付）。
- **脚本会**拒绝 `localhost` / `127.0.0.1` / `::1`，并对 **DNS 仅解析到回环** 的 hostname 报错（防 hosts/隧道误指本机）；跑通后请看终端 **`GET /meta fingerprint`** 与 **`api_base`** 是否与目标 staging 一致。
- **本地 8080**：若 A-LOG-003 失败，先怀疑 **旧二进制**（`/auth/logout` 未删会话）。停 8080 → **`cargo build -p traveltrust-api`** → 用 `scripts/dev/start-api-with-seed.bat` 再起（勿 `SKIP_API_BUILD=1` 除非已确认二进制最新）。

## 一键生成 `report.json` + 单条证据

在**仓库根**（PowerShell 或 Git Bash）：

```bash
python scripts/dev/r003_staging_full_regression.py ^
  --environment-name staging ^
  --api-base https://YOUR-STAGING-API.example ^
  --out evidence/GO_20260418 ^
  --executor your.name@company.com ^
  --a-email tourist@test.com ^
  --a-password "YOUR_SECRET"
```

- 脚本顺序：**阶段 0**（`/health`、`/meta`）→ **阶段 1**（A-ENV / A-NEG / A-LOG / A-ME）→ **门禁**（`GATE_A_TO_B.md`）→ **阶段 2**（注册新用户 → B-MKT → B-GDE → B-ORD → B-MSG）。
- 每次回归结束会写 **`r002_section4_backfill.md`**（与 **`report.json`** **`cases[]`** 同源，供 **[R-002 §4.1](../../docs/spec/R-002-回归执行闭环与发布准入.md#41-93-矩阵批次--回填登记b-486b-498)** 指针/粘贴）。
- 完成后人工补全 **`ENV-DB-PROOF/notes.md`** 中的 **铁律①** 写后读（PostgreSQL），并与 **`phase2/b_domain_chain.redacted.json`** 对齐；**`notes.md`** 若已由执行人写长文，脚本**不会整文件覆盖**，仅追加 **`api_base`** 锚点。

### GitHub Actions（不会本机跑时 · 可复现、无本机依赖）

1. 在仓库 **Settings → Secrets and variables → Actions** 新增 **Repository secrets**（名称须与 workflow 一致）：  
   **`R003_STAGING_API_BASE`**、**`R003_STAGING_A_PASSWORD`**、**`R003_STAGING_EXECUTOR`**。  
2. **Actions** → **R-003 staging evidence chain (dispatch)** → **Run workflow**。  
   - **`runner_type`**：**`github-hosted`** = 公网可达的 staging（**`ubuntu-latest`**）；**`self-hosted`** = 仓库已注册的 **`[self-hosted, linux]`** runner（须能访问**内网** staging）。  
   - **`r003_out`** 默认 **`evidence/GO_20260418`**。  
3. 成功后从 **Artifacts** 下载 **`r003-staging-evidence-<run_id>`**，把其中允许进 git 的文件（含 **`report.json`**）**另开 PR** 合入；**铁律①** **`ENV-DB-PROOF/notes.md`** 仍须具备 **staging PG** 权限的人在 PR 中补全。  
4. **可复现**：每次运行使用 **checkout 的 `GITHUB_SHA`** 与日志中的 **Python 版本**；同一 **`r003_out`** 的并发由 workflow **`concurrency`** 串行化组键（**不** `cancel-in-progress`，避免半截证据）。  
5. **封口文案**：本机合 PR 前可运行 **`python scripts/dev/print_tt_b486_seal_snippet.py`**（铁律①写够长时加 **`--require-iron-rule-notes`**）；workflow 成功时也会在 job 日志里打印同一段。

### Cursor 一键链（回归 → `validate --fail-on-no-go`）

1. **Staging（默认模板）**：`scripts/dev/.env.r003.local` 已指向 **`R003_OUT=evidence/GO_20260418`**；填写 **`R003_API_BASE`**、**`R003_A_PASSWORD`**、**`R003_EXECUTOR`**，且**不要**启用 **`R003_LOCAL_CHAIN`**（可对照 `scripts/dev/r003-staging-chain.env.example`）。  
2. **本机烟测**：仅在需要时取消注释 **`R003_LOCAL_CHAIN=1`**（输出 **`evidence/R003_local_evidence_chain/`**，不作 staging 交付）；**A-LOG-003** 失败时先 **`scripts\stop-api-thorough.bat`** 再起新编译的 API。  
3. **`Tasks: Run Task`** → **`R-003: staging evidence chain (env)`**，或 CLI：`python scripts/dev/run_r003_staging_evidence_chain.py --from-env`。

链式步骤：先跑 `r003_staging_full_regression.py`，再跑 `validate-regression-report.py … --fail-on-no-go`。**Staging 首轮**产出仍落在 **`--out`**（默认 **`evidence/GO_20260418`**）；**铁律①** 须 PG 权限的人补全 `ENV-DB-PROOF/notes.md`。

## 机读闸（合并/发版前）

```bash
python scripts/validate-regression-report.py evidence/GO_20260418/report.json --fail-on-no-go
```

- **`release_gate` = NO_GO** 时该命令 **exit 1** 为预期（阻断合并）；**GO / PARTIAL_GO** 须 **exit 0**。

## Gate 含义（脚本生成）

| `release_gate` | 典型条件 |
|----------------|----------|
| **GO** | A 全 PASS，B §2.0 五连全 PASS（且须人工确认 DB 佐证已补） |
| **PARTIAL_GO** | A 全 PASS；存在 B **BLOCKED**（如无杭州 active 向导、消息 **501** 等），见 **93 §7.1** |
| **NO_GO** | 任一 **FAIL**，或 A 未全绿仍跑 B，或主链/铁律①不可复核 |

## `release_gate` = **GO** 之后（冻结 · 会签 · 合并闸）

**唯一目标**：冻结本轮证据包并完成放行会签；细则与 **`PARTIAL_GO`** 收口见 **[R-003 Runbook §3.1](../../docs/spec/R-003-Staging首次完整回归-A-B域-执行Runbook.md#r003-go-freeze-signoff)**。

1. **立刻**由有 **staging PG** 权限的人补全 **`ENV-DB-PROOF/notes.md`**（铁律 ① 写后读）。
2. **冻结**：勿再覆盖本次 **`report.json`** 与本 run 证据；必要时记 **`sha256`**。
3. **会签**：向 Release Owner 提交路径、validate 结果、目录、**`release_gate=GO`**，**双签**后再走合并/发布闸。
4. **勿重跑无关改动**污染本包；扩面另开 **`run_id`** / 新目录（**R-004**）。

### CI 合并闸（冻结后）

会签后在 **`evidence/GO_20260418/`** 提交 **`.r003-go-frozen`** 后，GitHub Actions **[`.github/workflows/r003-go-staging-freeze-gate.yml`](../../.github/workflows/r003-go-staging-freeze-gate.yml)** 生效：**`main`** 上若存在该标记，则 **PR / push** 不得再改本目录，且 **`report.json`** 须 **`release_gate=GO`**（`validate-regression-report.py --fail-on-no-go --require-go`）。请把 workflow job **「R-003 GO staging freeze gate」** 设为 **`main` 的 required check**。

## 与占位 `report.json` 的关系

首次克隆后本目录可能含 **占位** `report.json`（**NO_GO**）。在 staging **实跑**成功后，以上 Python 命令会**覆盖**为真实结论与 `cases[]`。

## 互指

- **[evidence/r003_staging_first/README.md](../r003_staging_first/README.md)**（四件套 / 会签）
- **[templates/regression-report.staging.min.json](../../templates/regression-report.staging.min.json)**
