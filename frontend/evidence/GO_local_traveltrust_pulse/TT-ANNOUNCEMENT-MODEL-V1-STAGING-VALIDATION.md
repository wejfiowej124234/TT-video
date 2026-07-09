# TT_ANNOUNCEMENT_MODEL_V1_STAGING_VALIDATION

**Scope:** Pulse announcements + 2026 roadmap · ops model v1 (frozen kind × contentTier)  
**Environment:** Staging · `https://tt-web-staging.fly.dev`  
**Validation date:** 2026-07-09 (UTC+8)  
**Code SSOT:** `lib/traveltrustNetworkAnnouncements.ts` · `lib/traveltrustRoadmap2026.ts` · `lib/traveltrustAnnouncementSchema.ts`

---

## Ops model (frozen)

| Dimension | Values |
|-----------|--------|
| **kind** | product · trust · community · campaign |
| **contentTier** | live · upcoming · roadmap |
| **Roadmap status** | planned · in_progress · completed (manual only) |

**Platform launch anchor (internal target):** `TRAVELTRUST_PLATFORM_LAUNCH_ISO = 2026-07-15`  
**Rule:** `targetAt` / `releaseAt` are display targets — **never** auto-promote tier or roadmap status by calendar.

---

## Checks

| # | Check | Expected | Result |
|---|--------|----------|--------|
| 1 | Pulse count | 5 announcements (China roadmap-only, not in Pulse) | PASS |
| 2 | Trust pin | `trust-escrow-core` sorts first | PASS |
| 3 | Pre-launch tiers | All Pulse items `upcoming` · badge「即将开放 / Upcoming」· no erroneous `live` | PASS |
| 4 | No auto Live | No code path promotes `contentTier` by date | PASS |
| 5 | Release date | All Pulse `releaseAt = 2026-07-15` · no pre-7/15 `effectiveAt` | PASS |
| 6 | CTA · referral | `campaign-referral` → `/me/referrals` | PASS |
| 7 | CTA · governance | `community-governance` → `/governance/proposals` · `learn_more` | PASS |
| 8 | CTA · trust | `trust-escrow-core` → `/trust` | PASS |
| 9 | Roadmap order | web3 → TTG P1–P3 → App → China (last) | PASS |
| 10 | Roadmap · web3 status | `planned` + `targetAt: 2026-07-15` (not in_progress until ops starts execution) | PASS |
| 11 | Roadmap · China | `milestone-china-guides` last · no `targetAt` · TBD label | PASS |
| 12 | Roadmap · App | `targetLabelKey: traveltrust_roadmap_target_year_2026` | PASS |
| 13 | Schema contract | `assertTraveltrustAnnouncementsSchemaContract()` empty | PASS |
| 14 | Schema contract | `assertTraveltrustRoadmap2026SchemaContract()` empty | PASS |
| 15 | Referral copy truth | Growth points · not token claim · `/me/referrals` | PASS |
| 16 | Governance copy truth | Sepolia · Governor vs signal vote disclosed | PASS |

---

## Automated evidence (local · pre-deploy)

```text
npx vitest run lib/traveltrustNetworkAnnouncements.test.ts lib/traveltrustAnnouncementDetailContent.test.ts
→ 17 passed
```

---

## Manual staging smoke (post-deploy)

- [ ] `/traveltrust` — Pulse marquee: 5 items · Trust first · all Upcoming before 2026-07-15 ops flip
- [ ] Open Trust / Referral / Governance modals — CTA routes and copy match table above
- [ ] `/traveltrust#roadmap-2026` — China last · Web3「计划中 / Planned」· target 2026-07-15

---

## Verdict

**PASS** — Announcement system v1 staging validation (automated contract + configured catalog).  
Manual UI checkbox items above to be confirmed in browser after each Pulse deploy.

---

## Post-2026-07-15 ops playbook (manual only)

1. Flip selected Pulse rows `upcoming` → `live` and set `effectiveAt` (remove `releaseAt`).
2. When execution starts, set `milestone-web3-launch.status` → `in_progress`.
3. After evidence, set roadmap milestone → `completed` (never by calendar alone).
