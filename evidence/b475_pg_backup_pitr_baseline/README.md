# B-475 · PostgreSQL 备份与 PITR 基线（单库 L0）

**母表**：[B-475](../docs/任务母表.md)  
**Runbook**：[TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001](../docs/runbook/TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md)

| 文件 | 含义 |
|------|------|
| `baseline_record.v1.json` | 机读收口记录；`PLANNED` → 运维完成后 `PASS` 或 `WAIVED` |

**门禁**：`python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py`（`status=PASS` 时校验非空字段）。
