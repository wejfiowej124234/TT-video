# PER Wave A-2 Closeout

**Batch:** Wave A-2 (Public Surface Hygiene — spacing debug opt-in)  
**Stamp:** `20260709T232500Z`  
**Gate:** `bash scripts/gates/check-production-ui-hygiene-gate.sh` → **PASS**

---

## Scope (authorized batch only)

| ID | Fix |
|----|-----|
| **PER-R1-CI-09** | `/traveltrust` **间距调试** toggle — no longer auto-mounts on `NODE_ENV=development`; **opt-in only** |

**Not in this batch:** PER Final Spot Check · commit · staging · env diff

---

## Fix

**Before:** `shouldMountTravelTrustSpacingDebug()` returned `true` for all Next dev (`127.0.0.1:3012`) → PER walk saw public **间距调试** button.

**After (aligned with Wave A-1 mock-pay / test-persona pattern):**

| Mount condition | Default |
|---------------|---------|
| `?tt_spacing=1` | ✅ when query present |
| `NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG=1` | ❌ unset |
| `NODE_ENV=development` alone | ❌ **removed** |

Deep-link / localStorage behavior unchanged when chrome is mounted.

---

## Files touched

- `frontend/lib/travelTrustUiGuards.ts` · `travelTrustUiGuards.test.ts`
- `frontend/lib/traveltrustSpacingDebug.ts` · `traveltrustSpacingDebug.test.ts`
- `frontend/app/traveltrust/traveltrustNetworkPage.contract.test.ts`
- `frontend/lib/traveltrust/l5/sections-layout.ts` (comment)
- `scripts/gates/check-production-ui-hygiene-gate.sh`

---

## Local engineering flag

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_TRAVELTRUST_ALLOW_TRAVELTRUST_SPACING_DEBUG` | unset | Show spacing debug toggle without query param |

---

## Verification

```bash
bash scripts/gates/check-production-ui-hygiene-gate.sh
# check-production-ui-hygiene-gate: PASS PRODUCTION_UI_HYGIENE_WAVE_A
```

Manual: open `/traveltrust` (no query) → **no**「间距调试」button; add `?tt_spacing=1` → toggle appears.

---

## PER Round 1 — all waves closed

| Wave | Status |
|------|--------|
| A-1 | ✅ |
| B-1 | ✅ |
| B-2 | ✅ |
| C | ✅ |
| **A-2** | ✅ |

**Remaining CI:** none

---

## Exit sequence (locked · single Final Spot Check)

```
Hygiene gate (done) → PER Final Spot Check → Round 1 Exit
  → Commit SSOT → One-shot Staging Deploy → Environment Diff
```

### Final Spot Check matrix (suggested coverage)

| Page | Focus |
|------|-------|
| `/` | Footer · OG · Chrome · Spacing |
| `/traveltrust` | Hero · spacing · SEO · metadata · **no spacing debug** |
| `/market` | Demo data · duplicate guides · empty state |
| `/help` | No engineering jargon |
| `/trust` | No internal spec refs |
| `/governance` | Public hub · no Admin leak |
| `/traveltrust/announcements` | zh/en metadata |

### Environment Diff carry-forward (post-staging)

**Public Surface Parity:** metadata · footer · public copy · guide count · announcement titles · governance public hub.
