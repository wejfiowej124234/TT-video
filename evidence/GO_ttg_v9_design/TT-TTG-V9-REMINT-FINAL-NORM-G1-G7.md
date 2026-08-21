# TT · TTG V9 Remint Final Norm (G1–G7 Hard Gates)

**STATUS:** `FINAL_NORM_FROZEN` · Local target **`V9_REMINT_LOCAL_PASS`** · **NOT** Sepolia · **NOT** Mainnet · **NOT** Production GO  
**Companion:** `docs/runbook/TT-TTG-V9-FULL-25T-REMINT-DESIGN-LATEST.md` · `registry/ttg-v9-upgrade-design.v1.yaml`  
**Language:** Solidity / NatSpec **English only**

---

## 0 · V8 disposition (LOCKED)

| Rule | Binding |
|------|---------|
| V8 Token + V8 PM | **LEGACY / NON-OFFICIAL / NO_MIGRATION** |
| Holder migration / snapshot / 1:1 swap / claim / bridge | **NOT REQUIRED** (Owner: no external circulation) |
| On-chain | Contracts remain; Registry + www + wallets **must label Legacy** so old PM is never Official buy entry |
| Money Path / Timelock / P4Cap | **KEEP** |

---

## 1 · Seven contract hard gates (close before Sepolia)

| Gate | Meaning | Local Forge bar |
|------|---------|-----------------|
| **G1 NO_MINT** | Genesis one-shot 25T · `MAX_SUPPLY` · forever no mint · no minter role | ABI + invariant: supply never increases |
| **G2 Genesis 50/35/3/5/7** | Exact wei to Vault / Timelock / Team / Marketing / Treasury | Balance sum == `MAX_SUPPLY` |
| **G3 Governance-only Burn** | RETURN default · burn only Governor→vote→Timelock→`executeGovernanceBurn`→`protocolBurn` · no dead · no public burn · cannot burn user wallets | Permission + event + supply↓ |
| **G4 Governor voting/quorum** | Quorum & propose thresholds **pinned for 25T** (not V311 50k-cap leftovers) | See §2 |
| **G5 UUPS + Rescue** | Only Vault+PM UUPS · Timelock `_authorizeUpgrade` · rescue **non-TTG only** · TTG moves via PM rules / governance burn only | Auth + rescue deny TTG |
| **G6 Governor/Timelock cutover** | New Governor binds V9 TTG · `Timelock.setGovernor` · old gov cannot schedule | Local MockTimelock cutover test |
| **G7 Deploy topology** | Fixed order · **no Owner EOA bridge** for 12.5T | `TtgV9DeployTopology` helper + test |

**Publish layer (P1 #16–27):** Explorer / logo / Indexer / www same-day pin — **after** G1–G7 local PASS · on Sepolia then Mainnet readiness. Do not block G1–G7 on those.

---

## 2 · G4 pinned governance math (25T)

Denominator = `token.getPastTotalSupply(snapshot)` (actual checkpointed supply, may be &lt; 25T after burns).

| Param | V9 pin |
|-------|--------|
| `quorumNumeratorBps` | **100** (1% of snapshot supply; for+abstain) |
| `proposalThresholdVotes` floor | **0** (tier bps govern) |
| `maxVotingPowerPerAddressBps` | **0** (cap disabled) |
| Ordinary propose | **50 bps** of supply · **no absolute maxVotes** |
| Important propose | **100 bps** · no max |
| Core propose | **200 bps** · no max |
| Voting delay / period | Immutable at Governor deploy (local default 1 / 10 blocks; Mainnet pin in cutover checklist) |

**Supersedes** V311 `maxVotes = 50_000 ether` style caps (unusable / wrong on 25T).

---

## 3 · G7 deploy topology (fixed)

```text
1. Deploy Mock/Live Timelock address known (KEEP on Mainnet)
2. Deploy Vault implementation + ERC1967 proxy (no init)
3. Deploy Token(publicVaultProxy, timelock, team, marketing, treasury)  // credits 12.5T to vault proxy
4. vault.initialize(ttg, timelock)
5. Deploy PM implementation + proxy.initialize(usdc, ttg, p4cap, vault, timelock, guardian)
6. timelock → vault.bindMarket(pm)
7. Deploy GovernorV9(ttg, timelock, G4 params…)
8. timelock.setGovernor(governorV9) + allow-list vault/pm/governor targets
```

**Forbidden:** mint/transfer 12.5T through a temporary Owner EOA “bridge” wallet.

---

## 4 · Checklist 01–30 → gate map

| # | Pri | Closed by |
|---|-----|-----------|
| 01–08, 12–14 | P0 | G1–G5, G7 |
| 09–11 | P0 | G4, G6 (+ Sepolia for full G6 drill) |
| 15 | P0 | Norm §0 + Registry LEGACY (publish layer) |
| 16–29 | P1 | Sepolia / publish / evidence (not G1–G7 blockers) |
| 30 | P1 | Reality ladder: Local PASS → Sepolia → Mainnet readiness |

---

## 5 · Ladder

| Phase | Exit |
|-------|------|
| ① G1–G7 Forge + local gate | `V9_REMINT_LOCAL_PASS` |
| ② Sepolia full lifecycle + G6 live cutover | Owner auth · `V9_REMINT_SEPOLIA_PASS_STOP` |
| ③ Mainnet readiness + Official pin | Owner auth · separate |

**This document does not authorize Sepolia or Mainnet broadcast.**
