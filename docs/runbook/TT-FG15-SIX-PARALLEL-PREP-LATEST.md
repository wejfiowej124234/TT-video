# TT · FG-15 六并行准备包

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> FG-15-A 六并行准备 · **NOT FOR PROMOTION**。  
> **现行 SSOT：** [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md)

**Machine:** `TT_FG15_SIX_PARALLEL_PREP`  
**Status:** **ARCHIVED_HISTORICAL** · SUPERSEDED_SNAPSHOT · **禁止** PASS/GO/ACTIVE  
**Runner:** `python scripts/dev/run-fg15-six-parallel-prep-packs.py`（historical only）  
**机读索引:** `FG15-SIX-PARALLEL-PREP-INDEX-LATEST.json`

```text
代码冻结，证据累积；所有上线准备向 FG-15 结束时收敛。
```

## 优先顺序（写死）

| # | 包 | 机读 | 人文 |
|---|-----|------|------|
| 1 | Production Certification | `PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json` | [Cert Draft](./TT-PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.md) |
| 2 | Owner Sign-off（未签） | `OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json` | [Owner Draft](./TT-OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.md) |
| 3 | Launch Day Checklist | `LAUNCH-DAY-CHECKLIST-LATEST.json` | [Checklist](./TT-LAUNCH-DAY-CHECKLIST-LATEST.md) |
| 4 | Ops / Incident Runbook | `OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.json` | [Incident](./TT-OPS-INCIDENT-RUNBOOK-LAUNCH-LATEST.md) |
| 5 | 主网环境预检（只读） | `MAINNET-ENV-PREFLIGHT-READONLY-LATEST.json` | [Env Preflight](./TT-MAINNET-ENV-PREFLIGHT-READONLY-LATEST.md) |
| 6 | 运营材料 + 人工验收计划 | `LAUNCH-OPS-MATERIALS-LATEST.json` · `MANUAL-UAT-EXECUTION-PLAN-LATEST.json` | [Ops Materials](./TT-LAUNCH-OPS-MATERIALS-LATEST.md) · [Manual UAT](./TT-MANUAL-UAT-EXECUTION-PLAN-LATEST.md) |

## 窗内禁止

❌ 优化合约 · 改经济规则 · 改 FeeRouter · 改 Settlement · 改权限模型 · 改 Release SHA · 重部署 · ACTIVE · 最终签名 · Cert FINAL · GO

## 满窗后

```text
FG-15 ELAPSED PASS → Owner Sign-off → PSG Recalculate → Cert FINAL → GO/NO-GO
```

日常：`bash scripts/dev/run-fg15-running-maintain.sh`（sample · integrity · Launch Pack · 六包 · **priority deepen**）

满窗后仅按执行卡：[LC-09～13](./TT-LAUNCH-LC09-13-EXECUTION-CARDS-LATEST.md)
