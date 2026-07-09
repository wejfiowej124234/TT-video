# Primary Market · Owner Decision — DEFER for Web3 System Closure

**Status:** **DEFER · ACTIVE**  
**Effective:** 2026-07-08  
**Scope:** `TtgPrimaryMarketV1` on Sepolia · **does not block** `WEB3_SYSTEM_CLOSURE_PASS`

---

## Decision

| Item | State |
|------|--------|
| **On-chain contract** | ✅ Deployed · GovFreeze V2 proxy `0x7af15f98622b9282298ca3070a698ca4a96a4016` |
| **FE route `/primary-market`** | ❌ Not shipped (by design for current MVP) |
| **Web3 Closure blocker** | **No** — M05 marked `DEFER` in Master Map |
| **MVP focus** | Travel → Escrow → USDC → FeeRouter (G3-02 PASS) |

## Rationale

Primary Market is **governance/funding extension (Wave 2)**, not required for:

- Travel payment rail production readiness  
- Governor / Timelock / Treasury lifecycle (Cert #8–12)  
- Region Steward TTG stake (separate from primary sale UI)

## When to revisit

- After Cert #8–12 + RBAC D3 + `WEB3_SYSTEM_CLOSURE_PASS`  
- Owner explicit request to ship `/primary-market`  
- Requires: FE route + `NEXT_PUBLIC_*` PM addresses + human UAT (not Tokenomics change)

## SSOT refs

- Master Map M05: `registry/web3-system-master-map.v1.yaml`  
- Human map §4: `docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md`  
- GovFreeze baseline: `docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md`

---

*Configuration / product boundary doc only · no governance contract changes.*
