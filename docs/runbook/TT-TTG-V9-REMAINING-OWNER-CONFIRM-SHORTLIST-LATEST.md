# TT · TTG V9 — Remaining Owner Confirmations (fresh scan)

**STATUS:** `CLOSED_BY_OWNER_DESIGN_LOCK` · see [Owner Design LOCK](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md)  
**Owner accepted:** 必须项全按推荐 · 默认项全按默认（2026-08-21）

**Post-lock:** no further product A/B required for Design Lock. Remaining = engineering implementation + new audit ladder.

---

## 0 · 已敲定（不必再问）

| 项 | 决定 |
|----|------|
| 25T · NO FURTHER MINT | YES |
| 十国 steward_stake_bps 分级 · min ∝ live `totalSupply()` | YES |
| Merchant/Guide TTG RoleStake | **`NOT_REQUIRED` / `DISABLED`** · 非默认待办 · 履约 = USDC 81 + Escrow |
| 平台费（有主理人） | 5% 订单费内：**45%→申请收款址 · 55%→新总池** |
| 平台费（无主理人） | **100%→新总池** |
| Fee Router | **新部署** 按国→收款址（R2=A） |
| Role Stake | **新部署** |
| 统一新总池 | YES · 旧 P4Cap/Timelock/Safe = LEGACY（Q8） |
| 部署 + TTG 5% | `0xe1e732…` |
| TTG 3% | `0x010365…` |
| TTG 7% + 收30万 + 收总池30%拨付 | `0xF34804…` |
| `globalStakers` 35.75% Owner ACTIVE | EXIT |
| 旧 R2_FINAL 三审 PASS | **不继承** Fee/Root/Stake/新总池 |

---

## 1 · 仍需你确认（冲突 / 缺口）

### ★ 必须回（否则实现会分叉）

| # | 问题 | 为何冲突/缺口 |
|---|------|----------------|
| **R1** | 一级市场**改价/改批次**谁说了算？ | V9 现设计：**只有 Timelock/治理**能 seed；Guardian **只能暂停**。你曾说 `0xF34804` 能改价 → 与现码冲突。 |
| | **R1-A**（推荐）改价走治理/新 Timelock；`0xF34804` 只做暂停 Guardian | |
| | **R1-B** 改合约：给 `0xF34804` 直接改价权（扩大审计） | |
| **Q5** | 新 Timelock **admin** = `0xe1e732`？ | 与部署同址 · Solo 权力大 · 需你书面接受 |
| **Q6** | Guardian（仅暂停）= `0xF34804`？ | 与 R1-A 配套 |
| **S1** | 主理人收款址谁写入 Fee Router？ | 申请填地址后：是 **Admin 审核通过 → Timelock 写入**，还是别的？ |
| **S2** | 订单「属于哪国」谁告诉 Router？ | Escrow/订单上要有 **国家码**；缺了就无法自动 45% 打对的人 |
| **S3** | Escrow 平台费率是否钉死 **5% = 500 bps**？ | 你口头 5%；链上参数须写死或治理可调 |
| **S4** | KEEP EscrowFactory / SettlementRouter 等 Money Path？ | 新总池+新 Fee 后：EF/SR **可 KEEP 只改 fee 收款址**，还是也全部新部署？ |

### ☆ 建议默认（你可一句「全按默认」）

| # | 默认 | 含义 |
|---|------|------|
| **Q9** | **A** | burn 后已质押绝对量**不动**；只影响新申请门槛 |
| **Q11** | **A** | 83 的 Global 65/20/15 **搁置** · 非 ACTIVE |
| **Q12** | **A** | Country Pool 净利润 45/55 与平台费 45/55 **正交两套** |
| **L1** | **LEGACY 冻结** | 旧 P4Cap 里若有残留 USDC：**本波不取**；以后另案（可能仍要 Safe） |
| **L2** | **收款编排 OPEN** | 30万打到 `0xF34804` 本波可链下/后端先收；链上收款合约非硬闸 |
| **L3** | **新三审范围** | Fee Router + Stake + 新 Timelock + 新总池 + V9 绑定；Token 25T 字节可对照 R2 但不继承旧 PASS |

---

## 2 · 工程缺口（不是让你选产品，是提醒实现债）

| 缺口 | 说明 |
|------|------|
| 新 Fee Router 合约 | 尚无代码 · 须设计 Active Steward 表 + 45/55/100% |
| 新 Role Stake 合约 | live `totalSupply()` · 十国 bps · Steward ACTIVE · Merchant/Guide **NOT_REQUIRED/DISABLED** |
| 新 Project Pool | 可复用 P4Cap 逻辑新部署 · spender=新 Timelock |
| 新 Timelock + Governor 绑定 | admin=`0xe1e732` · 48h |
| Escrow → 新 Router | `platformFeeRecipient` 切流 |
| V9 PM `usdcTreasury` | 指向 **新总池**（非旧 `0xfB90`） |
| FTB / Registry 活地址 | Official 进账改钉新总池后须另闸更新（≠本波乱改 FTB Reality） |
| 旧三审 | 全拓扑回归后 **新 Candidate + 新三审** |

---

## 3 · 复制回复模板

```text
R1=
Q5=
Q6=
S1=   # 例：审核通过后 Timelock 写入收款址
S2=   # 例：Escrow/订单带国家码 ISO
S3=   # 例：500 bps 钉死 / 或治理可调
S4=   # 例：EF/SR KEEP，只切 fee 收款；或全部新部署
默认项= 全按默认 / 或逐条改
```

---

## 中文一句话

经济模型主体已齐；**还卡在：改价权（R1）、Timelock/Guardian 地址确认、主理人收款址怎么上链、订单国家码、Escrow 5% 是否钉死、旧 Escrow 栈 KEEP 还是重部署。** 其余可按默认。
