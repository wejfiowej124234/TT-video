# PDCA Guest CSR Reconcile

Captured: 2026-07-14T18:45:38.492Z
Evidence: `evidence/GO_pdca_business_content/20260714T184503Z`

## Environments

### staging

- API: `https://tt-api-staging.fly.dev`
- WEB: `https://tt-web-staging.fly.dev`

| Surface | Public API | CSR DOM | Judgment | Static blind spot |
|---------|------------|---------|----------|-------------------|
| community | 10 | 10 | aligned | no |
| guide | 10 | 10 | aligned | yes |
| destination | 10 | 10 | aligned | yes |
| campaign | 10 | 10 | aligned | yes |

**Campaign per-surface**

| Surface | Public API | CSR DOM | Judgment |
|---------|------------|---------|----------|
| home_hero | 2 | 2 | aligned |
| market_feed | 3 | 3 | aligned |
| community_feed | 5 | 5 | aligned |

## Honest boundary

- Phase ② Staging guest CSR reconcile ≠ ③ Production GO
- Read-only — no data mutation, no align, no Content Freeze lift
