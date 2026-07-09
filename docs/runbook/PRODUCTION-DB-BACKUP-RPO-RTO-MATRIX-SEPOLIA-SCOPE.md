# Production DB Backup · RPO / RTO Matrix · Sepolia Scope（148 PRODUCTION_SCOPE_SEPOLIA）

**Recorded:** 20260608  
**Scope SSOT:** [148-PI3-005-Production-Scope-Decision-Report.md](../handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md)  
**Execution SSOT:** [152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md](../handbook/engineering/152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md)  
**Audit baseline:** [122-PI3-001](../handbook/engineering/122-PI3-001-Production-Database-Backup-Readiness-Report.md) · [TT-B475](./TT-B475-PG-SINGLE-DB-BACKUP-PITR-BASELINE-001.md)

> **≠ Production GO** — 本矩阵登记 **Sepolia-scoped prod PG** 备份/恢复目标；**`B-475 status=PASS`** + prod drill 证据为 GO 必要条件。

---

## 1 · Scope lock

| Key | Value |
|-----|-------|
| `PRODUCTION_SCOPE` | **SEPOLIA** |
| Prod PG Fly app | **`tt-traveltrust-prod`** |
| Staging PG Fly app | **`tt-traveltrust-staging`** |
| B-475 record | `evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json` |
| Catalog / Ops freeze | **UNCHANGED** — 145/146/150 · prod `ENABLED=0` |

---

## 2 · Backup topology

| Layer | Mechanism | Target | Evidence |
|-------|-----------|--------|----------|
| Fly managed backup | `fly pg backup enable` + `fly postgres backup create` | **prod enabled** | `fly-backup-list.txt` in drill dir |
| WAL / PITR | Fly Managed Postgres | `wal_archive_destination_desc` in B-475 | Fly docs + baseline field |
| Logical backup | `pg_dump --schema-only` drill | cutover window + optional daily cron | `schema-head.sql` in drill dir |
| Staging rehearsal | `run-phase3-db-restore-drill-staging.sh` | connectivity · **≠** prod GO | `db-restore-drill-*/` |

---

## 3 · RPO / RTO targets（Owner 书面基线 · 122 §7）

| Metric | Target | Mechanism | GO requires |
|--------|--------|-----------|-------------|
| **RPO** | **≤ 24h** | Fly daily managed backup + optional logical dump | prod backup **enabled** · list non-empty |
| **RTO** | **SEV-2: 30 min ack** · PG full outage **≤ 4h** restore decision | [PRODUCTION-INCIDENT-RESPONSE §1](./PRODUCTION-INCIDENT-RESPONSE.md) | prod drill **READY** |
| **Retention** | Fly plan **7d** (Owner confirm) · logical **30d** suggested | baseline `logical_backup_schedule_desc` | non-empty in B-475 PASS |
| **Drill cadence** | **Quarterly** prod full restore or PITR | PRODUCTION-OPS-RUNBOOK §2 | `last_restore_drill_utc` = **prod** UTC |

---

## 4 · B-475 status ladder

| status | Meaning | Gate |
|--------|---------|------|
| `PLANNED` | Shape OK · prod not closed | `check-b475` exit 0 |
| `PASS` | prod drill + three fields filled | `check-b475` + prod evidence |
| `WAIVED` | dev-only · **not** for prod GO | notes required |

---

## 5 · Owner execution checklist

| Step | Action | Script |
|------|--------|--------|
| 1 | Confirm / create `tt-traveltrust-prod` | `fly apps list` |
| 2 | Enable managed backup | `bash scripts/dev/enable-fly-pg-backup.sh tt-traveltrust-prod` |
| 3 | Fill `scripts/dev/.env.production.local` (`DATABASE_URL`) | gitignored |
| 4 | Run prod restore drill | `bash scripts/dev/run-phase3-db-restore-drill-prod.sh` |
| 5 | Verify B-475 PASS | `python scripts/gates/check-b475-pg-backup-pitr-baseline-record.py` |
| 6 | Verify RPO/RTO | `bash scripts/dev/verify-pi3-001-rpo-rto-baseline.sh` |
| 7 | Execution gate → GO | `bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh` |

**Staging alignment (P1):** `enable-fly-pg-backup.sh tt-traveltrust-staging` + re-run staging drill.

---

## 6 · Evidence chain index

| Path pattern | Meaning |
|--------------|---------|
| `evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json` | **机读主记录** |
| `.../db-restore-drill-*/` | Staging drill · STATUS=READY |
| `.../prod-db-restore-drill-*/` | **Prod drill** · required for GO |
| `.../fly-pg-backup-enable-*/` | Owner backup enable evidence |
| `.../pi3-001-exec-*/` | Execution gate summary |

---

## 7 · Gate commands

```bash
bash scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh
bash scripts/dev/verify-pi3-001-rpo-rto-baseline.sh
bash scripts/dev/check-fly-pg-backup-status.sh
bash scripts/check-pi3-001-production-database-backup-readiness.sh   # 122 audit
```

---

*Maintained by PI3-001 Execution Sprint · 152 · 2026-06-08*
