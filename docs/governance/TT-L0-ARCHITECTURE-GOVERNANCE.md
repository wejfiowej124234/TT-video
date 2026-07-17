# TravelTrust · L0 Architecture Governance

**STATUS:** `ACTIVE`  
**Layer:** **L0**（在 PSG / PF / Production 之上）  
**Constitution:** [TT-ARCHITECTURE-CONSTITUTION-v1.md](./TT-ARCHITECTURE-CONSTITUTION-v1.md)  
**Machine key:** `TT_L0_ARCHITECTURE_GOVERNANCE`  
**Production GO:** `NO_GO` until PF + Production Entry（L0 本身不解冻 PF）

---

## 0 · 定位

```text
L0 Architecture Governance
        ↓
       PSG   （永久一级 · 公开面与发布准入）
        ↓
        PF
        ↓
Production Entry Review → Production GO
```

L0 **不是**一次专项；负责保证架构级不变量，使 PSG 认证有意义。

---

## 1 · 数据唯一来源（写死）

下列实体族必须登记 **唯一 Owner · 唯一写入口 · 唯一发布入口 · 唯一公开入口**：

| 实体族 | 公开入口（例） | 写/发布（例） |
|--------|----------------|---------------|
| User | `/me` · auth | registration / admin governance |
| Order / Escrow | order/escrow APIs | order state machine |
| Guide | `/api/v1/guides` | guide create/stake/profile |
| Provider | market provider listings | OCS / CMS publish |
| Acquisition | market acquisition listings | OCS / CMS publish |
| Campaign | cold-start / announcements | CMS / Official ops |
| Media | CDN / public URL | COS PutObject + asset registry |
| CMS / Catalog | catalog media · countries | CMS lifecycle publish |

**任何双写 = L0 FAIL** → 阻断 PSG Production Cert / Deploy。

机读方向（演进）：`registry/architecture-constitution.v1.yaml` → `entity_owners`（逐步补全，禁止平行表）。

---

## 2 · Data Lineage（写死）

每个 Public Surface 元素必须具备可追溯血缘，例如：

```text
Home Hero → CMS → Catalog → Asset → COS (object_key) → Guest
```

断链（缺 asset_id · ephemeral · 无 object_key · Guest 裸临时 URL）= **FAIL**。  
执行面：PSG B3 COS · `TT_PSG_SSOT_DRIFT` · Production Cert。

---

## 3 · 禁止 Runtime 修数据（写死 · 最高优先级经验）

| 层 | 允许 | 禁止 |
|----|------|------|
| **Runtime**（API/Web 进程、Fly SSH 应急除外的常态） | Read · 观测 · 健康 | 修 CMS · 修 DB 业务行 · 补对象 · 补 Seed · 手改 Production |
| **合法修复** | Migration · Bootstrap（闸内）· Publish · Governance 流程 | Runtime「救火 SQL/SFTP」冒充主路径 |

**LEGACY_INCIDENT_ONLY**（如 sftp restore）不得进入 CLOSED / Production Cert PASS 路径。

---

## 4 · 与 PSG / PF 的交接

| 从 | 到 | 条件 |
|----|-----|------|
| Feature 提案 | Development | **PSG Review**（对照 Constitution + L0 + 公开面影响） |
| Development | PF | **PSG Certification**（含 Phase 要求的 Production Cert） |
| PSG | PF | P0 与 Board 解冻公式 |
| PF | Production | Production Entry Review → Production GO |

**PSG ∉ PF** —— PF 不得替代或跳过 PSG。

---

## 5 · Release Constitution 指针

六条发布宪法见 Constitution **§3**（手改 / 前端修数 / CMS Published / COS Registry / Deploy∈PSG / Production∈PF）。

---

## 6 · 诚实边界

L0 ACTIVE ≠ PSG Exit ≠ PF 解冻 ≠ Production GO。  
未完成 L0 不变量前，**禁止**宣称企业级发布就绪。
