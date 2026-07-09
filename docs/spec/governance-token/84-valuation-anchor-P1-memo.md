# 84 §3.6 募资与三轨独立参数 · P1 工程纪要（2026-06-15 收口）

**Date:** 2026-06-15（**取代** 2026-05-27 Option C 占位叙事）  
**Status:** **ENGINEERING_DEFAULT（①）** — **不** 替代 **[LEGAL-SIGNOFF-CHECKLIST](LEGAL-SIGNOFF-CHECKLIST.md)** 签字 · **不** 宣称对外印刷 GO  
**Companion:** [84 §三 3.4 / §3.6](../84-第一阶段10国Country-Pool发行参数总表.md) · [country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md) · [protocol-convergence-P1-memo](protocol-convergence-P1-memo.md)

**历史：** 2026-05-27 **Option C**（费用% 与募资独立维度 · §四 占位）已由 **三轨独立参数模型** 取代；Option C 背景见 git 历史 / 本文件 **§4 变更记录**。

---

## 1. 现行决议（工程默认 · ①）

| 字段 | 填写 |
|------|------|
| **决议日期** | 2026-06-15 |
| **募资 SSOT** | **[country-pool-fundraise-governance-v1.md](country-pool-fundraise-governance-v1.md)** — 治理委员会 / 董事会按国家市场规模 · **无硬顶** |
| **Seat 质押 SSOT** | **[protocol-ssot.v1 §4](protocol-ssot.v1.md)** `steward_stake_bps` |
| **Fee Points SSOT** | **[country-revenue-model-v1-draft §5](country-revenue-model-v1-draft.md)** |
| **TTG 参考价** | **[ttg-reference-price-v1-draft.md](ttg-reference-price-v1-draft.md)** — Mock Swap / FDV · **不推导募资** |
| **一句话规则** | **三轨独立、无自动换算**；**84 §四 募资列** = 治理表 **镜像**；**fee 列** = protocol-ssot；禁止 Seat×参考价→募资（见 [archive](archive/phase1-fundraise-stake-times-reference-price-formula-historical.md)） |
| **十国合计** | **53,500 万元（5.35 亿元人民币）** |
| **代币 SSOT 版本** | **protocol-ssot.v1.1** · **protocol-ssot.v1.yaml 1.0.1** |
| **84 版本** | **1.0.22**（与 `governance_doc_reference::DOC_VERSION` 同号） |
| **同步文档清单** | ☑ **84** §四/§五/§六 ☑ **82** ☑ **03** ☑ **country-pool-fundraise-governance-v1** ☑ API/frontend 机读 ☑ **THREE-TRACK 审计** |
| **工程校验** | ☑ `bash scripts/gates/check-governance-doc-linkage.sh` **exit 0** |
| **LEGAL-SIGNOFF** | ☐ **待定**（**待定则不得对外印刷**） |

---

## 2. 与旧 Option C 的关系

| 旧 Option C（2026-05-27） | 现行（2026-06-15） |
|---------------------------|---------------------|
| §四 募资「占位」、与费点 **独立维度** | **country-pool-fundraise-governance-v1** 定表 · **84 镜像** |
| 硬顶列 + 3.85 亿合计 | **废止硬顶** · 合计 **5.35 亿** |
| A/B/C 选型驱动重算 | **废止**跨轨公式；募资变更 **仅** 治理提案改治理表 |

---

## 3. 定稿后动作（产品 / 法务 · 非 ①）

| 步 | 动作 |
|----|------|
| 1 | 法务书面确认各国募资与 **5.35 亿** 合计 |
| 2 | **LEGAL-SIGNOFF** 全勾选 + **08-4** 印刷升版 |
| 3 | **②** [country-pool-net-profit-settlement-v1-design.md](country-pool-net-profit-settlement-v1-design.md) 链上实施（**独立闸**） |

---

## 4. 变更记录

| Date | Note |
|------|------|
| 2026-05-27 | 初版 · **Option C** 工程默认 · §四 占位（已被取代） |
| 2026-06-15 | **P0 收口**：募资 SSOT → **country-pool-fundraise-governance-v1** · 三轨独立 · 84 **1.0.22** |
