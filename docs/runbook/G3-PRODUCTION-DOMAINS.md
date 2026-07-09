# G3 Production Domains · Six-Domain SSOT

**Machine SSOT:** [`registry/g3-production-domains.v1.json`](../../registry/g3-production-domains.v1.json)  
**Prerequisite:** `TT_G2_RETROSPECTIVE: COMPLETE` · `TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: CLOSED`

---

## 项目状态（写死 · 2026-07-04）

| 阶段 | 状态 |
|------|------|
| Platform | ✅ COMPLETE |
| Platform Governance | ✅ FROZEN |
| G1 | ✅ PASS |
| G2 | ✅ PASS |
| Master Reality Audit | ✅ CLOSED |
| G3 | 🟡 **READY**（六域均为 **PLANNED**） |
| G3 CDN Prep | ✅ **READY** · `TT_G3_PRODUCTION_CDN_PREP`（**≠ VERIFIED**） |
| Production GO | ❌ **NO_GO** · `TT_PRODUCTION_GO_PREP: READY` |

**G3 起只有一种发布语言。** 禁止再使用：Drift · Reality Gap · Runtime Gap · Platform Gap · OPEN · REOPEN · IN_PROGRESS · READY · BLOCKED · 「G3 基本完成」。

---

## G3 状态机（六域相同）

**Matrix / Domain 仅四态：**

```text
PLANNED
    ↓
IMPLEMENTING
    ↓
VERIFIED
    ↓
CLOSED
```

**每个 Domain 固定五步（六域完全一致，不得改流程）：**

```text
PLANNED
    ↓
Implementation
    ↓
Reality Verification
    ↓
Evidence Integrity
    ↓
Formal Acceptance
    ↓
VERIFIED
    ↓
Matrix CLOSED
```

**推进纪律：** 一次只做一个 Domain。完成 **Verification → Integrity → Formal → VERIFIED → CLOSED** 后，再进入下一 Domain。

**当前 Active Domain：** **G3-01 Production Network** · 专册 [`G3-01-PRODUCTION-NETWORK.md`](G3-01-PRODUCTION-NETWORK.md)

**G3 输入链（Official Content Baseline · 写死 · 在 G3-01 之前）：**

```text
TT_OCS_SURFACE_EXPANSION: VERIFIED        （② Staging · 10/10）
        ↓
TT_OCS_POST_APPLY_DDG: PASS               （OCS 收尾 · DDG PASS）
        ↓
Official Content Baseline V1 · READY
        ↓
G3-01 Production Network · PLANNED
```

G3 引用的 Official Content Baseline = **V1 · READY**（已通过 OCS 验收且通过 DDG 治理验证）。详见 [`TT-OFFICIAL-COLD-START-DATASET.md`](TT-OFFICIAL-COLD-START-DATASET.md) · [`TT-PRODUCTION-READINESS-PROGRAM.md`](TT-PRODUCTION-READINESS-PROGRAM.md) §0.0.2。

**治理原则（Production Readiness Program · 写死）：** Content/Data Governance **不阻塞** G3 生产基础设施 — 见 Program **原则四** · `TT_CONTENT_GOVERNANCE_NON_BLOCKING_G3`。配置优先于代码 — Program **原则五** · `TT_CONFIGURATION_CHANGES_OVER_CODE_CHANGES`。

---

## G3 CCV 预实施门禁（写死 · 六域统一）

<a id="tt-g3-ccv-pre-implementation-gate"></a>

**机读键：** `TT_G3_CCV_PRE_IMPLEMENTATION_GATE: ENFORCED`

**规则：** 每进入一个 G3 Domain，**先答三个问题**，再决定是否进入 Implementation。**禁止**一上来就配 DNS / 切 Stripe / 写代码。

| 检查项 | 问题 |
|--------|------|
| **Capability** | 这个能力是否已经存在？ |
| **Configuration** | 是否只是没有配置？ |
| **Verification** | 是否只是没有验收？ |

**维度状态（与 Domain 四态不同 · 仅 CCV 用）：** `VERIFIED` · `PLANNED` · `IMPLEMENTING`  
**Formal 轨（不变）：** `PLANNED` → Reality Verification → Evidence Integrity → Formal Acceptance

**判读（写死）：**

| Capability | Configuration | Verification | 结论 |
|------------|---------------|--------------|------|
| VERIFIED | PLANNED | PLANNED | **不开发** — 只做配置 + 验收 |
| VERIFIED | VERIFIED | PLANNED | **不开发** — 只做验收 |
| PLANNED / 缺失 | — | — | Matrix 登记 Gap → **才允许** 开发 |

**六域 CCV 快照（进入 Implementation 前必须能填这一眼表）：**

| Domain | Capability | Configuration | Verification | Formal |
|--------|------------|---------------|--------------|--------|
| **G3-01** Production Network | VERIFIED | PLANNED | PLANNED | PLANNED |
| **G3-02** Web3 USDC Escrow Payment | VERIFIED | PLANNED | PLANNED | PLANNED |
| **G3-03** Disaster Recovery | VERIFIED | PLANNED | PLANNED | PLANNED |
| **G3-04** Monitoring | VERIFIED | PLANNED | PLANNED | PLANNED |
| **G3-05** Production Cutover | VERIFIED | PLANNED | PLANNED | PLANNED |
| **G3-06** Production Evidence | VERIFIED | PLANNED | PLANNED | PLANNED |

**示例（G3-01 · 不要一上来配 DNS）：**

```text
G3-01 Production Network
  Capability      VERIFIED   （Fly · TLS · CDN 能力已在平台 / ② 验证过）
  Configuration   PLANNED    （生产域名 · DNS · CDN 绑定未切）
  Verification    PLANNED    （生产 Reality · SSL Labs · CORS 未验）
  Formal          PLANNED
→ 不开发；按 Checklist 做配置 + ③ 验收
```

**原则五联动：** 上表任一行若 Capability=VERIFIED，则 **禁止** 以「顺手改 API/UI」代替 Fly / DNS / Dashboard 配置。

---

**Release Train · 当前下一步（写死 · 不再优化 OCS）：**

```text
Official Content Baseline V1 · READY          ← 当前
        ↓
G3-01 Production Network · PLANNED
        ↓
IMPLEMENTING                             ← 网络 / 域名 / TLS / CDN
        ↓
VERIFIED
```

**并行可选（非 OCS · 非 G3）：** [Market Media DDG Remediation](TT-MARKET-MEDIA-DDG-REMEDIATION.md) — listing cover 迁移 + strict 全站 DDG。

---

## Production-only 纪律（G3 全域 · 写死）

**G3 的 VERIFIED 必须来自真实 Production Environment。**

| 禁止 | 必须 |
|------|------|
| Local PASS → Production VERIFIED | Production → Reality Verification → Evidence → Formal → **VERIFIED** |
| Staging PASS → Production VERIFIED | 证据包 `environment: production` |

与 Runtime Truth / Reality Audit 同源：**避免「本地 PASS」冒充「Production PASS」。**

**Verification 复用（禁止新建 G3 Verification 产品）：**

- `run-reality-verification.sh --gate G3 --domain G3-0N`
- `run-evidence-integrity-audit.sh G3`
- G3 Formal Acceptance（与 G2 同构）

---

## 证据目录（六域相同结构）

```text
evidence/GO_production_readiness/G3-0N/
    implementation/
    verification/
    evidence/
    formal/
    signoff.json
```

| Domain | 目录 |
|--------|------|
| G3-01 Production Network | `evidence/GO_production_readiness/G3-01/` |
| G3-02 Payment | `evidence/GO_production_readiness/G3-02/` |
| G3-03 Disaster Recovery | `evidence/GO_production_readiness/G3-03/` |
| G3-04 Monitoring | `evidence/GO_production_readiness/G3-04/` |
| G3-05 Production Cutover | `evidence/GO_production_readiness/G3-05/` |
| G3-06 Production Evidence | `evidence/GO_production_readiness/G3-06/` |

---

## G3-01 · Production Network（当前 · Scope 已冻结）

**不要直接改 DNS/CDN。** 按 [`G3-01-PRODUCTION-NETWORK.md`](G3-01-PRODUCTION-NETWORK.md) 顺序执行。

| 步 | 动作 |
|----|------|
| 1 | **冻结 Scope** — Domain · DNS · TLS · CDN · WAF · CORS only |
| 2 | **Checklist** — [`g3-01-production-network-checklist.v1.json`](../../registry/g3-01-production-network-checklist.v1.json) |
| 3 | **Implementation** — 逐项 PLANNED → IMPLEMENTING → VERIFIED → CLOSED |
| 4 | **Verification** — 复用 Reality · Integrity · Formal（不新建脚本） |
| 5 | **VERIFIED** → PRM-DOM-B001 **CLOSED** → G3-02 |

| 项 | 值 |
|----|-----|
| Status | **PLANNED** |
| Scope 准入 | 是否属于 G3-01 Scope？否 → 拒绝 |
| Matrix gap | PRM-DOM-B001 |
| Evidence | `evidence/GO_production_readiness/G3-01/` |

---

## G3-02 · Web3 USDC Escrow Payment

**核心支付轨：** Wallet → USDC approve/deposit → Escrow → Indexer → Settlement → FeeRouter  
**Matrix:** PRM-WEB3-PAY-B001 · **Evidence:** `G3-02/`  
**Runbook:** [`PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md`](PRODUCTION-PAYMENT-READINESS-WEB3-USDC.md)  
**Execution:** [`G3-02-WEB3-PAYMENT-PRODUCTION-EXECUTION.md`](G3-02-WEB3-PAYMENT-PRODUCTION-EXECUTION.md)  
**Gate:** `bash scripts/check-web3-payment-production-readiness.sh`

> **Stripe Live（PI3-003）** = 入驻准入费 **可选法币入口（P1）** · **不阻断** G3-02 VERIFIED / Production GO。

---

## G3-03 · Disaster Recovery

Backup · Restore · Recovery Drill · RPO · RTO · Matrix: PRM-DR-B001 · PRM-DR-B002 · Evidence: `G3-03/`

---

## G3-04 · Monitoring

Metrics · Logs · Alert · Synthetic · On-call · Evidence: `G3-04/`

---

## G3-05 · Production Cutover

Deployment · Rollback · Smoke · Rollout · Traffic Switch · Matrix: PRM-MVAL-B004 · Evidence: `G3-05/`

---

## G3-06 · Production Evidence（最终 Domain）

GO Decision Package · Final PER · Production Sign-off · Launch Checklist · Launch Approval

**Production GO 唯一判据：** [`TT-PRODUCTION-GO-DECISION-PACKAGE.md`](TT-PRODUCTION-GO-DECISION-PACKAGE.md) · Evidence: `G3-06/`

---

## Production GO 主链路（2026-07-08 · 与 G3 Domain 链并行）

SSOT: [`registry/production-go-closure-sequence.v1.yaml`](../../registry/production-go-closure-sequence.v1.yaml)

```text
OCS Bootstrap → Web3 Payment → CMS Ops → Parity → CDN → Domain/TLS → Monitoring → DR → Security → Owner Sign-off
```

Stripe **不在**主链路。

---

## Production GO 链（G3 Domain · 写死）

```text
G3-01 VERIFIED
    ↓
G3-02 VERIFIED
    ↓
G3-03 VERIFIED
    ↓
G3-04 VERIFIED
    ↓
G3-05 VERIFIED
    ↓
G3-06 VERIFIED
    ↓
Production GO Decision Package
    ↓
TT_PRODUCTION_GO = GO
    ↓
Production Retrospective
```

**禁止：** 「G3 基本完成」· 跳过某一域 VERIFIED · 聊天/感觉判 GO。

---

## G3 不做

Platform · Architecture · Builder · Registry · Guard · RuntimeIdentity · PCP · Platform Capability — 除非 Architecture Review。

**准入问题：** 是否直接影响 Production GO？**若不是，不做。**

---

## 诚实边界

- Domain **CLOSED** ≠ Production GO  
- ① 本地证据 ≠ ③ Production GO（真 PSP · 真域 · Owner Decision Package）  
- Matrix gap **PLANNED** = 待 G3 域验收，不是「漂移」叙事

**G2 基线：** [`G2-RETROSPECTIVE.md`](G2-RETROSPECTIVE.md)  
**GO 判据：** [`TT-PRODUCTION-GO-DECISION-PACKAGE.md`](TT-PRODUCTION-GO-DECISION-PACKAGE.md)
