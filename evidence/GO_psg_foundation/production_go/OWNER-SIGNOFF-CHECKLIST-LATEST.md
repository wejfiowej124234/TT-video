# PSG RC Step 5 · Owner Decision · Sign-off Checklist

**Package stamp:** `20260717T110139Z`  
**Freeze:** `RC-FREEZE-20260717T094900Z`  
**TT_PSG_PRODUCTION_CERT:** `PASS` (locked · do not re-run)  
**TT_PRODUCTION_GO (live matrix):** `NO_GO` — **must stay NO_GO until Owner signs + apply script**

## Cite-only evidence (no Gate re-run)

| Lane | Path | Status |
|------|------|--------|
| Freeze | `registry/psg-release-candidate-freeze-LATEST.v1.yaml` | FROZEN |
| Production Cert | `evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json` | PASS · stamp `20260717T104800Z` |
| Step4 Entry | `evidence/GO_psg_foundation/production_entry_review/PSG-RC-PRODUCTION-ENTRY-LATEST.json` | EXIT_READY · blockers=0 |
| PER Clear | `docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/PER-EXIT-BLOCKERS-CLEAR-LATEST.json` | PASS |
| Cap Cert (cite) | `evidence/GO_psg_foundation/capability_cert/PSG-RC-CAPABILITY-CERT-LATEST.json` | PASS |
| Repro (cite) | `evidence/GO_psg_foundation/production_cert/PSG-REPRODUCIBLE-BUILD-LATEST.json` | PASS |
| Env Align (cite) | `evidence/GO_psg_foundation/production_cert/PSG-ENVIRONMENT-ALIGNMENT-LATEST.json` | PASS |
| Ladder deferral | `docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/OWNER-ACCEPTED-MODULE-LADDER-CONFLUENCE.json` | MISSING |

## Checklist (Owner)

- ☑ **OD-01** Confirm freeze baseline RC-FREEZE-20260717T094900Z still FROZEN
- ☑ **OD-02** Confirm TT_PSG_PRODUCTION_CERT=PASS (locked) — do not re-run Production Cert
- ☑ **OD-03** Confirm Step4 EXIT_READY · exit_blockers=[]
- ☑ **OD-04** Confirm PER EXIT_BLOCKERS clear cites same freeze + PASS
- ☑ **OD-05** Confirm admission trio PASS (SSOT · Repro · Env) from locked cert JSON only
- ☑ **OD-06** Confirm destructive suite PASS (no SKIPPED) from locked cert JSON only
- ☑ **OD-07** Confirm Module Ladder Owner Non-blocking deferral on file (or Ladder PASS)
- ☑ **OD-08** Owner attestation: decision GO | NO_GO | GO_WITH_EXCEPTION + name + signed_utc

## Owner attestation (edit JSON package)

In `OWNER-DECISION-PACKAGE-LATEST.json` set:

```json
"owner_attestation": {
  "name": "Sebastian Ward",
  "role": "solo_owner",
  "decision": "GO",
  "signed_utc": "<ISO-8601 UTC>",
  "exceptions": [],
  "notes": null
}
```

Allowed `decision`: `GO` · `NO_GO` · `GO_WITH_EXCEPTION`.

## Atomic GO (only after attestation = GO)

```bash
node scripts/dev/apply-psg-rc-production-go-after-owner-signoff.cjs \
  --package evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json
```

**Forbidden:** re-run Foundation / Alignment / Freeze / Cap Cert / Production Cert to obtain GO.
