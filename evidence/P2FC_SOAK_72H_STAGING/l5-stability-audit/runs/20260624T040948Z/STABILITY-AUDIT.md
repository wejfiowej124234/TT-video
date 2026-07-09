# P2FC Soak L5 Stability Audit

**Generated:** 2026-06-24T04:09:48Z · **verdict:** **WARN** · **preconvergence:** 100/100
**Job:** `D:\TravelTrust-V1.1\evidence\P2FC_SOAK_72H_STAGING\job-20260624T011124Z` · **ok_polls:** 33 · **completed:** False

## 1. Wall-clock deviation

- wall/budget ratio=5.208 · wall ETA=372.1h · budget ETA=71.5h
- poll overhead=260.4s · jitter_trend=stable
- interval mean=320.4s stdev=14.5s
- fail_events=0 · verdict=warn

## 2. /meta layered failure propagation

- dominant chain=408>503>exec_ok>accept_deferred (1.0)
- L1→L2 503 ratio=1.0 · transitions=0
- observability samples=19 · exec_ok_ratio=1.0

## 3. Indexer parse rate

- parse_rate=0.03 · empty_rate=0.97 · flap_rate=0.03
- probe_fallback_ratio=1.0

## 4. Backlog risk diffusion

- TT_BACKLOG_DEPENDENCY_GRAPH: WARN files=180 risks=1 diffusion=1.1 out=D:/TravelTrust-V1.1/evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/runs/20260624T040948Z
- gate_fanout=11 · wave_blast=21

## Graduation pre-convergence

- score=100/100
- duration_convergence=stabilizing · converged_dims=3/4
- matrix_ready=True
- new_risks_since_prior=[]

## Risk pre-convergence matrix

- **M1_WALL_CLOCK** wall-clock 偏差: convergence=converged · gate=SOAK_72H · post-soak=monitor wall ETA ~372.1h — no deploy during soak…
- **M2_META_PROPAGATION** /meta 分层传播: convergence=converged · gate=G02 · post-soak=wave-0 meta hotfix + p2fc-verify-staging-meta-availability.s…
- **M3_INDEXER_PARSE** indexer parse rate: convergence=converged_acknowledged · gate=TN-P1-010 · post-soak=TN-P1-010 independent via internal/indexer-* — not GET /meta…
- **M4_BACKLOG_DIFFUSION** backlog 风险扩散: convergence=insufficient_samples · gate=WAVE-1/2 · post-soak=deploy backlog stamp + review 1 high-severity files…

## Hidden stability risks

- **[medium]** DRIFT_PROBE_FALLBACK: ≥95% polls use meta_build fallback — full /meta never succeeds during soak (expected)
- **[medium]** DRIFT_INDEXER_SOURCE_EMPTY: indexer_source empty 97% of polls — /meta body unavailable; TN-P1-010 must use internal spine
- **[low]** DRIFT_INDEXER_SOURCE_FLAP: indexer_source alternates empty/runtime — /meta intermittently parseable
- **[medium]** HR_LARGE_DIFF_BLOB: 42 files with delta≥50 — review blast radius before wave-1
- **[high]** HR_ITINERARIES_HUB: itineraries.rs hub change — impacts market/escrow/guide consumer paths
- **[medium]** HR_WALL_BUDGET_DIVERGE: wall/budget ratio 5.208 — 72h completion wall-clock >> nominal
