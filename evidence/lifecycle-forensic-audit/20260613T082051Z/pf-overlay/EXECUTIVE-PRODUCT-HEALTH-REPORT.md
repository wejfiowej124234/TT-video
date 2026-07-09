# Executive Product Health Report · DOMAIN-X

**Generated:** 2026-06-13T08:20:53.934252+00:00  
**Environment:** local (①)  
**SSOT:** docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §13.7

## Summary

| Metric | Value | Band |
|--------|-------|------|
| Complexity Score | 100 | HIGH |
| Redundancy Score | 100 | HIGH |
| Routes (page.tsx) | 194 | — |
| Buttons (est.) | 977 | — |
| Admin pages | 107 | — |

## Top actions (machine-suggested · Owner must confirm)

### Merge (20)
- **PF-SEED-001** · 编辑资料 / Edit profile → MERGE
- **PF-SEED-002** · Merchant listing / inventory → MERGE
- **PF-SEED-003** · Publish Hub entry → MERGE
- **PF-AUTO-005** · common_retry → MERGE
- **PF-AUTO-006** · common_backtohome → MERGE
- **PF-AUTO-007** · common_loading → MERGE
- **PF-AUTO-008** · community_tab_feed → MERGE
- **PF-AUTO-009** · didrank_title → MERGE
- **PF-AUTO-010** · escrow_detailaria → MERGE
- **PF-AUTO-011** · governance_nav_label → MERGE

### Remove (1)
- **PF-SEED-004** · archive/ui-v1

### Refactor (0)
- (none)

## Honest boundary

① artifact generation **≠** ③ Production GO. Human verdicts (KEEP/MERGE/RETIRE/REFACTOR) required in `product-forensic-registry.v1.json`.

**grep:** `TT_PRODUCT_FORENSIC_EXECUTIVE: OK`
