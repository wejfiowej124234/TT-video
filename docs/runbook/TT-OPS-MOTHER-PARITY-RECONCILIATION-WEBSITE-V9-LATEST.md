# OPS Mother Parity · Frontend Mother Consistency (living)

**Mother:** Production OPS `OPS-2026.08.20-v9` · SHA `3e356617a498b0faac42e4ae457343d36294a770`  
**`TT_PRODUCTION_GO`:** NO_GO (unchanged)

## Git / Release 真源（写死）

以后 frontend 母版一致性 **只认** OPS `3e356617…` 的 **真实 tree diff**：

| 规则 | 要求 |
|------|------|
| Shared-path | `byte_diff = 0`（相对 OPS） |
| HEAD-only 14 | **永久** `EXCLUDED_FROM_RELEASE` |
| V9 P0+P1 | **仅**原子 allowlist manifest 作为批准叠加层 |
| 历史「37」 | **RECONCILIATION_ONLY** · **不是** Git/Release 真源 |

**禁止**继续追溯或人为凑齐「37 条」。

### Permanent EXCLUDED_FROM_RELEASE（14）

- `frontend/app/assurance/**`（3）
- `frontend/app/brand/**`（3）
- `frontend/app/contact/**`（3）
- `frontend/app/protocol/**`（4）
- `frontend/components/traveltrust/cinematic/TravelTrustListingDocPage.tsx`（1）

### Production / Staging Candidate composition

```
Release Candidate = OPS Mother (3e356617)
                  + V9 Approved Allowlist Patch (atomic manifest only)
                  − HEAD-only 14 (EXCLUDED_FROM_RELEASE)
```

Machine:

- Allowlist: `evidence/GO_ttg_v9_audit/V9_WEBSITE_ALLOWLIST_ATOMIC_COMMIT_MANIFEST.json` · commit `04f970580…`
- Historical reconciliation archive (not truth): `evidence/GO_ttg_v9_audit/OPS_MOTHER_PARITY_RECONCILIATION.json`
- Demotion stamp: `evidence/GO_ttg_v9_audit/HISTORICAL_37_FRONTEND_DIFF_RECONCILIATION_ONLY.json`

## Historical note（降级）

先前「23 same-path + 14 HEAD-only = 37」仅为对账清单统计；后台 tip 探针无法复现为单一 tree 的 37 条真差。已正式降级，**不得**再作 Release / Gate / Identity 依据。

## Forbidden

Staging hotfix · Production deploy · 修改现有 OPS / V9 UI·UX 母版 · `/meta`/Indexer Production 切针 · Mainnet Phase2 · `TT_PRODUCTION_GO` flip
