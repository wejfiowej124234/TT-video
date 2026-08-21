# Executive Dashboard · Gate Semantics SSOT

**机读：** [`registry/executive-dashboard.v1.yaml`](../../registry/executive-dashboard.v1.yaml) → `gate_semantics`  
**PI3 真源：** [`registry/phase3-production-infrastructure.v1.yaml`](../../registry/phase3-production-infrastructure.v1.yaml)  
**一致性审计：** `scripts/dev/audit-executive-dashboard-gate-consistency.cjs`

---

## 1 · Gate 状态词汇（禁止混用）

| Status | 含义 | 计入 Closed？ | 计入 Interim？ | 计入 Open？ |
|--------|------|:-------------:|:--------------:|:-----------:|
| **CLOSED** | 最终 GO / 证据封口 | ✅ | — | — |
| **INTERIM_GO** | 仅 interim 里程碑（如 `*.fly.dev`） | ❌ **禁止** | ✅ | — |
| **WAITING_OWNER** | 等 Owner 输入（域名、Stripe 等） | ❌ | — | ✅ |
| **IN_PROGRESS** | 工程进行中（安全/监控/性能） | ❌ | — | ✅ |
| **PENDING** | 未启动（Go-Live） | ❌ | — | ✅ |
| **OPTIONAL** | P2 可选（Mainnet） | — | — | —（不计入 Release rollup） |

**纪律：** `INTERIM_GO` **≠** `CLOSED`。Dashboard **禁止**将 `INTERIM_GO` 统计进 Closed Gates。

---

## 2 · PI3 Release Gates（当前）

| Gate | Status | PI3 SSOT |
|------|--------|----------|
| PI3-001 | **CLOSED** | `status: GO` |
| PI3-002 | **INTERIM_GO** | `status: INTERIM_GO` · owner live pending |
| PI3-003 | **WAITING_OWNER** | `status: WAITING_OWNER_STRIPE` |
| PI3-004 | **INTERIM_GO** | `status: INTERIM_GO` · final UAT pending |
| PI3-006 | **PENDING** | deferred until PI3-002–004 live |
| PI3-005 | **OPTIONAL** | P2 · 不挡 Sepolia Production GO |

---

## 3 · Release Rollup（三态）

```text
Closed Gates     1   (PI3-001 only)
Interim Gates    2   (PI3-002, PI3-004)
Open Gates       2   (PI3-003 WAITING_OWNER, PI3-006 PENDING)
Release Decision NO_GO
```

P1 Production Readiness（Security · Observability · Performance）在 **Production** 区显示为 `IN_PROGRESS`，**不**并入 PI3 Release rollup 的 Closed 计数。

---

## 4 · Release Decision 规则

- `TT_RELEASE_DECISION: GO` 仅当 **所有 PI3 P0 release gates**（001–004 live + 006）为 **CLOSED**
- 任一 `INTERIM_GO` / `WAITING_OWNER` / `PENDING` / `IN_PROGRESS`（在 P0 路径上）→ **NO_GO**
- `OPTIONAL`（PI3-005 Mainnet）**不**影响 Sepolia Production GO

---

## 5 · 维护流程

1. 更新 `registry/phase3-production-infrastructure.v1.yaml` 各 item 的 `gate_status`
2. 镜像至 `registry/executive-dashboard.v1.yaml` → `pi3_release_gates`
3. 运行 `node scripts/dev/audit-executive-dashboard-gate-consistency.cjs`
4. `blocking_count=0` 后更新 Runbook / Sign-off
