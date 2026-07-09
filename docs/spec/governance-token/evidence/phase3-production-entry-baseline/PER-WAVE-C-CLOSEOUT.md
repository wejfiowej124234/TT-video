# PER Wave C Closeout

**Batch:** Wave C (Catalog Data Governance · Escrow Transaction Evidence)  
**Stamp:** `20260709T152200Z`  
**Phase:** ① local only (not ② staging · not ③ Production GO)

---

## Scope (authorized batch only)

| ID | Fix / evidence |
|----|----------------|
| **PER-R1-CI-10** | API catalog projection — exclude trust-gate E2E fixtures (`f0e0b101-*`), dev bios, test-account emails from **public `GET /api/v1/guides` list** (detail by id unchanged for GD/P06 deep links) |
| **PER-R1-VP-06** | Escrow happy path evidenced — buyer + provider bilateral service completion · mock-pay sandbox · production mock-pay UI gate |

**Not in this batch:** Wave A-2 **CI-09** · VP-01/02/05 · PER spot-check · commit · staging deploy

**Wave A-2 (CI-09):** see `PER-WAVE-A2-CLOSEOUT.md` — closed after Wave C.

---

## CI-10 · Root cause & layer

**Before:** 15 Hangzhou rows on public list (12× `f0e0b101-*` trust-gate + multi-demo + 1 canonical).  
**Cause:** Different `user_id` per fixture → `dedupe_guides_latest_per_user` ineffective; list filter did not exclude DDG-blocked fixtures when `data_origin=production`.  
**Fix layer:** **API list projection** (`should_exclude_guide_from_public_list`) — not frontend-only filter.

**After parity:**

| Layer | Hangzhou count | trust-gate on list |
|-------|----------------|-------------------|
| API `GET /guides?city=Hangzhou` | **1** | **0** |
| UI projection (= API list) | **1** | **0** |
| Duplicate display groups | **0** | — |

Evidence: `PER-WAVE-C-MARKET-GUIDE-PARITY-LATEST.json` — counts from **live `GET /api/v1/guides`** on `:8080` (not frontend-only stats).

**PER Round 2 carry-forward:** extend parity artifact to **DB count → API count → UI count** (Round 1 used API ↔ UI projection; DB row audit deferred).

---

## VP-06 · Escrow evidence

**Corridor A (itinerary-first):** `smoke-web3-itinerary-full-chain-local.sh` — create → publish → bind → reassign  
**Corridor B (Chain B seed):** `smoke-seed-tourist-guide-transaction-local.sh` — updated for **bilateral** `confirm-completion`

| Perspective | Steps | Terminal |
|-------------|-------|----------|
| Buyer (`tourist@test.com`) | create → mock-pay → confirm-completion → review | `completed` |
| Provider (`guide@test.com`) | accept → confirm-completion | `service_completion_pending` → `completed` |

Evidence: `PER-WAVE-C-ESCROW-EVIDENCE-LATEST.json` · sample order `cf0944e4-aa85-40ef-993b-f94581ef9233`

**PER Round 2 carry-forward (non-blocking):** cancelled · dispute · timeout · release rollback paths — enhancement, not Round 1 exit gate.

---

## Operational note (non-blocking)

During Wave C, `:8080` API was rebuilt (`cargo build -p traveltrust-api`) and recycled. Background task ended **exit 127** = **external process termination**, not build failure. Post-recycle: `/health` **200** · `/api/v1/public/roadmap` **200** — Public API normal.

---

## Files touched

- `crates/api/src/chain_off/market_public_surface.rs`
- `crates/api/src/chain_off/guides.rs`
- `crates/api/src/chain_off/trust_gate_e2e_seed/prefix.rs` · `mod.rs` · `prefix_gate_tests.rs`
- `scripts/dev/run-market-guide-catalog-parity.cjs` · `run-market-guide-catalog-parity.sh`
- `scripts/dev/record-per-wave-c-vp06-escrow-evidence.sh`
- `scripts/dev/smoke-seed-tourist-guide-transaction-local.sh` (bilateral completion)

---

## Verification

```bash
bash scripts/dev/run-market-guide-catalog-parity.sh
# TT_MARKET_GUIDE_CATALOG_PARITY: PASS

bash scripts/dev/record-per-wave-c-vp06-escrow-evidence.sh
# TT_PER_WAVE_C_VP06_EVIDENCE: PASS
```

---

## Remaining PER Round 1

All confirmed CI items **CLOSED** (see `PER-WAVE-A2-CLOSEOUT.md`).

**Exit sequence (locked · single spot-check):**

```
CI-09 → Wave A-2 closeout → Hygiene gate → PER Spot Check (final)
  → Commit SSOT → One-shot Staging deploy → Environment diff → PER Round 1 exit
```

Do **not** run PER Spot Check before Wave A-2 closeout (avoids duplicate audit artifacts). **A-2 closed** — proceed to Final Spot Check.
