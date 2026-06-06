# Provider register UI freeze (phase ①)

**Date:** 2026-05-26  
**Scope:** `/auth/register?role=provider` (step 1) · `/provider/register` (step 2) · `/me/onboarding?role=provider` (step 3 — **Console L5** progress via **`MeOnboardingConsoleProgress`**; see [ME-ONBOARDING-CONSOLE-L5-FREEZE](../GO_local_auth_l5/ME-ONBOARDING-CONSOLE-L5-FREEZE.md))

## Frozen surfaces

- L5 shell: `TT_PROVIDER_REGISTER_L5` · `AuthL5PageBackdrop` · `AuthL5Card` (same family as auth L5)
- `ProviderOnboardingProgress` on register (step 1), provider register (step 2)
- Gate panels on `/provider/register`: pending / rejected / already-provider
- Submit success: inline **`ProviderRegisterDonePanel`** in **`ProviderRegisterPageMain.tsx`** (step-3 progress + link to onboarding)

## Code-aligned note (2026-05-28 · ①)

- **Onboarding step-3 progress chrome:** **`MeOnboardingConsoleProgress`** in **`MeOnboardingPageMain.tsx`** (Console L5 · **非** Auth 暗条). Full freeze: [ME-ONBOARDING-CONSOLE-L5-FREEZE](../GO_local_auth_l5/ME-ONBOARDING-CONSOLE-L5-FREEZE.md).
- **Data/API/onboarding/market gates** are **not** frozen — see [README.md](../../../app/provider/register/README.md) §3–§7.

## Allowed changes (without unfreezing)

- Data/API wiring, i18n copy, validation rules, admin review tools
- `merchantPublishEligibility` and market publish server gates (not page layout)
- **`GET /me` / role-confirm memory sync** backend behavior (does not alter frozen L5 layout)

## Local verification

```bash
cargo check -p traveltrust-api
cd frontend && npx vitest run lib/provider/providerRegisterValidation.test.ts lib/provider/providerRegisterL5.contract.test.ts
bash scripts/dev/smoke-provider-onboarding-local.sh   # ① API full chain (optional)
```

See [README.md](../../../app/provider/register/README.md) for PG + env checklist and code SSOT.
