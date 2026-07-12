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
| **Consistency Audit** | [GOVERNANCE-CONSISTENCY-AUDIT-LATEST.md](GOVERNANCE-CONSISTENCY-AUDIT-LATEST.md) | **Pending evidence commit** | `bash scripts/gates/run-governance-consistency-audit.sh` |
| **Tokenomics** | [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md) | **PASS · FROZEN** | 10M · 六桶 · GOV-01～04 |
| **Registry** | [protocol-ssot.v1.yaml](protocol-ssot.v1.yaml) · [governance-phase-transition.v1.yaml](../../../registry/governance-phase-transition.v1.yaml) | **PASS** | 阈值机读 · 文档不写死 1.5M |
| **Genesis** | [GENESIS-GOVERNANCE-PHASE.md](GENESIS-GOVERNANCE-PHASE.md) v1.3 | **PASS · FROZEN** | G-END-01 **AND** G-END-02 |
| **Public** | [PUBLIC-GOVERNANCE-PHASE.md](PUBLIC-GOVERNANCE-PHASE.md) v1 | **PASS · FROZEN** | Public → Community / Mature DAO |
| **Lifecycle 总图** | [TTG-GOVERNANCE-LIFECYCLE.md](TTG-GOVERNANCE-LIFECYCLE.md) | **PASS** | 5 分钟读口 |
| **Owner Pending** | [registry/ttg-vesting-registry.v1.yaml](../../../registry/ttg-vesting-registry.v1.yaml) | **PENDING · OWNER_INPUT** | **仅** cliff / duration / start · **商业决策 · 非 AI** |
| **Sepolia Upgrade** | Governor V1.1 · `cap_disabled` | **DEFERRED** | **Owner Decision 之后** · 本阶段 **禁止** 开始 broadcast |

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
| **Next Owner Decision** | Team vesting 商业参数（12/24/36/48 月等 · **Owner 自选**） |
| **Next engineering gate** | Sepolia Governor V1.1 upgrade（**post Owner Decision**） |

---

## §5 验证命令（① 本地）

```bash
bash scripts/gates/run-governance-consistency-audit.sh
```

须 **`TT_GOV_CONSISTENCY_SUMMARY: PASS`** 与 Certificate §1 矩阵一致。

---

## §6 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1.1-20260712 | 2026-07-12 | 初版 Certificate：Framework V1.1 Freeze · Consistency PASS · Vesting OWNER_INPUT · Sepolia DEFERRED |
