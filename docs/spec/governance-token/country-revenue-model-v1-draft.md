# TravelTrust 国家收益模型 v1 草案（① · ENGINEERING_DEFAULT）

**Version:** v1-draft-20260616c  
**Status:** **SUPERSEDED BY [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) · P4 治理细节保留**  
**Companion：** [`ttg-reference-price-v1-draft.md`](ttg-reference-price-v1-draft.md) · `GET /api/v1/governance/protocol-reference` · `/governance/params`

**阶段边界：** ① 文档 + 公示文案 · **②** 测试网 FeeRouter/国家池分账真链 · **③** 法务签字后可对外印刷。

---

## 1. 运营与核算（一国一池）

| 原则 | 说明 |
|------|------|
| **独立运营** | 每个国家/地区独立运营 |
| **独立核算** | 该国订单与成本单独记账 |
| **独立国家池** | 该国产生的**订单利润**直接进入**对应国家池** |
| **禁止混池** | **不参与**「全球国家池」混合后再按国切回 |

---

## 2. 结算周期与 FeeRouter 分账（该国池净利润）

**结算周期：** **Phase ② 产品固定默认 `QUARTER`**（自然季 · **UTC** · **`closeDelayDays=15`** · [accounting-spec PR-01](country-pool-net-profit-accounting-spec-v1.md)）；MONTH/YEAR 须治理提案。

**对象：** 该国国家池在周期内的**净利润**（非毛订单额；具体科目以实现与 83/08-4 为准）。

| 去向 | 比例 | 说明 |
|------|------|------|
| **国家区域主理人及治理体系** | **45%** | 该国 Seat 主理人及其治理分配路径 |
| **TravelTrust Global Treasury（总部金库）** | **55%** | 全球总部金库 · **先**按 §2.1 用途政策支出 · **后**结余再分配 |

**与旧 84 叙事的区别（读前必知）：** 历史上 84/83 曾把 **45/55** 叙述为「整笔可分配平台费用 → 国家桶 / Global Pool」的第一层；**本 v1 草案**将 **45/55** 明确为 **「单国国家池净利润」** 的拆分，**不是** 全球国家池混合权重。

---

## 2.1 Global Treasury Usage Policy（① · 产品冻结 · 2026-06-16）

**对象：** 单国国家池净利润经 §2 拆分后进入 **Global Treasury** 的 **55% 法币/结算资产**（**非** TTG 代币供应 · **非** FeeRouter 第一层 Global 55% 混读）。

**执行顺序（写死 · 优先级递减）：**

| 优先级 | 用途 | 说明 |
|--------|------|------|
| **P1** | **平台运营** | 运营 · 安全 · 法务 · 会计 · 客服 · 市场 · 研发等总部持续成本；**须** 先于任何持有人分红 |
| **P2** | **安全与风险准备金** | 审计 · 保险 · 合规 · 极端风险缓冲；**不得** 与 P1 混账 |
| **P3** | **生态激励** | 经治理批准的生态/社区/增长激励；**非** 自动按 TTG 持仓比例发放 |
| **P4** | **Treasury Reserve（金库储备）** | P1～P3 **预算全部满足后** 的 **剩余结余默认留库** · **须 GlobalDAO / Timelock 治理投票** 方可用 · **GOV-01** · 单周期可动用 ≤ **`min(P4Surplus, TreasuryReserveBalance × treasury_p4_deploy_cap_bps / 10000)`** · **`treasury_p4_deploy_cap_bps=3000`（30%）** · Reserve **不含** P1～P3 已承诺预算 · 选项：**A 回购 · B 销毁 · C 持币奖励 · D 生态 · E 国家池** · 细则 [TTG-TOKENOMICS-FREEZE-V1 §2 GOV-01](TTG-TOKENOMICS-FREEZE-V1.md) · [ttg-primary-market-and-exit-policy-v1 §1](ttg-primary-market-and-exit-policy-v1-draft.md) |

**禁止表述（对外 · LEG 对齐 · ③ 须改写）：**

- **禁止** 将 **整笔 55%** 或 P4 结余叙述为「**自动**按 TTG 供应比例 **发现金** 给所有人」— **须先 P1～P3 全部满足 · 再经治理投票**
- **禁止** 将「持有 TTG」等同于「自动获得 **45%** 区域主理人净收益」— **45% 仅** 属 Active Seat 路径
- **禁止** 「固定收益 / 按持仓分现 / 保本 / 刚性 USDC 兑付」— P4 **默认留库** · 动用 **须治理** · **行业推荐回购销毁而非直接分钱**

**与 FeeRouter Global 内 65/20/15 的关系：** FeeRouter 第一层 **Global Pool 55%** 内的 65/20/15 属于 **D-4555-A · 可分配平台手续费** 子账（[protocol-ssot.v1 §2](protocol-ssot.v1.md)）；**本 §2.1** 约束 **D-4555-B · 单国净利润** 进入 **GovernanceTreasury** 后的 **现金用途顺序** — **两轨独立** · **禁止** 合并叙述。

**UI 镜像：** `/governance/params` · [country-revenue-model-v1-draft §2.1](country-revenue-model-v1-draft.md) · **[ttg-allocation-permissions-flows-ssot-v1 §3B](ttg-allocation-permissions-flows-ssot-v1.md)** · **① 只读** · **②** 链上 `GovernanceTreasury.spend` 预算科目对齐待 Gate-2.4 后单独立项

---

## 3. Seat · TTG 责任质押

| 项 | 规则 |
|----|------|
| **触发** | 担任该国 **Seat** 区域主理人 |
| **数量** | 按 **Seat 等级** · [protocol-ssot.v1 §4](protocol-ssot.v1.md) `steward_stake_bps` |
| **性质** | **责任质押** + **治理资格**（链上 `RegionStewardStakePool`） |
| **锁仓** | **24 个月** · 到期分批释放 |

## 4. 三轨独立参数（无自动换算）

| 体系 | 制定主体 | 文档 |
|------|----------|------|
| **募资目标（万元）** | 治理委员会 / 董事会 · 按市场规模 | [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) |
| **Seat 质押 TTG** | Seat 等级 · protocol-ssot | [protocol-ssot.v1 §4](protocol-ssot.v1.md) |
| **Fee Points** | 国家收益分配等级 · Seat 等级档 | 本节 §5 |

**禁止：** 用 TTG 参考价、质押枚数、Fee Points 任一组合 **自动推导** 另两列数值。历史工程公式 **仅** 见 [archive/phase1-fundraise-stake-times-reference-price-formula-historical.md](archive/phase1-fundraise-stake-times-reference-price-formula-historical.md)（**ARCHIVE · 勿引用**）。

---

## 5. Fee Points（费点）定义 — v1 冻结口径

**Fee Points 表示：**

1. **国家收益分配等级**  
2. **Seat 等级**（与 protocol-ssot 档位一致）

**Fee Points 不再表示：**

- 全球国家池权重（Fee Points 为国家收益分配等级，非全球混合权重）
- 与 TTG 质押 bps 同一语义（数值 Phase 1 可映射相等，**含义仍分轨**）
- 法币募资目标（募资见 [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md)，与 Fee Points 分轨）

**公示页读法：** `/governance/params` 十国表中 Fee Points 列 = **等级标签**；募资列 = **治理独立参数**；质押列 = **链上责任锁仓**。

---

## 6. 与 companion 文档关系

| 文档 | 关系 |
|------|------|
| [ttg-allocation-permissions-flows-ssot-v1](ttg-allocation-permissions-flows-ssot-v1.md) | **图解 SSOT** · 供应/四轨/申请/权限 · **改逻辑必改图 §0** |
| [TTG-TOKENOMICS-FREEZE-V1](TTG-TOKENOMICS-FREEZE-V1.md) | **GOV-01～04 · Gate-2.4 / Sepolia 唯一经济模型 SSOT** |
| [ttg-primary-market-and-exit-policy-v1](ttg-primary-market-and-exit-policy-v1-draft.md) | **公众三轮发行 · P4 治理+GOV-01 cap · Seat 解锁退出 · 回购/销毁（Owner 拍板）** |
| [protocol-ssot.v1](protocol-ssot.v1.md) | Seat 质押 bps · 锁仓 24 月 · 十国档位 |
| [country-pool-fundraise-governance-v1](country-pool-fundraise-governance-v1.md) | **治理委员会独立募资表** |
| [country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md) | **②** 净利润 45/55 **链上设计**（DESIGN ONLY） |
| [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) | **Gate-0 · 国家池净利润核算规格 v1（科目/周期/亏损/分账/签字）** |
| [ttg-reference-price-v1-draft](ttg-reference-price-v1-draft.md) | 200 CNY/TTG · Mock Swap · FDV（与募资解耦） |
| [84 §四](../84-第一阶段10国Country-Pool发行参数总表.md) | **募资列** 镜像 **country-pool-fundraise-governance-v1** · **fee 列** 镜像 protocol-ssot |
| [83](../83-治理与分配.md) · [08-4](../08-4-附录-收益流闭环图-FeeRouter-Target.md) | ② 链上实现须专项对齐本 §2，**非** ① 默认真链 |

---

## 7. 定稿门禁

**Gate-0 SSOT：** [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) — **Gate-0 Exit ✅（2026-06-15）** · **Gate-2 设计评审已开放** · 合约 PR 仍须 Gate-2 checklist

- [x] 产品确认「一国一池、不混全球池」与结算周期 → **accounting-spec §4 PR-01（QUARTER · UTC · 15d）** · 2026-06-15
- [x] 产品确认 **Global Treasury Usage Policy（§2.1 · P1～P4 顺序）** · 2026-06-16
- [x] 产品确认 **UnallocatedStewardPathVault**（Q-F01）→ **accounting-spec §6.3 / §7 PR-02/PR-03** · 2026-06-15
- [x] 财务确认收入/成本科目与亏损规则 → **[country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md)** · **accounting-spec v1.0.2 §0.2 FIN-01～FIN-DISC** · 2026-06-15
- [x] 法务确认 45/55 对外表述与 08-4 证券隔离 → **[country-pool-legal-freeze-matrix-v1.md](country-pool-legal-freeze-matrix-v1.md)** · **accounting-spec v1.0.3 §0.3 LEG-01～LEG-XJ** · 2026-06-15
- [ ] 工程 ② Settlement 合约按 **[country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md)** + **accounting-spec** 实现（**Gate-0 Exit 后 · Gate-2 设计评审 → 开工 checklist**）

**不替代：** [LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md)
