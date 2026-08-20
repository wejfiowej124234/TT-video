# Official V9 · Plane Map (www + API under V9)

**Verdict:** PASS · **TT_PRODUCTION_GO:** NO_GO

| Plane | Value | V9 role |
|-------|-------|---------|
| Official www | `3e356617a498b0faac42e4ae457343d36294a770` / 2026-08-20T00:51:57Z | Product Truth |
| Staging www | `3e356617a498b0faac42e4ae457343d36294a770` / 2026-08-20T10:50:46Z | Product identity 1:1 |
| Official API | `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` / chain=1 | Paired under V9 |
| Staging API | `1915ec4da828e0139e90a85cd321415fdb6e53d9` / chain=11155111 | Mapped ED under V9 (sha≠pin) |
| Repo tip/main | `33e7c67ae8989a2e69e15c999e7192ee9ece5f04` | Engineering SSOT |

## Doctrine

- Product pin `3e356617` applies to **www** Official + Staging.
- Official API stays `8df2ab21` / mainnet — paired with V9 www, not rewritten to pin.
- Staging API stays Sepolia Candidate — **mapped under V9**, not collapsed to product pin.
- Staging www build.env must wire to `tt-api-staging` only.

## Gate

```bash
bash scripts/gates/check-official-v9-plane-map.sh
```
