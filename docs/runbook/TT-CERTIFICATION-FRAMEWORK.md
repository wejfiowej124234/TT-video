# TravelTrust Certification Framework（全项目 · 唯一层级 SSOT）

**Document ID:** `TT-CERTIFICATION-FRAMEWORK`  
**Status:** **ACTIVE · FROZEN STRUCTURE**  
**生效：** 2026-07-12

> **地位：** 仓库 **Certification 层级与术语** 的唯一 SSOT。Runbook · 证据 · Dashboard · AI 协作 **均须映射到 L1→L2→L3**；**禁止**用平行「Audit 即完成」叙事替代 **Certification PASS + Certificate**。

---

## 为什么从 Audit 转向 Certification

| 概念 | 含义 | 能否宣称「完成」 |
|------|------|------------------|
| **Audit** | 检查 · 盘点 · 机读扫描 · 找 gap | **否** — 仅诊断输入 |
| **Certification** | 在定义域内 **Success + Failure 路径** 经证据链验证 → **Certificate** | **是** — 代表 **通过** |

**Audit** 仍保留为 **Certification 的工具**（例如 L1 _closure audit_ 脚本），但 **不得** 单独作为阶段收口宣称。

---

## 项目生命周期（写死）

```
Architecture
    ↓
Engineering          ← 开发逐渐停止
    ↓
Certification        ← 验证 · 认证成为主线
    ↓
Production           ← 发布 · 真资产 · GO
```

**禁止** 用 `Coding → Coding → Coding` 冒充企业后期节奏。

---

## 三级 Certification（L1 → L2 → L3）

| Level | 名称 | 阶段 | 环境 | 完成标志 | 主 SSOT（示例） |
|-------|------|------|------|----------|-----------------|
| **L1** | **Engineering Certification** | **①** | 本地 · Docker · 机读闸 · 单元/集成测试 | **L1 CLOSED** · 工程 HEAD 冻结 | [WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md](../spec/governance-token/WEB3-FULL-SYSTEM-CLOSURE-AUDIT-LATEST.md) · `acceptance.latest.log` · 各域 closure audit |
| **L2** | **Reality Certification** | **②** | **区块链测试网** · 测试币 · **真实钱包** · **真实 tx** | **L2 CLOSED** · Reality Certificate | [TT-WEB3-REALITY-CERTIFICATION.md](./TT-WEB3-REALITY-CERTIFICATION.md) |
| **L3** | **Production Certification** | **③** | 主网 / 生产 PSP / 真 USDC / Safe / Secrets | **Production GO** · Production Certificate | [go-live-checklist.md](../go-live-checklist.md) · PER · Production Entry Review |

**L2 命名：** **Blockchain Reality Certification** — **不绑定** Sepolia / Holesky / Base Sepolia 等具体链；**Target Chain** 在 L2 Runbook **Overview** 声明。

**须顺序递进 · 禁止跳阶：** L1 CLOSED **≠** L2 CLOSED **≠** L3 Production GO。

---

## 术语对照（全仓统一）

| 旧称 / 混用 | Certification 口径 |
|-------------|-------------------|
| Phase ① 本地绿 / closure audit PASS | **L1 Engineering Certification** 证据 |
| Phase ② Sepolia 验证 / testnet smoke | **L2 Reality Certification** |
| `go-live` / Production GO | **L3 Production Certification** |
| `run-*-closure-audit.py` | L1 **工具** — 输出为 Certification **输入**，非 L2/L3 PASS |
| ISS / gap 盘点 | Audit 产物 — 须在对应 Level **Certificate 前** 清零或 Owner 书面接受 |

---

## 每级 Certification 最小结构

各级 Runbook / SSOT **应**包含（L2 已落地 · L1/L3 逐步对齐）：

| 块 | 用途 |
|----|------|
| **Overview** | Production Review **第一页** — Stage · Status · Progress · Owner · 是否 Ready |
| **Domains / SC-*** | 认证域（L2 Web3：SC-0 … SC-H） |
| **Steps / SV-*** | 可执行步骤（保留历史编号） |
| **Success + Failure Cases** | 成功与失败路径 **同等** |
| **Required Evidence** | 链 / API / UI / Accounting 证据 |
| **Dashboard** | 进度统计（如 `0 / 8 SC PASS`） |
| **Certificate** | 该 Level **CLOSED** 硬闸 + Owner 签字 |

---

## L2 Web3 · 当前锚点

| 项 | 值 |
|----|-----|
| **Runbook** | [TT-WEB3-REALITY-CERTIFICATION.md](./TT-WEB3-REALITY-CERTIFICATION.md) |
| **L1 Engineering HEAD（Web3 冻结）** | `9de9c1eb` |
| **L2 Status** | **NOT_STARTED** |
| **Target Chain（当前）** | Sepolia · `chain_id=11155111` |
| **证据根** | `evidence/GO_phase2_testnet_20260526/blockchain-reality/` |

换链时：**仅改** L2 Runbook **Overview · Target Chain** 表与 registry 部署行 — **不改** Runbook 文件名 · SC/SV 编号 · Dashboard 结构。

---

## 与发布主链的关系

[TT-LOCAL-FIRST-CONVERGENCE.md](./TT-LOCAL-FIRST-CONVERGENCE.md) 的 **L0→L6→S5→S6→H1→Phase② CLOSED→③** 为 **发布编排主链**；本 Framework 为 **Certification 语义层** — **互补 · 非平行**：

- **Phase② CLOSED** = **L2 Reality Certification CLOSED**（Web3 域以 L2 Runbook Certificate 为准）
- **Production GO** = **L3 Production Certification** 子集

---

## AI / Agent 默认行为

1. 先判任务落在 **L1 / L2 / L3** 哪一级。
2. **完成宣称** 必须对应 **Certification PASS + Certificate 条件**，不得仅用 audit exit 0。
3. L1 工程冻结后 **默认不扩 Web3 代码** — 主线转 **L2 Reality Certification** 执行。
4. **禁止跳阶** · **禁止假完成**（见 [CONTRIBUTING · no-false-completion](../../CONTRIBUTING.md#no-false-completion)）。

---

## 交叉引用

| 文档 | 关系 |
|------|------|
| [AGENTS.md](../../AGENTS.md) | Agent 三阶段 + 本 Framework |
| [PHASE2-REPOSITORY-STATUS.md](./PHASE2-REPOSITORY-STATUS.md) | 仓库阶段闸 G-0～G-4 |
| [TT-WEB3-REALITY-CERTIFICATION.md](./TT-WEB3-REALITY-CERTIFICATION.md) | L2 Web3 唯一 Runbook |
| [TT-LOCAL-FIRST-CONVERGENCE.md](./TT-LOCAL-FIRST-CONVERGENCE.md) | 发布编排主链 |

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| v1-20260712 | 2026-07-12 | 初版 · L1/L2/L3 · Certification vs Audit · 项目生命周期 Architecture→Engineering→Certification→Production |
