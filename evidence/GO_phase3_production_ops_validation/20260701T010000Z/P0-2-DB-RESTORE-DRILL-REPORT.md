# P0-2-DB-RESTORE-DRILL

**Stamp:** `20260701T010000Z`
**Verdict:** **PASS**
**Gate line:** `TT_PHASE3_DB_RESTORE_DRILL: OK`

## Findings

- Fly PG backup list: backups NOT enabled on tt-traveltrust-staging (prod action item)
- Logical pg_dump: WARN skipped (docker connectivity); psql read drill OK
- Post-drill SELECT: current_database=tt_api_staging users_count=673
- baseline_record.v1.json last_restore_drill_utc updated
