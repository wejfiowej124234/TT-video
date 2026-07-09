# TTG 三轨独立参数模型 · 全链路一致性审计（①）

**Audit ID:** `three-track-independent-params-audit-20260615`  
**Phase:** **① 本地**（非 ②③ GO）  
**Canonical model:**

| 轨 | 制定主体 | SSOT |
|----|----------|------|
| **募资目标（万元）** | 治理委员会 / 董事会 · 按国家市场规模 | [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) |
| **Seat 质押 TTG** | Seat 等级 · 责任锁仓 · 治理资格 | [protocol-ssot.v1.md](protocol-ssot.v1.md) §4 |
| **Fee Points** | 国家收益分配等级 · Seat 等级档 | [country-revenue-model-v1-draft.md](country-revenue-model-v1-draft.md) §5 |
| **TTG 200 CNY/TTG** | Mock Swap · FDV 叙事 | [ttg-reference-price-v1-draft.md](ttg-reference-price-v1-draft.md) |

**历史工程公式（Seat×参考价→募资）：** 仅 [archive/phase1-fundraise-stake-times-reference-price-formula-historical.md](archive/phase1-fundraise-stake-times-reference-price-formula-historical.md)（**ARCHIVE · 勿引用**）。

**Business / IR / PM 叙事审计（同批）：** [GOVERNANCE-TO-BUSINESS-CONSISTENCY-AUDIT-20260615.md](GOVERNANCE-TO-BUSINESS-CONSISTENCY-AUDIT-20260615.md)

**国家收益 45/55（独立议题）：** [country-revenue-model-v1-draft.md](country-revenue-model-v1-draft.md) 定义为 **单国国家池净利润** 拆分；与 FeeRouter **可分配平台手续费** 第一层 45/55（[83](../83-区域治理与收益分配-协议白皮书.md) §3 · [84](../84-第一阶段10国Country-Pool发行参数总表.md) §1）**语义不同** — 链上 **②** 须专项对齐，**非** ① 默认真链。

---

## 1. 差异矩阵总览

| 域 | 对齐状态 | 说明 |
|----|----------|------|
| **Document · governance-token/** | **✅ 已对齐** | 三轨 SSOT + 归档；无活跃正文含旧公式 |
| **Document · 84 / 82 / 03 / memo** | **✅ 已对齐（2026-06-15 P0）** | 募资 SSOT · 删硬顶 · 5.35 亿 · 三轨 §3.4 |
| **Document · 83 / 08-4 / Runbook** | **⚠️ 分轨** | 平台费 45/55 已对齐链上；**≠** 国家池净利润 45/55 |
| **API · protocol-reference** | **✅ 已对齐** | 治理募资表 · `fundraise_target_source` · `valuation_anchor.independent_parameter_systems` |
| **API · ttg-exchange/quote** | **✅ 已对齐** | 仅 Mock/FDV · 无募资推导 |
| **UI · /governance/params** | **✅ 已对齐** | 客户端 overlay 治理表 · 三轨折叠说明 · 无硬顶列 |
| **UI · /traveltrust Mock Swap** | **✅ 已对齐** | 固定价 swap · 无募资绑定 |
| **i18n** | **✅ 已对齐** | 已删孤儿键 `governance_params_col_cap_wan`；country-revenue 45/55 文案带 draft 标注 |
| **Test · Vitest / Rust** | **✅ 已对齐（①）** | 单国 + **合计 53500 万** assert 已补；`check-governance-doc-linkage` 仍不验募资 MD |
| **Contract · FeeRouter / StakePool** | **⚠️ 分轨** | 45/55 = 平台费路由（83/84）；Stake bps = protocol-ssot；**无** 募资目标链上字段 · **无** 国家池净利润结算 |

---

## 2. Document 域

### 2.1 ✅ 已对齐（governance-token 现行 SSOT）

| 文件 | 结论 |
|------|------|
| [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) | 十国治理募资表 · 合计 **53,500 万** · 无硬顶 |
| [country-revenue-model-v1-draft.md](country-revenue-model-v1-draft.md) | 三轨 §4 · 国家池净利润 45/55 · Fee Points 语义 |
| [ttg-reference-price-v1-draft.md](ttg-reference-price-v1-draft.md) | Mock/FDV only · 不管辖募资 |
| [protocol-ssot.v1.md](protocol-ssot.v1.md) | `steward_stake_bps` 分轨 · 募资列指向治理表 |
| [archive/*](archive/README.md) | **唯一** 含 Seat×参考价→募资公式 |

### 2.2 ✅ 已对齐（2026-06-15 P0 · 含 Business 域同批）

| ID | 文件 / 位置 | 遗留项（改前） | 现行 SSOT | 状态 |
|----|-------------|----------------|-----------|------|
| **D-84-01** | [84 §四](../84-第一阶段10国Country-Pool发行参数总表.md) 主表 | 募资 **6000～7000**、**硬顶** 列 | [country-pool-fundraise-governance-v1](country-pool-fundraise-governance-v1.md) | **✅** |
| **D-84-02** | 84 §五 算术 | 合计 **3.85 亿** | **5.35 亿** | **✅** |
| **D-84-03** | 84 §六 中国展示块 | 融资 **6000**、硬顶 **8000** | CN **8000** 单目标 | **✅** |
| **D-84-04** | 84 §三 3.4 A/B/C | 线性标尺叙事 | 三轨独立 | **✅** |
| **D-84-05** | [84-valuation-anchor-P1-memo](84-valuation-anchor-P1-memo.md) | Option C 占位 | 治理表 SSOT | **✅** |
| **D-82-01** | [82 §索引行](../82-治理币-文档总览.md) | 「硬顶」列 | **无硬顶** | **✅** |
| **D-03-01** | [03-对外材料](03-对外材料-PPT与白皮书数据页摘抄索引.md) | 84 旧摘抄 | 治理表摘抄 | **✅** |
| **D-BIZ-01** | fundraising/internal · product-manager | 「募资目标、硬顶、估值锚」 | 三轨 + **53,500 万** | **✅** [GOVERNANCE-TO-BUSINESS](GOVERNANCE-TO-BUSINESS-CONSISTENCY-AUDIT-20260615.md) |

### 2.3 ⚠️ 45/55 语义双轨（非旧公式，但须登记）

| ID | 叙事 | 分母对象 | 链上现状 |
|----|------|----------|----------|
| **D-4555-A** | 83 / 84 / `FeeRouter.sol` / `protocol-reference.fee_router` | **单笔可分配平台手续费** → 国家桶 45% / Global 55% | **① 已实现**（`_bpsCountry=4500`） |
| **D-4555-B** | [country-revenue-model-v1-draft §2](country-revenue-model-v1-draft.md) | **单国国家池净利润**（季/年结算）→ 主理人 45% / Global Treasury 55% | **② NOT STARTED** — 无 CountryPool 净利润分账合约 |

**读法：** `/governance/params` 国家收益模型 bullet 描述 **D-4555-B**；同页 Fee 拆分条与 API `fee_router` 描述 **D-4555-A**。须在 **②** 专项设计前保持 **分轨标注**，禁止混读为同一池子已链上闭合。

---

## 3. API 域

### 3.1 ✅ 已对齐

| 路由 / 模块 | 键 | 值 / 行为 |
|-------------|-----|-----------|
| `GET …/governance/protocol-reference` | `phase1_countries[].fundraise_target_cny_wan` | 与 [governance_doc_reference.rs](../../crates/api/src/routes/governance_doc_reference.rs) 治理表一致（CN **8000** 等） |
| 同上 | `fundraise_target_source` | `"governance_board_per_country"` |
| 同上 | `valuation_anchor.fundraise_model` | `"governance_board_per_country_independent"` |
| 同上 | `valuation_anchor.independent_parameter_systems.auto_conversion_between_systems` | `false` |
| 同上 | `valuation_anchor.fundraise_targets_cny_wan` | 十国 JSON 镜像 |
| 同上 | `fee_router.layer1` | 45 / 55（**D-4555-A**） |
| `GET …/governance/ttg-exchange/quote` | `meta.valuation_anchor_id` | TTG 参考价 · **无** 募资字段 |

### 3.2 ⚠️ 遗留字段 / 闸缺口

| ID | 项 | 说明 | 收口 |
|----|-----|------|------|
| **A-01** | ~~`fundraise_cap_cny_wan`~~ | **✅ 2026-06-15** 已从 `governanceParams84Readonly` 移除 |
| **A-02** | `DOC_VERSION` `1.0.21` vs 84 文首 | 镜像版本与 **84 §四 数值** 不同步 | 84 重算后 bump 同批 |
| **A-03** | 无 `fundraise_targets` 合计机读 assert | Rust 测 CN/JP/KR/TH 单点 · **无 53500 合计** | 见 Test **T-01** |
| **A-04** | `check-governance-doc-linkage.sh` | 不校验 `country-pool-fundraise-governance-v1` ↔ API 字面量 | ② 前可加 gate（非 ① 阻塞） |

---

## 4. UI / i18n 域

### 4.1 ✅ 已对齐

| 表面 | 行为 |
|------|------|
| `/governance/params` | `applyGovernanceFundraiseTargetToRows` overlay 治理表；拆表 **Fee Points / 质押 / 募资**；无硬顶列 |
| 折叠区 | `GovernanceParamsPhase1IndependentParamsDetails` · 三轨说明 · **公式四条** + 废止注记 |
| `/traveltrust` · `TravelTrustStablecoinGateway` | Mock Swap · `ttgReferencePriceV1` · API quote · **无** 募资推导 |
| zh/en `governance_params_phase1_*` | 三轨独立文案 · **无** Seat×价 表述 |
| **双轨维度卡** | `GovernanceParamsDualTrackCards`（**已归档** · `frontend/archive/governance/`）· D-4555-A/B · 跳转锚点 |
| **主理人上下文** | `?from=steward_workbench` · `GovernanceParamsStewardContextPanel` |
| **Hub / Trust** | `governance_hub_params_pointer` · `trust_gov_params_hint` · 去 84 镜像口径 |

### 4.2 ⚠️ 遗留

| ID | 项 | 位置 | 收口 |
|----|-----|------|------|
| **U-01** | ~~`governance_params_col_cap_wan`~~ | **✅ 2026-06-15** 已从 zh/en 删除 |
| **U-02** | ~~Fee 拆分 vs 国家收益模型双轨标注~~ | **✅ 2026-06-15** · 维度卡 + section nav + 公式折叠 |
| **U-03** | ~~技术区仅写 spec 84~~ | **✅ 2026-06-15** · `governance_params_doc_notice` / data_scope 多 SSOT 指针 |

---

## 5. Test / 机读契约 域

### 5.1 ✅ 已有

| 套件 | 覆盖 |
|------|------|
| `governanceParamsPhase1IndependentParamsModel.test.ts` | 治理表 CN 8000 · overlay 覆盖 stale API |
| `governance_doc_reference::tests` | CN 8000 · JP 5000 · KR 4000 · TH 3500 · `fundraise_model` · 无 `fundraise_cap_cny_wan` |
| `governanceParamsPage.contract.test.ts` | 三轨 independent-params · 无 cap 列 |
| `ttgReferencePriceV1.test.ts` | FDV · stake units · mock rate |
| `governanceParamsCountryDisplay.test.ts` | 质押 TTG 与 protocol-ssot 一致 |

### 5.2 ⚠️ 缺口

| ID | 缺口 | 建议 |
|----|------|------|
| **T-01** | ~~无 **53500 万** 合计 assert~~ | **✅ 2026-06-15** · Rust `protocol_reference_phase1_countries` + Vitest `countryPoolFundraiseGovernanceV1.test.ts` |
| **T-02** | 无 Vitest 断言 `COUNTRY_POOL_FUNDRAISE_*` ↔ API `fundraise_targets_cny_wan` 全表 | 可选 contract 扩展 |
| **T-03** | `check-governance-doc-linkage.sh` 不扫 governance-token 募资 MD ↔ Rust 常量 | 84 bump 批加 |

---

## 6. Contract / 链上 域

### 6.1 ✅ 与三轨相关的已对齐部分

| 组件 | 对齐项 |
|------|--------|
| `RegionStewardStakePool.sol` | `stewardStakeBps` = protocol-ssot · **责任质押** · 与募资 **无** 链上耦合 |
| `FeeRouter.sol` | 45/55 平台费路由 · 与 **83/84 D-4555-A** 一致 |
| Deploy 脚本 | Stake pool / FeeRouter 读 SSOT bps · **不** 读募资万元 |

### 6.2 ❌ / ② 未同步（登记 · 非 ① 假完成）

| ID | 项 | 说明 |
|----|-----|------|
| **C-01** | 链上 **无** Country Pool 募资目标寄存器 | 符合设计（治理链下参数） |
| **C-02** | **无** 国家池 **净利润** 45/55 结算合约 | [country-revenue-model-v1-draft §7](country-revenue-model-v1-draft.md) 定稿门禁未闭 |
| **C-03** | `CountryPoolLedgerV0` / `CountryPoolRedemptionEpochV0` | 试点 DE/CN · **非** 净利润 45/55 分账 |
| **C-04** | `FeeRouter` 注释引用 **[84] §一** | 文档注释语义 = **D-4555-A**；与国家收益模型 **D-4555-B** 需在 ② 设计文档显式分叉 |
| **C-05** | ② 链上对齐 **缺口总表** | [PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md](PHASE2-COUNTRY-POOL-ONCHAIN-ALIGNMENT-AUDIT-20260615.md) — Settlement/Distribution **缺失** · Gate-0～5 顺序 |
| **C-06** | **Gate-0 核算规格** | [country-pool-net-profit-accounting-spec-v1.md](country-pool-net-profit-accounting-spec-v1.md) — **FREEZE CANDIDATE** · **Gate-2 硬闸** |

---

## 7. 十国募资数值对拍（工程 SSOT）

| jurisdiction | 治理表（万） | API `protocol-reference` | UI overlay | 84 §四（遗留） |
|--------------|-------------|--------------------------|------------|----------------|
| CN | 8000 | 8000 | 8000 | 6000 + 硬顶 8000 |
| US | 8000 | 8000 | 8000 | 6000 + 8000 |
| FR | 9000 | 9000 | 9000 | 7000 + 9000 |
| ES | 9000 | 9000 | 9000 | 7000 + 9000 |
| JP | 5000 | 5000 | 5000 | 3000 + 4000 |
| TH | 3500 | 3500 | 3500 | 2500 + 3500 |
| SG | 3000 | 3000 | 3000 | 2000 + 3000 |
| KR | 4000 | 4000 | 4000 | 2000 + 3000 |
| AU | 2000 | 2000 | 2000 | 1500 + 2000 |
| AE | 2000 | 2000 | 2000 | 1500 + 2000 |
| **合计** | **53500** | **53500** | **53500** | **38500** |

---

## 8. 收口优先级（① · 禁止新增功能）

| P | ID 集合 | 动作 | 阶段 |
|---|---------|------|------|
| **P0** | ~~D-84-01～03, D-84-05, D-82-01~~ | **✅ 2026-06-15** · 84 **1.0.22** · 82 · 03 · memo · types |
| **P1** | ~~T-01, U-01~~ | ~~Rust/TS 合计 **53500** assert · 删孤儿 i18n cap 键~~ | **✅ 已闭（2026-06-15）** |
| **P1** | U-03, D-03-01 | 技术说明 / 03 摘抄互链 **country-pool-fundraise-governance-v1** | ① 文案 |
| **P2** | D-4555-B, C-02～04 | FeeRouter / 国家池 **净利润** 模型链上设计 · Runbook | **②** |
| **P2** | A-04, T-03 | `check-governance-doc-linkage` 扩展募资表 | ② 前 |

---

## 9. 审计结论（①）

- **三轨独立（募资 / 质押 / Fee Points）+ TTG 参考价 Mock**：**governance-token SSOT · API · `/governance/params` · Mock Swap · 归档** 已闭合；**活跃路径无 Seat×参考价→募资**。
- **P0 文档收口（2026-06-15）：** **84/82/03/memo** 与 **country-pool-fundraise-governance-v1** 一致；**②** 净利润 45/55 见 **country-pool-net-profit-settlement-v1-design**（DESIGN ONLY）。
- **最大剩余：** **②** 国家池净利润链上结算（**D-4555-B**）· 法务 **LEGAL-SIGNOFF** 待定。

**Honest boundary:** ① 本地文档/API/UI 对齐 **≠** ② staging 治理提案已更新募资 **≠** ③ 法务印刷 GO。
