# G3 Production GO · Execution Tracker

**Target:** `TT_PRODUCTION_GO: GO` · **Discipline:** G3 infra only (no HAT/Manual/UI/features)

## Closed lanes
- `TT_PRODUCTION_ENTRY_READY`: YES
- `TT_PRODUCTION_OPERATIONS_GO`: GO
- Interim deploy: tt-api-prod / tt-web-prod

## Strict order
1. **Stripe Live** (PI3-003) — sk_live, webhook, PaymentIntent, refund, failures
2. **CDN/HLS** — R2 + edge probes (prep READY, not VERIFIED)
3. **Domain/TLS/CORS** (PI3-002) — www/api/cdn custom hostnames
4. **Security review** — secrets in Fly only
5. **Monitoring** (G3-04 / PI3-004)
6. **Backup + rollback** (PI3-001)
7. **Owner sign-off** + validator `--write-matrix`

See `G3-PRODUCTION-GO-EXECUTION-TRACKER-LATEST.json` for scripts and crosswalk.
