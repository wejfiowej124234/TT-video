# Deploy Backlog · 上线分层评审

- **backlog stamp:** `20260624T013808Z`
- **files:** 107 · **patch:** 1136317 bytes · **hotfix:** 5964 bytes
- **verdict:** **PASS**

## 部署波次（post-soak · 一次性）

- **Wave 0** `meta-hotfix` — apply meta-availability-hotfix.patch + fly.toml REQUEST_TIMEOUT_SECS=120 (4 files)
- **Wave 1** `api-runtime` — deploy tt-api-staging（含 L1 变更） (2 files)
- **Wave 2** `web-runtime` — deploy tt-web-staging (20 files)
- **Wave 3** `backlog-remainder` — 同批 deploy-backlog.patch 余量（e2e 不进镜像关键路径） (81 files)

## 分层

### L0_META_HOTFIX · meta 可用性 · G02 验收前置 (4)
- `crates/api/src/middleware/mod.rs` Δ12
- `crates/api/src/router.rs` Δ2
- `crates/api/src/routes/health_meta/handlers.rs` Δ2
- `frontend/app/meta/route.ts` Δ9

### L1_API_RUNTIME · API 运行时 / 路由 / DB (2)
- `crates/api/src/db/mod.rs` Δ2
- `crates/api/src/routes/itineraries.rs` Δ195

### L2_FRONTEND_RUNTIME · Web 运行时 UI/数据链 (20)
- `frontend/.i18n-coverage.json` Δ17
- `frontend/app/guides/page.tsx` Δ5
- `frontend/app/market/MarketPageClient.tsx` Δ4
- `frontend/app/orders/OrdersListCardItem.tsx` Δ9
- `frontend/app/orders/OrdersListCards.tsx` Δ33
- `frontend/app/orders/useOrdersListPageCore.ts` Δ7
- `frontend/app/terms/community-guidelines/page.tsx` Δ1
- `frontend/components/admin/AdminMainBootGate.tsx` Δ32
- … +12 more

### L3_FRONTEND_E2E · E2E/烟测（不随镜像默认执行） (80)
- `frontend/e2e/53-main-path.spec.ts` Δ237
- `frontend/e2e/93-matrix-admin-deep-batch.spec.ts` Δ28
- `frontend/e2e/93-matrix-admin-domain-batch.spec.ts` Δ15
- `frontend/e2e/93-matrix-enterprise-p1-batch.spec.ts` Δ6
- `frontend/e2e/93-matrix-path-f1-f4.spec.ts` Δ31
- `frontend/e2e/93-matrix-path-p1-remediation.spec.ts` Δ97
- `frontend/e2e/96-17-header-identity-spine.spec.ts` Δ10
- `frontend/e2e/account-nav-header-ia.spec.ts` Δ29
- … +72 more

### L9_OTHER · 其它 (1)
- `.../api/src/middleware/auth_pause_metrics/mod.rs` Δ1

