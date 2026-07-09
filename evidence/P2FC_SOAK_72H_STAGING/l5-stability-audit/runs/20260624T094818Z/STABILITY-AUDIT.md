# P2FC Soak L5 Stability Audit

**Generated:** 2026-06-24T09:48:18Z · **verdict:** **WARN** · **preconvergence:** 65/100
**Job:** `D:\TravelTrust-V1.1\evidence\P2FC_SOAK_72H_STAGING\job-20260624T011124Z` · **ok_polls:** 52 · **completed:** False

## 1. Wall-clock deviation

- wall/budget ratio=5.488 · wall ETA=390.4h · budget ETA=71.1h
- poll overhead=274.6s · jitter_trend=stable
- interval mean=334.6s stdev=72.4s
- fail_events=2 · verdict=warn

## 2. /meta layered failure propagation

- dominant chain=408>503>exec_ok>accept_deferred (0.981)
- L1→L2 503 ratio=1.0 · transitions=2
- observability samples=52 · exec_ok_ratio=0.981

## 3. Indexer parse rate

- parse_rate=0.037 · empty_rate=0.963 · flap_rate=0.037
- probe_fallback_ratio=1.0

## 4. Backlog risk diffusion

- TT_BACKLOG_DEPENDENCY_GRAPH: WARN files=180 risks=1 diffusion=1.1 out=D:/TravelTrust-V1.1/evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/runs/20260624T094818Z
- gate_fanout=11 · wave_blast=21

## Graduation pre-convergence

- score=65/100
- duration_convergence=converged · converged_dims=4/4
- matrix_ready=False
- new_risks_since_prior=[]

## Risk pre-convergence matrix

- **M1_WALL_CLOCK** wall-clock 偏差: convergence=converged · gate=SOAK_72H · post-soak=monitor wall ETA ~390.4h — no deploy during soak…
- **M2_META_PROPAGATION** /meta 分层传播: convergence=converged · gate=G02 · post-soak=wave-0 meta hotfix + p2fc-verify-staging-meta-availability.s…
- **M3_INDEXER_PARSE** indexer parse rate: convergence=converged_acknowledged · gate=TN-P1-010 · post-soak=TN-P1-010 independent via internal/indexer-* — not GET /meta…
- **M4_BACKLOG_DIFFUSION** backlog 风险扩散: convergence=converged · gate=WAVE-1/2 · post-soak=deploy backlog stamp + review 1 high-severity files…

## Long-term drift scan

- wall_growth=stable · overhead_slope=0.0
- indexer_decline=stable · slope=0.0
- meta_cluster=stable_cluster · density=0.981
- hotspots=5 · drift_signals=3

## Post-COMPLETED failure forecast (high likelihood)

- **step 4** `wave1_api_deploy`: API deploy OOM / compile timeout / health≠200
- **step 6** `meta_availability`: G02 strict /meta still 408 — 30s legacy vs 120s hotfix not live

## Future certain failures (pre-soak silent)

- **[critical]** FC-01_TIMEOUT_MISMATCH: fails_at=step-6 meta_availability --strict
- **[high]** FC-02_ITINERARIES_HUB: fails_at=step-4 wave1_api_deploy or post-deploy market/escrow
- **[medium]** FC-03_LARGE_DIFF_BLOB: fails_at=step-4/5 deploy OOM or runtime error

## FC execution-path rehearsal (T+min from COMPLETED)

- **T+28min** `FC-02_ITINERARIES_HUB` @ wave1_api_deploy (high)
- **T+28min** `FC-03_LARGE_DIFF_BLOB` @ wave1_api_deploy (medium)
- **T+45min** `FC-01_TIMEOUT_MISMATCH` @ meta_availability (critical)

## Recovery strategy map (FC-01/02/03)

### FC-01_TIMEOUT_MISMATCH
- **REC-01-A** when=step-3 apply_patches reject: git apply --3way hotfix; resolve middleware/mod.rs + fly.toml hunks…
- **REC-01-B** when=step-6 meta strict 408: verify fly secrets/env REQUEST_TIMEOUT_SECS=120 on tt-api-staging; red…
### FC-02_ITINERARIES_HUB
- **REC-02-A** when=step-4 fly deploy OOM/timeout: rollback API image; split wave1 — deploy hotfix-only subset first…
- **REC-02-B** when=step-4 health≠200 post deploy: fly logs tt-api-staging; isolate itineraries.rs; local cargo test -p t…
### FC-03_LARGE_DIFF_BLOB
- **REC-03-A** when=step-3 patch apply slow/conflict: apply hotfix first per wave plan; --3way backlog hunks…
- **REC-03-B** when=step-4/5 OOM: wave split: L0 hotfix → L1 API subset → L2 web; defer L3 e2e assets…

## Failure competition & success model

- baseline_score=11.1 · projected_MR=35.6
- wave1→grad P=0.1613
- optimal=STRAT-B_WAVE0_FIRST (28.3)
- competition_winner=FC-02_ITINERARIES_HUB

## Minimal risk change set (MR-01/02)

- **MR-01** Apply + deploy meta-availability-hotfix.patch only (Wave0)
- **MR-02** Defer itineraries.rs from initial wave1 deploy

## MR execution benefit & STRAT-B decision

- **decision:** `KEEP_DEFAULT_ONE_SHOT_APPLY_MR12` — MR-01+02 on existing 8-step one-shot beats STRAT-B extra cycle — do not replace watcher entrypoint
- WGG gain MR-01+02: **+19.5pp** · STRAT-B: +18.7pp
- score gain MR-01+02: **+24.5pp** · vs STRAT-B delta: **7.3pp**
- best_scenario: **STRAT-A_PLUS_MR12**

## MR12 execution lock (final freeze)

- **lock_status:** `FROZEN` · strategy=STRAT-A_PLUS_MR12
- **STRAT-B blocked:** yes · extra deploy blocked: yes
- **verify:** TT_MR12_EXECUTION_LOCK: FROZEN strategy=STRAT-A_PLUS_MR12 reject=STRAT-B entrypoint=one-shot


## Hidden stability risks

- **[medium]** DRIFT_PROBE_FALLBACK: ≥95% polls use meta_build fallback — full /meta never succeeds during soak (expected)
- **[medium]** DRIFT_INDEXER_SOURCE_EMPTY: indexer_source empty 96% of polls — /meta body unavailable; TN-P1-010 must use internal spine
- **[low]** DRIFT_INDEXER_SOURCE_FLAP: indexer_source alternates empty/runtime — /meta intermittently parseable
- **[medium]** HR_LARGE_DIFF_BLOB: 42 files with delta≥50 — review blast radius before wave-1
- **[high]** HR_ITINERARIES_HUB: itineraries.rs hub change — impacts market/escrow/guide consumer paths
- **[medium]** HR_WALL_BUDGET_DIVERGE: wall/budget ratio 5.488 — 72h completion wall-clock >> nominal
- **[medium]** DRIFT_HOTSPOT_SYS_OTHER: backlog hotspot SYS_OTHER Δ9613 gates=['ESCROW_CHAIN', 'LOW_SURFACE']
- **[medium]** DRIFT_HOTSPOT_SYS_E2E: backlog hotspot E2E / 烟测（非镜像关键路径） Δ4342 gates=['ESCROW_CHAIN']
- **[medium]** DRIFT_HOTSPOT_SYS_FRONTEND_OTHER: backlog hotspot SYS_FRONTEND_OTHER Δ335 gates=['ESCROW_CHAIN', 'LOW_SURFACE']
