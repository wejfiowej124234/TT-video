# Business Manual UAT Sign-off

**UTC:** 20260702T011941Z
**Phase:** Display Data Governance → Business Manual UAT

## Environments

| Env | Governance | UAT Probes |
|-----|------------|------------|
| Local (127.0.0.1:8080) | PASS | PASS |
| Staging (tt-api-staging.fly.dev) | PASS (31 unpublish) | PASS |

## Scenarios (API probes)

- UAT-01 游客 · 杭州市场 · C3 可见 — PASS
- UAT-08 Discover 无 test/demo/smoke 订单 — PASS

## Machine keys

```text
TT_DISPLAY_DATA_GOVERNANCE: PASS
TT_BUSINESS_MANUAL_UAT: PASS
TT_BUSINESS_MANUAL_UAT_SIGNOFF_UTC: 20260702T011941Z
```
