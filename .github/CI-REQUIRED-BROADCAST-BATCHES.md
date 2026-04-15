# Broadcast batch CI jobs (branch protection)

After each batch PR merges and the workflow is green, add these **check names** as required status checks on `main` (GitHub: Settings → Branches → protection rule → Require status checks).

| Batch | Required check name (exact) | Workflow job id |
|------|-----------------------------|-----------------|
| 1 | `Broadcast batch 1 blockers` | `broadcast-batch-1-blockers` |
| 2 | `Broadcast batch 2 blockers` | `broadcast-batch-2-blockers` |
| 3 | `Broadcast batch 3 blockers` | `broadcast-batch-3-blockers` |

The display name is the `name:` field on each job in `.github/workflows/build.yml`.
