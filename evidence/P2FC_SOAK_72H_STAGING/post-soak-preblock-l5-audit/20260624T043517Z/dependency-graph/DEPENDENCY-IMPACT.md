# Backlog Dependency Impact Graph

- **files:** 180 · **subsystems:** 10
- **high-severity hidden risks:** 1
- **verdict:** **WARN**

## Subsystem nodes

### SYS_META_G02 · G02 /meta 验收链 (3 files, Δ23)
- Gates: G01_WEB, G02_META, SOAK_EXEC
- `crates/api/src/middleware/mod.rs` Δ12
- `frontend/app/meta/route.ts` Δ9
- `crates/api/src/routes/health_meta/handlers.rs` Δ2

### SYS_API_DB · API 数据面 / PG (1 files, Δ2)
- Gates: TN_P1_010
- `crates/api/src/db/mod.rs` Δ2

### SYS_API_ROUTES · API 路由域 (1 files, Δ195)
- Gates: ESCROW_CHAIN
- `crates/api/src/routes/itineraries.rs` Δ195

### SYS_API_CORE · API 核心 router (1 files, Δ2)
- `crates/api/src/router.rs` Δ2

### SYS_ADMIN_UI · Admin 运营面 (1 files, Δ32)
- `frontend/components/admin/AdminMainBootGate.tsx` Δ32

### SYS_CONSUMER_UI · Consumer / 五主 adjacent (1 files, Δ4)
- `frontend/app/market/MarketPageClient.tsx` Δ4

### SYS_FRONTEND_LIB · Frontend lib / hooks (5 files, Δ49)
- Gates: ESCROW_CHAIN
- `frontend/lib/orders/ordersListL5.contract.test.ts` Δ29
- `frontend/lib/traveltrust/home/visualQaManifest.ts` Δ10
- `frontend/lib/admin/adminNavPerfL5.contract.test.ts` Δ5

### SYS_E2E · E2E / 烟测（非镜像关键路径） (80 files, Δ4342)
- Gates: ESCROW_CHAIN
- `frontend/e2e/smoke.spec.ts` Δ401
- `frontend/e2e/trust-gate-escrow.spec.ts` Δ281
- `frontend/e2e/market-subsite-shared.ts` Δ240

### SYS_FRONTEND_OTHER · SYS_FRONTEND_OTHER (13 files, Δ335)
- Gates: ESCROW_CHAIN, LOW_SURFACE
- `frontend/components/market/useMarketPage.ts` Δ119
- `frontend/playwright.config.ts` Δ53
- `frontend/evidence/GO_local_phase1/README.md` Δ45

### SYS_OTHER · SYS_OTHER (74 files, Δ9613)
- Gates: ESCROW_CHAIN, LOW_SURFACE
- `.../dom-compositor-audit.json` Δ6889
- `.../layer-kill-audit/kill-matrix.json` Δ397
- `.../b468-market-discovery-full-ui-journey.spec.ts` Δ222

## Risk diffusion

- gate_fanout=11 · wave_blast=21 · diffusion_score=1.1
- new vs prior: HR_ITINERARIES_HUB, HR_LARGE_DIFF_BLOB

## Hidden stability risks

- **[medium]** HR_LARGE_DIFF_BLOB: 42 files with delta≥50 — review blast radius before wave-1
- **[high]** HR_ITINERARIES_HUB: itineraries.rs hub change — impacts market/escrow/guide consumer paths
