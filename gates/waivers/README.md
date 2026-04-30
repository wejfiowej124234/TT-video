# 96-15 waiver (optional)

To **skip** the `tier-96-15` orchestration job on **Production gate** (emergency only):

1. Add **`gates/waivers/96-15.waiver.json`** (committed on the same branch as the PR) with:
   - `component`: must be `"tier_96_15"`
   - `expires_utc`: ISO-8601 UTC, **must be in the future** when the workflow runs
   - `ticket`: URL or issue id (string)
   - `reason`: short string

2. After `expires_utc`, the waiver is ignored and **96-15 runs again**.

3. **Governance**: waivers should require **CODEOWNERS** or second-party review on `gates/waivers/` (configure in GitHub).

Do **not** commit long-lived waivers to `main`.

Example (copy to `96-15.waiver.json` and edit):

```json
{
  "component": "tier_96_15",
  "expires_utc": "2026-05-01T00:00:00Z",
  "ticket": "https://example.invalid/TICKET-1",
  "reason": "Hotfix: 96-15 runner outage; Tier B/C re-run scheduled within 24h"
}
```
