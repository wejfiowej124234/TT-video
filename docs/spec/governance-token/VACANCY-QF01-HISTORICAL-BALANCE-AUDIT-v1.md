# Vacancy Q-F01 Historical Balance Audit v1

**Audit ID:** `VACANCY_QF01_HISTORICAL_BALANCE_AUDIT_V1`  
**Sprint:** W6.5-B · read-only · no chain writes  
**Parent:** [W6.5 Sign-off](./TRAVELTRUST-WEB3-RUNTIME-ACTIVATION-SIGNOFF-v1.md)  
**Machine SSOT:** [registry/vacancy-runtime-migration-inventory.v1.yaml](../../../registry/vacancy-runtime-migration-inventory.v1.yaml)  
**Gate:** `bash scripts/gates/check-vacancy-legacy-balance-audit-gate.sh`

**Audited:** 2026-07-09 UTC · Sepolia `11155111` · DE jurisdiction  
**RPC:** `https://ethereum-sepolia-rpc.publicnode.com` (read-only `cast call`)

---

## Executive summary

| Dimension | Finding |
|-----------|---------|
| **Token balances** | Unallocated **0.495 USDC** · Steward **0** · Ledger **0** |
| **Ledger epochs** | `latestEpochId = 1` · status **SPLIT_COMPLETED** · no open/pending epoch |
| **Claims / steward** | No active steward · no steward-path balance · `totalReleased = 0` |
| **Runtime** | Q-F01 — `vacancyLedger()` / `vacancyState()` **revert** (expected) |
| **Migration case** | **Case B (token migration)** — not pure Case A |

```
VACANCY_LEGACY_BALANCE_AUDIT_GATE: PASS
W6.5 Owner Sign-off §B.3: READY TO FILL (facts established)
```

**Critical insight:** Token balance alone would suggest migration, but **ledger + epoch record confirm no unfinished settlement**. The **0.495 USDC** on Unallocated matches epoch 1 split accounting — migration is **asset transfer**, not epoch reopen.

---

## A. Legacy runtime

### A.1 CountryPoolNetProfitLedger

| Field | Value |
|-------|-------|
| Contract | `CountryPoolNetProfitLedger` |
| Address | `0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa` |
| Runtime | **Q-F01** |
| Owner | Legacy Timelock `0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f` |
| Status | **LEGACY_READ_ONLY** |
| `version()` | `country_pool_net_profit_ledger_v1` |
| Wired steward vault | `0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb` |
| Wired unallocated vault | `0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0` |
| Settlement token | `0x241948bE49a778490c8A4Ae8D98b7537fE001f63` (6 decimals) |

### A.2 StewardPathVault

| Field | Value |
|-------|-------|
| Address | `0x6B3391c0b6297A5866c0bB7AD06dA99E08F0a3fb` |
| Runtime | Q-F01 |
| Owner | Legacy Timelock `0x0359d4fB…` |
| Status | LEGACY_READ_ONLY |

### A.3 UnallocatedStewardPathVault

| Field | Value |
|-------|-------|
| Address | `0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0` |
| Runtime | Q-F01 (`vacancyLedger()` reverts) |
| Owner | Legacy Timelock `0x0359d4fB…` |
| Status | LEGACY_READ_ONLY |

### A.4 Target runtime (W7 · not deployed)

| Field | Value |
|-------|-------|
| Stack | **Vacancy V1** |
| Recommended owner | V2 Timelock `0x904a6c4c6aab698afbf08ec6151d317c393520cc` |
| Addresses | **TBD W7** (triplet atomic deploy) |

---

## B. Balance snapshot (three layers)

### B.1 Token balance (`balanceOf`)

| Contract | Token | Raw (6 dec) | Human | W7 action |
|----------|-------|-------------|-------|-----------|
| UnallocatedStewardPathVault | USDC track | **495000** | **0.495000 USDC** | **Timelock transfer** to new vault |
| StewardPathVault | USDC track | 0 | 0 USDC | Direct switch (no asset) |
| CountryPoolNetProfitLedger | USDC track | 0 | 0 USDC | Accounting only |

### B.2 Ledger accounting (on-chain views)

| Field | Value | Interpretation |
|-------|-------|----------------|
| `latestEpochId` | **1** | One closed settlement cycle |
| `epochStatus(1)` | **4** = `SPLIT_COMPLETED` | No open epoch |
| `settlementPaused` | `false` | Not paused |
| `carriedLoss` | 0 | No carried loss |
| `epochNetProfitPrime(1)` | 1100000 | **1.100000 USDC** net profit split |
| Split steward / unalloc / global | 0 / **495000** / 605000 | Matches vault balances |
| `globalTreasury()` | `0x904a6c4c…` | Already V2 Timelock (prior cutover) |
| `vacancyState()` | **revert** | Q-F01 — no V1 view |
| `stewardActivationEpochId()` | **revert** | Q-F01 — no V1 view |
| `activeSteward.steward` | `0x0` | No active steward |
| Pending steward claim | — | **None** (`steward totalReceived = 0`) |

**Epoch status enum:** `NONE=0` · `OPEN=1` · `NO_SPLIT=2` · `SPLIT_PENDING=3` · `SPLIT_COMPLETED=4`

### B.3 Vault counters (Q-F01 legacy fields)

| Vault | `totalReceived` | `totalReleased` | Notes |
|-------|-----------------|-----------------|-------|
| Unallocated | 495000 | 0 | Matches token balance |
| StewardPath | 0 | — | Empty |

### B.4 Event history alignment

| Check | Result |
|-------|--------|
| Split accounting ↔ Unallocated token balance | **Aligned** (495000) |
| Open / pending epoch events | **None** (status SPLIT_COMPLETED) |
| Full `eth_getLogs` scan | **Deferred W7** (public RPC 50-block limit) |
| Vacancy V1 indexer events on Q-F01 | Expected empty or legacy-only — verify ops console at W7 |

**Discipline validated:** Inspecting **token + ledger + counters together** avoids false Case A (token-only check would miss epoch state; here epoch is clean but token non-zero).

---

## C. Migration decision

### Case A — Direct switch (deploy + registry, no asset migration)

**Criteria:**

- All vault token balances = 0  
- No open / pending epoch  
- No pending claims  

**Result:** � **Not eligible**

**Blocker:** Unallocated holds **0.495 USDC**.

### Case B — Governance migration (token transfer required)

**Required:**

- Timelock-governed transfer of **495000** token units from legacy Unallocated → new Unallocated V1  
- Post-transfer balance reconcile (old = 0, new = 0.495 USDC)  
- Accounting note in migration runbook (epoch 1 historical — no ledger state import)

**Not required (simplifies B):**

- No OPEN / SPLIT_PENDING epoch  
- No steward-path balance  
- No active steward / pending release  
- No `totalReleased` on unallocated  

### Recommended W7 sequence (updated with token step)

```
① Deploy Vacancy V1 triplet (owner = V2 Timelock)
        ↓
② Probe 4 selectors PASS on new addresses
        ↓
③ Initialize / wire vaults + globalTreasury
        ↓
④ Legacy Timelock: transfer 0.495 USDC old Unallocated → new Unallocated
        ↓
⑤ Verify balances (old unalloc = 0, new unalloc = 495000)
        ↓
⑥ Registry + jurisdiction JSON + env switch
        ↓
⑦ Indexer + live reconcile PASS
```

**Legacy triplet:** retain as `LEGACY_READ_ONLY` in registry (do not delete).

---

## D. Registry / owner relationship

```
Legacy (Q-F01)                         Target (Vacancy V1)
─────────────────                      ───────────────────
Owner: Legacy Timelock 0x0359…    →    Owner: V2 Timelock 0x904a…
Ledger 0x270456…                       Ledger TBD
Unalloc 0xAbE36… (0.495 USDC)    →    Unalloc TBD (receive transfer)
Steward 0x6B339… (0 USDC)        →    Steward TBD
```

**Asset migration executor:** Legacy Timelock (current Unallocated owner) — **not EOA**.

---

## E. VACANCY_LEGACY_BALANCE_AUDIT_GATE

| # | Condition | Status |
|---|-----------|--------|
| 1 | Three-contract token balances confirmed | ✅ |
| 2 | Epoch state confirmed | ✅ SPLIT_COMPLETED · no open epoch |
| 3 | Claim / release state confirmed | ✅ no pending steward claim |
| 4 | Event / accounting alignment | ✅ split ↔ balance; full logs deferred |
| 5 | Migration path confirmed | ✅ **Case B token migration** |

```
VACANCY_LEGACY_BALANCE_AUDIT_GATE: PASS
```

---

## F. W6.5 sign-off impact

| Sign-off item | Fill value |
|---------------|------------|
| §B.3 Balance audit completed | ✅ 2026-07-09 |
| §B.3 Migration path | ☐ Simple switch · **☑ Governance transfer + registry switch** |
| Unallocated balance | **0.495000 USDC** |
| Steward balance | **0** |

**W6.5 OWNER SIGNOFF:** **READY** (§B.3 facts filled — pending Owner signature on full package)

---

## G. W7 path (after sign-off)

```
W6.5-B Balance Audit PASS
        ↓
W6.5 Owner Sign-off SIGNED
        ↓
W7 Dry Run (fork / drill)
        ↓
WEB3_RUNTIME_ACTIVATION_GATE
        ↓
W7 Execution
```

---

## Appendix · Read-only commands (rerun)

```bash
export CHAIN_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
bash scripts/gates/check-vacancy-legacy-balance-audit-gate.sh
```

Manual spot checks:

```bash
cast call 0x241948bE49a778490c8A4Ae8D98b7537fE001f63 \
  "balanceOf(address)(uint256)" 0xAbE36f8eF43D544b9D0e1c0A5F9638dC37Ed33D0 \
  --rpc-url "$CHAIN_RPC_URL"

cast call 0x2704566A6657DcbEEBB71e43cEca381f16E1a8Aa \
  "epochStatus(uint256)(uint8)" 1 --rpc-url "$CHAIN_RPC_URL"
```

Expected: balance `495000` · epoch status `4`.
