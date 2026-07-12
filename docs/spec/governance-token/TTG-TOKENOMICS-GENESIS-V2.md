# TravelTrust TTG Tokenomics Genesis V2

**Document ID:** `TTG-TOKENOMICS-GENESIS-V2`  
**Status:** **FROZEN · Owner-approved business SSOT**  
**Effective:** 2026-07-12  
**Supersedes (allocation / seat-supply narrative):** [TTG-TOKENOMICS-FREEZE-V1](./TTG-TOKENOMICS-FREEZE-V1.md) §1 supply table · six-bucket `country_pool_shelf` / `advisors` / standalone `ecosystem` allocation  
**Does not supersede:** GOV-01～GOV-04 numeric gates · Fee/NetProfit 45/55 · Escrow isolation · USDC P1–P4 cash policy（unless explicitly amended）

**Machine mirror:** [protocol-ssot.v1.yaml](./protocol-ssot.v1.yaml)#token_allocation_bps · [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml)  
**Workspace:** [WEB3-全系统业务规范-LATEST.md](./WEB3-全系统业务规范-LATEST.md) · DD-2026-07-012+

**阶段：** ① 业务真源冻结 · **≠** ③ Production GO · **未经 Owner 确认不得 Git 提交或生产发布**

---

## §0 冻结声明

自本文件生效起，**TTG 创世分配与同币同权规则**以 **Genesis V2** 为唯一业务真源。

改四块比例 = 重大变更，须：**DAO Governance → Timelock → Owner Release Policy** + Registry bump + 认证文档同步。

---

## §1 供应与四块创世分配（FROZEN）

**总量：** 10,000,000 TTG（创世分配；总量层不通过 Mint 扩张供应叙事以本文件为准）

| 用途 | 英文 | bps | 数量 | 定义 |
|------|------|-----|------|------|
| 创始团队 | **Team** | 1500 | 1,500,000 | 创始团队长期激励 · **1 个钱包** · Vesting |
| 社区激励分配 | **Community Incentive Allocation** | 500 | 500,000 | 创世配额 · 社区成员激励 |
| DAO 金库 | **DAO Treasury** | 3000 | 3,000,000 | 协议长期战略储备（托管位置） |
| 公募发行 | **Public Sale** | 5000 | 5,000,000 | 用户以 USDC 兑换 TTG |
| **合计** | — | **10000** | **10,000,000** | — |

### 已取消（相对 V1 六桶）

| 旧键 | 处理 |
|------|------|
| `advisors` | 取消独立分配 · 并入 DAO Treasury |
| `country_pool_shelf` | **取消** · Region Steward 不占用创世供应桶 |
| `ecosystem`（独立创世桶） | 取消 · 战略/生态类支出经 **DAO Treasury** 治理拨付 |
| `public_global` 20% | 升为 **Public Sale 50%**（Registry 键可沿用 `public_sale` / `public_global` 别名，以本表为准） |

---

## §2 One TTG, Same Protocol Rights

**原则：** 同一种 TTG，享有相同的协议权利；协议限制状态（如 Vesting、Timelock 托管等）除外。

协议**不记录** TTG 来源。  
协议仅验证当前钱包**可用于 Stake 的 TTG 数量**是否达到门槛（不按来源分桶鉴权）。

协议只关心：是否属于当前地址 · 是否处于协议限制状态 · 是否满足业务规则。

**实现细节**（函数名、余额字段）→ Protocol Spec / Smart Contract Spec / Registry · **不写入本 Genesis**。

---

## §3 Community Incentive（命名固定）

| 层 | 名称 |
|----|------|
| Genesis | **Community Incentive Allocation** |
| Program | **Community Incentive Program** |
| 文档 | **Community Incentive Policy** |

**禁止别名：** Community Rewards · Community Pool · Community Grant。

创世 Allocation = 5%（500,000）。  
DAO Governance 可从 DAO Treasury 向 Community Incentive Program **追加专项预算**；属 Treasury 支出，**不改变**创世 Allocation 5%。

细则 → 独立 **Community Incentive Policy**（本 Genesis 不列举运营条目）。

---

## §4 DAO Treasury

- 用于治理批准的长期战略事项；**不作为日常运营资金池**。  
- 创世一次性分配 3,000,000 TTG。  
- 余额变化只能来源于创世分配或协议允许的资产转移，**不得通过新增 TTG Mint**。  
- **DAO Treasury 不代表治理权来源，仅代表协议资产的托管位置。**

须：提案 → 投票 → Timelock → 执行。

---

## §5 Public Sale

- 合计 **50%**（5,000,000 TTG）固定。  
- 轮次角色（Genesis）：

| 轮次 | 代号 | 开门 |
|------|------|------|
| Round 1 | Early Community | 可按发布计划开启 |
| Round 2 | Governance Open | 须治理开门 |
| Round 3 | Governance Open | 须治理开门 |

- **各轮枚数 → Registry**（合计必须 = 5,000,000）；Genesis 不写死每轮数量。  
- USDC → GovernanceTreasuryP4Cap（与 DAO TTG、Escrow 分离）。  
- Round 1 主要目标：建立早期社区（不写「不是融资」）。

---

## §6 Region Steward

```text
达到该国 Stake 门槛（Governance Parameter）
  → 通过审核
  → 锁仓（质押）
  → 成为主理人
```

- 门槛由 **Governance Parameter** 决定；本文不写死枚数。  
- **不记录来源**；只验可用于 Stake 的数量。  
- 退出后按协议解锁回钱包，**不销毁**。  
- **无 Country Shelf 创世桶**。

---

## §7 三轨分离（资产面）

| | DAO Treasury | USDC 全球金库 | Escrow |
|--|--------------|---------------|--------|
| 资产 | TTG | USDC | USDC（订单） |
| 性质 | 战略托管 | 平台运营现金 | 用户订金 |
| 投票 | 托管余额 ≠ 自动投票权 | — | — |

---

## §8 Team Vesting

- Team **15%** · **单受益钱包**（推荐 Safe）· `revocable: false` · Timelock custody。  
- Start 默认：`MAINNET_VESTING_DEPLOY_EXECUTE`。  
- cliff / duration / beneficiary 地址 → OWNER_INPUT（主网前冻结）。  
- **无独立 Advisors 创世轨**（V2）。

---

## §9 文档分层

| 层 | 写什么 |
|----|--------|
| **本 Genesis** | 四块比例 · Same Protocol Rights · 不记来源 · DAO 非投票来源 · 禁 Mint · 轮次角色 |
| **Registry** | 公募各轮枚数 · Stake 参数 · 机器校验 |
| **Community Incentive Policy** | Program 如何发放 |
| **Contract / Protocol Spec** | 可用于 Stake 的余额如何计算 |

---

## §10 变更控制

| 变更类型 | 要求 |
|----------|------|
| 四块比例 | 治理 + Timelock + Owner Release + 本文件新版本 |
| 公募各轮拆分（合计不变） | 治理 + Registry |
| Community Incentive Program 细则 | Community Incentive Policy |
| GOV-01～04 / Fee / Escrow | 既有 SSOT；非本文件默认可改范围 |

---

## 附录 A · Registry 键映射（V2）

| Genesis 名称 | Registry 推荐键 |
|--------------|-----------------|
| Team | `team` |
| Community Incentive Allocation | `community_incentive` |
| DAO Treasury | `treasury_dao` |
| Public Sale | `public_sale`（兼容别名 `public_global` 时须注释指向本 Genesis） |

**禁止键（V2）：** `advisors` · `country_pool_shelf` · 作为创世桶的 `ecosystem`
