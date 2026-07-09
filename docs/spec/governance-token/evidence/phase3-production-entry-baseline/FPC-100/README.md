# FPC-100 Evidence Root

**Purpose:** Rolling evidence for Full Production Certification 100% batches.  
**Checklist SSOT:** [`../FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md`](../FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md)  
**Machine registry:** [`../../../../registry/full-production-certification-checklist.v1.yaml`](../../../../registry/full-production-certification-checklist.v1.yaml)  
**Local anchor:** `e9df0a73`

## Status

| Field | Value |
|-------|-------|
| Mode | PLAN ONLY — batches **NOT STARTED** |
| PER Round 1 | EXIT ✅ |
| Local freeze | ACTIVE |

## Directory layout (created per batch)

```
FPC-100/
├── B00-anchor/
├── B01-public-surface/
├── …
├── FPC-100-BATCH-Bxx-LATEST.json   (rollup copies or symlinks by convention)
├── FPC-100-REGISTRY-LATEST.json
└── FPC-100-REGISTRY-LATEST.md
```

## Naming

See checklist §3 · registry `evidence_naming`.
