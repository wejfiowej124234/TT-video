# B16 · `/market` initial JS budget override rationale (① local)

**Not a global ceiling relaxation.** Global five-main `initial_js_transfer_bytes_max` remains **6_500_000**. Only **`/market`** uses `route_overrides.initial_js_transfer_bytes_max: 6_800_000`.

## Measured evidence (prod server `:3013` · B16 live scan)

| Route | initial_js_bytes | tracked_requests | static script responses |
|-------|------------------|------------------|-------------------------|
| `/` | 6_318_462 | 183 | 159 |
| **`/market`** | **6_676_955** | **208** | **179** |
| `/traveltrust` | 4_246_737 | 54 | 54 |
| `/did-rank` | 2_838_089 | 41 | 41 |
| `/community` | 2_867_093 | 47 | 46 |

- **`/market` − `/` delta:** +358_493 bytes (~5.7%), +25 network assets.
- **Override headroom:** 6_800_000 − measured 6_676_955 = **123_045 bytes (~1.8%)** for run-to-run variance — not an order-of-magnitude slack.

Source: `frontend/evidence/l5-performance-five-main-live-scan/scan-results.jsonl` (B16 PASS run).

## Product / code SSOT (why `/market` > other five-main routes)

1. **Dual data plane on one page** — [`LANDING-MARKET-PAGES-CODE-SSOT.md`](../../../../../../frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md) §3: **`GET /api/v1/discover/orders`** + **`GET /api/v1/guides`**; orders | guides | split views via `useMarketPage` / `MarketContent`.
2. **SSR parallel prefetch** — [`marketPageInitialData.server.ts`](../../../../../../frontend/lib/market/marketPageInitialData.server.ts): `fetchMarketPageInitialSnapshot()` pulls **discover (30) + guides (30)** in parallel before hydration.
3. **Extra client surface vs `/`** — filter/sort frozen band, hub sub-nav, favorites sync, bind-guide / custom itinerary modals (dynamic), cold-start campaign strip, product-enhancement rail — all on **`/market` main only** (MARKET-L5 scope).
4. **`/` is not a strict upper bound for `/market`** — landing is itinerary-create + single-card preview; market is full discover/guides marketplace (more components + more route-specific chunks loaded at first paint).

## Governance

- **FPC v5 unchanged** — budget file is B16 evidence artifact; probe reads `route_overrides` only at evaluation time.
- **Regression still applies** — `FPC-100-PERFORMANCE-BASELINE-LATEST.json` captures B16 PASS snapshot; future >8% JS disk or >12% avg navigation triggers P1.
- **②③** — transfer-byte SLO on staging/production hosts is a **separate gate**; this override is **① local** prod-build + `next start` scan only.

**Conclusion:** 6.8MB cap is **route-specific calibration** tied to measured dual-feed architecture, not a blanket waiver.
