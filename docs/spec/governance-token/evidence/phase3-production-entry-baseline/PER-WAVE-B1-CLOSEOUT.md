# PER Wave B-1 Closeout

**Batch:** Wave B-1 (Public Copy & IA — trust surface language)  
**Stamp:** `20260709T224500Z`  
**Gate:** `bash scripts/gates/check-public-surface-audit-gate.sh` → **PASS**

---

## Scope (authorized batch only)

| ID | Fix |
|----|-----|
| **PER-R1-CI-12** | `market_empty_catalog_note` — removed ① / local-dev lifecycle language → user-facing empty-state copy |
| **PER-R1-CI-16** | Help FAQ + intro — removed **08-4** · **GET /meta** · **Runbook** · env var names from consumer `/help` copy |
| **PER-R1-CI-15** | `/traveltrust/announcements` — `generateMetadata` + `Accept-Language` (default **zh**); title **项目动态与公告** |

**Not in this batch:** CI-10 duplicate catalog · VP-06 Escrow evidence · CI-05/06/07/08/11/13/14 · Wave A-2 CI-09

---

## Files touched

- `frontend/locales/zh.ts` · `en.ts` (help + market footnote keys)
- `frontend/app/traveltrust/announcements/page.tsx`
- `frontend/app/help/helpPage.i18n.contract.test.ts`

---

## Verification

```bash
bash scripts/gates/check-public-surface-audit-gate.sh   # exit 0
cd frontend && npx vitest run app/help/helpPage.i18n.contract.test.ts --reporter=dot
```

**Manual spot-check (recommended before Wave B-2):**

- `/market` empty/guides footnote — no **① 本地已过滤**
- `/help` — FAQ readable without **GET /meta** / **08-4**
- `/traveltrust/announcements` — document title **项目动态与公告** (zh default)

---

## Blockers

PER Round 1 confirmed issues: **12 → 9** (after A-1 + B-1)

---

## Next batch (frozen order)

```
Wave B-2: remaining copy/IA (CI-05/06/07/08/11/13/14)
Wave A-2: CI-09 spacing debug
Wave C: CI-10 + VP-06
PER Recheck → Commit → Staging one-shot
```

**Honest boundary:** Wave B-1 **≠** PER exit **≠** Production GO.
