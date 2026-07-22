# TT · Production Release Runbook（FG-15-A 历史冻结稿）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.



> **ARCHIVED_FG15_A_HISTORICAL（Baseline Migration Phase-3 · 2026-07-20）**  
> 文内 `09c72b93` / `v311_sepolia_clean_baseline` / Hardened = **immutable historical archive · NOT FOR PROMOTION**。  
> **现行 Web3 Release Baseline：** `PSG-REL-20260720-WEB3-CAND-V2` · Candidate v2 · FG-15-B。  
> 见 [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md)。  
> **禁止** Hard Gate flip · PSG Recalculate · 冒充本文件为现行 ACTIVE。

> **ARCHIVED_FG15_A_SNAPSHOT** · Release_SHA=`09c72b93` 非现行。  
> **现行：** `PSG-REL-20260720-WEB3-CAND-V2` / Candidate v2 / FG-15-B。  
> 见 [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md)。

**Machine:** `TT_PRODUCTION_RELEASE_RUNBOOK`  
**Status:** `SUPERSEDED_SNAPSHOT` · `ARCHIVED_FG15_A_DRAFT_NOT_ACTIVE`  
**Release_SHA (historical):** `09c72b934b62…`  
**Active pin (living):** `PSG-REL-20260720-WEB3-CAND-V2`  
**机读:** [`PRODUCTION-RELEASE-RUNBOOK-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/PRODUCTION-RELEASE-RUNBOOK-LATEST.json)

> FG-15-B **已 ELAPSED** · FINAL RELEASE 未 freeze 前：**禁止** Sign-off · Hard Gate 翻转 · Recalculate · Production GO · 重部署 · cert suite。

## 阶段（写死）

| 阶 | 名称 | 动作 |
|----|------|------|
| **P0** | FG-15 Observation Running | 采样 · 监控 · Evidence · Parallel Prep |
| **P1** | FG-15 ELAPSED PASS | `run-fg15-observation-elapsed-eval.py` |
| **P2** | Owner Sign-off | **人工**签名（仅 P1 后） |
| **P3** | PSG Recalculate | `run-psg-completion-matrix-recalculate.py` |
| **P4** | Production Certification 定稿 | DRAFT → FINAL |
| **P5** | GO / NO-GO | **另闸** Owner 决策 · 不自动 |

## P0 冻结

- Release SHA = `09c72b93…`  
- 合约 / 配置 / **不重部署**  
- ACTIVE（历史快照）= `v311_sepolia_clean_baseline` · **现行 = `v311_fund_safety_candidate_v2`**

## 互指

[Launch Final Pack](./TT-PRODUCTION-LAUNCH-FINAL-PACK-LATEST.md) · [Dossier 00–08](./TT-PRODUCTION-READINESS-DOSSIER-LATEST.md) · [FG-15 Running](./TT-FG15-OBSERVATION-WINDOW-RUNNING-LATEST.md)
