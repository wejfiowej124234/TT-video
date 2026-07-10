# GO_local_traveltrust_ph1 · ① local evidence index

PH-1 TravelTrust cinematic homepage corridor — **not** Production GO.

## Gates

```bash
bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_E2E=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_E2E_FULL=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_VISUAL=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_LIGHTHOUSE=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
TRAVELTRUST_PH1_VERIFY_SCREENSHOTS=1 bash scripts/gates/traveltrust-ph1-homepage-local.sh
```

Default path runs vitest contract index only (fast ①). Full e2e/visual/lighthouse require env flags + `:3012` / `:8080`.

## Human verify

See `human-verify-checklist.md` (TT-PH1-150～158).
