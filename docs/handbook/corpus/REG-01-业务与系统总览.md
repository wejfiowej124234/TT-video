# REG-01 · 业务与系统总览

**Version:** 1.0.4 · **最后更新：** 2026-04-29  
**受众**：产品、架构、后端、审计  
**状态**：现行（**corpus** 再生稿）  
**与 spec 关系**：由 **[spec/01-总库总览](../../spec/01-总库总览.md)** **浓缩重写**；**12 缝 / 17 条 / 系统级不变量** 仍以 **spec/01 §10** 与 **[spec/02](../../spec/02-架构设计.md)** 全文为准，本文只给**入口与口径**，不复制长表。

> **SSOT 边界（防误用）**：本文为 **corpus** 再生导读；**01 长表与不变量**仍以 **[spec/01](../../spec/01-总库总览.md)**（及 **spec/02** 互指处）全文为准。**`| METHOD | /path |`** 以 **[04 §3.4](../../spec/04-后端与API.md)** 为准；**域矩阵**以 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 为准。**禁止**以本文替代上述 SSOT 或仅凭本文删 **`docs` 下 `spec` 子树**（程序见 **[engineering/08 §3](../engineering/08-文档与spec迁移台账.md#mig-2-matrix)** + **[engineering/09 §3](../engineering/09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）+ **[engineering/08 §2](../engineering/08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](./SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**）。

---

<a id="reg01-positioning"></a>

## §1 项目定位（一句话）

**TravelTrust** 本仓库 = **TrustLayer** 的参考实现：面向全球旅行的**去中心化托管协议**——预订、**链上 Escrow**（资金真相）、争议与信誉；形态为 **混合架构**（链上资金与信任 + 链下业务与检索），**链为准、DB 为投影与检索**。

---

## §2 角色与资金主线（必读记忆）

| 角色 | 要点 |
|------|------|
| **旅行者 / 向导** | 双角色可能；向导侧常涉 **身份质押**（**`IdentityStakingPool` 系**，与 **TTG `/governance` 质押** 不同语义） |
| **资金** | **Escrow** 托管 → 双签 / 规则满足 **release**；争议 → 裁决 → **executeResolution** 等到资金终态 |
| **链 vs DB** | **链**：Paid / Released / Refunded / Slashed、order↔escrow 映射；**DB**：行程、证据、评价、用户资料等 |

**订单状态机（终态须一致）**：`Created → Accepted → Escrowed → Completed | Refunded | PartiallyRefunded | Slashed | Cancelled`；`Disputed` 经裁决后落入资金终态之一。细节与表体以 **[spec/01](../../spec/01-总库总览.md)**、**[spec/03](../../spec/03-业务流程与风控.md)** 为准。

**须回读 spec/01（≥3 · T-013）**：**[§〇 技术文档索引](../../spec/01-总库总览.md#技术文档索引读总览即可找到各技术文档细节)** · **[§1 业务流程](../../spec/01-总库总览.md#spec01-s1-business-flow)** · **[订单状态机](../../spec/01-总库总览.md#spec01-order-statemachine)** · **[§10 小结](../../spec/01-总库总览.md#spec01-s10-summary)**（**12 缝 / 17 条 / 不变量** 等长表仍以 **spec/01** 为准）。

---

## §3 文档与真源（过渡期双读）

| 需要什么 | 先读本 **REG-01** 哪一节 | 仍须打开的权威 |
|----------|-------------------------|----------------|
| HTTP 路径与状态码 | §3 本表 | **[04 §3.4](../../spec/04-后端与API.md)** + **`run-check-04-routes`** |
| 架构分层与领域 | 见 **REG-02** | **spec/02**、**[09](../../spec/09-技术架构总览-v1.0.md)** |
| 验收矩阵 | §2 心智 | **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** |
| 生产就绪 / GO | 不展开 | **[95](../../spec/95-全链路生产就绪检查清单与完成度矩阵.md)**、**[go-live](../../go-live-checklist.md)** |

---

## §4 仓库骨架（与实现一致的方向）

- **`crates/`**：领域与 **API**（`traveltrust-api` 聚合路由）。  
- **`frontend/`**：Next 应用与客户端。  
- **`contracts/`**：Solidity + **ABI**。  
- **`../../spec/`**：**过渡期** 契约表体、矩阵、台账（**删除前须完成 [SPEC-MIGRATION-STATUS](./SPEC-MIGRATION-STATUS.md)**）。  
- **`docs/handbook/`**：导读 + **本 corpus 正文**。

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.4 | 2026-04-29 | **SSOT 边界**：程序链内 **98** 链接展示统一为 **98 §2**（与 **engineering/01**/**02** 同条）。 |
| 1.0.3 | 2026-04-29 | **SSOT 边界**：删 **spec** 程序链显式 **08 §3**/**09 §3**/**08 §2**/**STATUS**/**98**（与 **corpus/README**/**SPEC-MIGRATION-STATUS §3** 同条）。 |
| 1.0.2 | 2026-04-29 | 文首 **SSOT 边界** 引（**01/04/93**、删 **spec** 程序；与 **engineering** 域篇同口径）。 |
| 1.0.1 | 2026-04-29 | **T-013**：显式链 **spec/01** 稳定锚点 **≥3**。 |
| 1.0.0 | 2026-04-28 | 首版：自 **spec/01** 浓缩再生。 |
