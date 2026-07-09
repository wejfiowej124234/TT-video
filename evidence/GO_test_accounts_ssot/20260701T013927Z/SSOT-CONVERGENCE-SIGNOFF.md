# Test Accounts SSOT Convergence — Sign-off

**UTC:** `2026-07-01T01:39:31Z`  
**Evidence:** `evidence/GO_test_accounts_ssot/20260701T013927Z/`

## Verdict

```text
TT_TEST_ACCOUNTS_SSOT_CONVERGENCE: PASS
TT_TEST_ACCOUNTS_IMMUTABLE_IDS: C1,C2,C3,C4,E1,E2
TT_TEST_ACCOUNTS_GOVERNANCE: BACKWARD_COMPATIBLE_ADD_NEW_ID_ON_BREAK
```

## Delivered

1. **Immutable ID Registry** — `registry/test-accounts-business-immutable.v1.yaml`
2. **Quick Reference** — `docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md`
3. **Change gate template** — `docs/runbook/TT-TEST-ACCOUNT-CHANGE.md`
4. **Matrix v1.3.7** — §0.1b Immutable IDs · §9 Registry email SSOT · §8/§0.4 dedupe
5. **Local doc slim** — removed §2.1 duplicate table · fixed migration count
6. **Probe fix** — Staging skips E1 login (IS_STAGING)
7. **6b5/6b4 split** — E1 on 6b4 documented in registry + verify-seed header
8. **Registry JSON** — `evidence/manual-uat/summary/test-accounts-registry.v1.json`
9. **Cursor rule** — `traveltrust-test-accounts-immutable-ids.mdc`
10. **Convergence scan** — `scripts/dev/run-test-accounts-ssot-convergence-scan.sh`

## Staging probe

`TT_MANUAL_UAT_ROUTE_PROBE: PASS` (E1 SKIP expected on staging)
