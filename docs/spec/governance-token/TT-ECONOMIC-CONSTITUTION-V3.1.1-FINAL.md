# TravelTrust Economic Constitution（V3.1.1 Final）

**Document ID:** `TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL`  
**Status:** **LOCKED · TARGET_BASELINE · OWNER_APPROVED · PSG Web3 唯一经济对齐目标**  
**Lock:** **2026-07-18 · ECONOMIC_MODEL_FREEZE** — **禁止**再改本文件**经济规则**（含措辞级「小改」）；经济变更须 **V3.2+** 新版本 + Owner 书面  
**PSG Completion Binding:** **2026-07-19** — 非经济条文：将 **Financial-Grade Web3 Protocol Readiness** 正式纳入 **PSG Production Completion Definition**（见下节 · 附录 E）  
**Effective (Target):** 2026-07-18  
**Supersedes (same-day patch):** `TT-ECONOMIC-CONSTITUTION-V3.1-FINAL`（V3.1 → V3.1.1：补 P0 缺口 · 强制 Distributable 命名与状态机）  
**Phase:** ① Target **LOCKED** · 进入 **Alignment Ladder** · **≠** live Full Alignment PASS · **≠** ③ Production GO  
**Machine:** [registry/traveltrust-economic-constitution-v3.1.v1.yaml](../../../registry/traveltrust-economic-constitution-v3.1.v1.yaml)  
**PSG Completion SSOT:** [registry/psg-production-completion-definition.v1.yaml](../../../registry/psg-production-completion-definition.v1.yaml) · [TT-PSG-PRODUCTION-COMPLETION-DEFINITION-LATEST](../../runbook/TT-PSG-PRODUCTION-COMPLETION-DEFINITION-LATEST.md)  
**Alignment ladder:** [TT-ECONOMIC-CONSTITUTION-V3.1-TARGET-BASELINE-LATEST.md](../../runbook/TT-ECONOMIC-CONSTITUTION-V3.1-TARGET-BASELINE-LATEST.md)

> **PSG 裁定（Owner）：** PSG Web3 **唯一目标基线** = 本 V3.1.1 Final · **已 LOCK**。  
> **PSG 全部完成（写死）** = **Product ∧ Data ∧ Security ∧ Operations ∧ Financial-Grade Web3** 全部 PASS。  
> 金融级 Web3 **不是**独立可选项；**禁止**仅以 Web2 Coverage PASS 宣称 PSG 完成。  
> **禁止** 继续迭代经济模型正文以换边际收益；下一步唯一工程主线 = **[Full Constitution Alignment](../../runbook/TT-PSG-WEB3-FULL-CONSTITUTION-ALIGNMENT-LATEST.md)** + **[Full Capability / FG-Web3 Gate](../../runbook/TT-PRODUCTION-FULL-CAPABILITY-GATE-LATEST.md)**。  
> V3.2 候选（国家生命周期 / 月结 Claim）见 **附录 D** · **不**纳入本版强制。  
> **诚实边界：** Target LOCKED **≠** Local/Staging Full Alignment PASS **≠** Production GO **≠** PSG 五柱完成。

---

<a id="psg-production-completion"></a>

## 第〇章 · PSG Production Completion（金融级强制 · 非经济规则）

本节**不**修改第一～十一章经济数字或资金流；仅绑定 **PSG 完成定义**。

```text
PSG_COMPLETE =
  Product_PASS
  ∧ Data_PASS
  ∧ Security_PASS
  ∧ Operations_PASS
  ∧ Financial_Grade_Web3_Protocol_Readiness_PASS
```

**Financial-Grade Web3 Protocol Readiness（金融级 Web3 协议就绪）** 为 PSG Production Completion 的**第五强制柱**，覆盖且必须全部 PASS：

| # | 强制面 |
|---|--------|
| 1 | Money-Path |
| 2 | Escrow State Machine |
| 3 | SettlementRouter |
| 4 | FeeRouter |
| 5 | Distributable |
| 6 | Steward Revenue |
| 7 | Treasury |
| 8 | TTG Governance |
| 9 | Timelock Execute |
| 10 | Wallet Security |
| 11 | RBAC |
| 12 | Indexer |
| 13 | 链上 / DB / UI 一致性 |
| 14 | Audit Evidence |
| 15 | 48H Observation |

**禁止：** `PSG_COMPLETE = Web2_Coverage_PASS_only` · 把金融级 Web3 降为「可选加分」· 用 Bar-1 / Track A 冒充五柱完成。  
**机读真源：** `TT_PSG_PRODUCTION_COMPLETION_DEFINITION` · 执行矩阵：`TT_PRODUCTION_FULL_CAPABILITY_GATE`。

---



## 第一章 核心原则

TravelTrust 采用「支付」与「治理」完全分离的经济模型。

- USDC：支付、订单结算、Escrow。
- TTG（TravelTrust Governance Token）：治理、提案、投票、区域主理人资格、生态治理。

协议遵循唯一原则：

> **One TTG = Same Protocol Rights**

任何合法 TTG，不因来源不同而拥有不同协议权限。

---



## 第二章 TTG 创世模型

TTG 总供应量：

**10,000,000 TTG（固定）**

永不新增 Mint。

创世分配：


| 分类                             | 比例  |
| ------------------------------ | --- |
| Founder / Team                 | 15% |
| Community Incentive Allocation | 5%  |
| DAO Treasury                   | 30% |
| Public Sale                    | 50% |


Founder / Team：

- 直接进入 Founder 指定个人钱包；
- Founder 自行向团队成员分配；
- 与其它 TTG 拥有完全一致的：投票权 · 提案权 · Stake 权 · 区域主理人申请权 · 治理收益权。

Community Incentive：

- 非一次性空投；
- DAO Proposal → DAO Vote → Timelock → 分阶段释放。

---



## 第三章 Public Sale

Public Sale：5,000,000 TTG。

分三轮：

- Round1：800,000
- Round2：1,200,000
- Round3：3,000,000

资金流：

```text
USDC → Primary Market → GovernanceTreasuryP4Cap
TTG → Buyer
```

Public Sale USDC **全部**进入 GovernanceTreasuryP4Cap。

---



## 第四章 Platform Access Fee

申请国家区域主理人时，需要：

1. TTG Stake（≥ 该国 **Stake Minimum**，见第十一章）；
2. 身份审核；
3. 平台准入；
4. 支付 Platform Access Fee（如适用）。

平台准入费：

**300,000 USDC**

定义：**Platform Bootstrap Fee**

用途：补偿 Founder 团队前期研发、产品、品牌、运营与平台启动成本。

资金流：

```text
申请区域主理人 → 300,000 USDC → Founder 指定个人钱包
```

该费用：

- 不兑换 TTG；
- 不属于 Public Sale；
- 不进入 DAO Treasury；
- 不进入 GovernanceTreasuryP4Cap；
- 不参与 45% / 55% 收益分配。



### 4.1 退款规则（P0 · 写死）


| 情形                      | Platform Access Fee             |
| ----------------------- | ------------------------------- |
| **身份/准入审核失败**           | **100% 退款** 至付款人原路径             |
| **审核通过（成为或确认准入）**       | **不可退**                         |
| **主理人退出 / 任期结束 / 市场承接** | **不可退**                         |
| **DAO 撤销主理人（REMOVE）**   | **不可退**（Stake 走 Recovery，见第十一章） |
| **Inactive 失联被开放重申**    | **不可退**（原 Fee 已属 Bootstrap）     |


---



## 第五章 DAO Governance

TravelTrust 使用：**有效流通票权快照模型**。

每个 Proposal 建立 Snapshot；Snapshot 后投票分母固定。

Founder Wallet：属于有效流通。

Proposal 三级治理：


| 级别  | 门槛   | 最低        | 最高          |
| --- | ---- | --------- | ----------- |
| 普通  | 0.5% | 5,000 TTG | 50,000 TTG  |
| 重要  | 1%   | —         | 100,000 TTG |
| 核心  | 2%   | —         | 200,000 TTG |


管理员：**不是**唯一 Proposal 发起人。达到门槛即可发起。

---



## 第六章 平台服务费

全球默认：

**平台服务费 = 订单本金 × 5%**

例如：订单 1,000 USDC → 平台服务费 50 USDC。

### 6.1 命名纪律（强制）


| 术语                                     | 含义                                           |
| -------------------------------------- | -------------------------------------------- |
| **Platform Service Fee Accrued**       | 订单上已计提的服务费毛额（可能仍受退款/争议/Chargeback 影响）        |
| **Distributable Platform Service Fee** | **扣减退款、争议、Chargeback 等之后**，真正可进入 45/55 分配的金额 |


**禁止** 用「Platform Service Fee Revenue」一词直接指代可分配金额。  
审计、财务、合约、文档 **统一**使用 **Distributable Platform Service Fee**。

不是企业会计净利润；是协议内 **可分配平台服务费**。

每个国家拥有独立的平台服务费参数。默认 5%。允许范围 **0%～10%**。超过 10%：必须作为**核心**协议治理提案。

---



## 第七章 国家费率治理

每个国家拥有独立平台服务费（例：中国 5% · 日本 3% · 韩国 4%）。

```text
ACTIVE 国家区域主理人发起提案
  → DAO Proposal → DAO Vote → Timelock → 生效
```

区域主理人有**提案权**；是否通过由 DAO 决定。  
新费率**只影响之后创建的新订单**，不追溯已创建订单。

---



## 第八章 用户支付模型

用户支付 = **订单本金 + 平台服务费 + Gas**。

例：本金 1,000 + 服务费 50 + 实时 Gas → 用户总成本 1,050 USDC + 实际 Gas。

Gas = 网络费用，**不是**平台收入。

---



## 第九章 服务费状态机（强制）

平台服务费**不会立即分配**。

状态：

```text
SERVICE_FEE_PENDING
  ↓（订单完成路径启动；仍可能退款/争议）
SERVICE_FEE_LOCKED
  ↓（退款结束 · 争议结束 · Chargeback 窗口关闭）
SERVICE_FEE_DISTRIBUTABLE
  ↓（执行 45/55 或 100% Project Revenue Pool）
SERVICE_FEE_DISTRIBUTED
```

只有达到 **SERVICE_FEE_DISTRIBUTABLE** 后的金额，才称为 **Distributable Platform Service Fee**，才允许进入第十二章分配。

---



## 第十章 退款机制


| 情形     | 本金    | 平台服务费          | Gas      |
| ------ | ----- | -------------- | -------- |
| 正常完成   | 结算    | 确认进入状态机        | 不退       |
| 用户主动取消 | 按取消政策 | 原则上不退（治理可定部分退） | 不退       |
| 服务商违约  | 退款    | 退款             | 不退       |
| 平台责任   | 退款    | 退款             | 可按平台补偿政策 |


任何服务费退款/冲正，必须在进入 **SERVICE_FEE_DISTRIBUTABLE** 之前完成账务调整。

---



## 第十一章 国家区域主理人



### 11.1 申请条件

- TTG Stake ≥ 该国 **Stake Minimum**；
- Platform Access（含 Access Fee 规则）；
- 身份审核；
- ACTIVE 状态。



### 11.2 Stake Minimum（P0 · 写死结构）

- **Stake Minimum** 按 **Country** 在 Registry 登记（Governance Parameter）。  
- **初值口径（对齐过渡）：**  
`stake_minimum_ttg = 10_000_000 × steward_stake_bps / 10_000`  
（引用既有 protocol-ssot 辖区 `steward_stake_bps`，直至 V3.1.1 专表冻结）  
- **举例（初值 · 可治理调整）：**


| Country | steward_stake_bps（初值） | Stake Minimum（TTG） |
| ------- | --------------------- | ------------------ |
| CN      | 400                   | **400,000**        |
| US      | 400                   | **400,000**        |
| JP      | 250                   | **250,000**        |
| …       | Registry              | Registry           |


- **DAO** 可经治理调整各国 Stake Minimum（重要级及以上提案）。  
- **禁止** 无 Registry 数值时在合约硬编码「全球同一固定 100,000」替代各国表。



### 11.3 任期与退出

- 最低任期：**24 个月**。  
- 退出通知：**180 天**。  
- 退出：**优先市场承接**（Buyout / 新主理人接管）。  
- 无人承接：进入 **Treasury Recovery**（第十三章）。



### 11.4 DAO 撤销主理人（P0 · 写死）

适用：违法、跑路、欺诈、长期不运营、严重违约等。

```text
DAO Proposal（REMOVE COUNTRY STEWARD）
  → Vote → Timelock
  → 撤销 ACTIVE
  → 正式登记质押 TTG 进入 Treasury Recovery
```

- Platform Access Fee：**不可退**（§4.1）。  
- 历史已 **DISTRIBUTED** 的 Distributable 份额：**不追溯追回**（另案 slash 不在本宪章默认启用）。



### 11.5 长期失联 / Inactive（P0 · 写死）

- **Inactive 阈值：** 连续 **180 天** 无协议定义的运营活动（登录/履职心跳以产品 Runbook 细化，阈值天数写死 180）。  
- 达到 Inactive 后：

```text
标记 Inactive
  → DAO 可提案「重新开放该国主理人申请」
  → 新申请人走 Stake + Access Fee + 审核
  → 原质押按无人承接规则进入 Treasury Recovery（若无市场承接）
```

---



## 第十二章 国家收益归属（唯一规则）



### 12.1 归属标准（P1 · 写死）

TravelTrust 全球统一采用：

`Order.destination_country`**（订单实际履行国家）**

作为**唯一收益归属真源**。

- **唯一来源字段：** `Order.destination_country`  
- **禁止** 用游客国籍、Guide 国籍、Merchant 注册国、临时 GPS 推断**替代**该字段作为分配真源。  
- GPS / 其它信号仅可作风控辅助，**不得**覆盖 `Order.destination_country`。



### 12.2 一期范围（P1 · 写死）

- **一期：每笔订单有且仅有一个 Destination Country。**  
- **多国行程（日本→韩国…）：禁止** 在一期拆分多国分配；产品须拆成多笔订单或延期。  
- **多国订单分配规则：V2 另版**（不在 V3.1.1 启用）。



### 12.3 区域粒度（P1 · 写死）

- **目前：Country 级** 主理人与费率。  
- **以后（另版）：** Country → Province → City。  
- V3.1.1 **不**启用省/市级分成。



### 12.4 分配（Distributable）

存在该国 **ACTIVE** 区域主理人时：

- **Distributable Platform Service Fee × 45%** → 该国主理人路径  
- **× 55%** → **Project Revenue Pool**

例：Distributable = 50 USDC → 主理人 22.5 · Project Revenue Pool 27.5。

**没有 ACTIVE 区域主理人时：**

- **Distributable Platform Service Fee × 100%** → **Project Revenue Pool**

与游客/Guide/Merchant 国籍无关；只认 `Order.destination_country`。  
历史订单：**不追溯**。

---



## 第十三章 Treasury Recovery

Recovery：

- **不是**保本；  
- **不是**原价赎回；  
- **不是**无限兑付。

只回收：**正式登记质押 TTG**。

完成后：TTG 进入 **Recovered Public Sale Inventory**，可再售；**不**新增 Mint；**不**改变总供应量。

### 13.1 Recovery Budget（P1 · 写死）

- 设置 **Recovery Budget**（治理参数 · 计 USDC 预算与/或每周期回收 TTG 上限）。  
- **禁止** 单次或无上限耗尽 GovernanceTreasuryP4Cap / Project Revenue Pool 以支撑 Recovery。  
- 具体数值：Registry `OWNER_INPUT` → DAO 可调；未配置 Budget 时 **禁止** 执行 Recovery 兑付腿（仅允许登记/冻结质押进入 Recovered Inventory 的非兑付路径，以实现 Runbook 细则为准）。

---



## 第十四章 四套资金永久隔离

① **Order Escrow** — 订单本金、退款、争议  
② **GovernanceTreasuryP4Cap** — Public Sale 收入、Recovery 再销售收入  
③ **Project Revenue Pool** — Distributable 分配后的平台资金（含无主理人时 100% 流入）  
④ **Founder Bootstrap Wallet** — Platform Access Fee  

永久独立，禁止混账。

---



## 第十五章 最终商业规则（Final SSOT）

1. TTG 总量固定 10,000,000。
2. Founder/Team 15% 进入 Founder 指定个人钱包，权利与其它 TTG 完全一致。
3. Community Incentive 5% 经治理分阶段释放。
4. Public Sale 50%，三轮 80万 / 120万 / 300万 TTG。
5. Public Sale USDC 全部进入 GovernanceTreasuryP4Cap。
6. Platform Access Fee = 300,000 USDC → Founder 钱包；审核失败 **100% 退**；通过/退出/撤销 **不可退**。
7. 治理采用有效流通票权快照模型。
8. 全球默认平台服务费 5%；国别独立；范围 0%～10%。
9. 国别费率由 ACTIVE 主理人提案 → DAO → Timelock；仅影响新订单。
10. 用户总支付 = 本金 + 平台服务费 + 实际 Gas。
11. 服务费状态：`PENDING → LOCKED → DISTRIBUTABLE → DISTRIBUTED`；只有 **Distributable Platform Service Fee** 可分配。
12. 收益归属唯一真源：`Order.destination_country`。一期一单一国 Destination。
13. 有 ACTIVE 主理人：Distributable **45%** 主理人 / **55%** Project Revenue Pool。
14. 无 ACTIVE 主理人：Distributable **100%** Project Revenue Pool。
15. 最低任期 24 月；通知 180 天；优先市场承接；否则 Treasury Recovery（受 **Recovery Budget** 约束）。
16. DAO 可 **REMOVE COUNTRY STEWARD** → Recovery；Inactive 180 天后可重开申请。
17. Stake Minimum 按 Country 登记于 Registry；初值可由 `steward_stake_bps` 换算；DAO 可调。
18. 回收 TTG → Recovered Public Sale Inventory 可再售；总供应量不变。
19. 四套资金永久隔离。

---



## 附录 A · 废弃与继承


| 旧真源                                    | V3.1.1 后                              |
| -------------------------------------- | ------------------------------------- |
| Genesis V2 经济叙事                        | LEGACY                                |
| 「Platform Service Fee Revenue」直接 45/55 | **禁止** · 改用 Distributable             |
| 主理人=国家净利润 45%                          | LEGACY                                |
| 无主理人 Unallocated 45%+Global 55%（服务费语义） | LEGACY · 改为 100% Project Revenue Pool |
| 退出仅解锁回钱包、无 Recovery                    | 修订为含 Recovery + Budget                |




## 附录 B · P2 / P3 Backlog（非本版强制）

**P2（近期可另开版本）：**

- ⑨ 平台服务费按 Category（Guide / Hotel / Luxury…）  
- ⑩ DAO Treasury 预算桶（Investment / Grant / Marketing / Development / Reserve）

**P3（白皮书/融资叙述）：**

- ⑪ KPI：Annual Active Travelers · GMV · Order Count · Revenue  
- ⑫ DAO Revenue Dashboard



## 附录 C · 实现诚实状态


| 面                   | 状态                                    |
| ------------------- | ------------------------------------- |
| Target Baseline     | **V3.1.1 LOCKED**                     |
| Live Full Alignment | **NOT_PASS**                          |
| PSG 五柱完成            | **否**（Financial-Grade Web3 = NOT_READY） |
| Production GO       | **不因本文自动变更**                          |
| 下一步                 | **Alignment Ladder + FG-Web3 Gate** · 禁止改经济模型正文 · 禁止 Web2-only 完成宣称 |




## 附录 D · V3.2 候选（Owner 建议 · 非本版强制 · 禁止塞进 V3.1.1）



### D.1 国家状态机（Country Lifecycle）

统一引用（后台 / DAO / UI / Registry）：

```text
APPLYING
  → REVIEWING
  → ACTIVE
  → SUSPENDED
  → REMOVED
  → OPEN_FOR_REAPPLICATION
```

- V3.1.1 仅强制语义：**ACTIVE** · **Inactive 180 天** · **REMOVE** · **重开申请**。  
- 完整六态枚举与转移表 → **V3.2**。



### D.2 国家 Steward 收益 / Claim 状态（月结）

在 Distributable 之后增加运营层（降 Gas · 易对账）：

```text
ORDER COMPLETE
  → SERVICE_FEE_PENDING
  → SERVICE_FEE_LOCKED
  → SERVICE_FEE_DISTRIBUTABLE
  → MONTHLY_CLAIMABLE
  → CLAIMED
```

- **意图：** 高单量国（如日万单）**禁止** 每单链上打款；按月（或治理周期）**Claim**。  
- V3.1.1 **强制到 DISTRIBUTABLE / DISTRIBUTED**；**MONTHLY_CLAIMABLE / CLAIMED** → **V3.2**。



## 附录 E · PSG Production Completion Binding（2026-07-19 · 非经济修订）

| 项 | 值 |
|----|-----|
| 类型 | **非经济** · Production Completion Definition |
| 是否改动经济数字 / 资金流 | **否** |
| 机读 | [`registry/psg-production-completion-definition.v1.yaml`](../../../registry/psg-production-completion-definition.v1.yaml) |
| 人类 | [TT-PSG-PRODUCTION-COMPLETION-DEFINITION-LATEST](../../runbook/TT-PSG-PRODUCTION-COMPLETION-DEFINITION-LATEST.md) |
| 效力 | 以后一切「PSG 是否完成」判断 **默认**含 Financial-Grade Web3 Gate |

