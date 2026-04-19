# TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001 · **B-475** **备份** **与** **PITR** **基线**

**母表**：[B-475](../任务母表.md)  
**路线图**：[postgresql-layered-evolution-roadmap.md](../architecture/postgresql-layered-evolution-roadmap.md) **·** **L0**  
**运维交叉引用**：[ops/RUNBOOK.md](../../ops/RUNBOOK.md)（**数据库** **/** **备份** **段落** **以** **环境** **为准** **补** **链** **）**

---

## §1 · 目标（文档 + 机读记录）

在 **不** **绑定** **单一云厂商** **的** **前提下**，书面固定 **最小** **生产** **基线**：

1. **WAL** **归档** **或** **等价** **连续** **备份** **路径** **（** **描述** **即可** **）** **。**
2. **逻辑** **备份** **节奏** **（** **如** **`pg_dump`** **cron** **/** **托管** **快照** **）** **。**
3. **恢复** **演练** **记录** **（** **时间** **UTC** **）** **。**

无法落地的环境（**仅** **dev** **沙箱** **）** **：** **将** **`baseline_record.v1.json`** **的** **`status`** **置为** **`WAIVED`** **并** **在** **`notes`** **写明** **原因** **与** **替代** **风险控制** **。**

---

## §2 · 证据落点

| 路径 | 含义 |
|------|------|
| [`evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json`](../../evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json) | **机读** **主** **记录** |
| [`evidence/b475_pg_backup_pitr_baseline/README.md`](../../evidence/b475_pg_backup_pitr_baseline/README.md) | **人读** **索引** |

---

## §3 · 机读验收

```bash
python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py
```

- **`status=PLANNED`** **：** **仅** **校验** **JSON** **形状** **与** **`schema`** **（** **规划** **登记** **可** **合并** **）** **。**
- **`status=PASS`** **：** **须** **填** **非空** **`wal_archive_destination_desc`** **、** **`logical_backup_schedule_desc`** **、** **`last_restore_drill_utc`** **。**
- **`status=WAIVED`** **：** **须** **有** **`notes`** **说明** **。**

**退出码** **0** **⇒** **机读** **PASS** **。**

---

## §4 · 与 TT-B475-B474-B473 的关系

历史文件 **[`TT-B475-B474-B473-SEAL-REGRESSION-001.md`](./TT-B475-B474-B473-SEAL-REGRESSION-001.md)** **专指** **B-473** **封口** **回归** **诊断** **；** **本** **TT** **ID** **虽** **共用** **「** **B-475** **」** **前缀** **，** **对象** **为** **PostgreSQL** **备份** **基线** **，** **勿** **混读** **。**

---

**文档版本**：1.0 · 2026-04-18
