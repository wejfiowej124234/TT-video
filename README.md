# TravelTrust（团队内部）

**TravelTrust** 为本团队在 **GitHub 私有仓库** 中维护的全栈项目：**Rust 后端 API**、**Next.js 前端**、**Solidity 智能合约**，以及 **`docs/`、`docs/spec/`** 下的**内部规格与工程文档**。  
**本文档以中文为准**，面向团队开发与协作；**不属于对外开源发布材料**，请勿将私有仓库内容或完整 spec 擅自对外公开或再分发。

**远程仓库（私有）**：`https://github.com/wejfiowej124234/Wbe3-TravelTrust`（与 `git@github.com:wejfiowej124234/Wbe3-TravelTrust.git` 为同一仓库，任选 HTTPS 或 SSH）。

可选能力包括：**链上托管（Escrow）**、**质押（Staking）**、**治理与费路由相关合约**、以及链下订单/社区/治理等 **REST API**。具体以代码与 [04-后端与API](docs/spec/04-后端与API.md) 为准。

---

## 重要声明（请先阅读）

- **不构成**投资、法律、税务或合规建议；**非**证券/代币/理财产品的销售要约或认购招揽。
- **不承诺收益**；文档中出现的代币或链上设计仅为**设计说明**，可能不完整或变更。
- **实验 / 持续开发中**：接口、合约与界面可能未完成；**生产环境使用前**须自行安全审计与合规评估。
- **使用自担风险**：智能合约与链上交互存在**资金损失**可能（漏洞、误操作、链重组等）；在各自职责范围内评估风险，见 [LICENSE](LICENSE)（MIT）。
- **合规由部署与运营方负责**：支付、旅游服务、KYC/AML、证券等适用法域不同，请咨询专业机构。

---

## 内部协作约定

| 项 | 说明 |
|----|------|
| **访问** | 仓库为 **Private**；仅被邀请的协作者可 clone / pull / push。新成员由管理员在 GitHub **Settings → Collaborators** 授权。 |
| **文档** | **`docs/`、`docs/spec/`** 为团队内部设计与实现的**权威说明（SSOT）**；变更大规格时按 [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) 与 [CONTRIBUTING.md](CONTRIBUTING.md) 约定同步。 |
| **密钥** | **勿提交** `.env`、私钥、真实凭证；使用根目录与 `frontend/` 的 `.env.example` 自建本地环境。 |
| **日常同步** | 开始工作前 `git pull`，完成后 `git push`；大功能用分支 + PR，由团队习惯决定。 |

### 用本地最新树覆盖远程旧内容（须全员知情）

若远程曾存在**过时或错误**的代码/文档，且团队同意**以当前本地仓库为准**丢弃远程旧历史，可在备份后由负责人执行（**危险操作**，会改写远程历史）：

```bash
git push origin main --force-with-lease
```

将 `main` 换成你们实际主分支名；执行前确保无人依赖将被覆盖的提交。更稳妥的做法是保留历史、用普通 `merge` / `rebase` 与删除文件提交逐步清理。

---

## 愿景与方向（与规格一致）

- **支付**：以稳定币托管等模式为主（代码与 spec 描述）；若规格涉及平台代币，仅表述为**手续费/质押/治理等效用向设计意图**，**不**构成募资或收益承诺。
- **信誉**：强调评价与**真实成交订单**绑定及权重等设计；具体实现随代码迭代。
- **履约**：向导质押、争议与仲裁等以 **`docs/spec/`** 为权威描述，以**已实现代码**为准。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端 API | Axum + Tower（Rust） | HTTP、中间件、与前端/链解耦 |
| 数据 | SQLx + PostgreSQL | 默认接库路径见 `docs/spec/` |
| 前端 | Next.js、React、TypeScript、wagmi、viem、WalletConnect；**R3F、drei、three.js**（部分 3D）、Framer Motion | Web 与钱包交互 |
| 共享逻辑 | `traveltrust-core`（Rust crate） | 领域类型与校验等 |
| 区块链 | EVM（Solidity + 链下集成） | 见 `contracts/` 与规格 |

## 数据形态与 DApp（概览）

- **协议与应用**：规格描述链上可验证托管等模式；账户、列表、索引等由链下服务按实现提供。
- **合约**（`contracts/src/`，详见 [contracts/README.md](contracts/README.md)）：**Escrow**、**EscrowFactory**、**Registry**、**Staking**、**FeeRouter**、**RegionVault**、**GovernanceTimelock**、**GovernanceTreasury**、**InvestorDistributionClaim** 及 Mock 等。
- **钱包**：通过 wagmi / WalletConnect 接入常见钱包；**不自研**托管钱包。

更多背景：[01-总库总览](docs/spec/01-总库总览.md)。

## 仓库目录结构

```
Wbe3-TravelTrust/
├── crates/           # Rust：traveltrust-core、traveltrust-api（链相关逻辑在 api 包内）
├── frontend/         # Next.js 应用
├── contracts/        # Solidity、Foundry 测试、ABI 导出
├── docs/             # 内部规格 docs/spec/、指南、说明（团队 SSOT）
├── ops/              # Runbook、运维说明
├── evidence/         # CI / 审计证据包（按需）
├── scripts/          # 开发与 CI 脚本，见 scripts/README.md
├── .github/          # Workflow、模板
└── README.md         # 本文件：仓库总自述（中文 · 内部）
```

权威路由与 API 列表以 **`docs/spec/04`** 与 **`crates/api/src/routes/`** 为准。

## 参与开发

- **[CONTRIBUTING.md](CONTRIBUTING.md)**：PR 流程、本地命令、文档同步约定。
- **[07-开发流程与顺序](docs/spec/07-开发流程与顺序.md)**：工程入口（阶段、审计、约定）。

## CI 与本地开发

阶段清单与 CI 预期见 [49-阶段建议](docs/spec/49-阶段建议-下一阶段方向与优先级.md) 等。**`.github/workflows/`** 中通常包含：`traveltrust-api` 的 **Rust 测试**、**前端** lint/测试、以及（若启用）**合约/ABI** 门禁。  
**合约测试**：安装 [Foundry](https://book.getfoundry.sh/) 后执行 `cd contracts && forge test`。

### 快速开始

```bash
# Rust：https://rustup.rs

# 环境变量：复制仓库根目录 .env.example → .env；前端另见 frontend/.env.example
# 可选本地数据库：在仓库根执行 docker compose up -d（见 docker-compose.yml）
cd crates/api && cargo run

# 前端（默认开发端口见 frontend 脚本，常见为 3012）
cd frontend && npm install && npm run dev
```

**前端缓存异常**（如 `.next` 损坏）：在 `frontend/` 下执行 `npm run clean` 后再 `npm run dev`。Windows 下请在 **`frontend` 目录**执行完整命令 **`npm run dev`**，不要只输入 `dev`。

**Windows 一键脚本**：`scripts\start-api-with-seed.bat`，说明见 [docs/测试账号与本地联调.md](docs/测试账号与本地联调.md)。

### 测试账号（仅本地）

见 [docs/测试账号与本地联调.md](docs/测试账号与本地联调.md)。**切勿**将默认测试账号密码用于生产。

### 运行参数（摘要）

- **`P3_CHAIN_OFF=1`**：本地演示用 mock 支付路径；**禁止**用于真实资金环境。
- **`DATABASE_URL`**：设置后启用 PostgreSQL 持久化；未设置时多为内存态（重启丢失）。迁移在 **`crates/api/migrations/`**。本地可先 **`docker compose up -d`**，再配置 `DATABASE_URL`（见上文联调文档）。

## 实现范围（高层）

- **API**：大量 **v1** 路由（见 `docs/spec/04`），含面向应用的公开接口及（若启用）**internal**（索引、对账、运维等）；以 **`crates/api/src/routes/`** 与规格为准。
- **前端**：**Next.js** 多模块 — **认证**、**订单/支付/托管/质押**、**向导/市场/discover**、**社区**（动态、私信、帖子等）、**治理**（提案、委托、费路由、金库）、**管理后台**、**争议**、**行程**、**条款/帮助** 等；页面真源为 **`frontend/app/`**。
- **合约**：`contracts/src/`；与前后端对齐说明见 [14-合约-API-ABI-前后端对齐](docs/spec/14-合约-API-ABI-前后端对齐.md)。

## 核心模块（概念，以规格为准）

| 模块 | 职责（规格口径） |
|------|------------------|
| **Registry** | 向导/用户注册与资质等字段 |
| **Escrow** | 订单资金托管、释放、与争议相关链上/链下流程 |
| **Staking** | 质押与罚没等（按规格与实现） |
| **Reputation** | 评价与订单完成态、权重等规则 |
| **争议 / 仲裁** | 证据与裁决等（API 与规格） |

代码命名可能与上表略有差异，以 **`docs/spec/`** 与源码为准。

## 合规与风险（设计原则）

- 本仓库为**内部研发与实现参考**，不能替代持牌法律/合规意见。
- **不**通过自述文档招揽投资或代币认购。
- 规格中的代币经济描述仅供团队理解设计意图；**上线与宣传须单独合规审查**。
- KYC/AML、旅游资质等以**运营地法规**为准，规格中可能仅预留扩展点。

## 文档索引

- [00-文档索引](docs/spec/00-文档索引.md) — 阅读顺序
- [01-总库总览](docs/spec/01-总库总览.md) — 总览
- [02-架构设计](docs/spec/02-架构设计.md) — 分层与域
- [03-业务流程与风控](docs/spec/03-业务流程与风控.md) — 流程与风控
- [04-后端与API](docs/spec/04-后端与API.md) — API 与数据
- [05-前端总览](docs/spec/05-前端总览.md) — 前端结构
- [06-DApp架构总览](docs/spec/06-DApp架构总览.md) — DApp 与钱包
- [07-开发流程与顺序](docs/spec/07-开发流程与顺序.md) — 开发流程
- [CONTRIBUTING.md](CONTRIBUTING.md) — 贡献指南

合规 / 审计 / CI：`docs/spec/` **08-x** 系列、[ops/RUNBOOK.md](ops/RUNBOOK.md)、[evidence/README.md](evidence/README.md)。

## 本仓库内其他 README（模块自述）

Git 托管页默认只突出**根目录 `README.md`**。各子目录另有**模块级自述**（与根自述**不重复**，侧重该目录职责），主要包括：

| 路径 | 用途 |
|------|------|
| [contracts/README.md](contracts/README.md) | 合约模块、部署与 ABI |
| [frontend/README.md](frontend/README.md) | 前端开发与构建 |
| [docs/README.md](docs/README.md) | 文档体系入口 |
| [docs/frontend/README.md](docs/frontend/README.md) | 前端文档子集 |
| [docs/backend/README.md](docs/backend/README.md) | 后端文档子集 |
| [docs/dapp/README.md](docs/dapp/README.md) | DApp 文档子集 |
| [scripts/README.md](scripts/README.md) | 脚本与门禁说明 |
| [evidence/README.md](evidence/README.md) | 证据包规范 |
| [contracts/abi/README.md](contracts/abi/README.md) | ABI 目录说明 |
| [frontend/dapp/abis/README.md](frontend/dapp/abis/README.md) | 前端 ABI 同步说明 |
| [data/README.md](data/README.md) | 数据目录说明 |
| [migrations/README.md](migrations/README.md) | 根目录迁移草稿说明 |
| [ops/monitoring/README.md](ops/monitoring/README.md) | 监控相关 |

另：`docs/spec/` 下各子目录、`frontend/components/*` 部分组件、**`contracts/lib/forge-std`**（第三方）等也有各自 `README`，属于**局部说明**；完整枚举可在仓库内搜索文件名 `README`。

## 授权条款

本仓库根目录 [LICENSE](LICENSE) 为 **MIT**。在**私有仓库**内，该条款约束本拷贝的使用与再许可方式；**不**表示将仓库或文档对外开源分发；对外发布须单独决策与授权。
