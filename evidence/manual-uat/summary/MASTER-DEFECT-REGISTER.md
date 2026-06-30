# Master Defect Register

**原则：** 行 **永不删除** · 只追加 · CLOSED 保留 · 可 **REOPENED**  
**机读：** [defects-registry.json](./defects-registry.json) · **追溯：** [REQUIREMENT-TRACEABILITY.md](./REQUIREMENT-TRACEABILITY.md)

| ID | Module | Req | P | Status | Opened Session | Fix Commit | Regression Session |
|----|--------|-----|---|--------|----------------|------------|-------------------|
| DEFECT-001 | API / Step 6b5 | R-API-6B5-002 | P2 | OPEN | S001 | — | — |
| DEFECT-002 | Infra / Playwright | R-INFRA-PW-001 | P1 | OPEN | S001 | — | — |
| DEFECT-003 | Infra / E2E | R-INFRA-E2E-001 | P2 | OPEN | S001 | — | — |

**Dashboard：** `python scripts/dev/generate-manual-uat-dashboard.py`
| DEFECT-004 | Config / API base | R-C1-001 | P1 | FIXED | S001 | 422aadb9 | — | — | S001 |
