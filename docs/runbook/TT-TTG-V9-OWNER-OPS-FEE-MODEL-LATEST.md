# TT · TTG V9 — Owner Ops Fee Model vs Spec Layers


> **STATUS (Documentation Truth Convergence · 2026-08-21):** **SUPERSEDED as Official ACTIVE V9 path** · DO_NOT_USE for living V9 Design Lock / DL_R1 / Mainnet Phase1.  
> **Sole upstream now:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · status `DEPLOYED_PENDING_CUTOVER` / `TIMELOCK_CUTOVER_PENDING` · **≠** `MAINNET_FULLY_ACTIVE` · **≠** `TT_PRODUCTION_GO`.  
> Historical evidence below is retained · R2_FINAL / Remint / Safe-Timelock / P4Cap-as-sale-sink / globalStakers ACTIVE claims are **LEGACY**.

**STATUS:** `OWNER_OPS_FEE_MODEL_RECORDED` · superseded for full matrix by [Fee vs Role Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md)  
**Trigger:** Owner rejects FeeRouter「质押激励」as living ops; restates Access Fee + 45/55 + quarterly 30% + **Role Stake 4% TTG** orthogonal  
**Forbidden:** Rewrite FeeRouter BPS / FTB Reality as already migrated · claim 83 GO · bake stake into Token

**Living SSOT (full matrix):** [TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md)

Parents: [Money Flow Reconciliation](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md) · [Pre-Audit Alignment](TT-TTG-V9-PRE-AUDIT-ALIGNMENT-REGISTER-LATEST.md) · [83](../spec/83-区域治理与收益分配-协议白皮书.md) · [FTB](TT-FINAL-TRUTH-BASELINE-LATEST.md)

Evidence: `evidence/GO_ttg_v9_audit/V9_OWNER_OPS_FEE_MODEL_RECORDED.json`

---

## 0 · Owner living ops model (this session · binding intent)

| # | Owner statement | Exact / rule |
|---|-----------------|--------------|
| **B** | 申请区域主理人 · **30万 USDC 平台准入费** | → **个人钱包** `0xe1e732EfBf9B010a9204054467256d3d93f3CdD4`（Marketing / Solo Owner ops） |
| **C1** | 平台交易费 / 平台服务费 | **有区域主理人：45% → 区域主理人侧 · 55% → 总项目池** |
| **C2** | 无区域主理人 | **100% → 总项目池** |
| **D** | 总项目池运营动用 | **每季度（3 个月）最多拿出 30% USDC** 用于官方运营/工资等 · **可打到个人钱包使用** |
| **X** | FeeRouter「质押 / globalStakers」 | **退出 ACTIVE** · 角色质押见 [Fee vs Stake](TT-TTG-V9-OWNER-ECONOMIC-MODEL-FEE-VS-STAKE-LATEST.md) |
| **S** | 区域主理人 **TTG 质押** | **ACTIVE** · ~4%（protocol-ssot / RegionStewardStakePool）· **≠** FeeRouter |
| **S2** | 商家 / 向导 TTG 质押 | **DISABLED · TBD** · 可升级 Role Stake 接口 |

**Orthogonal (unchanged):** Path A · 公售 TTG USDC → **P4Cap** `0xfB906ae…BbF`（≠ 准入费 · ≠ 订单 Fee）。

---

## 1 · Three layers — do not collapse

| Layer | What it is | Status vs Owner intent |
|-------|------------|------------------------|
| **L-Owner Ops** | 上表 B / C1 / C2 / D | **Living intent recorded** |
| **L-83 Target** | FeeRouter 第一层 45% 国家桶 + 55% Global；Global 内再拆 **TTG 质押激励 65% / 储备 20% / 运营 15%** → 链上默认 BPS `4500/3575/1100/825`；国家桶 → RegionVault→Snapshot→Claim（**不是**主理人 EOA 直收 45%） | **协议 Target 文档** · **≠** Owner living ops · **≠** Official commercial GO |
| **L-Reality (FTB)** | FeeRouter 已部署 · BPS MATCH · country/stakers 现落 Safe interim · reserve/ops → P4Cap · P4Cap `spend` ≤ **30%/90d** via Timelock | **链上 Reality** · interim · **≠** 83 GO · **≠** Owner 口述已全部落地 |

**AI 误读纠正：** 仓库里的 `globalStakers` /「TTG 质押激励」来自 **83 Global Pool 内 65% 切片**，**不是**主理人 30 万准入费，也不是「必须做质押产品才能去 Safe」。Owner 本轮明确：**不以该质押切片为当前运营真源**。

---

## 2 · Mapping table (honest)

| Owner intent | Closest repo surface | Gap / honesty |
|--------------|----------------------|---------------|
| 30万 → `0xe1e732…CdD4` | Registry `founder_designated_wallet` · rails `founder_bootstrap_wallet` | **Exact now pinned** (was null) · collection orchestration still OPEN |
| 45% 主理人 / 55% 总池 | 83 第一层 45/55 · FeeRouter `country`/`global*` | 83：**45% = 国家桶再分配**，非默认「打进主理人个人钱包」；链上 Global 还多了一腿 **3575「stakers」** |
| 无主理人 → 100% 总池 | Country Pool **Unallocated** 设计（净利润轨）· FeeRouter **不自动**改 BPS | FeeRouter Reality **始终四腿拆分**；要「真 100%」须改路由落点或 BPS（**须另闸 Owner 经济授权**） |
| 季度最多 30% → 个人钱包运营 | **P4Cap** `TREASURY_P4_DEPLOY_CAP_BPS=3000` · `P4_ACCOUNTING_PERIOD=90 days` · `spendP4Reserve(token,to,amount)` | **比例与周期已对齐**；`to` 可为个人钱包 **仅当** Timelock/治理执行 spend · **不是**自动转账 |
| 不要质押模型 | 83 Target `TTG Staking 65%×55%` · FeeRouter `globalStakers` 腿 | **Owner 标记：非 living ops** · 代码/白皮书仍在 → 标 **TARGET_DEFERRED / 非本波实现** · **禁止**再把 GlobalStakersFeeVault 当 Safe-exit 必选项 |

---

## 3 · What this does to Option I / II / audits

| Previous framing | Update |
|------------------|--------|
| Option II = RegionVault + **GlobalStakersFeeVault** as Safe-exit | **Withdraw as default** — staking vault **not** Owner living model |
| Option I = country+stakers → P4Cap interim | Still valid **custody** path for Safe-exit **without** claiming Owner C1 already on-chain |
| 「质押」出现在 Local drill | **Over-introduced** relative to Owner ops · keep only as optional 83 Target artifact |

**Next Owner decisions still required before 3× audit:**

1. FeeRouter **Safe-exit custody** while keeping BPS frozen: confirm **interim all-gov-pool (P4Cap)** for country+stakers legs — **or** formal economic change to collapse stakers / implement true 100% when no steward.  
2. Confirm **45% living meaning**: (a) 主理人侧经济（国家桶/主理人路径）vs (b) **直接打主理人 EOA**（与现行「FeeRouter 禁个人 EOA 作 sink」冲突 · 须书面例外）。  
3. Confirm P4 spend `to` for ops 30% may include Marketing `0xe1e732…` under Timelock (ops policy).

---

## 4 · Binding Agent rules

- **Do not** invent or revive staking products for V9 Root Replacement.  
- **Do not** redirect 300k into P4Cap / FeeRouter / RegionVault.  
- **Do not** mutate R2_FINAL / FeeRouter BPS without separate Owner economic auth.  
- **Do** treat Owner table in §0 as living ops SSOT for narrative + Path B Exact.  
- 83 / FeeRouter four-leg remain **documented Target/Reality** until Owner formally amends economics.

---

## 中文要点

- 你认的运营模型是：**30万→`0xe1e732…`** · **有主理人 45/55** · **无主理人 100% 进总池** · **总池每季最多 30% 可打个人钱包做运营**。  
- 仓库「质押」是 **83 里 Global 55% 再拆 65% TTG 激励** 的 Target 文案 + FeeRouter `globalStakers` 腿 —— **不是**主理人准入费模型；本轮按你的口径标成 **非当前运营真源 / 本波不实现**。  
- **P4Cap 的 90 天 ≤30%** 与你说的「季度最多 30%」**已对齐**；公售仍进 P4Cap。  
- **未改**链上 BPS；真要「无主理人 100%」或「45% 直打主理人钱包」= **另开经济授权**，不能靠 Safe 退出顺带改写。
