# Owner Sign-off Package — Mainnet Deployment

**Status:** PENDING — sign only after Package generation post-Freeze  
**Does not authorize broadcast by itself**

---

## Package under review

| Field | Value |
|-------|-------|
| Package stamp | _fill after generate_ |
| Git commit | _fill from MANIFEST/manifest.json_ |
| Web3 Freeze stamp | _fill from freeze manifest_ |
| Phase ② Exit Review | _PHASE2_EXIT_REVIEW_PASS_ |

---

## Owner confirmations

### A. Package integrity

- [ ] Reviewed `MANIFEST/manifest.json` (single SSOT for this deploy)
- [ ] Registry snapshot matches frozen Web3 Freeze manifest
- [ ] Bytecode hashes in `contract-bytecode-hashes.json` match R-01 audit scope
- [ ] Wave matrix + constructor parameters reviewed
- [ ] Rollback plan (`rollback/MAINNET-ROLLBACK-PREP-V1.md`) accepted
- [ ] Emergency recovery plan accepted

### B. Governance & compliance

- [ ] R-01 third-party audit PASS on frozen bytecode
- [ ] Shadow Launch GO (`evidence/mainnet_shadow_launch/`)
- [ ] G6 no-rollback ack signed (`evidence/mainnet_launch_gate/G6_no_rollback_ack.md`)
- [ ] Escrow V1 mainnet forbidden policy acknowledged (V2 only)
- [ ] PRODUCTION_SCOPE_MAINNET selected

### C. Authorization

- [ ] Authorize Wave 1 broadcast (`TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1`)
- [ ] Dual-control: engineering lead + Owner present for broadcast window

---

## Signatures

| Role | Name | Signature | Date (UTC) |
|------|------|-----------|------------|
| Owner | | | |
| Engineering lead | | | |
| Security reviewer | | | |

---

## After signoff

1. Save signed copy as `OWNER-SIGNOFF-SIGNED.md` in package `owner-signoff/`
2. Record in Production Readiness Book
3. Proceed to Wave 1 per `runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md`

**Unsigned prep copy:** `OWNER-SIGNOFF-PACKAGE.md` (this file)
