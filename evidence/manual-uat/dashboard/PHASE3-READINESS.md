# Production Readiness Dashboard

**AUTO-GENERATED** · `2026-06-30T14:06:10Z`
**Generator:** `python scripts/dev/generate-manual-uat-dashboard.py`

> **证据口径：** 本页证明当前质量聚合态 · **非** ③ Production GO 签字。
> **SSOT 结构：** [evidence/manual-uat/README.md](../README.md)（**FROZEN** · 只追加 Session）
> **Active mainline:** [TT-PROJECT-MAINLINE](../../docs/runbook/TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md) · 验产品
> **Configuration:** `TT_CONFIGURATION_ZERO_DRIFT` **STATUS FROZEN 2026-06-30** · maintenance verify only

## Production Readiness（主视图 · Configuration 已毕业）

| 指标 | 值 |
|------|-----|
| **Open P0 Business Bugs** | **0** |
| **Open P1 Business Bugs** | **1** |
| **Manual UAT Coverage** | 0% (0/27 PASS · 0 FAIL · 0 blocked) |
| **Regression** | Pending 0 · Passed 41 |
| **Production Readiness** | **IN_PROGRESS** |

| 上下文 | 值 |
|--------|-----|
| Phase | ①-local |
| Current Session | S001 (`20260630T112505Z`) |
| Latest Commit | `422aadb9` |
| Open P2 Business Bugs | 2 |
| Open P3 Business Bugs | 0 |
| Overdue P1 (>24h OPEN) | 0 |
| Overdue P2 (>7d OPEN) | 0 |
| Closed Bugs (累计) | 25 |

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
