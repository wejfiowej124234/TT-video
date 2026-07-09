# Admin Final Spot Check · Session AFSC-20260608

**Policy:** Record only · no UX fixes · wait staging-soak  
**Env:** FE :3012 · API :8080 · persona tourist@test.com (Ops console role)

## Navigation (Guide links) — OK

| Path | Guide step | Landed URL | Extra clicks |
|------|------------|------------|--------------|
| CMS Publish | Daily ops #1 | /admin/content/countries | 0 |
| Official OPS | Daily ops #4 | /admin/official | +1 to cold-start |
| Moderation | Daily ops #3 | /admin/community/reports?status=open | 0 |

## Shell completion — partial in automated run

AFSC-001..003: page shells not detected (API/session env). Manual browser verify recommended.

Re-run: bash scripts/ops/run-admin-final-spot-check.sh
