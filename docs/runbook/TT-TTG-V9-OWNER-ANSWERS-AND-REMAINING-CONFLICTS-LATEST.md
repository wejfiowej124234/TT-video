# TT · TTG V9 — Owner Answers Recorded + Remaining Conflicts


> **ACTIVE V9 documentation pointer:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER`.  
> Any R2_FINAL / Remint / sale→P4Cap / globalStakers / Safe-as-V9-admin narrative below = **LEGACY / SUPERSEDED / DO_NOT_USE_AS_ACTIVE_TRUTH** (historical contrast only).

**STATUS:** `PARTIAL_OWNER_ANSWERS` → superseded by **`V9_OWNER_DESIGN_LOCKED`**  
**Lock doc:** [TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md](TT-TTG-V9-OWNER-DESIGN-LOCK-LATEST.md)  
**Owner:** accepted recommended R1/Q5/Q6/S1–S4 + defaults (2026-08-21)

---

## 1 · Just recorded (Owner)

| ID | Answer |
|----|--------|
| **R2** | **A** · 新部署按国→主理人收款址 Fee Router（自动 45/55 或无主理人 100%→P4Cap） |
| **R3** | 平台服务费（订单 **5%**）有主理人：**45%→该国主理人申请收款址 · 55%→P4Cap**；无主理人：**100%→P4Cap** |
| **Q1** | 45% **直打**申请时提供的主理人钱包 |
| **Q4** | Stake 不符合 → **重部署**（live `totalSupply()`） |
| **Deploy / Marketing 5% TTG** | `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` |
| **Access Fee 300k USDC** | **`0xF34804AA66bAeE02F3aF1C540B9997C7F46b2736`**（与部署/5% TTG **拆开**） |
| **Q7** | 总池 P4 ≤30% 运营支出 `to` → **`0xF34804…2736`** |
| **Team 3% TTG** | `0x010365F0835323826569D61D0E13E6F8d25F6828` |
| **Treasury 7% TTG** | 同 `0xF34804…` |
| **Q8** | **B_REDEPLOY · 统一新总池** — 不接受 Safe 迁权窗；旧 Timelock/Safe/旧 P4Cap = **LEGACY**；Official Project Pool = **NEW**（spender/owner 绑 NEW Timelock） |

### Ops map（修订后）

| 地址 | 用途 |
|------|------|
| `0xe1e732…CdD4` | **仅** 部署 + genesis **TTG 5%** +（拟）NEW Timelock admin |
| `0xF34804…2736` | genesis **TTG 7%** + **收 30万准入费** + **收新总池 30% 运营拨付** +（拟）Guardian pause |
| `0x010365…6828` | genesis **TTG 3%** |
| **NEW Project Pool** | 公售 USDC + 平台费 55%/100% · 90d≤30% · Timelock spend → `0xF34804…` |
| 旧 P4Cap `0xfB90…` | **LEGACY** · 非 Official 进账 · 存量另案 |

**SUPERSEDED:** 曾把 30万 Access Fee Exact 钉在 `0xe1e732…` — Owner 改为 `0xF34804…`。  
**SUPERSEDED:** KEEP_AND_REWIRE 旧 P4Cap 为 Official 总池 — Owner **统一新总池**（2026-08-21）。

---

## Q8 大白话：为什么要问「是否接受一次 Safe 迁权」

（历史说明 · **Owner 已选新总池，本节归档**）

主网上旧 Timelock 管理员写死 Safe，改不掉。迁权本需 Safe「交一次钥匙」。

**Owner 决定：** 不迁权 · **Official 统一新总池** · 旧 Timelock/Safe/旧 P4Cap = LEGACY。  
公售 USDC、平台费进池、90d/30% 支出全部只认 **NEW Project Pool**（新部署，绑 NEW Timelock）。

| 曾选项 | Owner |
|--------|-------|
| Q8=A Safe 交钥匙迁 KEEP P4Cap | **未选** |
| **Q8=B_REDEPLOY 统一新总池** | **已选** |

---

## 仍缺（很少）

```text
R1= A或B     # A=改价只走新 Timelock/治理（推荐）· B=给 0xF34804 直接改价
Q5= A建议    # 新 Timelock admin = 0xe1e732
Q6= A建议    # Guardian 暂停 = 0xF34804
```

**已敲定：** R2=A · R3 · Q7=`0xF34804` · **Q8=统一新总池** · 部署+5%TTG=`0xe1e732` · 30万=`0xF34804` · Fee/Stake/总池/Timelock **全新** · 旧 Safe/Timelock/P4Cap=LEGACY。

---

## 2 · V9 code truth vs Owner intent（冲突）

### R1 — 一级市场价格 / 批次参数（重要）

| Surface | V9 `TtgBatchPrimaryMarket` |
|---------|----------------------------|
| **Guardian** | **只能 `pause`** · **不能**改价/改批次 |
| **Timelock** | `seedBatchesFromNorm` / `unpause` / `setGuardian` / UUPS |
| **改价** | 须 **Governor → NEW Timelock → execute**（或 Timelock admin 在 delay 后 schedule） |

**冲突：** Owner 说 Treasury `0xF34804…`「有权限调一级市场价格」。  
**现合约：Treasury 若仅当 Guardian → 只有暂停权，没有改价权。**  
改价在 **Timelock**（admin 拟为 Marketing Solo `0xe1e732…`），不是 Treasury EOA 直调。

**请选：**
- **R1-A** 接受现设计：改价走治理/Timelock；Treasury = pause Guardian only  
- **R1-B** 要改产品：给 Treasury（或其它）单独「ops 改价」角色（= **改 V9 PM 语义 · 新审范围扩大**）

---

### R2 — 45% 直打主理人钱包 vs 旧 FeeRouter 能力

| Fact | |
|------|--|
| KEEP `FeeRouter` | **一个** `countryBucket` 地址 · `distribute` 一次打四方 |
| 十国多主理人 | 各有不同收款址 → **单桶无法同时服务多国** |
| BPS | 可 `setRoutingConfig(4500,5500,0,0)` 且三腿地址填 P4Cap（字段名可仍叫 globalStakers）—— **语义可凑 45/55**，但 **多主理人路由不够** |

**Agent 判定：** 旧 FeeRouter **不符合**「每国主理人申请址直收 45%」→ **应重新部署**（或旁路：Registry+分发合约）。推荐 **新 Fee / StewardPayoutRouter**：

```text
Escrow fee → Router
  if jurisdiction has Active Steward payout:
      45% → stewardPayout[j]
      55% → P4Cap
  else:
      100% → P4Cap
```

**请选：**
- **R2-A** 同意新部署 Steward-aware Fee Router（推荐）  
- **R2-B**  interim 只用人工 Timelock 改 `countryBucket`（同时只能服务一国 · 弱）

---

### R3 — 「5% 平台服务费」语义

Owner：「无主理人时 **5%** 平台服务费回总池」。

| 读法 | 含义 |
|------|------|
| **R3-A（推荐）** | Escrow **平台费率 = 5%**（`platformFeeBps=500`）；费进 Router 后 **无主理人 → 100% P4Cap**；有主理人 → 对该笔费 **45/55** |
| **R3-B** | 别的意思（请写） |

**冲突：** 现网 Escrow `platformFeeBps` 未必已钉 500；与 FeeRouter 内 BPS 是 **两层**（费率 vs 费内拆分）。

---

### R4 — 权限过集中（诚实风险 · 非阻断若 Solo 接受）

同一 EOA `0xe1e732…` 拟同时：
- Deployer  
- NEW Timelock **admin**  
- Marketing **5% TTG**  
- Access Fee **30万 USDC** 收款  

Treasury `0xF34804…`：7% TTG +（若 R1-A）仅 pause。

**请选：**
- **R4-A** Solo 接受（书面）  
- **R4-B** Timelock admin 与 Marketing 拆开（请给 admin 址）

---

## 3 · 旧合约符合性速判

| Contract | Meet new Target? | Action |
|----------|------------------|--------|
| FeeRouter KEEP | **NO**（四腿 ACTIVE 叙事 + 无 per-steward 路由） | **Redeploy** Steward-aware router（R2-A） |
| RegionStewardStakePool | **NO**（immutable supply） | **Redeploy** live `totalSupply()` |
| Identity Merchant/Guide pools | TBD DISABLED OK as LEGACY | 接口预留 · 本波可不部署 |
| GovernanceTreasuryP4Cap KEEP | **YES** for Path A + 90d/30% | **KEEP_AND_REWIRE** spender→NEW Timelock |
| V9 Token/Vault/PM/Governor sources | Monetary OK · Guardian≠改价 | Deploy with Norm ops；R1 定改价路径 |
| Old Timelock+Safe | **NO** as ACTIVE root | **NEW Timelock** |

---

## 4 · 仍需你确认（精简清单）

复制回复：

```text
R1= A或B          # 改价：接受 Timelock-only vs 给 Treasury 改价权
R2= A或B          # 新 Fee Router vs 人工改单桶
R3= A或B          # 5%=订单平台费率500bps？
R4= A或B          # Solo 集中是否接受
Q7= A/B/C         # P4 支出可否打 0xe1e732
Q8= A或B          # 是否接受一次 Safe 迁权窗
Q5= A             # NEW Timelock admin = 0xe1e732？（默认 A）
Q6= A             # Guardian pause = 0xF34804？（默认 A，若 R1-A）
Q9= A             # burn后已质押不动？（建议 A）
Q11= A            # 83的65/20/15搁置？（建议 A）
Q12= A            # 净利润45/55与平台费正交？（建议 A）
Q14= A            # 新三审覆盖 Fee+Root+Stake+新Router（建议 A）
```

**已可视为敲定、无需再问：**  
十国 bps 表 · live `totalSupply()` · 300k→`0xe1e732` · 45%→申请收款址 · 无主理人→P4Cap · `globalStakers` EXIT · Stake 重部署 · 三 ops 地址与 3/5/7% 对齐 · 旧三审不继承。

---

## 中文要点

- 三地址与 V9 **3%/5%/7%** **一致**；部署用 Marketing。  
- **冲突最大：**「Treasury 改一级市场价格」——现 V9 **只有 Timelock 能 seed 批次/价**，Guardian **只能暂停**。  
- **45% 直打主理人钱包** → 旧 FeeRouter **不够**（一国一桶）→ **建议新部署**。  
- Q4 → **重部署 Stake**。  
- 请回 **R1 R2 R3 R4 Q7 Q8**（其余可按建议默认）。
