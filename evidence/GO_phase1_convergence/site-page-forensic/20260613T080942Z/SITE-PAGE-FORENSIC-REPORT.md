# Site Page Forensic Report · Phase① Final Convergence

**Standard:** v1.14.0 STRUCTURE FROZEN · **NOT** a new DOMAIN  
**Generated:** 2026-06-13T08:09:44.521843+00:00

## Summary

| Verdict | Count |
|---------|-------|
| KEEP | 84 |
| MERGE | 3 |
| RETIRE | 0 |
| REFACTOR | 107 |

**Routes scanned:** 194 · **Nav hrefs:** 94 · **Orphan hrefs (sample):** 1

## MERGE (RC-01 priority)

- `/me/identities` · Publish / merchant / identity hub entry proliferation (RC-01)
- `/me/publish` · Publish / merchant / identity hub entry proliferation (RC-01)
- `/provider` · Publish / merchant / identity hub entry proliferation (RC-01)

## REFACTOR (RC-03 Admin/RBAC)

- `/admin/alerts/incidents/[id]`
- `/admin/alerts/incidents`
- `/admin/api-versions`
- `/admin/approvals/[id]`
- `/admin/approvals`
- `/admin/audit/logs/[id]`
- `/admin/audit/operations`
- `/admin/audit`
- `/admin/auth-audit-events`
- `/admin/community/abuse-policy`
- `/admin/community/appeals`
- `/admin/community/appeals/review`
- `/admin/community/comments/visibility`
- `/admin/community/moderation/cases`
- `/admin/community/penalties`

## RETIRE

- _(none)_

**grep:** `TT_PHASE1_SITE_PAGE_FORENSIC: OK`
