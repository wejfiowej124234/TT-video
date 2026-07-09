# P2FC Soak L5 Stability Audit

**Generated:** 2026-06-24T04:03:11Z · **verdict:** **WARN**
**Job:** `D:\TravelTrust-V1.1\evidence\P2FC_SOAK_72H_STAGING\job-20260624T011124Z` · **ok_polls:** 32 · **completed:** False

## 1. Runtime volatility

- budget_elapsed=1920s · wall_elapsed=9995s · ratio=5.206
- interval mean=320.5s stdev=14.7s
- fail_events=0 · verdict=warn

## 2. /meta 408/503 layers

- observability samples=17 · exec_ok_ratio=1.0
- api_meta codes={'408': 17}
- web_meta codes={'503': 17}

## 3. Indexer / exec chain drift

- probe_fallback_ratio=1.0
- indexer_source={'(empty)': 31, 'runtime': 1}

## 4. Backlog dependency impact

- TT_BACKLOG_DEPENDENCY_GRAPH: WARN files=180 risks=1 out=D:/TravelTrust-V1.1/evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/runs/20260624T040311Z

## Hidden stability risks

- **[medium]** DRIFT_PROBE_FALLBACK: ≥95% polls use meta_build fallback — full /meta never succeeds during soak (expected)
- **[medium]** DRIFT_INDEXER_SOURCE_EMPTY: indexer_source empty 97% of polls — /meta body unavailable; TN-P1-010 must use internal spine
- **[low]** DRIFT_INDEXER_SOURCE_FLAP: indexer_source alternates empty/runtime — /meta intermittently parseable
- **[medium]** HR_LARGE_DIFF_BLOB: 42 files with delta≥50 — review blast radius before wave-1
- **[high]** HR_ITINERARIES_HUB: itineraries.rs hub change — impacts market/escrow/guide consumer paths
- **[medium]** HR_WALL_BUDGET_DIVERGE: wall/budget ratio 5.206 — 72h completion wall-clock >> nominal
