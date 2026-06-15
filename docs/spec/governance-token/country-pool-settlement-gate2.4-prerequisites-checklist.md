# Gate-2.4 · Country Pool Net Profit · Sepolia 前置清单

**Checklist ID:** `country-pool-settlement-gate2.4-prerequisites`  
**Version:** v1-20260615  
**Phase:** **② 测试网前置** · **禁止** 无 Owner 授权 broadcast · **≠** ③ Production GO  
**Upstream:** Gate-2.3 四卡 merged · [G23-04 ABI Manifest](../../contracts/abi/manifests/country-pool-net-profit-v1.json)

> **① 本地 manifest 冻结 ≠ ② Sepolia GO。**

---

## G24-P-01～11 状态

| ID | 项 | ①/② | 状态 | 证据 / 路径 |
|----|-----|-----|------|-------------|
| **G24-P-01** | Gate-2.3 Projection Package v1 四方 Pre-Review | ① | ✅ | [projection-package-v1.md](country-pool-settlement-gate2.3-projection-package-v1.md) |
| **G24-P-02** | Gate-2.3 Solidity delta merged（G23-01～03） | ① | ✅ | `feature/g23-01` · `g23-02` · `g23-03` |
| **G24-P-03** | ABI export + manifest + check-55-s13 | ① | ✅ | [country-pool-net-profit-v1.json](../../contracts/abi/manifests/country-pool-net-profit-v1.json) · `bash scripts/check-55-s13.sh` |
| **G24-P-04** | Event Topic Registry（decoder 规格） | ① | ✅ | [country-pool-net-profit-v1.yaml](../../registry/event-decoders/country-pool-net-profit-v1.yaml) · **decoder 实现留 Gate-2.4/3** |
| **G24-P-05** | G-1/G-2 + PHASE2-START-CHECKLIST | ② | ☐ | [PHASE2-START-CHECKLIST](../../runbook/PHASE2-START-CHECKLIST.md) |
| **G24-P-06** | Timelock `setAllowedExecutionTarget` ×3 Safe 预案 | ② | ☐ | Architecture §7 |
| **G24-P-07** | pilot DE registry JSON 填实地址 | ② | ☐ | `config/jurisdiction_country_pool_net_profit.template.json` |
| **G24-P-08** | Sepolia STEWARD_STAKE_POOL + jurisdiction | ② | ☐ | TT-PHASE2-STEWARD-POOL checklist |
| **G24-P-09** | Phase2ControlPlane · non-Anvil owner | ② | ☐ | Runbook |
| **G24-P-10** | Runbook `[D-4555-B]` Anvil 全序列 | ① | ✅ | Gate-2.2 evidence · deploy script |
| **G24-P-11** | Legal LEG-XJ-05 未部署国不暗示已结算 | ②/③ | ☐ | legal-freeze-matrix |

---

## G23-04 冻结面（Gate-2.4 不得 breaking change）

| 合约 | ABI 路径 | 事件 / selector 真源 |
|------|----------|----------------------|
| `CountryPoolNetProfitLedger` | `contracts/abi/CountryPoolNetProfitLedger.json` | manifest `events` + `selectors` |
| `StewardPathVault` | `contracts/abi/StewardPathVault.json` | `StewardPathDeposit` |
| `UnallocatedStewardPathVault` | `contracts/abi/UnallocatedStewardPathVault.json` | `UnallocatedStewardDeposit` · `UnallocatedStewardReleased` |
| `CountryPoolNetProfitGovernancePayload` | manifest `governance_payload` | `CPNP_*` selector 常量 |

**验证（① 本地）：**

```bash
bash scripts/dev/check-country-pool-net-profit-abi-freeze.sh
bash scripts/check-55-s13.sh
cd contracts && forge test --match-contract CountryPoolNetProfitAbiFreeze
```

---

## 诚实边界

- **G24-P-03/04 ☑** = manifest + topic registry **已冻结** · **≠** indexer/API/DB 已合入 · **≠** Sepolia broadcast 已执行
- **Sepolia deploy** 须 **G24-P-05～09** + Owner 授权 · 单独 PR / checklist
