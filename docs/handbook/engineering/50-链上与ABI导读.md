# 50-链上与 ABI 导读（合约源码 · `contracts/abi` · 55-S13）

**Version:** 1.0.11 · **最后更新：** 2026-04-29  
**受众**：后端 / 全栈 / 合约（改 **`contracts/src`**、**`contracts/abi`**、**`frontend/dapp/abis`**、或 **链上读数 / `GET /meta` 契约** 时）  
**状态**：现行  
**与 spec 关系**：**partial** — 把 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** 与 **`contracts/`** 的**工程落点**写成可导航的九节导读；**不替代** **[14](../../spec/14-合约-API-ABI-前后端对齐.md) §1.1 模块表**、**[04 §3.4](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 表体；**不**在文内粘贴 ABI JSON 或 **14** 宽表。  
**来源**：[14-合约-API-ABI-前后端对齐](../../spec/14-合约-API-ABI-前后端对齐.md) · [contracts/README](../../../contracts/README.md) · [contracts/abi/README](../../../contracts/abi/README.md) · [ops/RUNBOOK §12.4](../../../ops/RUNBOOK.md)（ABI 同步有序清单）  
**与 spec 覆盖关系**：partial  

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

> **SSOT 边界（防误用）**。**ABI 与链上契约最小规则（不扩写）**：**Solidity 行为**以 **`contracts/src`** 为准；**canonical ABI JSON** 以 **`contracts/abi`** 为准；**DApp 加载子集**以 **`frontend/dapp/abis`** 与 **`check-55-s13`** 为准；**模块/方法/对齐叙述**以 **`spec/14`** 为准；**v1 HTTP 与 `/meta` 键**以 **04 §3.4** 为准。**engineering/50** 仅导读与链指，**不**与上列并列 SSOT。

**先读**：[06-工程模块技术文档编制契约](./06-工程模块技术文档编制契约与验证闭环.md) · [04-HTTP与路由契约导读](./04-HTTP与路由契约导读.md) · [08-文档与spec迁移台账](./08-文档与spec迁移台账.md)

---

<a id="b50-1-scope"></a>

## 1. 模块职责（L1）

- **解决**：在**不复制** **14 §1.1** 表体、**不**内嵌 ABI JSON 的前提下，说明 **Solidity 源码 → `contracts/abi` →（按 55-S13）`frontend/dapp/abis` → HTTP/`GET /meta` 暴露地址** 的**责任边界**与**合入门禁**。  
- **与 [41-D](./41-D-索引与对账导读.md) 分工**：**本篇**主扛 **ABI 真值与 DApp/脚本同步**；**索引器事件 → DB → 只读 API** 主扛 **41-D** + **[110](../../spec/110-阶段开发链上索引器与事件同步器.md)**。  
- **与 [20-B](./20-B-订单机制.md) / [21-B](./21-B-市场与托管机制.md)**：订单与托管 **HTTP** 仍以 **04** 为准；链上 **Escrow** 方法名与事件以 **合约 + 14** 为准。

---

<a id="b50-2-mechanism"></a>

## 2. 核心机制（L2）

1. **三层真值**（与 **14 §1.2** 一致）：**`contracts/src/*.sol`** 为行为真值；**`contracts/abi/<Contract>.json`** 为机读 ABI 单源（canonical）；**`frontend/dapp/abis/`** 为 DApp 实际加载子集（**须**与 **55-S13** 声明的合约集合 **字节一致**，**Escrow** 等允许「精简 ABI」但须与调用一致，见 **14** 与 **`scripts/gates/check-55-s13.sh`**）。  
2. **导出与校验**：本地可用 **`./scripts/sync-abi-from-forge.sh`**（须 **Foundry**）刷新 **`contracts/abi/`**，再按 **Runbook §12.4** 顺序跑 **`check-55-s13`**；CI 侧 **`contract-abi-gate.yml`** 跑 **`forge test`** + **`run-verify-abi-forge.sh`**（与 **14 §1.1.1** checklist 同源族）。  
3. **HTTP 与链上地址**：**`GET /meta`**、**`governance/*`** 等路径上出现的 **`chain.contracts.*`** 键名与 **env** 对齐关系以 **04 §3.4** 为准；**14** 提供合约侧锚点叙述（如 **B-110** 与 **`balanceOf`** 读数分工），**冲突时以 04 为准**。  
4. **`contracts/planned/`**：仅叙事/占位旁注（见 **`planned/README.md`**），**不参与** **`forge build`** 真值；与 **14 §1.1.0c** 一致。

---

<a id="b50-3-model"></a>

## 3. 数据与状态模型（L2～L3）

- **ABI 文件**：按合约名命名的 JSON；**旧 `Staking.json` 路径已移除**（见 **`build.yml`** 与 **14** 读前摘要）。  
- **环境变量与 meta 键**：部署地址类（如 **`FEE_ROUTER_ADDRESS`**、**`REGION_VAULT_ADDRESS`**、**`ONBOARDING_FEE_RECEIVER_ADDRESS`**）以 **Runbook**、**`.env.example`**、**04** 散文窗为 SSOT；**本篇不**维护 env 全表。  
- **链下投影**：事件落库、对账键与 **110 / 96-08** 绑定；不在本篇展开。

---

<a id="b50-4-relations"></a>

## 4. 系统关系（强制）

| 真源 | 与本导读关系 |
|------|----------------|
| **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** | 模块 ↔ 方法/事件 ↔ 前后端分工的**叙事与检查报告入口** |
| **[04 §3.4](../../spec/04-后端与API.md)** | **v1 HTTP** 路径与 **`chain.contracts.*`** 机读键 |
| **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** | 族名脚注（如 **55-S13**、**B-MKT**、治理族）；**不**在此抄矩阵 |
| **[contracts/README](../../../contracts/README.md)** | 目录职责、部署与 **Foundry** 操作入口 |
| **`contracts/src/`** | 已部署逻辑真值 |
| **`scripts/gates/check-55-s13.sh`** | **`contracts/abi` ↔ `frontend/dapp/abis`** 字节对齐门禁实现 |
| **[ops/RUNBOOK](../../../ops/RUNBOOK.md) §12.4** | **sync-abi → 前端 → check-55 → Contract ABI Gate** 顺序 |

---

<a id="b50-5-usage"></a>

## 5. 工程使用方式

- **团队口径**：与 **[engineering/README](./README.md)** 段首同条 — **engineering 仅为导读，不替代 spec**；**ABI 侧**契约仍以 **14**、**`contracts/`**、**`check-55-s13`** 等脚本为 SSOT；**v1 HTTP** 仍以 **04 §3.4** 与 **`run-check-04-routes`** 为准（**04 §3.4、93、14、代码与脚本** 枚举与 **09** 文首一致）。  
- **PR 闭包（团队口径）**：凡动 **`contracts/src`** / **`contracts/abi`** / **`frontend/dapp/abis`** 的 PR，**须**在本闭包内落齐 **`forge build` / `forge test`**（或 **CI `contract-abi-gate`** 等价证据）→ **`bash scripts/check-55-s13.sh`** → **exit 0**；若 **04 §3.4** 或 **`/meta`** 键受影响，**同 PR** **`run-check-04-routes`** **exit 0** 并更新 **04** 窗内表行。**禁止**仅以 **handbook/50** 散文合入。**HTTP** 细则见 **[04 · §1a](./04-HTTP与路由契约导读.md#hb-eng-04-drift-checklist)**。  
- **改接口**：先改 **`contracts/src`** 与 **`contracts/test`** → **`forge build` / `forge test`** → **`sync-abi-from-forge`** → **`bash scripts/check-55-s13.sh`**；若 **04** 已登记路由或 **`/meta`** 键受影响，**同批** **`run-check-04-routes`** 与 **04** 散文窗。  
- **只改前端调用**：仍须满足 **55-S13**；**禁止**手写与 **`contracts/abi`** 冲突的 selector。  
- **未装 Foundry**：见 **[contracts/LOCAL-FOUNDRY.md](../../../contracts/LOCAL-FOUNDRY.md)**；合入前依赖 CI **`contract-abi-gate`** 或本地补齐工具链。

---

<a id="b50-6-verify"></a>

## 6. 工程验证（强制）

**ABI 与 DApp 镜像（**55-S13** / **14 §1.2**）**

```bash
bash scripts/check-55-s13.sh
```

**路由与 04 §3.4 对拍（链上相关 API 变更时必跑）**

```bash
bash scripts/run-check-04-routes.sh
```

**handbook（改本文或同批 **engineering** / **corpus REG** 时）**

```bash
bash scripts/check-handbook-frontmatter.sh
bash scripts/check-handbook-engineering-content.sh
```

**§2b 证据（14-chain-abi 簇）：** [EVIDENCE-14-chain-abi-cluster-verified](./EVIDENCE-14-chain-abi-cluster-verified.md#ev14abi-v1)（**[09 §2b.5](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-14chainabi)** **V-1～V-3**；**[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** **spec/14** 行 **覆盖度 full**；**14** 表体仍在 **spec/14**）

---

<a id="b50-7-debug"></a>

## 7. 调试与排错（强制）

| 现象 | 优先查看 |
|------|----------|
| **`check-55-s13` 报字节不一致** | 是否漏跑 **`sync-abi-from-forge`**；**`frontend/dapp/abis`** 是否手工改残 |
| **`run-check-04-routes` 失败** | **04 §3.4** 是否未登记新 **`/api/v1/...`**；与链上字段无关时先查 **04** |
| **本地无法 `forge test`** | **`contracts/lib/forge-std`**、**`LOCAL-FOUNDRY.md`**；CI 见 **`contract-abi-gate.yml`** |
| **索引/对账与链上事件不一致** | **41-D**、**110**、**internal/indexer-tick** 路径（**非**本篇主域） |

---

<a id="b50-8-limits"></a>

## 8. 边界与限制

- **本篇不覆盖**：**110** 级索引器运维、**FeeRouter** 后经济叙事全量（回 **14 / 83 / 84**）、**主网资金 GO**（根 **README** 三阶口径）。  
- **禁止**：在 handbook 中嵌入 **04/93** 表体或完整 ABI JSON；以「导读已写」为由 **删除 `../../spec/14`**（须 **08 §2** + **SPEC-MIGRATION**）。  
- **① / ② / ③**：本地脚本与 CI 绿**不等于**生产链上终验（**96-07 / go-live** 另闸）。

---

<a id="b50-9-refs"></a>

## 9. 参考（强制，只引用）

- **spec**：[14](../../spec/14-合约-API-ABI-前后端对齐.md) · [14-附录-API与ABI对齐检查报告](../../spec/14-附录-API与ABI对齐检查报告.md) · [04](../../spec/04-后端与API.md) · [93](../../spec/93-全站功能验证矩阵-域别回归清单.md) · [06-DApp架构总览](../../spec/06-DApp架构总览.md) · [110](../../spec/110-阶段开发链上索引器与事件同步器.md)  
- **仓库**：[contracts/README](../../../contracts/README.md) · [contracts/abi/README](../../../contracts/abi/README.md) · [scripts/README](../../../scripts/README.md)  
- **handbook**：[04-HTTP导读](./04-HTTP与路由契约导读.md) · [41-D](./41-D-索引与对账导读.md) · [20-B](./20-B-订单机制.md) · [21-B](./21-B-市场与托管机制.md)

---

## 盲测验收（Owner / 评审）

1. **§6** 能否找到 **`check-55-s13`** 与 **`run-check-04-routes`**？  
2. **§4** 是否显式链 **14 / 04 / contracts/README**？  
3. **ABI canonical** 目录是哪一层（**`contracts/abi`** vs **`frontend/dapp/abis`**）？  
4. 本文是否**未**粘贴 **14 §1.1** 宽表或 ABI JSON？

---

**Reviewed-by:** @ghost 2026-04-28（默认 **CODEOWNERS**；替换规则见 [EVIDENCE-14-chain-abi-cluster-verified §V-3](./EVIDENCE-14-chain-abi-cluster-verified.md#ev14abi-v3)）

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.11 | 2026-04-29 | **§2b**：补 **08 §3**（**spec/14**）与 **09 §3** **14-chain-abi verified** 三向对拍句（与 **EVIDENCE-14-chain-abi** **V-1** 台账段互指）。 |
| 1.0.10 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.9 | 2026-04-29 | **§5**：增 **团队口径** 与 **README/09** 同条（**14、contracts、脚本** + **04 §3.4**）；与 **治理收口** **同批**。 |
| 1.0.8 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.7 | 2026-04-29 | **§5** 首条增 **PR 闭包**（**14/contracts/55-S13** + 触 **04** 时 **`run-check-04-routes`**；互指 **04 §1a**）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT** 与 **README**/ **手册 00 §3** / **三处对拍** 同形（**不**扩写 **14** 表体）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT 边界** 前缀（与同目录 **0x** 篇检索口径一致；**SSOT** 与 **ABI 最小规则** 句间用句号，避免连续 `：`）；语义同 **1.0.2**。 |
| 1.0.2 | 2026-04-29 | 文首 **ABI 与链上契约最小规则** 块（**contracts/src**、**contracts/abi**、**dapp/abis+55-S13**、**spec/14**、**04 §3.4**；**50** 不并列 SSOT）。 |
| 1.0.1 | 2026-04-28 | **`contracts/`** 外链由 **`../../contracts/`** 更正为 **`../../../contracts/`**（相对 **`engineering/`** 三跳到仓根；与 **I5** 本地链检查一致）。 |
| 1.0.0 | 2026-04-28 | 首版：**14 + contracts** 链上执行层导读；**§6** + **§2b** 证据链。 |

---

**上一篇**：[42-D-Admin审计合规与审批](./42-D-Admin审计合规与审批.md) · **下一篇**：[engineering README](./README.md) · **索引**：[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)
