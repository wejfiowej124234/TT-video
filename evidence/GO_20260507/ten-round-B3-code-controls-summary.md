# Ten-round · B.3 code-backed `controls_notes` summary (① local)

**Date:** 2026-05-08

**Scope:** `page.tsx` parent directory recursive `*.tsx` **`data-tt-*`** → CSV **`tt:`** (TT-96-20 **B.3** / **E.2.2**).
**Does not claim:** 93/96-20 semantic PASS, Playwright, Tier C, or ②③.

## Per-round counts (`primary_round` from Appendix E CSV)

| Round | Pages | With `data-tt-*` | Shell-only (0 hits) | `data-tt` tokens (sum) |
|-------|------:|-----------------:|----------------------:|-----------------------:|
| **R1** | 13 | 12 | 1 | 20 |
| **R2** | 5 | 5 | 0 | 23 |
| **R3** | 11 | 10 | 1 | 36 |
| **R4** | 21 | 20 | 1 | 36 |
| **R5** | 6 | 5 | 1 | 14 |
| **R6** | 5 | 5 | 0 | 8 |
| **R7** | 35 | 35 | 0 | 35 |
| **R8** | 12 | 12 | 0 | 12 |
| **R9** | 15 | 15 | 0 | 40 |

## Pages with no `data-tt-*` in route dir (listed `tt:shell-only` in CSV)

- `frontend/app/community/me/likes/page.tsx`
- `frontend/app/community/post/[id]/page.tsx`
- `frontend/app/network/page.tsx`
- `frontend/app/orders/[id]/page.tsx`

## Commands (replay)

```bash
# fill from source
bash scripts/tt-96-20-appendix-e-fill-controls-from-source.sh -i … -o … --summary …
# validate + strict code parity
bash scripts/tt-96-20-appendix-e-validate.sh --strict-pass-controls --require-controls-tag --strict-b-axes --require-key-api-signal …
bash scripts/tt-96-20-appendix-e-audit-controls-vs-source.sh … --strict
```

**Repo root:** `D:\TravelTrust`
