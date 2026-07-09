# Production Governance Principles v1

**Production Release Governance v1 — CLOSED**

| | |
|---|---|
| **Status** | `FROZEN` |
| **Lifecycle** | `COMPLETE` |
| **Mode** | `OPERATE` |
| **Compatibility** | `PATCH ONLY (v1.x)` |

**Governance Root:** `registry/production-governance-principles.v1.yaml`  
**Declared complete:** 2026-07-08 · **Active with:** `GOVERNANCE_FREEZE_ACTIVE`

> **Canonical root** — child docs **cite** this file; do not copy principles inline.  
> **Freeze** = governance constraint · **Lifecycle COMPLETE** = v1 build finished.

---

## Post-v1 discipline（两条纪律）

### 1. 不再讨论治理设计

除非 Compatibility Rule 定义的 **v2 演进**，否则禁止：

- 新增 Principle · Gate · Governance Root · 治理文档层级
- 调整 Four-Gate · Readiness Book **结构**

### 2. 所有工作映射到三类更新

每一次提交应归类为：

| 类型 | 内容 |
|------|------|
| **State Update** | Dashboard · Book · Registry 状态刷新 |
| **Execution** | Cert · Freeze · Package · Sign-off · Deployment |
| **Evidence** | 证据沉淀 · LATEST 指针 · 审计材料 |

若不属于以上三类且非 v2 演进 → 重新审视是否应进入 v1。

---

## Governance hierarchy（v1 · frozen · complete）

```text
Production Governance Principles   ← Governance Root (this file)
        ↓
Governance Freeze
        ↓
Four-Gate Framework
        ↓
Production Readiness Book
        ↓
Deployment Track
        ↓
Evidence / Registry / Dashboard
```

Do not add Principle #2 · Policy V2 · Meta Governance under v1 — evolve as **Production Release Governance v2** if needed.

---

## Compatibility Rule

Do not mix **field fixes** with **governance-process changes** — use the correct version lane.

| Lane | When | Examples |
|------|------|----------|
| **Patch (v1.x)** | Allowed under v1 freeze | Doc errors · broken references · typos · non-semantic clarifications |
| **Minor / Major (v2)** | Required for semantic change | Governance semantics · process flow · Gate definitions · principles · structure / schema |

Any change that affects governance semantics, process, Gate, principle, or structure → **v2 cycle**, not a v1 patch.

---

## Principle #1 — Structure Frozen · State Continues

> Governance Freeze freezes release governance **structure**, schemas, templates, and process definitions. It does **not** freeze runtime state, evidence updates, certification progress, or deployment execution.

| Principle | 含义 |
|-----------|------|
| **Structure Frozen** | 不修改治理结构、Schema、模板、Gate 定义 |
| **State Continues** | 状态、证据、Dashboard、Book 可以持续刷新 |
| **Execution Continues** | Cert、Freeze、Package、Deployment 按流程继续执行 |
| **Truth Comes from SSOT** | 所有状态最终以 Registry / Evidence 为准 |

---

## Update types

| 类型 | 包含 | Governance Freeze 后 |
|------|------|----------------------|
| **Structure Update** | Runbook · Schema · Gate · Book 结构 · Evidence 树 · PREP 模板 | **禁止** |
| **State Update** | Dashboard · Book · Evidence · Registry 状态刷新 | **允许** |
| **Execution** | Cert · Freeze · Package · Deployment · Sign-off | **允许** |

```bash
node scripts/dev/refresh-governance-status.cjs   # State Update
```

---

## Operate mode（当前工作重点）

| Prior (Design) | Now (Operate) |
|----------------|---------------|
| 设计治理模型 | **State Update** — 刷新状态 |
| 新增 Gate / Book | **Execution** — 执行既定流程 |
| 扩展抽象层 | **Evidence** — 沉淀证据 |

---

## Current phase chain

```text
Governance System          COMPLETE (v1)
Governance Freeze          ACTIVE
Timelock Waiting
Cert #8–#12 → ②-F → Web3 Freeze → Package → Sign-off → Shadow → Wave 1
```

---

## Child SSOT（引用，不复制原则）

| Layer | SSOT |
|-------|------|
| Governance Freeze | `registry/governance-freeze.v1.yaml` · [GOVERNANCE-FREEZE-V1.md](GOVERNANCE-FREEZE-V1.md) |
| Four-Gate | `registry/production-go-four-gate-framework.v1.yaml` · [PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md](PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md) |
| Prerequisite Review | `registry/phase3-deployment-prerequisite-review.v1.yaml` |
| Readiness Book | `gen-production-readiness-book.cjs` |
| Deployment Track | `registry/mainnet-deployment-package.v1.yaml` · [MAINNET-DEPLOYMENT-PACKAGE-V1.md](MAINNET-DEPLOYMENT-PACKAGE-V1.md) |
