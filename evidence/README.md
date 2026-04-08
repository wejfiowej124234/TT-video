# Evidence 目录（Gate 通过证据 bundle）

本目录存放 **Gate 通过** 与 **演练** 的取证级 evidence bundle，与 [08-1-战略与合规风险检查清单](../docs/spec/08-1-战略与合规风险检查清单.md)、[08-2-附录-闭合工单表](../docs/spec/08-2-附录-闭合工单表.md) 配套。08 定稿与闭合标准见 [08-4](../docs/spec/08-4-对外口径包.md)、[08-3](../docs/spec/08-3-参数与门禁表.md) 开篇「审计闭合标准」及 [08-2 定稿前检查](../docs/spec/08-2-附录-闭合工单表.md)。

<a id="ssot-guards-ci-summary"></a>

## PR/CI 静态 SSOT Guard 总览（一条读）

**[GO_20260407_SSOT_GUARDS.md](GO_20260407_SSOT_GUARDS.md)**（**TT-SSOT-GUARD-GO-SUMMARY-018**）：汇总已落地的 **B-097 Escrow** 与 **B-110 Pool** 两条 **Python** 门禁的覆盖范围、**`check-invariants.sh` / Build workflow** 入口、典型阻断回归与「**新链上 SSOT → 单开 TT + 新 guard/allowlist**」规则。机读脚本表见 **[scripts/README.md](../scripts/README.md)** **二、CI 门禁**；任务溯源见 **[docs/任务母表.md](../docs/任务母表.md)** **SSOT Guard 门禁索引**。

<a id="build-ci-closure-20260408"></a>

### Build（`build.yml`）全绿收口 · 2026-04-08

- **[GO_20260408_BUILD_CI_CLOSURE.md](GO_20260408_BUILD_CI_CLOSURE.md)**：GitHub Actions Run **`24139191178`**（tip **`2364f55`**）及本轮 **gate / regional-matrix / e2e·8080 / smoke / governance·params / traveltrust·nav / Vitest·locale / trust-gate·alert** 等修复链条台账；**后续新卡从新问题起算，不回扫本条已收口链**。

<a id="07-p0-e2e-three"></a>

## 07 §二 2.1 发布前 E2E 三项（P0 · artifacts 索引）

与 [01-总库总览 §「发布与 E2E（P2）」](../docs/spec/01-总库总览.md) 及 [07 §二 2.1](../docs/spec/07-开发流程与顺序.md#21-顺序约束简要) **字面一致**；**不得视为可发布** 前须各至少 **一份**可复核留痕（并入当次 **`evidence/GO_YYYYMMDD/`** 或私有制品库同形 manifest 指针）。

| 项（07 / 01） | 建议 `artifacts/` 文件名（示例） | 最少内容 |
|---------------|-----------------------------------|----------|
| **正常放款** | `e2e-normal-release.md`（或 `.json` 索引） | 环境、日期、命令/入口、结论、执行人；链上 tx / 订单 id 可检索 |
| **争议三终态** | `e2e-dispute-three-terminals.md` | Refunded / PartiallyRefunded / Slashed 各至少一条可复现路径或引用 SSOT 路径 |
| **三条超时路径** | `e2e-three-timeouts.md` | 与 01/53 超时语义对齐的三类路径各一条留痕（或引用已登记的演练编号 **DR-***） |

与 [27-P14 · P14-3](../docs/spec/27-P14-实现记录.md) 同批执行时可互链上述文件名。**签字**：`manifest.json` 之 **`sign_off`** 须非空（见下文 manifest 格式）。

## 目录约定

- **索引器 / DB 投影对账**（可选机器预检、发版留痕）：最小顺序见 **[Runbook §12.5](../ops/RUNBOOK.md)**（与 **§2.55**、`indexer-reconcile-probe`、`write-indexer-evidence` 配套；**步骤 6** 链级 **`dry-run`** 只读计数与 **`artifacts/`**）；**不替代** [01 §「发布与 E2E」](../docs/spec/01-总库总览.md) **三项**（**[27-P14 P14-3](../docs/spec/27-P14-实现记录.md)**）。**链级「规划归零」只读（DR / 演练，不执行 DELETE）**：**`POST …/internal/indexer-reconcile`** 可选 **`orders_chain_scope_rollback_dry_run:true`**（响应锚 **`110-ORDERS-CHAIN-SCOPE-DRY-RUN`**）及同类 **`event_log_*` / `correction_executor_*`** dry-run；值班 **`bash scripts/internal-indexer-ops.sh reconcile --chain-scope-dry-run`**（及 **`--event-log-scope-dry-run`** 等）见 **[Runbook §2.55](../ops/RUNBOOK.md)**、**[110 §3.1.4](../docs/spec/110-阶段开发链上索引器与事件同步器.md)**；可将 **dry-run** 响应 JSON（含各计数与 **`anchor`**）落入 **`evidence/GO_YYYYMMDD/artifacts/`** 与 manifest 同批。**execute** 路径须独立 **ENV + confirm**，**不**纳入 CI 自动跑，且仍须 **01/03** 与 Runbook 人工评审。
- **可验证发布 manifest + E2E / 演练留痕**：**`gen-frontend-manifest`**（**`build` 后**执行）、**`pre-release-automation` 与 manifest 的关系**、**P14-3** 与 **Runbook §4** — **[Runbook §12.6](../ops/RUNBOOK.md)**。
- **17 条 checklist #5（部署参数 / Slither）**：执行顺序 **[Runbook §12.8](../ops/RUNBOOK.md)**；将 **`export_deployment_params`** 输出与/或 Slither 报告路径纳入本目录 **`artifacts`**（或 **08-3 evidence_pointer**，须可复核）；与 [checklist-17](../scripts/checklist-17.md) #5 勾选配套。
- **08-2 工单定稿顺序**：Owner → 审查一 → 审查二（横向 Gate 评审见 **§12.7**）→ Evidence 列 — **[Runbook §12.9](../ops/RUNBOOK.md)**（与 [08-2 定稿前检查](../docs/spec/08-2-附录-闭合工单表.md) 全文同读，**不替代**人工勾选）。
- **evidence/GO_YYYYMMDD/** — 某次 Gate 通过（或发版前五门全过）的 evidence bundle。
  - **根目录 `.gitignore` 已排除 `evidence/GO_[0-9]{8}/`**：该路径**不会**进入公开 git 历史；责任人本地创建后自行归档或写入私有制品库；复核方可对照 [15 附录〇 机器预检段](../docs/spec/15-多维度文档与技术检查报告.md#发版前勾选总表) 在本地重跑 `pre-release-automation` / `cargo test`。
  - 内含：`manifest.json`（产物清单）、`manifest.sha256`（校验）、截图/日志索引等。
  - 可选：运维脚本 **`scripts/write-indexer-evidence.sh`** 或 Windows **`scripts/write-indexer-evidence.ps1`**（须 **Git Bash** 执行 **`indexer-public-snapshot.sh`**；manifest / **`.zip`** 由 PowerShell **`Compress-Archive`** 生成）；或 Windows **`.\scripts\internal-indexer-ops.ps1 evidence`** / **`evidence-bundle`**（委托 **`write-indexer-evidence.ps1`**；其它子命令委托 **bash** **`internal-indexer-ops.sh`**）可将 **`indexer_public_snapshot_*.json`**（**`/health`** + **`/meta`** + 可选 admin/internal 段；顶域 **`snapshot_provenance`** **`script`**/**`script_semver`**/**`host_git_commit`**/**`host_git_branch`**/**`host_repo_dirty`** 标识生成器与主机 Git 上下文）落入本目录，见 [RUNBOOK §2.55](../ops/RUNBOOK.md)（110 索引器留痕）。**`04` / `14` / `110`** 与 **`07 §六 6.4`** 互指见 **[14 §2.1 · 运维 JSON 快照](../docs/spec/14-合约-API-ABI-前后端对齐.md)**（**`04 §3.4` · `internal`** 为段落 **SSOT**）。**`INDEXER_EVIDENCE_WRITE_MANIFEST=1`** 或 **`INDEXER_EVIDENCE_BUNDLE_ZIP=1`**（或 **`internal-indexer-ops.sh evidence-bundle`** / **`.ps1 evidence-bundle`**）另生成 **`indexer_public_snapshot_manifest.json`**（`gate` / `date` / `artifacts` / `sign_off` + **`bundle_kind`**），可选 **`indexer_evidence_bundle_*.zip`**；正式过门前替换默认 **`gate`/`sign_off`**。
  - 工单表 **Evidence** 列可贴：`evidence/GO_20250220/` 或 manifest 的 hash。
- **evidence/GO_YYYYMMDD_template/** — **可复制模板**：首次过门时复制为本目录并重命名为 GO_YYYYMMDD，再填写 manifest。勿在此目录内放真实证据。
- **evidence/GO_placeholder/** — **仅占位说明**（非 bundle、非模板）：说明真实 bundle 用 GO_YYYYMMDD 目录。
- **evidence/DR-YYYYQX-0N/** — 单次演练（Runbook 演练）产物，可选按演练编号建子目录。

<a id="governance-pool-country-pool-ssot-drill"></a>

### 治理池根级链上 SSOT 演练留痕（B-110）

- **`country_pool` 根级链上主读闸**（**`GOVERNANCE_COUNTRY_POOL_BALANCE_CHAIN_SSOT`**）：**可复制** 开关、验证点、回滚、与 **Σ / 观测腿** 边界 — **[Runbook §7.1.1](../ops/RUNBOOK.md)**（**TT-RUNBOOK-COUNTRY-POOL-DRILL-001**）。与 **`GOVERNANCE_POOL_BALANCE_CHAIN_SSOT`**（**`pool_balance`**）**独立**；留痕时建议**分别**保存两次闸的前后 JSON 片段（脱敏 **`API_BASE`**）。
- **建议 artifacts 文件名**：`governance-pool-country-pool-ssot-on.json`、`governance-pool-country-pool-ssot-off.json`、可选 `governance-fee-pool-aggregates-projection-only.json`（核对 **`data_source":"projection"`** 且无根级 **`country_pool*`**）。

<a id="governance-pool-treasury-erc20-ssot-drill"></a>

- **`treasury_erc20_pool` 根级链上主读闸**（**`GOVERNANCE_TREASURY_ERC20_POOL_BALANCE_CHAIN_SSOT`**）：**可复制** 开关、验证、回滚；**硬性验证**为 **`GET …/governance/pool` 根级 `treasury_erc20_pool*` 随闸出现/消失**，且 **`GET …/governance/fee-pool-aggregates` 响应根级永不出现 `treasury_erc20_pool*`**（与 **Σ** 无关、不并入聚合）— **[Runbook §7.1.2](../ops/RUNBOOK.md)**（**TT-RUNBOOK-TREASURY-ERC20-POOL-DRILL-007**）。
- **建议 artifacts 文件名**：`governance-pool-treasury-erc20-ssot-on.json`、`governance-pool-treasury-erc20-ssot-off.json`、可选 `governance-fee-pool-aggregates-no-treasury-erc20-keys.json`（`jq` 输出或脱敏 JSON，证明根级 **`treasury_erc20_pool` / `treasury_erc20_pool_data_source` / `treasury_erc20_pool_is_chain_ssot`** 均为缺失或 **`false`**）。

<a id="orders-detail-escrow-chain-state-ssot-drill"></a>

### 订单详情 `escrow_chain_state*` / `escrow_release_state*` / `escrow_dispute_state*` / `escrow_locked_amount*` 链上 SSOT 演练留痕（**TT-ESCROW-SSOT-RUNBOOK-003** · **TT-ESCROW-SSOT-RUNBOOK-RELEASE-006** · **TT-ESCROW-SSOT-RUNBOOK-DISPUTE-009** · **TT-ESCROW-SSOT-RUNBOOK-AMOUNT-012**）

- **验证步骤**：**[Runbook §7.1.3](../ops/RUNBOOK.md)** — **A** 证明 **`GET …/api/v1/orders/:id`** 在 **`get_escrow_status` 成功**时根级出现 **`escrow_chain_state*`**；且 **仅当**链上 **`Escrow.status()`** 为 **Completed / Refunded / Resolved / PartiallyRefunded / Slashed** 时出现根级 **`escrow_release_state*`**（**`chain_read`** + **`true`**）；**非**上述终态时 **`escrow_release_state*`** **不得**出现；且 **仅当**链上为 **`Disputed` / `Resolved`** 时出现根级 **`escrow_dispute_state*`**（**TT-ESCROW-SSOT-DISPUTE-STATE-008**），**无争议**时 **不得**出现；且 **仅当**链上 **Escrow 有效**、**`token()` 非零**、**`balanceOf(escrow) > 0`** 时出现根级 **`escrow_locked_amount*`**（**TT-ESCROW-SSOT-AMOUNT-011**），**否则不得**出现。**B** 证明 **列表**与 **占位**响应根级**永不**带 **`escrow_chain_state*`** / **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`**（与 **TT-ESCROW-SSOT-ORDER-STATE-AGGREGATE-EXCLUDE-002** 一致）。
- **建议 artifacts 文件名**：`orders-detail-escrow-chain-state-ssot-ok.json`（**A**、脱敏 **`API_BASE`**/**`Bearer`**，可含 **`escrow_release_state*`** / **`escrow_dispute_state*`** / **`escrow_locked_amount*`**）；可选 **`orders-detail-escrow-release-state-ssot-terminal-only.json`**（五放款终态之一）、**`orders-detail-escrow-dispute-state-ssot-disputed-or-resolved.json`**（**`Disputed`** 或 **`Resolved`**）、**`orders-detail-escrow-locked-amount-ssot-positive-balance.json`**（**`balanceOf(escrow) > 0`**）；**`orders-list-no-escrow-order-ssot-root-keys.json`**（**B**，证明根级无上述四套键；旧名 **`orders-list-no-escrow-chain-state-root-keys.json`** 仍可作别名归档）。
- **发版过门收口（GO 静态文档 · TT-RELEASE-GATE-ESCROW-GO-DOC-015）**：四套键**覆盖范围**、**不变量**、**§7.1.3** 验证步骤、**B1～B3 十二项 `has_*` 全 `false` 门禁**、**artifacts 命名** — **[GO_20260407_ESCROW.md](GO_20260407_ESCROW.md)**（过门日 **2026-04-07**；若另择过门日可复制改名并修订文内日期表）。

**首次过门时**：① 复制 **evidence/GO_YYYYMMDD_template/** 为 `evidence/GO_YYYYMMDD/`（如 GO_20250220）② 在新区目录内编辑 `manifest.json`（填 gate、date、artifacts、sign_off）③ 生成 `manifest.sha256`（见模板内 README.txt，可用 `sha256sum manifest.json > manifest.sha256` 或等价命令）④ 在 08-2 对应工单 Evidence 列填写该路径或 manifest hash。无 bundle 时 Gate 不视为闭合。（注：原 scripts/p13_evidence_bundle.sh 已移除，按上述手工步骤即可。）

## manifest 格式与必填字段（SSOT）

**必填字段**（缺一则该 bundle 不得作为门禁证据）：

| 字段 | 类型 | 说明 |
|------|------|------|
| gate | string | 如 Gate-1～Gate-5；须与 08-2 Gate 汇总一致 |
| date | string | YYYY-MM-DD，过门或发版日期 |
| artifacts | array | 至少 1 项；每项含 path、sha256（小写 hex） |
| sign_off | array | 至少 1 人；角色或代号 |

**示例**：

```json
{
  "gate": "Gate-1",
  "date": "2025-02-20",
  "artifacts": [
    { "path": "SSOT-PARAMS-v1.pdf", "sha256": "..." },
    { "path": "PDP-ch1-8-signed.pdf", "sha256": "..." }
  ],
  "sign_off": [ "法务", "运维" ]
}
```

生成后计算 `sha256 manifest.json`（或 `sha256sum manifest.json`）写入 `manifest.sha256`，便于验证未被篡改。

**校验**：定稿或过门时建议对 manifest 做一次校验（必填字段存在、date 格式、artifacts[].sha256 为 64 位 hex）。有 jq 时可手工写校验命令；无 jq 时人工按上表核对，落 08-2 定稿前检查。（注：原 scripts/validate-evidence-manifest.sh 已移除。）

**可验证发布（08-4 第 7 章、W-Q6-FE、51-D3）**：前端构建完成后，按以下手工步骤生成 manifest.json 与 manifest.sha256，纳入 evidence：

### 可验证发布：手工生成 Manifest 步骤

当需要对发布的前端产物生成可验证的 manifest（如发版到生产环境前）：

**第一步：构建前端产物**
```bash
cd frontend
npm run build
```
构建完成后，产物位于 `frontend/.next/` 目录（Next.js 默认输出）。

**第二步：生成产物清单（manifest.json）**

推荐：仓库根执行 **`./scripts/gen-frontend-manifest.sh`**（可选环境变量 **`EVIDENCE_GO_DIR=evidence/GO_YYYYMMDD`**）或 Windows **`.\scripts\gen-frontend-manifest.ps1`**，生成 `frontend/.next/build-manifest.json` 并可复制为 **`frontend-build-manifest.json`** + **`.sha256`**。亦可手工在 `evidence/GO_YYYYMMDD/` 中按下列模板编写 `manifest.json`：

```json
{
  "gate": "Gate-5",
  "date": "2025-03-06",
  "artifacts": [
    { "path": ".next/static/chunks/main.js", "sha256": "abc123..." },
    { "path": ".next/static/chunks/pages/index.js", "sha256": "def456..." },
    { "path": "package.json", "sha256": "ghj789..." },
    { "path": "next.config.js", "sha256": "klm012..." }
  ],
  "sign_off": [ "DevOps Lead", "QA Lead" ]
}
```

**字段说明**：
- `gate`：通过的门（如 Gate-5 前端可替代）；必须与 08-2 工单 Gate 列一致
- `date`：发布或过门日期，格式 YYYY-MM-DD
- `artifacts`：产物列表，每项须包含 `path`（相对于 frontend/ 或仓库根的路径）和 `sha256`（小写 16 进制，64 位）
- `sign_off`：签字人，至少 1 人（角色名或代号）

**第三步：计算产物的 SHA256 hash**

若产物数量较少，可手工计算；若产物众多（>10 个），建议用脚本：

**方案 A - 手工（≤10 个产物）**：
```bash
# 计算单个文件 sha256
cd frontend
sha256sum .next/static/chunks/main.js
# 输出示例：abc123def456... .next/static/chunks/main.js
# 取前 64 位 16 进制数填入 manifest.json 的 sha256 字段
```

**方案 B - 脚本化（产物众多）**：
```bash
# 在 evidence/GO_YYYYMMDD/ 目录下（与 manifest.json 同级）
cd frontend
find .next -type f \( -name "*.js" -o -name "*.css" -o -name "*.json" \) | while read file; do
  hash=$(sha256sum "$file" | awk '{print $1}')
  echo "\"path\": \"$file\", \"sha256\": \"$hash\""
done > /tmp/artifacts.txt
# 手工将 /tmp/artifacts.txt 的内容填入 manifest.json 的 artifacts 数组
```

**第四步：生成 manifest.json 的校验哈希**

当 manifest.json 完全填实后：

```bash
cd evidence/GO_YYYYMMDD/
sha256sum manifest.json > manifest.sha256
# 输出：abc123...（64 位 hex）  manifest.json
```

此后 `manifest.sha256` 内容为单行，即 manifest.json 文件本身的 sha256 哈希，用于防止 manifest.json 被篡改。

**第五步：验证完整性（可选）**

过门或收付证据前，可验证：
```bash
# 验证 manifest.json 未被篡改
sha256sum -c manifest.sha256
# 输出：manifest.json: OK （说明 manifest.json 内容与哈希一致）

# 验证 artifacts 中单个产物的 hash（抽查）
cd ../../frontend
sha256sum .next/static/chunks/main.js
# 对比 manifest.json 中对应 artifact 的 sha256 值
```

### 示例流程

```bash
# 1. 构建前端
cd /path/to/Wbe3-TravelTrust
cd frontend && npm run build

# 2. 创建 evidence 目录（按日期）
mkdir -p ../evidence/GO_20250306

# 3. 编写 manifest.json（手工或脚本生成 artifacts 列表）
cat > ../evidence/GO_20250306/manifest.json << 'EOF'
{
  "gate": "Gate-5",
  "date": "2025-03-06",
  "artifacts": [
    { "path": "frontend/.next/static/chunks/pages/_app.js", "sha256": "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" },
    { "path": "frontend/package.json", "sha256": "5ce0a6ba5e58e1da8b7c0e6d1c0f0a0c5a0e0a0c0f0a0c0e0a0c0f0a0c0e0a" }
  ],
  "sign_off": [ "DevOps Lead" ]
}
EOF

# 4. 生成 manifest.sha256
cd ../evidence/GO_20250306
sha256sum manifest.json > manifest.sha256
cat manifest.sha256
# 输出示例：e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  manifest.json

# 5. 在 08-2 工单 Evidence 列填写
# evidence/GO_20250306/manifest.json 或其 sha256：e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

### 注意事项

- **产物路径一致性**：manifest.json 中的 `path` 应与实际文件位置相对应（可相对于仓库根或 frontend 目录）；定稿后不可改路径，否则校验失败。
- **SHA256 格式**：务必使用小写 16 进制（awk '{print tolower($1)}'），否则校验失败。
- **工单对应**：每个 Gate 的 manifest 应与 08-2 对应工单的 Evidence 列一一对应；缺失或路径错误参与不过门。
- **无 CI 自动化**：当前无自动脚本生成 manifest；完全手工执行。发版时可由 DevOps 或 QA 按上述流程执行一次，产物提交至 evidence 目录，工单 Evidence 列贴链接即可。

**Gate 通过检查**（满足后该 bundle 方可作为门禁证据；过门时逐项勾选）：□ manifest 含 `gate`、`date`、`artifacts`、`sign_off` □ 08-4 已定稿时，manifest 内引用版本号与 08-4 文末版本一致 □ 工单 Evidence 列已贴本目录路径或 manifest hash。与 00 发版前快速核对、08-2 定稿前检查配套使用。

*勿提交敏感内容（密钥、未脱敏 PII）；仅路径与 hash、脱敏清单可入仓。*

**发版时**：每 Gate 的 08-2 Evidence 列须填 **evidence/GO_YYYYMMDD/** 或 manifest.sha256；当前占位示例见 [50-阶段 §六附 50-P14 人工项填选一览](../docs/spec/50-阶段-后续优化与开发清单.md)。

**缺口说明**：真实 `evidence/GO_YYYYMMDD/` bundle 须在过门时按上文「首次过门时」四步产出并入仓；仓内不代造真实证据。除该人工步骤外，无其他可于仓内补齐的 evidence 缺口。

**未完成部分闭环标准**：当每个 Gate 已产出 evidence/GO_YYYYMMDD/（含 manifest.json + manifest.sha256），且 08-2 对应工单 Evidence 列已填该路径或 manifest.sha256 后，即视为 evidence 未完成部分已闭环。
