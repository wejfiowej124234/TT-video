# Local-First Alignment Audit

**At:** 20260630T051509Z
**HEAD:** `9979b35efe562e8dd200e9f1a1e17fcc8182d170`
**Staging API:** `9979b35efe562e8dd200e9f1a1e17fcc8182d170`
**Staging Web:** `9979b35efe562e8dd200e9f1a1e17fcc8182d170`

```text
TT_LOCAL_FIRST_ALIGNMENT: NOT_100_PERCENT_ALIGNED
```

## P0 Gaps (3)

- **GAP-DEPLOY-SSOT**: 51
- **GAP-WT-TRACKED**: ["AGENTS.md","data/indexer_audit.jsonl","data/indexer_state.json.runtime","deploy/fly/tt-web-staging/build.env.local","frontend/.i18n-coverage.json","scripts/dev/deploy-tt-web-staging.sh","scripts/dev/gen-phase2-baseline-consistency-audit.py","scripts/dev/l5-p0-closure-lib.sh","scripts/dev/lib/release-seed-guide-slot.sh","scripts/dev/lib/tt-patch-order-assignable-guide.sh"]
- **GAP-EVIDENCE**: TN-P1-010/D24/D6 not all PASS @ HEAD · TN-P1-010: need post-soak TN-P1-010 @ freeze 8dcd304a (historical-only reports excluded)

**Honest:** 100% ALIGNED required before formal 72h soak + Graduation CLOSED.
