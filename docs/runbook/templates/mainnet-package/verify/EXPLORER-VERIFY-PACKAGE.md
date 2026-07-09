# Explorer Verify Package — Mainnet (Etherscan)

**Status:** PREP checklist — post-broadcast per contract  
**Chain:** Ethereum Mainnet (`chain_id: 1`)  
**Explorer:** https://etherscan.io

---

## Per-contract verification

After each wave broadcast, verify source on Etherscan and record:

| Contract | Address | Verified URL | Commit SHA |
|----------|---------|--------------|------------|
| EscrowFactoryV2 | TBD | | |
| FeeRouter | TBD | | |
| Registry | TBD | | |
| GovernanceTimelock | TBD | | |
| TravelTrustGovernor | TBD | | |
| … | | | |

---

## Standard verify command

```bash
forge verify-contract \
  <ADDRESS> \
  <ContractName> \
  --chain mainnet \
  --etherscan-api-key "$ETHERSCAN_API_KEY" \
  --watch
```

Constructor args: extract from broadcast log or `constructor-parameters.v1.yaml`.

---

## Proxy / implementation (if applicable)

For `TimelockUpgradeableProxy` deployments:

1. Verify implementation contract first
2. Verify proxy with implementation address
3. Record `implementation` link on Etherscan
4. Cross-check with `registry/g24-p-upgrade-01-contract-posture.v1.yaml`

---

## `/meta` parity after verify

```bash
curl -s "$API_PROD/meta" | jq '.chain.contracts'
bash scripts/ops/runtime-chain-ssot-cast-verify.sh
```

All deployed addresses must appear in `GET /meta` → `chain.contracts` within 15 minutes of env deploy.

---

## Evidence index

Write `verify/explorer-verification-index.json`:

```json
{
  "schema": "traveltrust.mainnet_explorer_verification_index.v1",
  "chain_id": 1,
  "contracts": []
}
```

---

## NO-GO

- Etherscan verification fails for P0 contract
- Explorer address ≠ registry snapshot address
- Implementation mismatch on proxy
