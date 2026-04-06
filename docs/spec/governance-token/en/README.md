# Governance token documents (English)

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **中文 SSOT** | **[../README.md](../README.md)**、**[82-治理币-文档总览](../../82-治理币-文档总览.md)** |
| **英文草案** | **下表 `01` / `02`** |

**Status**: DRAFT — **not** legal/final for public offering or investment disclosure.  
**Authoritative Chinese SSOT**: [../README.md](../README.md), [../../82-治理币-文档总览](../../82-治理币-文档总览.md).

| File | Purpose |
|------|---------|
| [01-external-litepaper-draft.md](01-external-litepaper-draft.md) | External-facing litepaper / whitepaper draft |
| [02-internal-tech-spec-draft.md](02-internal-tech-spec-draft.md) | Internal engineering spec (do not distribute externally) |

**Slide / deck index (ZH SSOT)**: [../03-对外材料-PPT与白皮书数据页摘抄索引.md](../03-对外材料-PPT与白皮书数据页摘抄索引.md) — maps PPT/PDF sections to **83/84**, **[84 §1.1.1](../../84-第一阶段10国Country-Pool发行参数总表.md)** / **[Runbook §7.1](../../../../ops/RUNBOOK.md)**, and [08-4 appendix fee-flow diagram](../../08-4-附录-收益流闭环图-FeeRouter-Target.md).

**Linkage**: Any material change to this folder or `82` must satisfy [07 §二 2.4](../../07-开发流程与顺序.md) and `scripts/check-governance-doc-linkage.sh`.

**Legal sign-off**: Use [../LEGAL-SIGNOFF-CHECKLIST.md](../LEGAL-SIGNOFF-CHECKLIST.md) before using the external draft publicly.

### Deploy order (engineering hard constraint)

**Local virtual chain first** (Anvil + Foundry), then **testnet**, then **mainnet**. **Do not** treat legal final copy as a substitute for closing the loop on **order/Escrow flows** and **governance-token flows** (delegate/vote/timelock/Snapshot·Claim — as implemented) locally. Authoritative detail: Chinese SSOT [../02-对内技术规格-草案.md](../02-对内技术规格-草案.md) **§1.3**; also [../../82-治理币-文档总览.md](../../82-治理币-文档总览.md) **§三附**, [../../../../contracts/README.md](../../../../contracts/README.md), [../../../../ops/RUNBOOK.md](../../../../ops/RUNBOOK.md) **§2.56**, [../../07-开发流程与顺序.md](../../07-开发流程与顺序.md) **§五 5.2A**, [../../14-合约-API-ABI-前后端对齐.md](../../14-合约-API-ABI-前后端对齐.md) **§6**.
