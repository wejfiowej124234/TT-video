# G23-04 · ABI & Event Freeze — ① 本地验收

**Card:** `G23-04-abi-event-freeze`  
**Branch:** `feature/g23-04-abi-event-freeze`  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Date:** 2026-06-15

---

## 1. 冻结产出

| 产物 | 路径 |
|------|------|
| Ledger ABI | `contracts/abi/CountryPoolNetProfitLedger.json` |
| Steward vault ABI | `contracts/abi/StewardPathVault.json` |
| Unallocated vault ABI | `contracts/abi/UnallocatedStewardPathVault.json` |
| Payload selectors | `contracts/abi/CountryPoolNetProfitGovernancePayload.json` |
| **ABI Manifest** | `contracts/abi/manifests/country-pool-net-profit-v1.json` |
| **Event Topic Registry** | `registry/event-decoders/country-pool-net-profit-v1.yaml` |
| Gate-2.4 前置 | `docs/spec/governance-token/country-pool-settlement-gate2.4-prerequisites-checklist.md` |

**无** Solidity 业务逻辑 / storage / 事件 schema 变更。

---

## 2. 验证（exit 0）

```bash
bash scripts/dev/check-country-pool-net-profit-abi-freeze.sh
bash scripts/check-55-s13.sh
cd contracts && forge test --match-contract CountryPoolNetProfitAbiFreeze
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract CountryPoolNetProfitFuzz
cd contracts && forge test --match-contract FeeRouterTest
```

| Suite | Result |
|-------|--------|
| CPNP ABI freeze script | **pass** · 9 P0 events |
| `CountryPoolNetProfit` | **54 passed** |
| `CountryPoolNetProfitFuzz` | **4 passed** |
| `CountryPoolNetProfitAbiFreeze` | **3 passed** |
| `FeeRouterTest` | **10 passed** |

---

## 3. Gate-2.3 出口

G23-03 · G23-01 · G23-02 · **G23-04** 四卡 DoD ☑ → 可进入 **Gate-2.4 前置评审**（G24-P-05+ 仍 ② · 禁止无授权 broadcast）。

**① manifest 冻结 ≠ ② Sepolia GO。**
