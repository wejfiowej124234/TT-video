# TT · Production Launch Final Pack

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> 文内 `09c72b93` / `v311_sepolia_clean_baseline` / Hardened = **immutable historical archive · NOT FOR PROMOTION**。  
> **现行 SSOT：** [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md)。  
> **禁止** Hard Gate flip · Recalculate · 冒充本文件为现行 ACTIVE · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`。

> **ARCHIVED_FG15_A_SNAPSHOT（2026-07-20）** · Release_SHA=`09c72b93` 仅历史。  
> **现行 Web3 SSOT：** `PSG-REL-20260720-WEB3-CAND-V2` / Candidate v2 @ `97289a71` / FG-15-B **ELAPSED**。  
> **禁止**用本包冒充当前 Active。

**Machine:** `TT_PRODUCTION_LAUNCH_FINAL_PACK`  
**Status:** `ARCHIVED_HISTORICAL` · `ARCHIVED_FG15_A_DRAFT_NOT_ACTIVE`  
**Release_SHA (historical):** `09c72b934b62…`  
**Active pin (living):** `PSG-REL-20260720-WEB3-CAND-V2` @ `97289a71` · FG-15-B **ELAPSED**  
**机读:** [`PRODUCTION-LAUNCH-FINAL-PACK-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/PRODUCTION-LAUNCH-FINAL-PACK-LATEST.json)  
**Runner:** `python scripts/dev/run-production-launch-final-pack.py`（须 `TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1`）

```text
本包 = FG-15-A 历史草稿。现行 = Candidate v2 @ 97289a71 · FG-15-B ELAPSED。
FINAL RELEASE 未 freeze → 禁止 Sign-off · Hard Gate flip · Recalculate · GO · cert suite
```

## 汇总成员

| 成员 | 人文 | 机读 |
|------|------|------|
| Release Runbook | [本文链](./TT-PRODUCTION-RELEASE-RUNBOOK-LATEST.md) | `PRODUCTION-RELEASE-RUNBOOK-LATEST.json` |
| Rollback Plan | [Rollback Pack](./TT-PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.md) | `PRODUCTION-ROLLBACK-PLAN-PACK-LATEST.json` |
| Launch Day Checklist | [Checklist](./TT-LAUNCH-DAY-CHECKLIST-LATEST.md) | `LAUNCH-DAY-CHECKLIST-LATEST.json` |
| Dossier 00–08 | [Dossier](./TT-PRODUCTION-READINESS-DOSSIER-LATEST.md) | `PRODUCTION-READINESS-DOSSIER-LATEST.json` |
| Risk Register | [Risk](./TT-FINAL-RISK-REGISTER-LATEST.md) | `FINAL-RISK-REGISTER-LATEST.json` |
| Ops SOP | [Ops](./TT-OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.md) | `OPS-SOP-LAUNCH-DAY-FINALIZE-LATEST.json` |
| CMS/Market | [CMS](./TT-CMS-MARKET-LAUNCH-PREP-LATEST.md) | `CMS-MARKET-LAUNCH-PREP-LATEST.json` |
| Cert DRAFT | [Cert](./TT-PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.md) | `PRODUCTION-CERTIFICATION-PACKAGE-DRAFT-LATEST.json` |
| Owner Sign-off DRAFT | [Owner](./TT-OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.md) | `OWNER-SIGNOFF-PACKAGE-DRAFT-LATEST.json` |

## 日常（窗内）

```bash
bash scripts/dev/run-fg15-observation-running.sh
python scripts/dev/run-production-launch-final-pack.py
```
