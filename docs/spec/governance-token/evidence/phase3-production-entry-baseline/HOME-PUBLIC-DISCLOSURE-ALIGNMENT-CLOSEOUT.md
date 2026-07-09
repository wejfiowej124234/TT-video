# Home Public Disclosure Alignment Closeout

**Sync ID:** `HOME_PUBLIC_DISCLOSURE_ALIGNMENT`  
**Date:** 2026-07-09  
**Verdict:** `HOME_PUBLIC_DISCLOSURE_ALIGNED: PASS`  
**Parent:** P3-01..P3-04 · Phase③ Entry

---

## Drift class closed

**Runtime State ↔ Public Communication Drift (Home / Pulse / Roadmap)**

| Before | After |
|--------|-------|
| Pulse `upcoming` + future release dates | Pulse `live` + `effectiveAt` aligned to runtime |
|「Sepolia 测试网预览 · Beta」|「Sepolia ② · Web3 Runtime ACTIVE」|
| Phase 1/2/3 像待上线 | Phase 1/2/3 LIVE on Sepolia · Phase③ Entry pinned |
| 无 Phase③ Entry 表达 | `phase3-entry-mainnet-prep` 置顶公告 |

---

## SSOT chain

```
registry/traveltrust-public-disclosure.v1.yaml
        ↓
frontend/lib/traveltrustNetworkAnnouncements.ts
        ↓
Pulse ticker · Announcements archive · Roadmap
        ↓
/governance/params (Web3 Runtime strip · 技术细节)
```

---

## UI / content changes (① · i18n + data only)

| Surface | Change |
|---------|--------|
| Pulse catalog | 4 items · all `live` · Phase③ Entry pinned |
| Status badge | `sepolia_active` replaces `sepolia_preview` |
| Locales en/zh | Deploy phase copy · network label · phase3 entry keys |
| Roadmap TTG milestone | `planned` → `in_progress` |
| Hero | No structural change — Web3 detail stays in Pulse / Params |

---

## Verification

```bash
bash scripts/gates/check-home-public-disclosure-alignment-gate.sh
```

| Test | Result |
|------|--------|
| `traveltrustNetworkAnnouncements.test.ts` | PASS |
| `homePublicDisclosureAlignment.contract.test.ts` | PASS |
| `homeMarketing.contract.test.ts` | PASS |

**Not in scope:** mainnet broadcast · five-main route layout · new Web3 features.

---

## Program alignment

| Internal state | Public copy |
|----------------|-------------|
| Phase②.5 CLOSED | Phase③ Entry announcement |
| Sepolia Runtime ACTIVE | Status badge + network label |
| P3-03 / P3-04 planning | Phase③ Entry detail · not「已上主网」 |
| ABI-002 | DEPLOYMENT_PREPARATION_READY in phase2 step copy |
| Mainnet | Explicitly NOT_STARTED in public text |
