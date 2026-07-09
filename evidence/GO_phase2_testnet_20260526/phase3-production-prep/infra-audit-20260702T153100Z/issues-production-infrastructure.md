# Production Infrastructure · 问题清单（机读生成）

**生成：** 20260702T153100Z  
**审计脚本：** `scripts/dev/run-production-infrastructure-audit.sh`

| ID | 优先级 | 域 | 裁定 | 说明 |
|----|--------|-----|------|------|
| INF-P0-002 | P0 | B-475 / PI3-001 | BLOCKER | baseline status=PLANNED — prod PG backup plan must enable → PASS |
| INF-P1-001 | P1 | Fly PG staging backup | WARN | tt-traveltrust-staging: fly postgres backup list failed — prod must not copy staging gap |
| INF-P0-003 | P0 | Fly PG prod backup | BLOCKER | tt-traveltrust-prod: fly postgres backup list failed |
| INF-P0-004 | P0 | Prod domain / PI3-002 | BLOCKER | PROD_API_BASE/PROD_WEB_BASE unset or placeholder — no dedicated production domain |
| INF-P1-002 | P1 | CDN / HLS | OPEN | P3-COM-1 NOT STARTED — not blocking M-00 per PI3-007 defer |
| INF-P1-004 | P1 | Prod rollback drill | OPEN | staging rollback PASS · prod drill NOT_RUN |
| INF-P1-005 | P1 | Prod DB restore drill | OPEN | staging drill PASS · prod drill NOT_RUN |

---

**计数：** P0=3 · P1=4 · P2=0  
**Infrastructure GO：** `NO_GO`（P0=0 且 PI3-001/002 闭合）

