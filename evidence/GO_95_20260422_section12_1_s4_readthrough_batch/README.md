# GO_95 · §12.1 · S-4 读通批次登记（非主行闭证）

**日期**：2026-04-22  
**范围（95 §12.1 · S-4）**：质押 / 区域治理经济 — **[81](../../docs/spec/81-经济模型-向导质押与订单押金.md)**、**[83](../../docs/spec/83-区域治理与收益分配-协议白皮书.md)**、**[84](../../docs/spec/84-第一阶段10国Country-Pool发行参数总表.md)**、**[91](../../docs/spec/91-协议金库与资金池-技术索引.md)**、**[governance-token/README](../../docs/spec/governance-token/README.md)**、**[P5-1](../../docs/spec/P5-1-逐国链上账本SSOT-一国辖区端到端.md)**（与 **§7.1 域 J**、**§7.4**、**F-024**、**country_ledger_jurisdiction**、**14/B-116** 母题对读；**并列** **§12.4** 既有 **「S-4（子证 · 81 读前批）」2026-04-21**）。

## 1. 本轮读通与对拍（有界）

| 文档 | 本轮触及 | 与 95 / 互指 对读 |
|------|----------|-------------------|
| **81** | 读前摘要；**§1** 边界（身份/订单风险质押 **vs** Escrow 本金 **vs** TTG **vs** FeeRouter；**GuideIdentityStakingPool**/**ProviderIdentityStakingPool**） | 与 **160**/**14**/**contracts/README** 分轨一致；**未**重读 **§2～9** 全文 |
| **83** | 读前摘要；**文档定位与权威关系**表首屏；**状态**行（Target vs 仓库 **Partial/MVP**） | **Snapshot/Claim** 与 **110**/**04** **Partial** 运维投影叙事一致；**未**扫正文长章 |
| **84** | 读前摘要；**§一 1.1.1**（可分配费用 **100%** 与 **gas/slash** 正交）；**§1.2.1** 分轨 B（协议金库 **vs** FeeRouter 分轨 A） | 与 **81 §1.2**/**Runbook §7.1** 互指闭合；**≠** 对外数字已定稿（**§三 3.6**/**82 T7** 仍属后续） |
| **91** | **§一～三**（防混用动机；**GovernanceTreasury** **vs** FeeRouter 四分账 **vs** 身份双池 **vs** Escrow） | 与 **84 §1.2.1**/**governance-token/02 §4.7** 同源分轨表 |
| **governance-token/README** | 读前摘要；**文件清单**表；**版本与状态**（草案、**07 §二 2.4**、**linkage** CI） | 与 **82/83/84** 入口一致；**未**通读 **02-对内** 全文 |
| **P5-1** | 篇首 **Epic/性质/硬约束**；**§1** SSOT 一句话；**§2～3.2**（`country_ledger_ssot_v0` **vs** **B-115/B-116** 禁止双计） | 与 **04**/**双路径 country-ledger**/**§11.1** 旁证方向一致；**未**替代 **B-115/B-116** 封口证 |

## 2. 互指一致性（本轮结论）

- **身份质押（81）**、**订单 Escrow**、**FeeRouter/Region（83/84）**、**治理金库/换币（governance-token/84 §1.2.1）** 在 **81/91** 中均为**显式分轨**，与 **95 §7.7** 已述「pool/rewards 预览 **≠** 83/84 终局」兼容。  
- **P5-1** 将 **运营账本 SSOT** 与 **B-116 平台费投影**/**B-115 分配域** 正交钉死，**不**与本轮机读冲突。  
- **未**发现需新开 **§9 ISS-*** 的文档硬冲突（本轮有界）。

## 3. 命令结果（机读 · 非 S-4 闭证）

```bash
bash scripts/check-07-version-triple.sh
bash scripts/run-check-04-routes.sh
bash scripts/check-governance-doc-linkage.sh
```

**结果（本轮）**：**`OK: 07 version triple aligned (1.0.858).`**；**`run-check-04-routes.sh` exit 0**；**`OK: governance doc linkage checks passed.`**

## 4. 诚实边界

- **不得**将本包替代 **S-4** 主表 **`[x]`**（须 **81/83/84/91**/**governance-token**/**P5-1** 全文审计 + **§7.4**/**F-024** 等 **95 §12.1** 主行口径）。  
- **不得**将 **linkage**/**check-04** 绿替代 **83/84 Target** 对外定稿或 **Snapshot/Claim** 链上终局。  
- 与 **§12.4 · S-4（子证 · 81 读前批）** **并列**；本包为 **S-4 批次读通登记（v1.4.153）**。
