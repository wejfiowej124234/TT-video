# TT · TTG V9 — Gov Root ① Local PASS + FeeRouter Bucket Target Audit


> **ACTIVE V9 documentation pointer:** [`TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST`](TT-TTG-V9-DOCUMENTATION-TRUTH-BASELINE-LATEST.md) · Design Lock **DL_R1** · Mainnet `DEPLOYED_PENDING_CUTOVER`.  
> Any R2_FINAL / Remint / sale→P4Cap / globalStakers / Safe-as-V9-admin narrative below = **LEGACY / SUPERSEDED / DO_NOT_USE_AS_ACTIVE_TRUTH** (historical contrast only).

**STATUS:** `V9_GOV_ROOT_LOCAL_PASS_STOP` · **mechanics only** · economic destinations corrected by [Money Flow Reconciliation](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md)  
**Phase:** ① Local only · **FORBIDDEN:** Sepolia · Mainnet · `TT_PRODUCTION_GO` change  
**Parent:** [Governance Root Replacement](TT-TTG-V9-GOVERNANCE-ROOT-REPLACEMENT-LATEST.md)

Evidence: `evidence/GO_ttg_v9_audit/V9_GOV_ROOT_LOCAL_PASS_STOP.json`

---

## 0 · Invariants preserved

| Invariant | Status |
|-----------|--------|
| TTG V9 25T Monetary Invariant | **Unchanged** (not reminted this wave) |
| Five-batch primary market | **Unchanged** |
| Governance Burn | **Unchanged** (binds NEW Timelock at Official deploy) |
| Money Path FeeRouter BPS | **Unchanged** · on-chain `4500 / 3575 / 1100 / 825` |

---

## 1 · FeeRouter Bucket Target Audit (Norm · Registry · Reality)

### On-chain Reality (`chain_id=1` · FeeRouter `0x2aF4…8A72`)

| Leg | BPS | Reality address | Class |
|-----|-----|-----------------|-------|
| countryBucket | 4500 | Safe `0x9649…40e7` | **INTERIM — must exit** |
| globalStakers | 3575 | Safe `0x9649…40e7` | **INTERIM — must exit** |
| globalReserve | 1100 | P4Cap `0xfB90…BbF` | **KEEP Exact Address** |
| globalOps | 825 | P4Cap `0xfB90…BbF` | **KEEP Exact Address** (interim ops→P4Cap OK) |

### Norm / Registry Target

| Leg | Target (83 / Registry) | Mainnet deploy status | Verdict |
|-----|------------------------|-----------------------|---------|
| countryBucket | FTB interim = Safe · Target 83 = RegionVault | **Owner Option I or II** | **I:** P4Cap Exact · **II:** NEW RegionVault deploy · **forbidden** personal EOA |
| globalStakers | FTB interim = Safe · Target = TTG incentive sink | **Owner Option I or II** | **I:** P4Cap Exact · **II:** GlobalStakersFeeVault (optional) · **forbidden** personal EOA |
| globalReserve | P4Cap | **DEPLOYED** | Exact Address `0xfB906ae34521E0BC884AB1a8D0dcf986aBD59BbF` |
| globalOps | P4Cap (living interim) | **DEPLOYED** | Exact Address same P4Cap |

**Forbidden:** Marketing `0xe1e732…` / Treasury `0xF34804…` / Team as FeeRouter sinks.  
**Do not** treat Option II vaults as mandatory solely to remove Safe — see [Money Flow Reconciliation](TT-TTG-V9-MONEY-FLOW-ECONOMIC-TRUTH-RECONCILIATION-LATEST.md).

---

## 2 · ① Local Forge results

| Item | Result |
|------|--------|
| NEW `GovernanceTimelock(admin=SoloOwner, delay=172800)` | PASS |
| KEEP_AND_REWIRE: Treasury owner+spender · EF guardian · SR owner · FeeRouter owner | PASS |
| `setRoutingConfig` → RegionVault + GlobalStakersFeeVault + P4Cap×2 · BPS frozen | PASS |
| Fund-flow `distribute` · Safe / Solo / Guardian EOA balances = 0 | PASS |
| ZERO ACTIVE Safe refs on privilege + fund paths | PASS |
| Command | `forge test --match-contract TtgGovRootReplacementLocalTest --skip '**/ttg-meme-denom/**' --skip '**/ttg-v8/**' --skip '**/ttg-v9/**' --skip 'test/EscrowV2.t.sol'` |
| Suite | **3/3 PASS** |

Artifacts:

- `contracts/src/GlobalStakersFeeVault.sol` (NEW minimal companion)
- `contracts/test/TtgGovRootReplacementLocal.t.sol`

---

## 3 · Stop boundary

```text
V9_GOV_ROOT_LOCAL_PASS_STOP
  → next (later): Sepolia lifecycle + privilege migration
  → NOT this turn: Sepolia / Mainnet / TT_PRODUCTION_GO
```

---

## 中文要点

- FeeRouter **country/stakers 不得填个人 EOA**；Mainnet 需 **NEW 部署 RegionVault + GlobalStakersFeeVault**；reserve/ops **Exact = P4Cap**。  
- ① Forge KEEP_AND_REWIRE + 48h Solo Timelock + 资金流 **PASS** → 停在 **`V9_GOV_ROOT_LOCAL_PASS_STOP`**。  
- 不进 Sepolia/Mainnet；不改 `TT_PRODUCTION_GO`。


---

## Correction (post Money Flow Reconciliation)

RegionVault + GlobalStakersFeeVault as **mandatory** Safe-exit destinations is **withdrawn**.

- **Option I (default interim):** `countryBucket` + `globalStakers` → **P4Cap Exact** (same interim gov custody as reserve/ops).  
- **Option II (83 Target):** RegionVault + incentive vault — **separate Owner auth**, not implied by Local PASS.  
- Path A sale→P4Cap and Path B 300k→Founder wallet remain orthogonal and unchanged.
