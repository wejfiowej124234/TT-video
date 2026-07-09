# Sign-off · Official Catalog Identity Policy (OCIP)

**Stamp:** 20260703T054700Z  
**SSOT:** registry/official-catalog-identity-policy.v1.yaml

## Approved model

```text
Official Dataset → Canonical Identity (immutable) → Mutable Content → Public Catalog
```

- **UUID / chain_id / manifest slug** — assigned once in `state.json`, never replaced by re-INSERT
- **Operations** — PATCH content on same UUID (price, bio, avatar, tags, video)
- **Downstream** — Campaign · Orders · Reviews reference stable IDs

## Staging (20260703T044855Z state)

- Canonical entities mapped: **50**
- UUID blocking drift: **0**
- Campaign item ref gaps: **9** (enhancement · first-deploy slug refs; identities stable)

**APPROVED**
