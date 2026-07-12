# 治理币（Governance Token）文档目录

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **协议数值 / 辖区 bps / 锁仓层级（P0 · 唯一写入口）** | **[protocol-ssot.v1.md](protocol-ssot.v1.md)** — **84/89/96/合约/API/前端禁止自写数字** |
| **四类资金分轨 / Vault / 可退不可退** | **[fund-flow-ssot.v1.md](fund-flow-ssot.v1.md)** |
| **Steward / Country / Redemption 状态枚举** | **[state-machine.v1.md](state-machine.v1.md)** |
| **TTG 分配 · 权限 · 申请流程（图解 SSOT · 改逻辑必改图）** | **[ttg-allocation-permissions-flows-ssot-v1.md](ttg-allocation-permissions-flows-ssot-v1.md)** |
| **TTG Tokenomics V1 · GOV-01～04（FROZEN · Gate-2.4 读口）** | **[TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md)** · **[Final Audit Report](TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md)** |
| **5 分钟看懂全治理系统（总图 · 首选）** | **[TTG-GOVERNANCE-LIFECYCLE.md](TTG-GOVERNANCE-LIFECYCLE.md)** |
| **Governance Framework V1.1 已冻结？** | **[TTG-GOVERNANCE-FREEZE-CERTIFICATE.md](TTG-GOVERNANCE-FREEZE-CERTIFICATE.md)** |
| **Genesis 治理启动解释** | **[GENESIS-GOVERNANCE-PHASE.md](GENESIS-GOVERNANCE-PHASE.md)** |
| **Public 治理阶段 · 成熟 DAO 生命周期** | **[PUBLIC-GOVERNANCE-PHASE.md](PUBLIC-GOVERNANCE-PHASE.md)** · 阈值 **[registry/governance-phase-transition.v1.yaml](../../registry/governance-phase-transition.v1.yaml)** |
| **公众三轮 · P4 治理 · Seat 解锁退出（Owner 拍板）** | **[ttg-primary-market-and-exit-policy-v1-draft.md](ttg-primary-market-and-exit-policy-v1-draft.md)** |
| **总览与联动** | **[82-治理币-文档总览](../82-治理币-文档总览.md)**、**[83](../83-区域治理与收益分配-协议白皮书.md)**、**[84](../84-第一阶段10国Country-Pool发行参数总表.md)**（**§四 fee 列镜像 protocol-ssot §4**） |
| **对外口径** | **[08-4](../08-4-对外口径包.md)** |
| **本目录文件表** | **下文「文件清单」** |

本目录为 TravelTrust **治理币 / 协议治理代币** 主题的专题库，与 **[82-治理币-文档总览](../82-治理币-文档总览.md)** 配套。**多区域治理、收益池、Seat/Buyout/Snapshot** 等协议级规格见 **[83-区域治理与收益分配-协议白皮书](../83-区域治理与收益分配-协议白皮书.md)**（**FeeRouter** 第一层已与 **84** 对齐：**45%/55%**、Global **65/20/15**；**可分配费用分母与仲裁/slash 正交**见 **84 §1.1.1**、[Runbook](../../../ops/RUNBOOK.md) **§7.1**；与 82/08-4 交叉审阅）。**第一阶段十国 Country Pool**（费用/承销分母、募资表、附录 A 合并结论）见 **[84-第一阶段10国Country-Pool发行参数总表](../84-第一阶段10国Country-Pool发行参数总表.md)**。

---

## 文件清单

### Protocol Convergence（P0 · 2026-05-27）

| 文件 | 说明 |
|------|------|
| **[protocol-ssot.v1.md](protocol-ssot.v1.md)** | **唯一数值真源**：TTG 供应、FeeRouter bps、十国 `fee_route_bps` / `steward_stake_bps`、锁仓层级 |
| **[ttg-allocation-permissions-flows-ssot-v1.md](ttg-allocation-permissions-flows-ssot-v1.md)** | **图解 SSOT**：供应/四轨/两轨收益/申请/权限 · **§0 维护规则**（改逻辑必改图） |
| **[fund-flow-ssot.v1.md](fund-flow-ssot.v1.md)** | TTG / CountryPool / Escrow / Fee 四轨 + 子 Vault + NAV 赎回 |
| **[state-machine.v1.md](state-machine.v1.md)** | `steward_application` / `steward_seat` / `country_jurisdiction` / `redemption` / `region_share_eligibility` |
| **[protocol-convergence-P1-memo.md](protocol-convergence-P1-memo.md)** | P1 决议 + P2 ① 交付状态 |
| **[84-valuation-anchor-P1-memo.md](84-valuation-anchor-P1-memo.md)** | **84 §3.6** 三轨独立 · 募资 SSOT 互链（取代 Option C 占位） |
| **[country-revenue-model-v1-draft.md](country-revenue-model-v1-draft.md)** | **① 国家收益模型** · Fee Points · 净利润 45/55 · Treasury P1～P4 |
| **[TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md)** | **FROZEN · GOV-01～04 · Gate-2.4 / Sepolia 唯一经济读口** |
| **[TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md](TTG-TOKENOMICS-FREEZE-V1-FINAL-AUDIT-REPORT.md)** | **Tokenomics V1 终审计报告（①）** |
| **[country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md)** | **治理委员会独立募资表（万元 · 无硬顶 · 唯一写入口）** |
| **[country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md)** | **② Country Pool 净利润 45/55 结算 · DESIGN ONLY** |
| **[country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md)** | **Gate-0 Exit · v1.0.3 · 产品+财务+法务已签 · Gate-2 设计评审开放** |
| **[country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md)** | **Gate-0 · COA 映射矩阵 v1 · R/E 科目 · NetProfit · 亏损结转 · QUARTER 日历 · 2150 Unallocated（财务已签）** |
| **[country-pool-legal-freeze-matrix-v1.md](country-pool-legal-freeze-matrix-v1.md)** | **Gate-0 · Legal Freeze Matrix v1 · L-01～L-07 · LEG-XJ（法务已签）** |
| **[country-pool-settlement-architecture-package-v1.md](country-pool-settlement-architecture-package-v1.md)** | **Gate-2.1 Final · DR-01～07 已闭 · 四方已签 · v1-final-closeout** |
| **[country-pool-settlement-gate2.2-implementation-readiness-checklist.md](country-pool-settlement-gate2.2-implementation-readiness-checklist.md)** | **Gate-2.2 · Readiness 全绿 · 允许 Solidity 分支** |
| **[country-pool-settlement-gate2.3-projection-package-v1.md](country-pool-settlement-gate2.3-projection-package-v1.md)** | **Gate-2.3 EXIT（①）** · **D-4555-B → Gate-2.4 Ready Candidate** |
| **[country-pool-settlement-gate2.4-prerequisites-checklist.md](country-pool-settlement-gate2.4-prerequisites-checklist.md)** | **Gate-2.4 Sepolia 前置（② · NOT STARTED）** |
| **[gate2.3/README.md](gate2.3/README.md)** | **Gate-2.3 实施任务卡索引 · G23-03→01→02→04 · 一卡一 PR** |
| **[PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md](PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md)** | **② 链上对齐审计 · 缺口 + 实施顺序（登记）** |
| **[THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md](THREE-TRACK-INDEPENDENT-PARAMS-CONSISTENCY-AUDIT-20260615.md)** | **三轨独立参数 · 全链路一致性审计（① · 工程）** |
| **[GOVERNANCE-TO-BUSINESS-CONSISTENCY-AUDIT-20260615.md](GOVERNANCE-TO-BUSINESS-CONSISTENCY-AUDIT-20260615.md)** | **治理 → 融资/IR/产品/运营 · 叙事一致性审计（①）** |
| **[ttg-reference-price-v1-draft.md](ttg-reference-price-v1-draft.md)** | **200 CNY/TTG** · Mock Swap · FDV（三轨独立 · 不推导募资） |
| **[archive/README.md](archive/README.md)** | **历史工程公式归档**（勿引用） |

**团队规则：** 见 **protocol-ssot.v1 §0** — 新增字段、状态、百分比、锁仓 **须先登记 SSOT**，再改业务文档或代码。**分配/权限/申请流程叙事或 Mermaid 变更** 须同步 **[ttg-allocation-permissions-flows-ssot-v1.md §0](ttg-allocation-permissions-flows-ssot-v1.md)**。

### 专题草案

| 文件 | 说明 |
|------|------|
| [01-对外白皮书-草案](01-对外白皮书-草案.md) | 对外叙事与风险披露（草案，中文） |
| [02-对内技术规格-草案](02-对内技术规格-草案.md) | 实现、数据模型、API/合约与门禁（草案，中文）；**§1.3** **本地链→测试网→主网** 工程硬约束；**§2.5** **镜像** **[protocol-ssot.v1 §1](protocol-ssot.v1.md)**（**改数只改 SSOT**） |
| [03-对外材料-PPT与白皮书数据页摘抄索引](03-对外材料-PPT与白皮书数据页摘抄索引.md) | PPT/PDF/官网数据块 → **83/84/08-4 附录图** 的摘抄索引与禁止项 |
| [LEGAL-SIGNOFF-CHECKLIST.md](LEGAL-SIGNOFF-CHECKLIST.md) | 对外定稿前法务签核清单（模板；含 **83/84/TTG** 专项） |
| [en/README.md](en/README.md) | 英文分册索引（Litepaper / 对内规格草案） |

---

## 版本与状态

- 当前均为 **草案**：对外发布、募资路演或媒体引用前，须完成 **法务定稿** 并与 [08-4-对外口径包](../08-4-对外口径包.md) 一致。
- **仓库联动**：本目录或 [82-治理币-文档总览](../82-治理币-文档总览.md) 重大变更时，须执行 [07-开发流程与顺序 §二 2.4](../07-开发流程与顺序.md) 所列最小同步项；CI 门禁：`scripts/check-governance-doc-linkage.sh`（见 [.github/workflows/governance-doc-linkage-gate.yml](../../../.github/workflows/governance-doc-linkage-gate.yml)）。
- 与产品关系：**当前 MVP** 以 [01-总库总览](../01-总库总览.md) 为准——**不发行平台支付币**；本目录描述 **可选路线图** 与 **一旦启用时的技术与披露要求**。

### 开发与上链顺序（工程硬约束）

**须先本地虚拟链、后公链**：在 **Anvil** 上完成合约部署与自动化测试，并与 **订单主路径（Escrow 等）** 及 **治理代币相关链上/索引/API 联调（含委托、投票、提案执行、Snapshot·Claim 等——以最终实现的模块为准）** 全部跑通、验收无遗留阻塞后，再按 **[contracts/README](../../../contracts/README.md)** 同一套脚本切换 RPC 部署 **测试网**，最后经 Runbook/多签流程上 **主网**。**细则与验收清单句式**见 [02-对内技术规格-草案 §1.3](02-对内技术规格-草案.md)；**总纲串联**见 [07 §五 5.2A](../07-开发流程与顺序.md)。

---

## 对外发布前检查（最小清单）

- [ ] 完成 [LEGAL-SIGNOFF-CHECKLIST.md](LEGAL-SIGNOFF-CHECKLIST.md) 签核项与记录表  
- [ ] 08-4 中收益流、证券隔离、治理币相关句式已与本目录对外稿（**中/英**）对齐  
- [ ] 01/04/14 中「结算币种 / 激励币种」边界已一致  
- [ ] 文档版本号、定稿日期、责任人已填写（对外 PDF 若单独分发，须登记哈希或版本）  

---

## 索引入口

- 总索引：[00-文档索引](../00-文档索引.md)（检索 **82**）  
- 体系串联：**[07-开发流程与顺序](../07-开发流程与顺序.md) §零 0.3**（`82 治理币` 口径；[00-文档体系与阅读串联](../00-文档体系与阅读串联.md) 兼容壳）  
- **全系统大图（Target 收益流节点）**：[18-TravelTrust-全系统架构图](../18-TravelTrust-全系统架构图.md) **§二 5️⃣附**；**架构设计锚点**：[02-架构设计](../02-架构设计.md) **§十、§十四 14.6**  
