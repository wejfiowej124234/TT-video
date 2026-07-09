# Escrow Settlement Authorization — Cross-Validation Matrix

**Recorded:** 2026-07-08T10:30:21.466Z

| Layer | Check | Expected | Actual | PASS |
|-------|-------|----------|--------|------|
| Contract | deposit caller | traveler only | restricted | ✅ |
| Contract | refund caller | traveler only | restricted | ✅ |
| Contract | release caller | permissionless AFTER bilateral complete (target) OR restricted (legacy) | public_anyone | ❌ |
| Contract | completion flags on-chain | travelerConfirmed + guideConfirmed OR status gate | absent | ❌ |
| Contract | release requires business complete | status/service gate beyond Funded | no | ❌ |
| API/DB | confirm-completion bilateral | both parties confirm before Completed | single-party immediate Completed | ❌ |
| API/DB | completion_* DB fields | completion_tourist_confirmed + completion_guide_confirmed | absent | ❌ |
| API/DB | Escrowed→Completed transition | after bilateral service confirm | allowed in one API call | ❌ |
| API/DB | pre-pay bilateral (itinerary) | confirm-bilateral fields | missing | ❌ |
| Frontend | release gate | after bilateral SERVICE complete (target) | after rating bilateral | ❌ |
| Frontend | trip completion bilateral UX | waiting for other party | absent | ❌ |
| Frontend | confirm completion action | per-party confirm trip done | missing | ❌ |
| Docs | bilateral service complete in 53/01 | documented | yes | ✅ |
| Docs | release separate from completion confirm | documented | yes | ✅ |
| Registry/MasterMap | Escrow module M10 | present | yes | ✅ |
