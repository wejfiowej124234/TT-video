# TT · TTG V9 — Owner Economic Model (Fee vs Role Stake Split)

**STATUS:** `V9_OWNER_ECONOMIC_MODEL_ACTIVE`  
**Rule:** **Role Stake (TTG lock)** ⊥ **FeeRouter (USDC platform fee split)** ⊥ **Access Fee (USDC)** ⊥ **Sale → P4Cap**  
**Forbidden:** Treat FeeRouter `globalStakers` / 83「TTG 质押激励 65%×55%」as Owner living economics · bake stake % into non-upgradeable Token

Parents: [Owner Ops Fee Model](TT-TTG-V9-OWNER-OPS-FEE-MODEL-LATEST.md) · [Money Flow](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md) · [protocol-ssot](../spec/governance-token/protocol-ssot.v1.md) · [L5 Steward](TT-WEB3-L5-FLOW-V311-STEWARD-GOVERNANCE-LATEST.md)

---

## 0 · Final Owner matrix (this session)

| Module | Final口径 | Notes |
|--------|-----------|--------|
| **区域主理人准入费** | **300,000 USDC** → `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4` | 平台准入费 · **≠** 质押 · **≠** FeeRouter |
| **区域主理人 TTG 质押** | **需要** · 十国 bps × **live** `totalSupply()` | 旧池不符合 → **Redeploy** |
| **商家 / 向导 TTG 质押** | **未来需要** · 额度 **TBD** · DISABLED | 可升级接口 |
| **平台服务费（有主理人）** | **45% → 申请时提供的主理人收款钱包** · **55% → P4Cap** | Owner 2026-08-21 |
| **平台服务费（无主理人）** | **100% → P4Cap**（订单平台费；Owner 口述费率层「5%」见 Remaining Conflicts R3） | |
| **FeeRouter `globalStakers`** | **EXIT ACTIVE** | 旧四腿不符合 → **Redeploy** 倾向 |

**公售 TTG USDC → P4Cap** 仍正交（Path A）。

---

## 1 · Split diagram (binding)

```text
                    TTG V9 Token (non-upgradeable · MAX_SUPPLY 25T · NO_FURTHER_MINT)
                              │
              ┌───────────────┼───────────────────────────────┐
              │               │                               │
     Role Stake System    FeeRouter (USDC)              Access Fee (USDC)
     (upgradeable /         45/55 or 100%→pool           300k → 0xe1e732…
      param-owned)          NO stake concept              ≠ stake ≠ FeeRouter
              │
    ┌─────────┼─────────┐
    ↓         ↓         ↓
 Steward   Merchant   Guide
  ACTIVE    DISABLED  DISABLED
  ~4% TTG    TBD        TBD
```

**Governance path for stake params:** Governor → vote → **NEW Timelock** → update role stake config / enable role.  
**Does not** remint Token.

---

## 2 · Existing Region Steward 4% TTG system (AS-IS lookup)

| Surface | Path / fact |
|---------|-------------|
| **SSOT 表** | [`protocol-ssot.v1.md` §4](../spec/governance-token/protocol-ssot.v1.md) · `steward_stake_bps` 分母 = **TTG total_supply** |
| **Registry** | [`registry/v311-stake-minimum-by-country.v1.yaml`](../../registry/v311-stake-minimum-by-country.v1.yaml) · `stake_minimum_ttg = supply × bps / 10000` |
| **合约** | [`contracts/src/RegionStewardStakePool.sol`](../../contracts/src/RegionStewardStakePool.sol) · per-`jurisdiction` lock · `configureJurisdiction`（owner 可改 bps）· proxy storage init 存在 |
| **集中度** | GOV-03 · `max_aggregate_seat_stake_per_entity_bps = 400`（同一控制主体 Seat 质押合计 **≤4%**） |
| **产品流** | L5 ③ · Stake TTG ≥ 该国 minimum **+** 300k Access Fee |
| **正交声明** | protocol-ssot：**`fee_route_bps` ≠ `steward_stake_bps`**（数值曾相等 ≠ 同语义） |

**Owner confirm (2026-08-21):** 十国 **继续用现有 `steward_stake_bps` 分级表**（CN/US=400…）；分母 = **当时链上 TTG `totalSupply()`**（治理 burn 后总量下降 → **申请门槛按同一百分比自动变少**）。**不是**写死 genesis 枚数。

### Phase-1 十国 `steward_stake_bps`（已有 · 非 FeeRouter）

| Country | steward_stake_bps | 相对**当前**总供应 |
|---------|-------------------|-------------------|
| CN / US | **400** | **4.00%** |
| FR / ES | 450 | 4.50% |
| JP / TH | 250 | 2.50% |
| SG / KR | 200 | 2.00% |
| AU / AE | 150 | 1.50% |

**公式（Owner binding）：**

```text
minStake(jurisdiction) = ttg.totalSupply() × steward_stake_bps[j] / 10_000
```

例：CN 400 bps · 供应 25T → 需锁 **1T**；若 burn 后供应变 20T → 新申请只需锁 **0.8T**（仍是 4%）。  
已质押仓位按**当时锁入的绝对数量**持有，不因后续 burn 自动退还差额（除非另定规则）。

### AS-IS 实现缺口（须进 V9 Role Stake）

| Surface | Behavior |
|---------|----------|
| `RegionStewardStakePool.minStakeAmount` | 用 **immutable `ttgTotalSupplyUnits`**（部署写死）· **不会**随 burn 下降 |
| Registry `v311-stake-minimum-by-country` | 仍镜像旧 `ttg_total_supply: 10000000` 绝对枚数 |
| V9 Token | `totalSupply` **可降**（`protocolBurn`）· `MAX_SUPPLY` 永不增 |

**V9 Target:** Role Stake / 新绑 NEW TTG 的 Steward 池须读 **`IERC20(ttg).totalSupply()`（或 V9 等价）** 算门槛；bps 表仍由 Timelock `configureJurisdiction` 可调。**禁止**把 4% 写进不可升级 Token。

**供应注意：** 同 bps 在 **25T genesis** 下绝对枚数远大于旧 10M 面额表；以 **活 `totalSupply()` × bps** 为准，Registry 绝对列仅作展示缓存。

### Merchant / Guide AS-IS（接口已有 · 额度 TBD）

| Role | Contract AS-IS | Owner living |
|------|----------------|--------------|
| Merchant (Provider) | `ProviderIdentityStakingPool` · `minIdentityStake` **immutable at deploy** | DISABLED / TBD — **不宜**把未定额度写进不可升级 Token |
| Guide | `GuideIdentityStakingPool` · 同上 | DISABLED / TBD |

**Target shape (Owner):** 统一 **Role Stake System**（可升级 / Timelock 配置），角色开关：

```text
REGION_STEWARD → per-country bps table (CN/US 4%…) · ACTIVE · min = live totalSupply × bps
MERCHANT       → TBD · DISABLED
GUIDE          → TBD · DISABLED
```

现有双 Identity 池 + Steward 池可作 **LEGACY 实现面**；V9 绑定 NEW TTG 时优先 **可配置 Role Stake + live supply 分母**，避免 immutable `ttgTotalSupplyUnits` 与 burn 脱节。

---

## 3 · FeeRouter — ACTIVE Owner semantics (post-split)

| Item | ACTIVE? |
|------|---------|
| 第一层 45% 主理人侧 / 55% 项目总池 | **YES**（有主理人） |
| 无主理人 → 100% 项目总池 | **YES**（Target；实现另闸） |
| `globalStakers` 3575 bps / 83「质押激励」 | **NO — exit Owner ACTIVE** |
| 用 FeeRouter 腿「代替」主理人 4% TTG 质押 | **FORBIDDEN** |

**诚实 Reality：** 链上 FeeRouter 默认仍可能是 `4500/3575/1100/825`。Owner ACTIVE 叙事 **不再消费** `globalStakers` 腿；Safe-exit / 重路由时按 **45/55 或 100%→P4Cap** 设计，**禁止**再部署 GlobalStakersFeeVault 当经济真源。

---

## 4 · Why not bake 4% into Token

| Surface | Upgrade? | Stake params? |
|---------|----------|---------------|
| TravelTrustGovernanceTokenV9 | **No** (invariant) | **Never** |
| Role Stake / RegionStewardStakePool (owner/Timelock config) | **Yes** (proxy or configure) | **Yes** |
| FeeRouter BPS | Timelock `setRoutingConfig` | **Fee only** · no stake |

---

## 5 · Agent binding

1. Narrative / audits / Root Replacement：**质押 = Role Stake**；**分账 = FeeRouter USDC**。  
2. 不再把 Option II「GlobalStakersFeeVault」当 Safe-exit 默认。  
3. V9 remint **不**重写 Seat 经济为 Fee 腿；Stake 池 **另轨** 绑 NEW TTG。  
4. Merchant/Guide：**留接口 · DISABLED · 额度 TBD**。  
5. 改十国 bps / 统一 4% / 改 FeeRouter 四腿 → **须 Owner 书面经济授权**（本文件只定拆分与 ACTIVE 语义）。

---

## 中文要点

- **质押**只有角色责任锁 TTG：**主理人 ~4%（现有十国表 + Seat 池）**；商家/向导 **TBD + 可升级接口**。  
- **FeeRouter 不再含「质押」概念**；`globalStakers 35.75%` **退出 Owner ACTIVE**。  
- **30万 USDC** 准入费与 **TTG 质押** 双轨并行（L5 已写）。  
- 现成体系：`protocol-ssot` + `v311-stake-minimum-by-country` + `RegionStewardStakePool`；Identity 双池 = 商家/向导 LEGACY 面。  
- **4% 不写进不可升级 Token**；走 Role Stake / 治理升级。
