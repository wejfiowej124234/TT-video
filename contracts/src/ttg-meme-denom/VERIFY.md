# TTG V8 token · Etherscan / wallet-scanner pin

**STATUS:** DESIGN_ONLY · not Official live · not Production GO

This file is the verification recipe for `TtgMemeDenomGovernanceToken`. It exists to close the three live-token scanner issues on `0x3cB1…` **on the replacement 25T token**, not by re-verifying the 10M LEGACY bytecode.

| Screenshot | Live 10M symptom | V8 pin |
|------------|------------------|--------|
| Wallet “合约未开源” | Unverified or scanner lag | Verify Etherscan **and** Sourcify in the same session as deploy |
| Wallet “发现增发机制” | Source contained `_mint` (constructor-only) | No `mint` / `_mint` identifier; constructor `_creditGenesis` only |
| Etherscan 0.8.19 CVE banner | `solc 0.8.19+commit.7dd6d404` | Compile **0.8.26** · `via_ir` · optimizer 200 · `evm_version=paris` |

Re-verifying the live 10M token at 0.8.19 **cannot** remove the third banner. Those five notes are compiler-version bugs, not contract bugs.

## forge settings (must match verify)

Profile `ttg_v8` in `contracts/foundry.toml`. Default profile **skips** this family so the rest of the tree stays 0.8.19.

①:

```bash
bash scripts/dev/run-ttg-v8-forge.sh -vv
```

- `solc` **0.8.26+commit.8a97fa7a** (token pragma is pinned)
- `optimizer = true` · `optimizer_runs = 200`
- `via_ir = true`
- `evm_version = paris`

Constructor:

```text
constructor(address team, address daoTreasury, address publicSaleHolder)
```

Genesis split is 15 / 35 / 50 of 25T. `publicSaleHolder` is usually the deployer, who then transfers Public inventory to the new Primary Market.

## verify (② Sepolia rehearsal · after Owner auth)

```bash
cd contracts
FOUNDRY_PROFILE=ttg_v8_broadcast forge verify-contract \
  <TOKEN_ADDR> \
  src/ttg-meme-denom/TtgMemeDenomGovernanceToken.sol:TtgMemeDenomGovernanceToken \
  --chain-id 11155111 \
  --compiler-version 0.8.26 \
  --optimizer-runs 200 \
  --via-ir \
  --evm-version paris \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $TEAM $DAO $PUBLIC) \
  --verifier etherscan --watch
```

Also publish to Sourcify (`--verifier sourcify`). Wallet scanners that still show “未开源” after Exact Match are indexer lag — wait and refresh; do not redeploy to “fix” a lag.

③ mainnet verify of this family is **not** this rehearsal and still needs separate Owner auth. Do not broadcast Ethereum Mainnet from this recipe.

## what this does **not** do

- Does not mutate FTB or live Money Path.
- Does not fly-deploy Official www.
- Does not claim Production GO.
