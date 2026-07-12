# TravelTrust Certification Framework（全项目 · 唯一层级 SSOT）

**Document ID:** `TT-CERTIFICATION-FRAMEWORK`  
**Version:** **v1.1**  
**Status:** **ACTIVE · FROZEN STRUCTURE**（v1.1 起 **禁止** 在执行 L2 前继续扩展层级定义；缺陷仅通过 **v1.2+** 小版本演进）  
**生效：** 2026-07-12

> **地位：** 仓库 **Certification 层级与术语** 的唯一 SSOT。Runbook · 证据 · Dashboard · AI 协作 **均须映射到 L0→L1→L2→L3**（L4 为上线后框架 · **非当前目标**）；**禁止**用平行「Audit 即完成」叙事替代 **Certification PASS + Certificate**。

> **与 spec `07` 架构 L1/L2/L3 区分：** 本文 **Certification L0–L4** = **发布/认证阶段**；[07 §零](../spec/07-开发流程与顺序.md) 的 L1/L2/L3 = **文档/架构权威层级** — **不同维度 · 禁止混读**。

---

## 为什么从 Audit 转向 Certification

| 概念 | 含义 | 能否宣称「完成」 |
|------|------|------------------|
| **Audit** | 检查 · 盘点 · 机读扫描 · 找 gap | **否** — 仅诊断输入 |
| **Certification** | 在定义域内 **Success + Failure 路径** 经证据链验证 → **Certificate** | **是** — 代表 **通过** |

**Audit** 仍保留为 **Certification 的工具**（例如 L1 closure audit 脚本），但 **不得** 单独作为阶段收口宣称。

---

## 五层 Certification（L0 → L4）

```
L0  Requirements Certification
    Business · Tokenomics · SSOT · Architecture
        ↓
L1  Engineering Certification
    Implementation · Unit Test · Audit · Closure
        ↓
L2  Blockchain Reality Certification
    Wallet · Blockchain · RPC · Indexer · Explorer · Evidence
        ↓
L3  Production Certification
    Mainnet · Safe · Secrets · Deployment · Operations-readiness
        ↓
L4  Operations Certification          ← 框架保留 · 非当前目标
    Monitoring · Incident · Treasury · Governance · Quarter Close · Version
```

**须顺序递进 · 禁止跳阶：** L0 CLOSED → 才合法大规模 L1 扩展 → L1 CLOSED → L2 → L3 → L4。

---

## 各层职责与输出

| Level | 名称 | 认证内容 | 输出 | 当前状态（2026-07-12） |
|-------|------|----------|------|------------------------|
| **L0** | **Requirements Certification** | 产品需求 · 业务规则 · Tokenomics · SSOT · 流程/架构冻结 | **Requirements Certificate** | **FROZEN** — TTG 六桶 · 治理规则 · Treasury 分离 · Escrow · 45/55 · 三阶段发布 · UAT 边界 · 数据治理 SSOT 已齐 |
| **L1** | **Engineering Certification** | 代码 · 测试 · Audit · Closure · 机读闸 | **Engineering Certificate** | **CLOSED** — Web3 HEAD **`9de9c1eb`** · L1 audit WARN=开放 L2/L3 gap · 0 machine FAIL |
| **L2** | **Blockchain Reality Certification** | 测试网 · 测试币 · **真实钱包** · **真实 tx** · **真实事件** | **Reality Certificate** | **NOT_STARTED** — 待 SC-0 + Owner + Broadcast |
| **L3** | **Production Certification** | 主网部署 · Safe · Secrets · 法务 · 生产 PSP · GO | **Production Certificate** | **NOT_STARTED** — 待 L2 CLOSED |
| **L4** | **Operations Certification** | 监控 · 事件 · Treasury 运营 · 治理 · 季结 · 版本演进 | **Operations Certificate**（持续） | **FUTURE** — 见文末 |

---

## L0 · Requirements Certification（需求冻结）

**职责：** 在写代码之前，把 **业务规则与 SSOT** 冻结为可执行契约。

| 子域 | 已冻结 SSOT（示例） |
|------|---------------------|
| **Business** | onboarding · fee_schedule · acquisition PD-009 · escrow 状态机 |
| **Tokenomics** | [TTG-TOKENOMICS-FREEZE-V1.md](../spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md) · [ttg-vesting-registry.v1.yaml](../../registry/ttg-vesting-registry.v1.yaml) |
| **SSOT** | [fund-flow-ssot.v1.md](../spec/governance-token/fund-flow-ssot.v1.md) R1–R4 · [asset-denomination-treasury-separation.v1.yaml](../../registry/asset-denomination-treasury-separation.v1.yaml) |
| **Architecture** | protocol-ssot · governance-token/* · 07/18 架构顶盖 |

**L0 完成标志：** Requirements Certificate Owner 签字 · **禁止** 无变更控制的新增「平行业务规则」进入 L1。

**当前判定：** **L0 FROZEN** — 过去一年 Tokenomics/治理/Treasury/Escrow/45/55/三阶段/UAT/权限/数据治理收敛已完成；剩余 **OWNER_INPUT** 属 **L3 商业参数**，不回流推翻 L0 结构。

---

## L1 · Engineering Certification

| 项 | 值 |
|----|-----|
| **环境** | ① 本地 · Docker · 机读闸 · 单元/集成测试 |
| **Web3 HEAD** | `9de9c1eb` |
| **主 SSOT** | [WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md](../spec/governance-token/WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md) · `acceptance.latest.log` |
| **重新冻结** | `HOLD_L1_ENGINEERING_FREEZE` — 下一合法工程 = L2 阻塞 bugfix only |

---

## L2 · Blockchain Reality Certification

| 项 | 值 |
|----|-----|
| **Runbook** | [TT-WEB3-REALITY-CERTIFICATION.md](./TT-WEB3-REALITY-CERTIFICATION.md) |
| **命名** | **Blockchain Reality** — **不绑定**具体链；Target Chain 在 Runbook **Overview** |
| **Target Chain（当前）** | Sepolia · `chain_id=11155111` |
| **证据根** | `evidence/GO_phase2_testnet_20260526/blockchain-reality/` |
| **当前主线** | **全部精力投入 L2** — SC-0 → SC-A…H |

---

## L3 · Production Certification

| 项 | 值 |
|----|-----|
| **触发** | **仅当 L2 CLOSED** |
| **主 SSOT** | [go-live-checklist.md](../go-live-checklist.md) · PER · Production Entry Review |
| **完成** | Production GO · Production Certificate |

---

## L4 · Operations Certification（框架 · 非当前目标）

**L4 is entered only after L3 Production Certification is completed.**

上线后持续运营归属 L4，**与 L0–L3 上线前 work 分离**：

| 子域 | 示例 |
|------|------|
| **Monitoring** | alerts · SLO · production metrics |
| **Incident** | runbooks · postmortem |
| **Treasury** | P1–P4 实际拨付 · 季结 |
| **Governance** | 提案 · vote · timelock execute |
| **Quarter Close** | CountryPoolNetProfit · 45/55 实链 |
| **Version** | v1.1 · v1.2 演进 |

**当前：** **不执行 L4** · 不在 L2 期间扩展 L4 Runbook。

---

## 术语对照（全仓统一）

| 旧称 / 混用 | Certification 口径 |
|-------------|-------------------|
| Tokenomics/治理文档冻结 | **L0 Requirements** |
| Phase ① 本地绿 / closure audit PASS | **L1 Engineering** 证据 |
| Phase ② testnet / 真实 tx 验证 | **L2 Reality** |
| `go-live` / Production GO | **L3 Production** |
| 上线后季结/治理/监控 | **L4 Operations**（L3 后） |
| `run-*-closure-audit.py` | L1 **工具** — 非 L2/L3 PASS |
| ISS / gap 盘点 | 须在对应 Level **Certificate 前** 清零或 Owner 书面接受 |

---

## 每级 Certification 最小结构

| 块 | L0 | L1 | L2 | L3 | L4 |
|----|----|----|----|----|-----|
| Overview | 需求范围表 | 工程 HEAD/闸 | **Production Review 第一页** | GO 入口 | — |
| Domains | 业务域 SSOT | closure 域 | SC-0…H | PER/部署域 | 运营域 |
| Success + Failure | 规则边界 | 测试/audit | **同等地位** | 生产验收 | 事件/季结 |
| Evidence | SSOT 版本 | 机读 JSON | blockchain-reality/ | GO 证据 | 运营日志 |
| Certificate | Requirements | Engineering | Reality | Production | Operations |

---

## 与发布主链的关系

[TT-LOCAL-FIRST-CONVERGENCE.md](./TT-LOCAL-FIRST-CONVERGENCE.md) 的 **L0→L6→S5→S6→H1→Phase② CLOSED→③** 为 **发布编排主链**；本 Framework 为 **Certification 语义层** — **互补 · 非平行**：

- **Phase② CLOSED** = **L2 Reality Certificate**
- **Production GO** = **L3 Production Certificate** 子集

---

## AI / Agent 默认行为（v1.1 写死）

1. 先判任务落在 **L0 / L1 / L2 / L3 / L4** 哪一级（**L4 默认不投入**）。
2. **当前唯一推进主线：L2 Blockchain Reality Certification。**
3. **Framework 冻结至 L2 完成或 Owner 显式 v1.2** — 禁止执行前继续扩展层级。
4. **完成宣称** 必须 **Certification PASS + Certificate**，不得仅用 audit exit 0。
5. **禁止跳阶** · **禁止假完成**（[CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)）。

---

## 交叉引用

| 文档 | 关系 |
|------|------|
| [AGENTS.md](../../AGENTS.md) | Agent 阶段 + 本 Framework |
| [TT-WEB3-REALITY-CERTIFICATION.md](./TT-WEB3-REALITY-CERTIFICATION.md) | L2 Web3 唯一 Runbook |
| [WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md](../spec/governance-token/WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md) | L1 Web3 大审计 |
| [TT-LOCAL-FIRST-CONVERGENCE.md](./TT-LOCAL-FIRST-CONVERGENCE.md) | 发布编排主链 |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1-20260712 | 2026-07-12 | 初版 L1/L2/L3 |
| v1.1-20260712 | 2026-07-12 | **+L0 Requirements · +L4 Operations（框架）** · 五层职责表 · 当前状态矩阵 · **冻结至 L2 完成** |
