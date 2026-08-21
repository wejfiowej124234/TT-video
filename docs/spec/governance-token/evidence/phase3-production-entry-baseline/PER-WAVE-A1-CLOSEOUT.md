# PER Wave A-1 Closeout

**Batch:** Wave A-1 (P0 contamination + footer IA)  
**Stamp:** `20260709T143500Z`  
**Gate:** `bash scripts/gates/check-production-ui-hygiene-gate.sh` → **PASS**

---

## Scope (authorized batch only)

| ID | Fix |
|----|-----|
| **PER-R1-CI-03** / CI-04 | `publicChromeHygiene.ts` — seed/test email + nickname → generic chrome label unless `NEXT_PUBLIC_TRAVELTRUST_ALLOW_TEST_PERSONA_CHROME=1` |
| **PER-R1-CI-04** / CI-05 | `allowChainOffMockPayUi()` — **opt-in only all envs**; mock-swap `data-*` only when flag on |
| **PER-R1-CI-02** | `LandingFooter` — removed FeeRouter operator links; consumer **信任与治理** column (`/trust` · `/governance`) |

**Not in this batch (Wave A-2 / B):** CI-09 间距调试 · CI-12 · CI-10 · VP-06

---

## Files touched

- `frontend/lib/publicChromeHygiene.ts` (+ test)
- `frontend/lib/travelTrustUiGuards.ts` (+ test)
- `frontend/components/header/HeaderUserMenu.tsx`
- `frontend/components/landing/LandingFooter.tsx` (+ test)
- `frontend/components/traveltrust/cinematic/TravelTrustStablecoinGateway.tsx`
- `frontend/locales/zh.ts` · `en.ts` (footer keys)
- `scripts/gates/check-production-ui-hygiene-gate.sh`

---

## Local engineering flags (explicit opt-in)

| Flag | Default | Purpose |
|------|---------|---------|
| `NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI` | unset / `0` | Mock TTG swap + mock pay UI |
| `NEXT_PUBLIC_TRAVELTRUST_ALLOW_TEST_PERSONA_CHROME` | unset | Show seed nicknames in header |

Set `=1` in `.env.local` only when debugging chain-off / test accounts.

---

## Verification

```bash
bash scripts/gates/check-production-ui-hygiene-gate.sh   # exit 0
```

**Manual spot-check (recommended before Wave B):**

- Log in as `tourist@test.com` → header shows **用户**, not **测试游客**
- `/` footer → no **费路由自检** / **费路由（治理）**
- `/traveltrust` → no **Mock swap** button without mock flag

---

## Next batch (frozen order)

```
Wave B: CI-12 + copy/IA backlog
Wave C: CI-10 + VP-06 evidence
PER Recheck → Commit → Staging one-shot
```

**Honest boundary:** Wave A-1 **≠** PER exit **≠** Production GO.
