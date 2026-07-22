# TT · Production Readiness Dossier（00–08）

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> tip `652bbab5` / RUNNING / wait-window wording below = **SUPERSEDED_SNAPSHOT** · cert **FORBIDDEN** until FINAL RELEASE `freeze_status=FROZEN`.



> **ARCHIVED_FG15_A_HISTORICAL（Baseline Migration Phase-3 · 2026-07-20）**  
> 文内 `09c72b93` / `v311_sepolia_clean_baseline` / Hardened = **immutable historical archive · NOT FOR PROMOTION**。  
> **现行 Web3 Release Baseline：** `PSG-REL-20260720-WEB3-CAND-V2` · Candidate v2 · FG-15-B。  
> 见 [TT-WEB3-CANDIDATE-V2-LATEST](./TT-WEB3-CANDIDATE-V2-LATEST.md)。  
> **禁止** Hard Gate flip · PSG Recalculate · 冒充本文件为现行 ACTIVE。

**Status:** `SUPERSEDED_SNAPSHOT` · `STRUCTURED_00_08_DRAFT` · 向 FG-15 结束收敛  
**Release_SHA:** `09c72b93…`（冻结）  
**机读:** [`PRODUCTION-READINESS-DOSSIER-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/PRODUCTION-READINESS-DOSSIER-LATEST.json)

> **阶段一句话：** 代码冻结，证据累积；所有上线准备向 FG-15 结束时收敛。

```text
Production Readiness Dossier
├── 00 Executive Summary
├── 01 Release Identity
│    ├── SHA
│    ├── Artifact
│    └── Bytecode
├── 02 Contract Deployment
│    ├── Addresses
│    ├── Tx Hash
│    └── Chain
├── 03 PSG Completion Matrix
│    ├── L1 · L2 · L3 · L4 · L5
├── 04 Security
├── 05 Operations
├── 06 Risk Register
├── 07 Rollback Plan
└── 08 Owner Sign-off
```

| § | 内容 | 当前态 |
|---|------|--------|
| **00** | L1–L4 PASS · FG-15 RUNNING · Cert DRAFT | 摘要就绪 |
| **01** | SHA=`09c72b93` · Artifact/Bytecode bundles | 冻结 |
| **02** | Hardened 地址 + Tx · Sepolia · NOT_ACTIVE | 冻结 |
| **03** | L1✅ L2✅ L3✅ L4✅ L5⏳(FG-15) | 矩阵索引 |
| **04** | L3 Hardened PASS | 就绪 |
| **05** | L4 + Case A/B/C SOP | 就绪 |
| **06** | Closed/Accepted/Deferred/Blocking | 已分类 |
| **07** | Rollback Tree · IR · ops/RUNBOOK | 指针就绪 |
| **08** | Owner Sign-off DRAFT · **未签** | 仅准备 |

**窗内禁止：** 改 SHA/合约/配置/重部署 · ACTIVE · GO · 伪 FG-15 PASS · 最终签名。

刷新：`python scripts/dev/run-fg15-parallel-launch-prep-deepen.py`
