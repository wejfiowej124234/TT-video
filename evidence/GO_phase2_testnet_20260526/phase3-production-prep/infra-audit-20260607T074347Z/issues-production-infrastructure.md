# Production Infrastructure · 问题清单（机读生成）

**生成：** 20260607T074347Z  
**审计脚本：** `scripts/dev/run-production-infrastructure-audit.sh`

| ID | 优先级 | 域 | 裁定 | 说明 |
|----|--------|-----|------|------|
| INF-P0-001 | P0 | Fly CLI | BLOCKER | fly auth whoami failed — cannot verify PG backups / prod apps / certs |
| INF-P0-002 | P0 | B-475 / PI3-001 | BLOCKER | baseline status=PLANNED — prod PG backup plan must enable → PASS |
