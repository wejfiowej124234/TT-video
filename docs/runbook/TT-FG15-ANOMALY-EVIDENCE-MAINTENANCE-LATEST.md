# TT · FG-15 Anomaly Evidence Maintenance

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> FG-15-A anomaly maintain · **禁止**默认跑 `run-fg15-running-maintain.sh`。  
> **现行 SSOT：** [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md) · [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md)  
> 法医：`TRAVELTRUST_ALLOW_HISTORICAL_BASELINE=1`

**Status:** **ARCHIVED_HISTORICAL** · SUPERSEDED_SNAPSHOT  
**机读:** `FG15-ANOMALY-EVIDENCE-MAINTENANCE-LATEST.json`  
**Ledger:** `audit_trail/fg15_observation_48h/OBSERVATION-48H-ANOMALY-LEDGER.jsonl`  
**Samples:** `…/samples/sample-*.json` · `OBSERVATION-48H-SAMPLES.jsonl`

历史刷新脚本：`run-fg15-running-maintain.sh` / `run-fg15-close-prep.py`（**非**现行 mainline）。

| 状态 | 含义 |
|------|------|
| CLEAN | anomaly_samples=0 · ledger 空 |
| HAS_ANOMALIES | 须记录处置后再谈 ELAPSED PASS |

ELAPSED eval 要求：干净采样累积 · 无开放 anomaly。
