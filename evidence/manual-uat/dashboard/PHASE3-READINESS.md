# Production Readiness Dashboard

**AUTO-GENERATED** · `2026-07-04T01:31:28Z`
**Generator:** `python scripts/dev/generate-manual-uat-dashboard.py`

> **证据口径：** 本页证明当前质量聚合态 · **非** ③ Production GO 签字。
> **SSOT 结构：** [evidence/manual-uat/README.md](../README.md)（**FROZEN** · 只追加 Session）
> **Active mainline:** [TT-PROJECT-MAINLINE](../../docs/runbook/TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md) · 验产品
> **Configuration:** `TT_CONFIGURATION_ZERO_DRIFT` **STATUS FROZEN 2026-06-30** · maintenance verify only

## Production Readiness（主视图 · Configuration 已毕业）

| 指标 | 值 |
|------|-----|
| **Open P0 Business Bugs** | **0** |
| **Open P1 Business Bugs** | **0** |
| **Manual UAT Coverage** | — (0/0 PASS · 0 FAIL · 0 blocked) |
| **Regression** | Pending 0 · Passed 42 |
| **Production Readiness** | **IN_PROGRESS** |

| 上下文 | 值 |
|--------|-----|
| Phase | ①-local |
| Current Session | — (`latest`) |
| Latest Commit | `fea685b0` |
| Open P2 Business Bugs | 2 |
| Open P3 Business Bugs | 0 |
| Overdue P1 (>24h OPEN) | 0 |
| Overdue P2 (>7d OPEN) | 0 |
| Closed Bugs (累计) | 26 |

## ② Testnet Sign-off（CLOSED）

| 指标 | 值 |
|------|-----|
| **Testnet Sign-off Coverage** | 100% (22/22 PASS · 0 PARTIAL · 0 FAIL · 0 blocked) |
| **TT_TESTNET_SIGNOFF** | **CLOSED** |
| **TT_TESTNET_GRADUATION** | **CLOSED** |
| **Testnet Session** | TN-20260630T144813Z |
| **Checklist SSOT** | [TT-TESTNET-SIGNOFF-CHECKLIST](../../docs/runbook/TT-TESTNET-SIGNOFF-CHECKLIST.md) |
| **Test accounts（一页）** | [TT-TEST-ACCOUNTS-QUICK-REFERENCE](../../docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md) · Immutable C1–E2 |
| **① Baseline** | Manual UAT 27/27 · `20260630T142222Z` |

> **纪律：** ② Sign-off + Graduation **CLOSED** · ③ Production GO 须 **独立 GO gate**（禁止从 Graduation 直接推导）。

## ③ Production Convergence（CLOSED）

| 机读键 | 值 |
|--------|-----|
| **PHASE3_PRODUCTION_PREP** | **ACTIVE** |
| **PHASE3_OPS_VALIDATION** | **CLOSED** |
| **PHASE3_PRODUCTION_CONVERGENCE** | **CLOSED** |
| **PHASE3_PRODUCTION_GO** | **NO_GO** |
| **Runbook SSOT** | [PHASE3-PRODUCTION-PREPARATION](../../docs/runbook/PHASE3-PRODUCTION-PREPARATION.md) |
| **Canonical ② Sign-off** | [TESTNET-SIGNOFF-20260701T002252Z.md](../signoff/TESTNET-SIGNOFF-20260701T002252Z.md) |

> **纪律：** Convergence **仅** 收敛 SSOT/文档 · **不** 关闭生产专属 BLOCKER · Production GO 仍为独立 gate。

> **纪律：** 配置漂移复发 = **Regression**（DEFECT + REG）· **非** Configuration Sprint。见 [TT-CONFIGURATION-ZERO-DRIFT-FROZEN](../../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)。

## 工作流（项目主线 · 验产品）

```
Manual UAT → Business Defect → Regression → Production Entry Review
    → Testnet Sign-off → Mainnet Preparation
```

Configuration 章节 **FROZEN 2026-06-30** — 见 [TT-CONFIGURATION-ZERO-DRIFT-FROZEN](../../docs/runbook/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)。

## 配置漂移（已毕业 · FROZEN · 附录）

| 指标 | 值 |
|------|-----|
| **TT_CONFIGURATION_ZERO_DRIFT** | **FROZEN** |
| CFG 登记（封顶） | CFG-001～CFG-028 |
| CFG OPEN | 0 |
| Zero Drift Gate | **PASS** (graduated) |
| 维护验证（Regression guard） | `bash scripts/dev/verify-cfg-drift-closure.sh` — fail → **DEFECT/REG** |
| SSOT | [CFG-REGISTRY.md](../summary/CFG-REGISTRY.md) · [freeze signoff](../signoff/TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md) |

## Severity SLA

| Severity | 目标 |
|----------|------|
| P0 | 当天关闭 |
| P1 | 24 小时 |
| P2 | 下一 Session |
| P3 | 版本内（Release） |

## 数据源

- [defects-registry.json](../summary/defects-registry.json)
- Latest session SUMMARY.json
- [MASTER-DEFECT-REGISTER](../summary/MASTER-DEFECT-REGISTER.md)
- [Regression queue](../regression/README.md)
- [Release index](../release/README.md)
