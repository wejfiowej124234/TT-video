# TT-LOCAL-CI-DELIVERY-GATE-001 · 本地 / VPS 交付门禁（绕开 GitHub-hosted 计费）

**Version:** 1.0.3  
**Status:** `Target`（与 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md) §5.0** 对读：**组织 gate 未解除** 时 **以本节为交付真门禁**；**不**宣称替代 **07** 或 **分支保护** 的长期策略）

**文档对齐勘误（2026-04-19）**：若你 **已按 §2 跑通** 本地 / VPS 交付门禁并留证，随后仓库仅合入 **spec/母表/27 索引/59 B1 行** 等 **纯文档勘误** 与 **`internal` 测试文件顶栏未使用 `use` 清理**，**不**构成 **§2 全量重跑** 的硬性理由；收口材料可 **一行** 指向 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md)** **§10**（**文档对齐勘误**）与 **[TT-ALIGN-DOCS-CODE-MOTHER-AUDIT-2026-04-19](./TT-ALIGN-DOCS-CODE-MOTHER-AUDIT-2026-04-19.md)** **§8**。**若 diff 触及 `frontend/` 路由、`crates/api` 契约路径或合约 ABI**，仍须按 **§2** 与 **CONTRIBUTING** 对本次变更范围重跑相关门禁。

## 0. 固定打法（日常节奏）

| 节奏 | 做什么 | 备注 |
|------|--------|------|
| **日常** | **本地 / VPS** 跑 **§2** 交付门禁（入口：**`bash scripts/gates/ci-local-delivery-minimum.sh`** 等，见 **[scripts/README.md](../../scripts/README.md)**） | **交付与验收以本节为真判据**；母表 **[B-499](../任务母表.md)** 已写明：**GitHub-hosted 未恢复不阻塞交付**，统一转按 **本篇** 执行。 |
| **定期** | 在 **GitHub Actions** 对 **`Build`** 最新 run **Re-run**，**只验证** hosted 是否恢复（**非空 Steps** + **`actions/checkout`** 级日志） | **判读** 仍按 **[TT-L4-PARALLEL-CI-001 §5.0](./TT-L4-PARALLEL-CI-001.md)**：未见 checkout 前，**不把 hosted 红叉当仓库内回归**。可选机读：`bash scripts/dev/gh-actions-check-run-annotations.sh build.yml`。 |
| **需要 PR Checks 时** | 上 **self-hosted runner**，**先试点只迁一个 job** 的 **`runs-on:`**（见 **§3**、[Adding self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/adding-self-hosted-runners)），确认 **checkout** 与后续 step 后再扩大 | **不占 hosted 分钟**；与 **§5.0** 对读。 |

## 1. 背景与边界

- **GitHub-hosted Actions** 因 **组织 Billing / spending limit** 等 **无法调度** 时，**PR 上的绿勾 / 红叉** 可能 **不可信**（见 **TT-L4-PARALLEL-CI-001 §5.0**）。  
- **本节**给出 **不依赖 GitHub-hosted 分钟**、**当天可执行** 的 **交付门禁顺序**：先 **本地 / VPS 脚本**；**Billing 恢复后** 再接 **GitHub 展示层**（hosted 或 self-hosted）。  
- **真源**：具体命令与脚本索引仍以 **[scripts/README.md](../../scripts/README.md)** 为准；本节只做 **编排与决策**。
- **文档真源**：**`snapshots/`**、**`archive/`**、**`docs/spec/27-archived/`** **等** **归档** **或** **快照** **路径** **非** **SSOT** **；** **工程** **口径** **以** **[** **00-文档索引** **](../spec/00-文档索引.md)** **版本** **表** **及** **主线** **spec** **（** **如** **04** **/** **07** **/** **14** **）** **为准** **。**

## 2. 阶段一：先保交付（本地 / VPS 真门禁）— **最推荐**

**目标：** **合并 / 发版前** 在 **本机或自建 VPS** 跑通与仓库已约定一致的检查，**不**被 **GitHub Billing** 阻塞。

| 层级 | 建议命令 / 入口 | 说明 |
|------|-----------------|------|
| **最小三连（Rust + 路由 + 元数据）** | **`bash scripts/gates/ci-local-delivery-minimum.sh`**（薄封装）或手跑 **[scripts/README.md](../../scripts/README.md)「提交前自检三连」** | **`cargo test -p traveltrust-api`**、**`run-check-04-routes`**、**`check-pr-crates-needs-metadata`** |
| **企业级预检（不启服务）** | **`bash scripts/enterprise-preflight.sh`**（或 Win **`enterprise-preflight.ps1`**） | 见 **scripts/README** 篇首 |
| **Gate 子集（按需）** | **`scripts/gates/*.sh`** 中与本次 diff 相关的门禁 | 与 **[00-文档治理总册 §8.3](../spec/00-文档治理总册.md#doc-audit-gates-ssot)**、各 Runbook 引用一致 |
| **前端构建 / 单测** | 在 **`frontend/`**：**`npm ci`**（或已装依赖）→ **`npm run build`** → **`npm test`**（若有） | 与 **05**、**36** 对读 |
| **E2E（Sepolia 全栈）** | 根目录 **`.env`** 与 **[TT-L4-PARALLEL-CI-001](./TT-L4-PARALLEL-CI-001.md) §3** 条件满足时：**`cd frontend && npm run e2e:sepolia`** | **重**、**须** API + DB + 链上环境；**非**每次 commit 必跑，**发版 / 大改** 前强建议 |

**VPS：** 与本地相同：clone **`main`** → 配置 **`.env` / `DATABASE_URL`** → **cron** 或 **systemd timer** 调用上表脚本；失败时 **exit 非 0** 发告警即可。

## 3. 阶段二：再补团队可见性（**第二推荐**）

- **GitHub Actions + [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/about-self-hosted-runners)**：**保留** **`.github/workflows/*.yml`**，将有关 job 的 **`runs-on`** 改为 **`self-hosted`**（或 label），**执行在自有机器 / VPS**，**一般不占 GitHub-hosted 分钟**。  
- **前提**：组织策略 **允许** 注册 self-hosted；runner **安全加固**（仅跑受信仓库、网络隔离、密钥轮换）。  
- **与 §5.0**：self-hosted **若** 能出现 **checkout 级日志**，**组织 gate（计费未调度）** 可视为对该 job **已解除**；**判读** 仍以 **TT-L4 §5.0** 为准。

## 4. 方案排序（决策表）

| 优先级 | 方案 | 适用 |
|--------|------|------|
| **1** | **混合**：阶段一真门禁 + Billing 恢复后接 GitHub 展示（hosted 或 self-hosted） | **当前默认**；**交付不中断** |
| **2** | **仅 self-hosted**（尽快上 runner，少依赖 hosted） | 要强 **PR Checks** 且 **自有机器** 可持续在线 |
| **3** | **纯等 GitHub-hosted 恢复** | **不推荐** 作为 **唯一** 路径（被动） |

## 5. 相关链接

- **组织侧计费与机读注解**：[TT-L4-PARALLEL-CI-001 §5.0～§5.1](./TT-L4-PARALLEL-CI-001.md)  
- **脚本总索引**：[scripts/README.md](../../scripts/README.md)  
- **母表 B-499**（Actions SSOT）：[任务母表.md](../任务母表.md) **B-499** 行  
- **PR 路径与 CI workflow 约定**：[CONTRIBUTING.md](../../CONTRIBUTING.md)
