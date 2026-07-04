# TT-RELEASE-TRAIN · Reality Verification（G1 / G2 / G3 统一规范）

**SSOT（机读）：** [`registry/release-train-reality-verification.v1.json`](../../registry/release-train-reality-verification.v1.json)  
**Runtime Identity：** [`TT-RUNTIME-IDENTITY.md`](TT-RUNTIME-IDENTITY.md) · [`TT-PRODUCTION-RUNTIME-IDENTITY-GUARD.md`](TT-PRODUCTION-RUNTIME-IDENTITY-GUARD.md)  
**Configuration Truth：** [`TT-CONFIGURATION-TRUTH.md`](TT-CONFIGURATION-TRUTH.md)

---

## Release Train 统一层（所有 Gate 同源）

```text
Reality Audit
      ↓
Reality Gap Report
      ↓
Reality Fix
      ↓
Platform Coverage Audit    ← RuntimeIdentity / ConfigurationTruth 覆盖率
      ↓
Reality Verification
      ↓
Formal Acceptance
      ↓
Gate PASS
```

**Coverage 低于 100% 或存在未迁移模块 → `TT_PLATFORM_COVERAGE_AUDIT: FAIL` → Formal BLOCKED**（G2/G3：**RuntimeIdentity 100% · ConfigurationTruth 100% · 0 unmigrated modules**）

**平台架构冻结（2026-07-04）：** 禁止新增 Registry / Guard / Verification Layer / Truth Source / Capability — **除非 Architecture Review Approve**。

**下一阶段目标（写死）：** **Platform Adoption 100%** — 只允许 P0 运行态阻塞 · P1-B 全仓 Adoption · P1-C 仓库固化；禁止「新增 XXX 架构」叙事。

| Gate | Verification 入口 | Formal 前置 |
|------|-------------------|-------------|
| **G1** | `bash scripts/dev/run-reality-verification.sh --gate G1` | `TT_G1_REALITY_VERIFICATION: COMPLETE` |
| **G2** | `bash scripts/dev/run-reality-verification.sh --gate G2` | `TT_G2_REALITY_VERIFICATION: COMPLETE` + Identity + **Configuration Truth PASS** |
| **G3** | `bash scripts/dev/run-reality-verification.sh --gate G3` | 同 G2 |

**禁止跳层：** Fix 阶段的 CLOSED **不等于** Verification VERIFIED；Verification FAIL **必须 REOPEN** Matrix Gap。

---

## 六真源（Six Truth Sources）

Verification **不再改代码**，只核对六者一致：

| # | Truth Source | 含义 |
|---|--------------|------|
| 1 | **Evidence** | 探针 / signoff JSON 已落盘 |
| 2 | **Matrix** | Master Matrix 与 `closed_evidence` 一致 |
| 3 | **Registry** | SSOT JSON 与代码 / Identity 一致 |
| 4 | **Configuration** | Fly Secrets · Fly Config · `.env.production` · GHA · Registry · **Runtime /meta** 六层无 Drift |
| 5 | **Runtime** | 目标环境 HTTP / 行为与 SSOT 一致 |
| 6 | **Call Graph** | Builder → Governed View → API **真正被调用** |

**Configuration Drift 例：** Registry=production · Fly secret=production · **Runtime meta=null** → `TT_CONFIGURATION_TRUTH: FAIL`

Call Graph：`scripts/dev/lib/runtime-truth-call-graph.cjs`

---

## RuntimeIdentity · 平台唯一身份判断器

**禁止**脚本内 ad-hoc `if (production)` — 统一：

```javascript
const { RuntimeIdentity } = require('./scripts/dev/lib/runtime-identity.cjs');
RuntimeIdentity.current().isProduction();
```

Rust：`RuntimeIdentity::current()` · `crates/api/src/runtime_identity.rs`

**Machine keys：** `TT_RUNTIME_IDENTITY` · `TT_PRODUCTION_RUNTIME_IDENTITY` · `TT_CONFIGURATION_TRUTH`

---

## G2 当前真实 Blocker

`PRM-SEC-B002` — Configuration Drift：`deployment_profile=null` on prod despite seed-off。

```bash
bash scripts/dev/phase3-production-fly-deploy-and-sync.sh --secrets-only
bash scripts/dev/run-reality-verification.sh --gate G2
```

---

## 诚实边界

- ① Fix / Verification **≠** ② staging GO **≠** ③ Production GO
- G1：staging identity · G2/G3：**Identity + Configuration Truth 强制 PASS**
