# G2 Lessons Learned

Generated as immutable G2 baseline reference.

## LL-G2-001 · G2 Gate recompute order

- **Category:** matrix_sync
- **Issue:** sync-production-readiness-g2-matrix.cjs ran recomputeG2Gate() before upserting TT_WAVE2_FORMAL_ACCEPTANCE: COMPLETE, leaving TT_PRODUCTION_READINESS_G2_GATE stuck at IN_PROGRESS after Formal.
- **Fix:** Move recomputeG2Gate() after all machine key upserts in formal (and all) modes.
- **Prevention:** Formal script step 5 must end with G2_GATE PASS in registry before gate validator.
- **Files:** scripts/dev/sync-production-readiness-g2-matrix.cjs

## LL-G2-002 · Fly env probe KEY=value format

- **Category:** runtime_probe
- **Issue:** g2-prod-probe.sh emitted bare values; production runtime identity guard failed on Fly layer parse.
- **Fix:** Probe outputs deployment_profile=production style KEY=value lines.
- **Prevention:** Re-run run-production-runtime-identity-guard.sh after any prod probe change.
- **Files:** scripts/dev/lib/g2-prod-probe.sh

## LL-G2-003 · Verification COMPLETE ≠ G2 Gate PASS

- **Category:** release_train_semantics
- **Issue:** validate-g2-reality-verification.cjs initially set TT_PRODUCTION_READINESS_G2_GATE: PASS on verification alone.
- **Fix:** Verification sets TT_WAVE2_FORMAL_ACCEPTANCE: READY and G2_GATE: IN_PROGRESS; PASS only after Formal + gate validator.
- **Prevention:** Never conflate Reality Verification, Formal Acceptance, and Gate PASS in machine keys.
- **Files:** scripts/dev/validate-g2-reality-verification.cjs, scripts/dev/sync-production-readiness-g2-matrix.cjs

## LL-G2-004 · CLOSED gaps require closed_evidence paths

- **Category:** matrix_evidence
- **Issue:** Matrix gaps marked CLOSED without repo evidence paths caused integrity audit and re-validate drift.
- **Fix:** upsertClosedEvidence() in sync script; integrity audit enforces CLOSED ↔ evidence ↔ signoff.
- **Prevention:** Run evidence integrity audit before every Formal Acceptance.
- **Files:** scripts/dev/sync-production-readiness-g2-matrix.cjs, scripts/dev/lib/evidence-integrity-audit.cjs

## LL-G2-005 · G2 closed without new platform capabilities

- **Category:** platform_freeze
- **Issue:** Temptation to add Registry/Guard layers during hardening.
- **Fix:** Platform frozen; adoption migrations + release train scripts only; Architecture Review required for new surfaces.
- **Prevention:** G3 work limited to production go-live domains only.
- **Files:** registry/release-train-reality-verification.v1.json

