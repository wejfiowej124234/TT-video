# TravelTrust Architecture Constitution v1

**STATUS:** `RATIFIED` · **最高治理文档**（≠ Runbook · ≠ Registry · ≠ Spec 契约长表）  
**Machine key:** `TT_ARCHITECTURE_CONSTITUTION_V1`  
**Effective:** 2026-07-16  
**Phase scope:** ① Local · ② Staging · ③ Production（原则全阶适用；**Production GO 仍另闸**）  
**L0:** [TT-L0-ARCHITECTURE-GOVERNANCE.md](./TT-L0-ARCHITECTURE-GOVERNANCE.md)  
**PSG:** [../runbook/TT-PUBLIC-SURFACE-GOVERNANCE.md](../runbook/TT-PUBLIC-SURFACE-GOVERNANCE.md)  
**Registry pointer:** [../../registry/architecture-constitution.v1.yaml](../../registry/architecture-constitution.v1.yaml)

---

## 0 · 效力

本文是 TravelTrust **架构与发布的最高治理文件**。  
以后任何新模块（Web3 · AI · 支付 · 国家站 · CMS · 媒体 · 公开页）**必须**遵守。  
与本文冲突时：**以本文为准**；实现细节落在 Spec / Code / Registry / Runbook，**不得**用细节绕过原则。

**PSG 是永久一级规范，不是一次专项。**  
**PSG 不属于 PF** —— PF 在 PSG 之下。

---

## 1 · 发布总序（写死）

```text
Feature
  → PSG Review
  → Development
  → PSG Certification
  → PF
  → Production Entry Review
  → Production GO
```

治理栈：

```text
L0 Architecture Governance
        ↓
       PSG
        ↓
        PF
        ↓
Production Entry Review
        ↓
   Production GO
```

**禁止：** 开发 → Deploy → 测试（跳过 PSG / PF）。

---

## 2 · 十条原则

### 2.1 SSOT 原则

每个业务概念只有一个权威真源（文档或代码或 Registry 键）。  
平行真源 = **违宪** → 必须收敛或新增 ID，禁止「口头同步」。

### 2.2 单一数据源原则（L0）

User · Order · Guide · Provider · Acquisition · Campaign · Media · CMS 等实体必须具备：

| 要求 | |
|------|--|
| 唯一 Owner | |
| 唯一写入口 | |
| 唯一发布入口 | |
| 唯一公开入口 | |

**任何双写 = FAIL。**

### 2.3 Public Surface 原则

Guest 可见面只消费 **Published + Production** 数据；生命周期与隔离由 PSG 强制。

### 2.4 CMS 原则

CMS 是内容真源；Guest **只**见 Published。Approved 是过渡动作，不是平行状态。

### 2.5 COS 原则

公开媒体真源 = 持久对象存储 + Asset Registry（`object_key` / `storage_backend`）。  
禁止 ephemeral 盘 / sftp 补图冒充生产主存。

### 2.6 Runtime 原则

**Runtime 禁止修数据**（本次事故的最大教训）。

| Runtime 可以 | Runtime 禁止 |
|--------------|--------------|
| Read | 修 CMS |
| 健康检查 / 观测 | 修 DB 行数据「救火」 |
| | 补对象 / 补 Seed / 手改 Production |

真正修复只允许：**Migration · Bootstrap · Publish · Governance** 闸内路径。

### 2.7 Deploy 原则

任何 Deploy **必须**过 PSG（含 Production Cert / 破坏性 / 准入三闸，按当前 Phase 要求）。  
禁止「先上再说」。

### 2.8 Production 原则

Production 数据 **禁止手改**。  
Production GO **必须**先 PF，且 PF 解冻条件以 Board 写死公式为准（可机读）。

### 2.9 Certification 原则

认证必须可重复、可审计、可验证。  
`PASS_RUNTIME_SAMPLE` / 「感觉稳定」 / 「碰巧全绿一次」**不得**冒充 Exit。

### 2.10 Governance 原则

新增能力先 **PSG Review**（Solo = **Owner Self Review** · ≠ peer Code Review），再开发；**合入**（Solo = Owner 将变更纳入主干/发布分支 · **不要求** PR Approver）后 **PSG Certification**，再进 PF。  
治理优先于热修速度。Solo 工作流：[TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](../runbook/TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)。

---

## 3 · Release Constitution（发布宪法 · 六条）

| # | 条文 |
|---|------|
| **第一条** | 任何 Production 数据：**禁止手改**。 |
| **第二条** | 任何 Public Surface：**禁止前端修数据**（前端不得充当写真源或掩盖 DB/API 错误）。 |
| **第三条** | 任何 CMS：**Guest 必须 Published**。 |
| **第四条** | 任何 COS：**必须 Object Registry**（asset → object_key → CDN → Guest）。 |
| **第五条** | 任何 Deploy：**必须 PSG**。 |
| **第六条** | 任何 Production：**必须 PF**（再经 Production Entry / Production GO）。 |

违宪项在认证中记 **FAIL**；不得用热修、sftp、前端 fallback、Runtime SQL 绕过。

---

## 4 · Data Lineage（血缘 · 强制）

每个公开页面/媒体位必须可追踪，例如：

```text
Home Hero → CMS → Catalog → Asset → COS → Guest
```

**任何断链 = FAIL**（PSG B3 / Production Cert / SSOT Drift 可机读）。

---

## 5 · 与下级文档的关系

| 层级 | 文档 | 角色 |
|------|------|------|
| **Constitution** | 本文 | 最高原则 |
| **L0** | [TT-L0-ARCHITECTURE-GOVERNANCE.md](./TT-L0-ARCHITECTURE-GOVERNANCE.md) | 架构所有权 / 血缘 / Runtime 禁令 |
| **PSG** | Runbook + Matrix + Phase B + Production Cert | 公开面与发布准入认证 |
| **PF** | Platform Financial / Release Ladder 等 | PSG 之后的平台/金融/阶梯 |
| **Spec / Code** | 04 / 93 / migrations / API | 契约与实现真源 |
| **Registry** | YAML 机读 | 键与状态，不替代本文 |

---

## 6 · 修订

仅当 **Blocking Defect** 或 **Owner 书面修宪** 时修订版本（v1 → v1.1 / v2）。  
禁止为赶功能静默削弱条文。

**Production GO:** 本文 **不** 单独授权 GO；GO 仍走既有 checklist 与人签。
