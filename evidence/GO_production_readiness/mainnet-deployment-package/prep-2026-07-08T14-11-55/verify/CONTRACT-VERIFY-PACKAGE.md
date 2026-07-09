# Contract Verify Package — Mainnet

**Status:** PREP checklist — run after each wave broadcast  
**Goal:** Prove on-chain bytecode matches frozen compile artifacts (TT-MAINNET §1.3 G1)

---

## Scope (minimum per wave)

| Wave | Contracts |
|------|-----------|
| 1 | EscrowFactoryV2, FeeRouter, Registry |
| 2 | GovernanceTimelock, TravelTrustGovernor, GovernanceTreasury, GovernanceVotesToken |
| 3 | RegionStewardStakePool, CountryPool*, TtgPrimaryMarketV1 (if deployed) |

List full set in evidence `bytecode_identity_manifest.json`.

---

## Method A · Local forge vs chain

```bash
# Lock commit
export TRAVELTRUST_GIT_SHA=$(git rev-parse HEAD)

# Per contract after broadcast
cast code <DEPLOYED_ADDRESS> --rpc-url "$RPC_URL_MAINNET" > /tmp/onchain.hex
forge inspect contracts/src/EscrowFactoryV2.sol:EscrowFactoryV2 bytecode > /tmp/local.hex
# keccak256 must match — record in evidence
```

---

## Method B · ABI / artifact sync (pre-broadcast)

```bash
bash scripts/run-verify-abi-forge.sh
bash scripts/dev/sync-abi-from-forge.sh
```

Evidence: `contracts/abi/*.json` aligned with Foundry build at freeze commit.

---

## Method C · Foundry verify (broadcast)

```bash
cd contracts
forge verify-contract <ADDRESS> EscrowFactoryV2 \
  --chain-id 1 \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --constructor-args $(cast abi-encode "constructor(address)" "$TIMELOCK_ADDRESS")
```

Record verification URL in `verify/verification-index.json`.

---

## Evidence to capture

| Artifact | Path |
|----------|------|
| Bytecode identity manifest | `evidence/mainnet_deploy/verify/bytecode_identity_manifest.json` |
| Per-contract keccak log | `evidence/mainnet_deploy/verify/keccak-<contract>.json` |
| ABI forge verify log | `evidence/mainnet_deploy/verify/abi-forge-verify.log` |
| Forge verify tx log | `evidence/mainnet_deploy/verify/etherscan-<contract>.log` |

---

## NO-GO

Any core contract bytecode **cannot** be aligned with frozen compile artifact → **halt next wave** (G1).
