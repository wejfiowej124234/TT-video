# TT · Performance Runtime Revalidation · LATEST

**Verdict:** `PERFORMANCE_RUNTIME_REVALIDATION_WAITING_DEPLOY`  
**Stamp:** `20260723T092334Z` · `2026-07-23T09:23:34Z`  
**Tip:** `ea71c577ce6f99696df33f9394cf96746edc843b` · **Pin:** `PSG-REL-20260720-WEB3-CAND-V2`  
**PCR:** `PCR-20260723-PERFORMANCE-RUNTIME-REVALIDATION`  
**Optimization runtime live:** `NO — WAITING_DEPLOY`

## Preconditions

- Optimization Closure: `PERFORMANCE_OPTIMIZATION_CLOSURE_PASS`
- Runtime `/meta/build` git_sha: `ea71c577ce6f99696df33f9394cf96746edc843b`
- Local HEAD tip: `ea71c577ce6f99696df33f9394cf96746edc843b`

## Dimensions

| Dimension | Status |
|-----------|--------|
| Tip alignment | `PASS` |
| Optimization live (compact/cache) | `WAITING_DEPLOY` |
| Identity hot path `/meta/build` | `PASS` |
| Compact path | `WAITING_DEPLOY` |
| API hot paths | `PASS_WITH_ED` |
| Concurrency | `PASS_WITH_ED` |
| Frontend TTFB | `PASS_WITH_ED` |
| CWV lab | `WAITING_ENV` |
| Postgres slow-query | `WAITING_ENV` |
| User INP | `WAITING_ENV` |

## Live signals (this run)

| Probe | p50 ms | p95 ms | p99 ms | bytes |
|-------|--------|--------|--------|-------|
| `/meta/build` | 1640.53 | 4861.16 | 6989.7 | 1302.0 |
| `/meta?compact=1` | 7099.35 | 8076.46 | 8357.4 | 74718.0 |
| `/meta` full | 7500.6 | 11919.05 | 12017.02 | 74718.0 |
| `/health` | 1772.56 | 4904.45 | 6927.25 | 2.0 |

## Holds

| ID | Sev | Disposition | Title |
|----|-----|-------------|-------|
| `PERF-RT-OPT-NOT-DEPLOYED` | P1 | WAITING_DEPLOY | Staging runtime lacks compact/cache/singleflight headers |
| `PERF-RT-CWV-LAB` | ED | WAITING_ENV | Core Web Vitals lab/field not re-run |
| `PERF-RT-PG-SLOWQUERY` | ED | WAITING_ENV | Postgres slow-query dump not collected |
| `PERF-RT-INP` | ED | WAITING_ENV | User interaction INP lab not executed |

## Rebind

| Step | OK |
|------|----|
| evidence_authenticity | `✅` |
| delta_recertify_dry_run | `✅` |
| reality_closure | `✅` |
| reality_closure_prr | `✅` |
| regression_freeze | `✅` |
| engineering_ssot | `✅` |
| candidate_v2 | `✅` |
| performance_audit_gate | `✅` |

## Honesty

Staging tip ea71c577 aligned. Optimization Closure code (compact/cache/singleflight) is local working tree — NOT present on Staging runtime (compact still ~75KB, no x-traveltrust-meta-* headers). Hot identity /meta/build exists; Fly cold-start variance inflated this-run p95 vs prior morning. CWV/PG/INP WAITING_ENV. ≠ Production GO · no EGM/Candidate/Product Baseline/Hard Gate/Cutover/new RC.

## Next (Owner)

1. Commit Optimization Closure code (no new RC — patch on tip line / Staging Patch Ledger).
2. Deploy `tt-api-staging` (+ web if FE compact path required).
3. Re-run: `python scripts/dev/run-performance-runtime-revalidation.py`  
   Expect `x-traveltrust-meta-view: compact`, body ≪ 75KB, then verdict → `PASS`.

## Gate

```bash
python scripts/dev/run-performance-runtime-revalidation.py
bash scripts/gates/check-performance-runtime-revalidation-gate.sh
```
