# Local-First Alignment Audit

**At:** 20260630T051148Z
**HEAD:** `9979b35efe562e8dd200e9f1a1e17fcc8182d170`
**Staging API:** `877a1e77bf05cf1d4d5141aedac404a23d219e5f`
**Staging Web:** `877a1e77bf05cf1d4d5141aedac404a23d219e5f`

```text
TT_LOCAL_FIRST_ALIGNMENT: NOT_100_PERCENT_ALIGNED
```

## P0 Gaps (5)

- **GAP-DEPLOY-SSOT**: 50
- **GAP-WT-TRACKED**: ["AGENTS.md","data/indexer_audit.jsonl","data/indexer_state.json.runtime","frontend/.i18n-coverage.json","scripts/dev/deploy-tt-web-staging.sh","scripts/dev/gen-phase2-baseline-consistency-audit.py","scripts/dev/l5-p0-closure-lib.sh","scripts/dev/lib/release-seed-guide-slot.sh","scripts/dev/lib/tt-patch-order-assignable-guide.sh","scripts/dev/phase2-deep-release-gate.py"]
- **GAP-API-SHA**: api=877a1e77bf05 head=9979b35efe56
- **GAP-WEB-SHA**: web=877a1e77bf05 head=9979b35efe56
- **GAP-EVIDENCE**: TN-P1-010/D24/D6 not all PASS @ HEAD · TN-P1-010: need post-soak TN-P1-010 @ freeze 8dcd304a (historical-only reports excluded)

**Honest:** 100% ALIGNED required before formal 72h soak + Graduation CLOSED.
