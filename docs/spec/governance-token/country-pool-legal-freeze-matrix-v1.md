# Country Pool Legal Freeze Matrix v1

**Matrix ID:** `country-pool-legal-freeze-v1`  
**Version:** v1.0.3-legal-freeze-20260615  
**Status:** **GATE-0 LEGAL FREEZE（② · 随 accounting-spec v1.0.3）**  
**SSOT 规格：** [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) **§9**  
**Companion：** [country-pool-accounting-mapping-matrix-v1.md](country-pool-accounting-mapping-matrix-v1.md) · [08-4](../08-4-对外口径包.md) **§2** · [LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md)

**阶段：** ② · **Gate-0 Exit 通过后允许 Gate-2 设计评审** · **合约 PR 仍须 Gate-2 开工 checklist**

---

## 1. 使用说明

| 列 | 含义 |
|----|------|
| **Legal ID** | accounting-spec **§9 L-01～L-07** 及扩展 **LEG-*** |
| **合规边界** | 对外/对内 **禁止** 与 **必须** 表述 |
| **08-4 锚点** | 证券隔离 / NAV / 收益流 交叉 |
| **披露句（草案 · 定稿前不得对外印刷）** | 法务冻结 **语义**；印刷须 bump 08-4 或风险披露附录 |

**分轨（写死）：** **D-4555-A** = FeeRouter 可分配平台手续费第一层 45/55 · **D-4555-B** = 单国 Country Pool **净利润** 45/55 — **不同分母 · 不同时点 · 不同合约**。

**Owner 自证边界（①）：** 本矩阵为 **规格层合规冻结** · **≠** ③ licensed counsel 印刷 GO · 见 [SOLO-MAINTAINER-SIGNATURE-INDEX](../../frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md)

---

## 2. L-01～L-07 逐项合规边界

### L-01 · 双轨披露（D-4555-A ≠ D-4555-B）

| 项 | 规则 |
|----|------|
| **必须** | 对外材料 **分列**「平台可分配手续费路由（D-4555-A）」与「单国国家池净利润结算（D-4555-B）」 |
| **禁止** | 同页/同段 **加总** 两轨 45% 或 55% · 暗示 **「双重 45/55」** · 用 FeeRouter 图 **等同** 净利润 split 图 |
| **08-4** | 扩展 FeeRouter 段 · [08-4-附录-收益流闭环图](../08-4-附录-收益流闭环图-FeeRouter-Target.md) **仅覆盖 D-4555-A** |
| **FIN 交叉** | [FIN-DISC-01/05](country-pool-accounting-mapping-matrix-v1.md) |

**披露句（草案）：**  
「TravelTrust 存在 **两套独立** 的 45%/55% 参数：**(A)** 订单进入 FeeRouter 后的 **可分配平台手续费** 在国家/Global 间的 **第一层路由**；**(B)** 各国 Country Pool 在 **关账周期** 内按科目核算 **净利润** 后的 **第二层分配**。二者 **分母、时点与合约均不同**，**不得** 合并解读为对同一笔收入的重复分配。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

### L-02 · 收益分配非收益保证（No Return Guarantee）

| 项 | 规则 |
|----|------|
| **必须** | 明示 **分配裁量** · **亏损期无 split** · **无保底** · **Past performance ≠ future** |
| **禁止** | 保本 · 固定收益 · 股息 · 股权 · 利润分成承诺 · 「刚性 45%」· 「亏损补底」· APY/年化收益暗示 |
| **08-4** | §2 收益证券隔离 · §4 治理币边界 · LEGAL-SIGNOFF「禁止性表述」 |
| **FIN/产品交叉** | §5 L-06 · **FIN-L02** · **Q-F02** |

**披露句（草案）：**  
「Country Pool **净利润** 在 **正余额且满足关账与资格快照** 时，方可能按协议 **裁量** 进入 Steward/Global 路径分配。**该分配不构成** 对本金属、固定收益、股息、股权或利润分成之 **保证**；**亏损或零利润周期不发生** 净利润 split。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

### L-03 · StewardPath 资格条件与表述（非工资 · 非股权分红）

| 项 | 规则 |
|----|------|
| **必须** | 45% 表述为 **「协议治理裁量下的区域分配路径」** · 进入 **StewardPathVault** 须 **§7 Q-01～Q-04 全满足** |
| **禁止** | 工资 · 劳务报酬 · 股权分红 · 「Seat 即 entitlement」· 质押量比例 **替代** 45% 公式 |
| **资格真源** | Q-01 Active Seat · Q-02 `RegionStewardStakePool` · Q-03 无暂停 · Q-04 最短任期 |
| **08-4** | Howey 风险 · **83/84** 非股权披露 |
| **Q-F05** | **禁止** 主理人 **个人 EOA** 在 split/释放中 **直接收款** |

**披露句（草案）：**  
「**Steward 路径** 份额 **仅** 在辖区 **Active Region Steward** 于快照块满足 **Seat、质押、合规与任期** 等 **全部** 协议条件时，方可进入 **StewardPathVault** 后续治理分配流程。该路径 **不代表** 雇佣关系、固定薪酬或 **Country Pool 股权**。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

### L-04 · 证券化风险隔离（Securities Exposure · D-4555-B 切片）

| 项 | 规则 |
|----|------|
| **必须** | D-4555-B **纳入** 08-4 §2「收益证券隔离」闭环 · **Howey** 风险披露 **覆盖** 净利润 split |
| **禁止** | 将 split 描述为 **投资者回报** · 与 **TTG/Country Pool 认购** **绑定承诺** · 「staking = dividend」 |
| **三轨独立** | 募资表（万元）· Fee Points · Seat 质押 **不参与** split 公式（§6.5） |
| **LEGAL-SIGNOFF** | 本矩阵 **§6** D-4555-B 扩展项 **☑** |

**披露句（草案）：**  
「Country Pool **净利润 split** 为 **协议层治理与国库路由** 机制，**与** Country Pool **份额认购/NAV 赎回** **分段披露**。**不得** 将净利润分配解读为对 Pool 参与者的 **证券型回报**；具体 **Howey/证券属性** 结论以 **法务定稿** 风险披露为准。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

### L-05 · 亏损期不分配披露（Loss Period · No Split）

| 项 | 规则 |
|----|------|
| **必须** | 风险披露 **明示** **`NetProfit ≤ 0`** 时 **无** steward/global split · **`carriedLoss`** 结转 |
| **禁止** | 「下期一定补发」· 隐性保底 · 用 Global 55% **填补** Steward 45% 缺口（**≠** Q-F02） |
| **FIN 交叉** | **FIN-DISC-02** · **FIN-L02** · §5 L-01～L-04 |

**披露句（草案）：**  
「当单国 Country Pool 在结算周期 **净亏损或零利润** 时，协议 **不执行** 净利润 45/55 split；亏损 **可结转** 至后续周期 **扣减** 可分配利润。**不存在** 对 Steward 或 Global 路径的 **亏损期刚性分配**。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

### L-06 · Global Treasury 与 StewardPath 分轨披露

| 项 | 规则 |
|----|------|
| **必须** | **55% Global** 与 **45% Steward/Unallocated** **分轨叙述** · Global **不因** 资格缺失 **获得额外** 45% |
| **禁止** | 「Unallocated 最终归总部」· 将 **2150 Unallocated** 披露为 **Global 收入**（**FIN-U-01**） |
| **08-4** | Global Pool 65/20/15 **仅** 指 D-4555-A Global **桶内** · **≠** D-4555-B 55% 腿语义混读 |
| **L-06（spec）** | 启用 **② 链上读数** 前 **LEGAL-SIGNOFF D-4555-B 切片 ☑**（本矩阵 §6） |

**披露句（草案）：**  
「净利润 split 中 **55%** 进入 **Global Treasury 路径**，**45%** 进入 **Steward 或 Unallocated 托管路径**。**资格缺失时**，原属 Steward 的 45% **进入 Unallocated 协议托管**，**不** 并入 Global 55% 或 **视为** 总部额外收入。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

### L-07 · UnallocatedStewardPathVault 托管性质

| 项 | 规则 |
|----|------|
| **必须** | 披露为 **「待主理人资格满足后、经治理释放的协议托管余额」** |
| **禁止** | Global 收入 · 已放弃权益 · 销毁 · 无提案改分 · **跨 jurisdiction 混用**（**Q-F03**） |
| **释放** | **仅** 独立治理提案 + Timelock（**U-04** · **U-05**） |
| **FIN 交叉** | **FIN-U-01** · **FIN-DISC-03** · GL **`2150-CP-UNALLOC-{J}`** |

**披露句（草案）：**  
「**UnallocatedStewardPathVault** 持有 **因主理人资格暂不满足** 而 **未能** 进入 StewardPath 的 **45% 份额**，性质为 **协议托管负债**，**待** 辖区满足 **§7** 条件并经 **治理提案** 释放至 StewardPath。**该余额不是** 已销毁资产、总部收入或参与者可单方提取的权益。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

## 3. 跨辖区限制（LEG-XJ · Gate-0 冻结）

| ID | 规则 | 依据 |
|----|------|------|
| **LEG-XJ-01** | **一国一池** · **`jurisdiction` ISO 3166-1 alpha-2** · **禁止** 多国净利润 **合并后再按国切回** | accounting-spec §1.1 · country-revenue-model §1 |
| **LEG-XJ-02** | **`epochId` per jurisdiction** · **Unallocated / carriedLoss / split** **不得** 跨 **J** 混用 | **Q-F03** · **U-03** · **FIN-L02-01** |
| **LEG-XJ-03** | **对外** 须 **按国** 披露 Pool 状态 · **禁止** 「全球 Pool 统一分红」叙事 | **84** · **08-4** Country Pool 段 |
| **LEG-XJ-04** | **制裁/合规辖区** 的 split/释放 **须** 服从 **治理裁定扣减（E-130）** 与 **法务 Runbook** — **不得** 以 split **规避** 制裁 | §3 E-130 · Runbook 定稿表（③） |
| **LEG-XJ-05** | **Phase ② 试点** 仅 **已部署 jurisdiction** 可链上读数；**未上线国** **不得** 对外暗示 **已结算** | PHASE2 审计 · **L-06** |

**状态：** **✅ 法务已确认** · 2026-06-15

---

## 4. NAV 与净利润 split 分段披露（L-05 · 08-4 R4 交叉）

| 披露段 | 内容 | 禁止混读 |
|--------|------|----------|
| **NAV 赎回** | **比例赎回 · 非本金保证** · Operations 已花 **不退** | 将 NAV **等同于** 净利润 split 收益 |
| **净利润 split** | **周期 P&L · 关账后** 治理路由 | 将 split **等同于** 认购回报或 **刚性分红** |

**披露句（草案）：**  
「Country Pool **NAV 窗口赎回** 与 **净利润 split** 为 **两套机制**：赎回按 **NAV 比例** 且 **非保本**；净利润 split **仅** 在 **关账周期正利润** 下 **可能** 发生，**均不构成** 对参与者的收益保证。」

**状态：** **✅ 法务已确认** · 2026-06-15

---

## 5. 对内禁止清单（印刷前 grep · LEG-BAN-01）

对外/对内材料 **不得** 出现下列 **未经法务书面批准** 的表述：

| 禁止类 | 示例 |
|--------|------|
| 双重 45/55 | 「FeeRouter 45% + 净利润 45% = 90% 给国家」 |
| 收益保证 | 「每季固定 45% 分给主理人」「保底分配」 |
| 证券化 | 「Country Pool 股息」「Seat = 股权分红」 |
| Unallocated 误读 | 「未分配利润归总部」「Unallocated 即 burn」 |
| 跨辖区 | 「全球 Pool 统一结算再分国」 |
| 混轨 | 用 **D-4555-A 图** 解释 **D-4555-B split** |

**CI 旁证：** `scripts/gates/check-governance-doc-linkage.sh`（业务文档 legacy 术语 · 三轨 SSOT）

---

## 6. LEGAL-SIGNOFF D-4555-B 扩展切片（L-06 · 随 Gate-0 ☑）

| ☐ | 项 | 状态 |
|---|-----|------|
| ☑ | **D-4555-B 分轨披露**（L-01） | **2026-06-15** |
| ☑ | **科目与亏损 · 无保底分配**（L-02 · L-05） | **2026-06-15** |
| ☑ | **主理人路径 · 非证券型收益承诺**（L-03） | **2026-06-15** |
| ☑ | **Unallocated 托管 · 证券隔离**（L-07 · Q-F02～Q-F03） | **2026-06-15** |
| ☑ | **08-4 第 2 章 Howey / 收益证券隔离覆盖 D-4555-B**（L-04） | **2026-06-15** |
| ☑ | **Global vs Steward 分轨**（L-06） | **2026-06-15** |
| ☑ | **跨辖区限制 LEG-XJ-01～05** | **2026-06-15** |

**② 链上读数前提：** 上述 **全部 ☑** 后，方可在 **staging/测试网 UI** 展示 **D-4555-B 链上 epoch**（仍 **≠** ③ 对外印刷 GO）。

---

## 7. Gate-0 法务签字（本矩阵）

| 项 | 状态 |
|----|------|
| L-01～L-07 合规边界 + 披露句草案冻结 | **✅ 2026-06-15** |
| LEG-XJ-01～05 跨辖区限制 | **✅ 2026-06-15** |
| NAV/split 分段披露（§4） | **✅ 2026-06-15** |
| LEGAL-SIGNOFF D-4555-B 切片（§6） | **✅ 2026-06-15** |
| accounting-spec **§10 法务行** · **§11 G0-05/G0-06 法务列** | **见 accounting-spec v1.0.3** |

**签字：** **Sebastian Ward（法务 Gate-0 · Owner 自证 · 非 ③ licensed counsel）** · **2026-06-15**

---

## 8. 变更记录

| Version | Date | Note |
|---------|------|------|
| v1.0.3-legal-freeze-20260615 | 2026-06-15 | Gate-0 法务冻结首版 · L-01～L-07 · LEG-XJ · LEGAL-SIGNOFF D-4555-B 切片 |
| v1-20260615 | 2026-06-15 | （reserved） |
