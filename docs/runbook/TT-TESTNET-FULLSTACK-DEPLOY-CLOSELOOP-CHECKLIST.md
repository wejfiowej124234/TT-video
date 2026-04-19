# 测试网全栈部署与联调闭环清单（五步）

**定位**：在 **不推进主网** 的前提下，把 **治理栈 + 资金栈 + 业务合约** 部署到 **同一测试网**，完成 **本地站点 ↔ 测试网合约** 全链路验证，并落盘 **可复核证据包**。细则与裁断仍以 **[`contracts/README.md`](../../contracts/README.md)**、**[`TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)**（资金栈封口）、**[母表 B-434/B-435](../任务母表.md)** 为准；本页为 **操作顺序清单**，不替代上述真值。

**TTG v2 全量重建（旧测试网地址与旧证据作废）**：拍板 **A～H** 与 **逐步执行表（步骤 0～11）** 以 **[82-治理币-文档总览 · §三之二 · §10](../spec/82-治理币-文档总览.md)** 为 SSOT；本文 **五步** 与 **§10** 同向，**先 §8 拍板再执行**。

### 入口与产出：第二代治理体系（TTG v2）

**可直接进入的主线**：**重新部署治理栈（新 TTG）** → **按下文五步做环境 / 前端 / 观测对齐** → **新一轮测试网封口**（**仅使用新 `evidence/.../run_<UTC>/`**）。

**本轮将建立一套全新链上真值（须整批写入台账与 `.env`，与旧代无自动继承）**：

| 变量 | 角色 |
|------|------|
| **`GOVERNANCE_TOKEN_ADDRESS`** | **TTG**（**`GovernanceVotesToken`**；钱包「导入代币」用此地址，**勿**填 **`GOVERNOR_ADDRESS`**） |
| **`GOVERNOR_ADDRESS`** | **TravelTrustGovernor** |
| **`TIMELOCK_ADDRESS`** | **GovernanceTimelock** |

**叙事**：当前不是在「修系统」，而是在 **生成第二代治理体系（TTG v2）**——**所有**依赖 Governor / Timelock / 治理票的索引、`.env`、`GET /meta`、脚本与证据，均以 **本轮 `forge --broadcast` 产出地址** 为 **SSOT**；旧提案 id、旧 tx、旧 `run_*` **不得**混入本轮封口，除非运维台账中另有**显式**归档 / 对照说明。

**改 `name` / `symbol` 等元数据（以 TTG 为准）**：这不是「改一行文案」。链上 **`name()` / `symbol()`** 与 **Governor `token()`**、**Timelock**、**`setAllowedExecutionTarget`**、历史 **proposalId** 均锚定在**已部署地址**；改源码**不会**迁移旧部署。须按 **合约 → 广播部署 → 根 `.env` 全量回填 → 重启 API（`/meta` 新真值）→ `sync-abi-from-forge` + `check-55-s13` 与前端 `NEXT_PUBLIC_*` 同源 → 新开证据目录再封口** 全链路对齐；**不得**沿用旧地址或旧 `/meta` 冒充 **TTG v2**。

**推荐网络**：Sepolia（`CHAIN_ID=11155111`）等已配置的测试网；**`CHAIN_RPC_URL` / `CHAIN_ID` / 部署账户** 须全程一致。

### 最容易踩的坑（提前挡掉）

| 坑 | 为何错 | 正确做法 |
|----|--------|----------|
| **只改 Token 源码，不重部署整条治理栈（含 Timelock）** | 链上 **`name`/`symbol`/逻辑** 以**已部署合约**为准；Governor **`token()`**、Timelock **允许目标** 与旧地址绑定，**只换「代码」不换链上实例**会导致 **Governor / Timelock / TTG** 引用断裂或与 `.env` 自洽失败。 | 改 **`GovernanceVotesToken`** 等治理相关合约后，用 **`DeployGovernanceStack.s.sol`** **整栈重部署**，**整批更新** **`GOVERNOR_ADDRESS` / `TIMELOCK_ADDRESS` / `GOVERNANCE_TOKEN_ADDRESS`**（及依赖它们的脚本与台账）。 |
| **ABI 未同步** | `contracts/abi` 与 **`forge build` 产物** 不一致时，Explorer/cast/链下工具与 **`frontend/dapp/abis`** 子集可能对**错函数/错事件**。 | 仓库根执行 **`scripts/sync-abi-from-forge.sh`**（或 **`.ps1`**），按脚本提示处理 **55-S13** 子集，并跑 **`scripts/check-55-s13.sh`**（见 **`contracts/abi/README.md`**、**Runbook §12.4**）。 |
| **改了根目录 `.env` 但未重启 API** | **`GET /meta` → `chain.contracts`** 来自进程内 **`ChainConfig`**；不重启则仍返回**旧地址**，前端/联调误以为已对齐。 | 更新 `.env` 后 **重启 `traveltrust-api`**（或你方等价部署流程），再 **`curl` /meta** 核对。 |
| **复用旧 `run_<UTC>/` 目录做新一轮封口** | 证据包若混入**旧 proposal / 旧 tx / 旧 chain_id**，第三方复验会 **FAIL**，母表也不可标「已做」。 | **每一轮**测试网 closeout **新建** **`evidence/.../run_<UTC>/`**（可用 **`scripts/ops/tt-testnet-fullstack-new-run-dir.sh`**），**禁止**在已封口目录上覆盖混写。 |

---

## 一、合约部署（同一套地址）

**目标**：测试网上存在 **一套** 可互认的合约地址（治理 Timelock / Governor / Token + Escrow/Registry/质押 + FeeRouter/RegionVault/Treasury/ReserveVault 等），**禁止** 在未留痕的情况下混写两套 `TIMELOCK_ADDRESS` / `GOVERNOR_ADDRESS`。

| 顺序 | 动作 | 说明 |
|------|------|------|
| 1 | **治理栈**（若本轮需要完整 Governor + Votes Token + Timelock） | 使用 **`contracts/script/DeployGovernanceStack.s.sol`** 广播；记录 **Governor / GovernanceVotesToken（TTG）/ GovernanceTimelock** 等地址。命令与约束见 **[`contracts/README.md`](../../contracts/README.md)**「治理栈」段。 |
| 2 | **资金栈**（在 **已有** `GovernanceTimelock` 裁断地址上） | **不要** 无改广播整包 **`Deploy.s.sol`**（会 `new GovernanceTimelock`，与 **B-434 方案 B** 冲突）。使用 **`DeployFundStackUnderTimelock.s.sol`**，**`TIMELOCK_ADDRESS`** 与 **`cast call … admin()`** / **`PRIVATE_KEY`** 对齐后再 **`--broadcast`**。详见 **[`TT-B435`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)** §2～§3。 |
| 3 | **业务与工厂**（EscrowFactory、Registry、双质押池等） | 按当前仓库 **`Deploy.s.sol`** 或已约定的拆分脚本，在 **同一 `CHAIN_RPC_URL`** 上部署；确保 **Escrow 创建路径** 指向的 **`platformFeeRecipient`**（通常为 **FeeRouter**）与资金栈地址一致（**[`contracts/README.md`](../../contracts/README.md)** FeeRouter 段）。 |
| 4 | **落盘** | 保留 **`contracts/broadcast/.../run-latest.json`**（或等价广播日志）、区块浏览器链接、**部署交易哈希** 列表。 |

**出口判据**：能在 Explorer 上逐地址核对 **owner / admin / timelock 归属** 与 README 设计一致；**Timelock `admin()`** 与资金栈广播私钥 **同一 EOA**（见 TT-B435 §3.0）。

---

## 二、地址回填与对齐（`.env` / API / 前端）

**目标**：运行中的 **API `GET /meta`** 与 **本地前端** 读到的 **链 ID、RPC、合约地址** 为 **同一套**，避免「后端连 A 地址、前端连 B 地址」。

| 层级 | 检查项 |
|------|--------|
| **根 `.env`（API）** | **`CHAIN_RPC_URL`、`CHAIN_ID`** 与测试网一致；**`FEE_ROUTER_ADDRESS`、`REGION_VAULT_ADDRESS`、`ESCROW_FACTORY_ADDRESS`、`REGISTRY_ADDRESS`、`GUIDE_STAKING_ADDRESS`、`STAKING_PROVIDER_ADDRESS`、`TREASURY_ADDRESS`、`GOVERNOR_ADDRESS`、`GOVERNANCE_TOKEN_ADDRESS`** 等与部署结果一致（键名以 **[`.env.example`](../../.env.example)** / **P5** 为准）。 |
| **链下开关** | 真实联调验收时 **`P3_CHAIN_OFF`** 勿误开为链上 mock；与 **[`RUNTIME_CHAIN_SSOT_CHECKLIST.md`](../../evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md)** 一致。 |
| **前端** | **`frontend/.env.local`**（或等价）中 **`NEXT_PUBLIC_*`**：**链 ID、RPC、各合约地址** 与 API **`/meta`** 同源；**`NEXT_PUBLIC_API_BASE_URL`** 指向当前联调 API。 |
| **机读对拍** | 启动 API 后执行 **`GET /meta`**，核对 **`chain.chain_id`、`chain.contracts.*`** 与 Explorer 上部署地址一致。 |

**出口判据**：**单源**：以 **部署台账 + `/meta`** 为准，前端与 CI 不再手写第二套地址。

---

## 三、本地前端联调（站点 ↔ 测试网）

**目标**：用 **本地 URL**（如 `http://localhost:3012`）访问前端，**实际连到** 上一步配置的测试网与 API。

| 检查项 | 说明 |
|--------|------|
| **CORS** | API **`CORS_ORIGINS`** 包含本地前端 origin（见 **`.env.example`** 注释）。 |
| **钱包网络** | 浏览器钱包 **切换到测试网**；链 ID 与 **`NEXT_PUBLIC_*`** 一致。 |
| **连接与读** | 钱包连接成功；**托管 / 市场 / 治理** 等页能加载 **无链上读错误**（或仅有已知的链上读降级横幅且与托管页 **B-068** 口径一致——以产品为准）。 |
| **SSOT 轻量校验** | 按 **[`scripts/ops/runtime-chain-ssot-cast-verify.sh`](../../scripts/ops/runtime-chain-ssot-cast-verify.sh)**（或 TT-B435 引用的 runtime 脚本）核对 **`feeRouter.owner()`** 等与 **`TIMELOCK_ADDRESS`** 一致。 |

**出口判据**：核心页面在 **真实测试网配置** 下可稳定打开，**无明显错链 / 错合约**。

---

## 四、真实交易验证（扣款 · 状态 · 观测）

**目标**：至少一条 **用户钱包签名** 的链上交易走完业务闭环，且 **后端观测** 与链上一致。

| 顺序 | 验证点 | 说明 |
|------|--------|------|
| 1 | **真实交易** | **MetaMask（或等价）签名**；保留 **tx hash**；Explorer 可查 **成功**。 |
| 2 | **资金语义** | **扣款 / 入金 / 分账** 与业务预期一致；注意 **若使用新 `MockERC20`**，须在钱包中查看 **该 token 合约地址** 的余额（见 **TT-B435** §「FUND_STACK_TOKEN_ADDRESS」表）。 |
| 3 | **订单 / 托管状态** | 前端 **订单状态** 与链上阶段一致（accept、deposit、release 等按产品路径）。 |
| 4 | **Indexer / Reconcile / Overview** | 对运行中 API 调用 **`POST …/internal/indexer-tick`**（或运维等价）、**`POST …/internal/indexer-reconcile`**、**`GET …/admin/observability/overview`**（须 **admin 会话**）；结果与 **B-383 / B-384 / B-415** 等键语义对拍。 |
| 5 | **Runtime SSOT** | **`bash scripts/ops/runtime-chain-ssot-cast-verify.sh`**（环境变量与 **§二** 一致）通过；**`feeRouter.owner() == TIMELOCK_ADDRESS`** 等关键等式成立。 |

**出口判据**：**链上 tx** + **DB/投影** + **overview** 三者叙事一致，无「链上已付、后台仍草稿」类双源撕裂。

---

## 五、证据封口（测试网 closeout 包）

**目标**：形成 **可追溯** 的 **`run_<UTC>/`**（或项目约定的证据目录），使 **「本地前端 + 测试网合约」** 稳定状态可被第三方复验。

| 内容 | 说明 |
|------|------|
| **部署与交易** | **部署 tx**、**业务关键 tx** 列表（如 **`tx_hashes.json`**）。 |
| **观测快照** | **`indexer_tick.json`、`reconcile.json`、`overview.json`**（与 **TT-B435** §3.4 / 既有 B-435 证据结构对齐）。 |
| **README** | **`deployment_chain_id`、合约地址表、所用 commit、RPC 类型（不写私钥）**；**`verdict`/`GO` 语义** 与母表要求一致。 |
| **脚本** | 若使用 **`scripts/ops/b435-*`** 等收口脚本，保留 **命令行与环境变量说明**（可抄 **`.env.example`** 注释）。 |
| **参考路径** | 已封口示例：**[`evidence/b435_fullstack_fund_testnet_closeout/run_20260417T003342Z`](../../evidence/b435_fullstack_fund_testnet_closeout/run_20260417T003342Z)**；Runbook：**[`TT-B435`](./TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)** §3.7。 |
| **脚手架脚本** | **新建** **`run_<UTC>/`** **骨架** **：** **`bash scripts/ops/tt-testnet-fullstack-new-run-dir.sh`** **；** **填齐** **`tx_hashes.json`** **且** **API** **就绪** **后** **收口** **`indexer_tick.json`** **/** **`reconcile.json`** **/** **`overview.json`** **/** **`ssot.txt`** **：** **`bash scripts/ops/tt-testnet-fullstack-seal.sh`** **（** **互** **`b435-merge-first-payment-tx`** **/** **`b435-evidence-internal-curls`** **）** **。** |

**出口判据**：证据目录 **自洽**（JSON 内 **chain_id** 与 README 一致）；母表 **B-435** 等 **仅在满足 TT-B435 封口条件后** 可标为已做。

---

## 与主网的关系

**本清单完成前，不进入** **[`TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001`](./TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md)** **主网预发布**；主网最终执行顺序见 **[`TT-MAINNET-MAINNET-LAUNCH-FINAL-EXEC-CHECKLIST.md`](./TT-MAINNET-MAINNET-LAUNCH-FINAL-EXEC-CHECKLIST.md)**（**G0～G6+SL** 前提）。
