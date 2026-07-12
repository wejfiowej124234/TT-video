# TTG Governance Freeze Certificate — Governance Framework V1.1

**Document ID:** `TTG-GOVERNANCE-FREEZE-CERTIFICATE`  
**Version:** v1.1-20260712  
**Status:** **ACTIVE · GOVERNANCE FRAMEWORK FROZEN（规则层 · ①）**  
**Signed-by:** Pending Owner attestation（见 §4）  

> **本文件职责：** 宣告 **TTG 治理框架 V1.1** 文档与机读 SSOT **收口完成** · **不再静默改规则**。  
> **不等于：** ② Sepolia 已升级 · ③ Production GO · 全项目 [GOVERNANCE-FREEZE-V1](../../runbook/GOVERNANCE-FREEZE-V1.md)（发布治理结构冻结 · 不同键）。

**阶段口径：** ① Governance Framework Freeze **→** Owner Decision（Vesting 商业参数）**→** Sepolia Upgrade **→** ③ Mainnet 另闸  

**5 分钟总图：** [TTG-GOVERNANCE-LIFECYCLE.md](TTG-GOVERNANCE-LIFECYCLE.md)

---

## §0 冻结声明

自 **2026-07-12** 起，**Governance Framework V1.1** 进入 **FROZEN**：

- **禁止** Agent / 工程 **静默** 修改 GOV-01～04 · Genesis/Public 定义 · GOV-03 V1.1 · 阶段过渡阈值叙事  
- **允许** bugfix · i18n · 证据刷新 · 一致性审计重跑 · **不改语义** 的排版  
- **任何治理规则变更** 须走：**Governance Proposal（GOV-02）→ Vote → Timelock 48h → Execute** · 同步 SSOT / Registry bump · 新 Certificate 版本  

**Owner 裁定（2026-07-12）：** 治理规则 **不再继续优化** — 继续改规则 **收益递减 · 风险上升** · 进入 **Governance Freeze** 与 **Owner Decision** 轨。

---

## §1 签收矩阵

| 项 | 版本 / 证据 | 状态 | 说明 |
|----|-------------|------|------|
| **Governance Framework** | V1.1（GOV-03 Amendment + Genesis AND + Public 定义） | **PASS · FROZEN** | 本 Certificate |
| **Consistency Audit** | [GOVERNANCE-CONSISTENCY-AUDIT-LATEST.md](GOVERNANCE-CONSISTENCY-AUDIT-LATEST.md) · `20260712T120952Z` | **PASS** | `bash scripts/gates/run-governance-consistency-audit.sh` |
| **Production-Grade Alignment Audit** | [WEB3-PRODUCTION-GRADE-ALIGNMENT-AUDIT-LATEST.md](WEB3-PRODUCTION-GRADE-ALIGNMENT-AUDIT-LATEST.md) · `20260712T120952Z` | **PASS** | `bash scripts/gates/run-web3-production-grade-alignment-audit.sh` |
| **Asset / Treasury Separation** | [ASSET-DENOMINATION-TREASURY-SEPARATION-AUDIT-LATEST.md](ASSET-DENOMINATION-TREASURY-SEPARATION-AUDIT-LATEST.md) | **PASS** | `bash scripts/gates/run-asset-denomination-treasury-separation-audit.sh` |
| **Tokenomics** | [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md) | **PASS · FROZEN** | 10M · 六桶 · GOV-01～04 |
| **Registry** | [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml) · [governance-phase-transition.v1.yaml](../../../registry/governance-phase-transition.v1.yaml) | **PASS** | 阈值机读 · 文档不写死 1.5M |
| **Genesis** | [GENESIS-GOVERNANCE-PHASE.md](GENESIS-GOVERNANCE-PHASE.md) v1.3 | **PASS · FROZEN** | G-END-01 **AND** G-END-02 |
| **Public** | [PUBLIC-GOVERNANCE-PHASE.md](PUBLIC-GOVERNANCE-PHASE.md) v1 | **PASS · FROZEN** | Public → Community / Mature DAO |
| **Lifecycle 总图** | [TTG-GOVERNANCE-LIFECYCLE.md](TTG-GOVERNANCE-LIFECYCLE.md) | **PASS** | 5 分钟读口 |
| **Owner Pending** | [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) v3 | **PENDING · OWNER_INPUT** | **Team 1.5M FROZEN** · PM **500K+500K+1M** · ecosystem **治理释放** · commercial **Owner 填** |
| **Sepolia Upgrade** | Governor V1.1 · `cap_disabled` | **DEFERRED** | **Owner broadcast 授权** · **不** 依赖 vesting 商业参数已填 |

---

## §2 V1.1 冻结范围（写死）

| 包含 | 不包含 |
|------|--------|
| GOV-01～04（含 GOV-03 V1.1 · `max_voting_power_cap_disabled: true`） | Team vesting **商业数值**（Owner 填） |
| Genesis / Public / Community 阶段定义 | Sepolia 链上 Governor 升级执行 |
| `public_governance_threshold`（Registry） | ③ Production GO / 法务对外签字 |
| 流程保护：Vesting schema · Safe · Proposal · Quorum · Timelock · Seat 一国一控 | 主网部署 |

---

## §3 解冻与修订（唯一合法路径）

```text
Governance Proposal（GOV-02）
        ↓
Quorum ≥ 4% total supply · Approval ≥ 50%
        ↓
Timelock 48h
        ↓
Execute（链上 + SSOT/Registry bump）
        ↓
新 TTG-GOVERNANCE-FREEZE-CERTIFICATE 版本号
        ↓
Consistency Audit PASS
```

**禁止：** PR 静默改 GOV 数值 · 文档 alone 改 Registry 阈值 · 用 ① 本地 PASS 冒充 ② Sepolia 已升级。

---

## §4 Owner 签收（Pending）

| 字段 | 值 |
|------|-----|
| **Framework** | Governance Framework **V1.1** |
| **Freeze effective** | 2026-07-12（文档层 · ①） |
| **Owner attestation** | ☐ Pending |
| **Next Owner Decision** | Vesting **commercial** 参数（cliff/duration/start/beneficiary · **非** amount） |
| **Next engineering gate (②)** | Sepolia Governor V1.1 — **Owner broadcast 授权**（`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1`） |
| **Mainnet vesting gate (③)** | Vesting ACTIVE — commercial OWNER_INPUT + legal sign-off + 链上验证 |

---

## §4.5 阶段闸区分（Sepolia 技术 vs Vesting 主网分配）

| 闸 | 阶段 | 前置条件 | **不**依赖 |
|----|------|----------|-----------|
| **Sepolia Governor V1.1** | ② 测试网 | ① Framework V1.1 冻结 · 双审计 PASS · Owner **`TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1`** | Team vesting cliff/duration/start/beneficiary |
| **Mainnet vesting ACTIVE** | ③ 生产 | commercial OWNER_INPUT 已填 · legal sign-off · 链上 vesting = registry | Sepolia 升级可先/后并行 |

**Supply 写死（Registry v3）：** `team` **1.5M** · `advisors` **0.5M** 标准 vesting · `ecosystem` **1.5M** 治理批准释放 · `public_global` **2M** = Primary Market **500K+500K+1M**（非 cliff vesting）· `country_pool_shelf` / `treasury_dao` **2M TTG only** · **USDC P1→P4** = **GovernanceTreasuryP4Cap**（见 [asset-denomination-treasury-separation](../../../registry/asset-denomination-treasury-separation.v1.yaml)）· **禁止** 独立 `investor` 池。

---

## §5 验证命令（① 本地）

```bash
bash scripts/gates/run-governance-consistency-audit.sh
bash scripts/gates/run-web3-production-grade-alignment-audit.sh
bash scripts/gates/run-asset-denomination-treasury-separation-audit.sh
```

须 **`TT_GOV_CONSISTENCY_SUMMARY: PASS`** · **`TT_WEB3_ALIGN_SUMMARY: PASS`** · **`TT_ASSET_TREASURY_SEPARATION_SUMMARY: PASS`** 与 Certificate §1 矩阵一致。

---

## §6 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.1-20260712 | 2026-07-12 | 初版 Certificate：Framework V1.1 Freeze · Consistency PASS · Vesting OWNER_INPUT · Sepolia DEFERRED |
| v1.1-20260712-supply-v3 | 2026-07-12 | Registry v3：PM 三轮轨 · ecosystem 治理释放 · country/treasury 路径 |
