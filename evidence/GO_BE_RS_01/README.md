# GO_BE_RS_01 · RegionShare Reconcile Evidence Pack

> **Sprint**：170-B · **BE-RS-01**  
> **Gate**：`bash scripts/dev/run-sprint170-be-rs01-implementation-gate.sh`  
> **Live job**：`bash scripts/ops/region-share-reconcile.sh`  
> **Cron**：`bash scripts/ops/region-share-reconcile-cron.sh`

## Required env (live / Sepolia)

| Variable | Purpose |
|----------|---------|
| `API_BASE_URL` | API root |
| `INTERNAL_API_SECRET` | `X-Internal-Api-Secret` |
| `ADMIN_BEARER_TOKEN` | Optional overview parity |
| `REGION_SHARE_RECONCILE_CHAIN_ID` | Optional chain filter |
| `REGION_SHARE_RECONCILE_VERIFY_OVERVIEW` | `true` for admin overview deep-equal |

## Sign-off

- [ ] `region-share-reconcile.sh` exit 0
- [ ] `amount_triangle_marker` aligned or documented incomparable
- [ ] Admin `/admin/region-share/reconcile` shows latest report
- [ ] `run-business-expansion-enterprise-gap-audit.sh` BE-RS-01 MET
