# G23-04 · ABI & Event Freeze

**Card ID:** `G23-04-abi-event-freeze`  
**Priority:** **4 / 4**（Gate-2.3 最后一卡 · Gate-2.4 直接消费）  
**Phase:** **① 本地** · **≠** ② Sepolia GO  
**Depends on:** **G23-03 + G23-01 + G23-02 merged**  
**Unlocks:** Gate-2.4（ABI · decoder · Sepolia checklist）

---

## 1. 目标

冻结 **Topic0 · 事件参数顺序 · public ABI**；产出 Gate-2.4 使用的 **ABI Manifest**；**禁止再改事件名**。

---

## 2. 范围（In）

| 项 | 说明 |
|----|------|
| **事件冻结** | `NetProfitAccrued` · `EpochClosed` · `NetProfitSplit` · `LedgerFundedForSplit` · `EpochOpened` · vault deposit/release · `ActiveStewardConfigSet` 等 **v1 名不变** |
| **Topic0** | 登记清单（yaml/json）· 与 `76aff11c` 实现对拍 |
| **ABI 基线** | `contracts/abi/CountryPoolNetProfitLedger.json` · Vaults · Payload 相关 |
| **Manifest** | `contracts/abi/manifests/country-pool-net-profit-v1.json`（Gate-2.4 输入） |
| **同步** | `./scripts/sync-abi-from-forge.sh` · `check-55-s13.sh` |
| **NatSpec** | `@custom:gate2.4-frozen` 或 README 冻结表 |

### 冻结名对照（禁止 rename）

| 实现名（冻结） | 误用设计名 |
|----------------|------------|
| `StewardPathDeposit` | ~~Deposit~~ |
| `UnallocatedStewardDeposit` | ~~Deposit~~ |
| `UnallocatedStewardReleased` | — |

---

## 3. 范围（Out · 硬闸）

- 新功能 / `recordAccrualBatch` 行为变更（已在前卡完成）
- Sepolia broadcast（Gate-2.4 单独 PR）
- indexer migration 合入（Gate-3）
- registry decoder **实现**（Gate-2.4 可同批 · 本卡仅 manifest）

---

## 4. 预期改动面

| 路径 | 说明 |
|------|------|
| `contracts/abi/CountryPoolNetProfitLedger.json` | export |
| `contracts/abi/StewardPathVault.json` | export |
| `contracts/abi/UnallocatedStewardPathVault.json` | export |
| `contracts/abi/manifests/country-pool-net-profit-v1.json` | topic0 + selector 表 |
| `docs/spec/14` 或 registry 登记条目 | Gate-2.4 同批或本卡 |
| `contracts/abi/README.md` | 冻结说明一行 |

**禁止** 本 PR 修改 Solidity **行为**（仅 NatSpec / 注释允许）。

---

## 5. DoD

```bash
cd contracts && forge build
./scripts/sync-abi-from-forge.sh
bash scripts/check-55-s13.sh
cd contracts && forge test --match-contract CountryPoolNetProfit
cd contracts && forge test --match-contract CountryPoolNetProfitFuzz   # 若已合 G23-02
cd contracts && forge test --match-contract FeeRouterTest
```

| # | 检查项 | 状态 |
|---|--------|------|
| D1 | ABI JSON 与 `forge build` artifact **一致** | ☐ |
| D2 | Manifest 含 **全部** P0 事件 topic0 + 核心 selector | ☐ |
| D3 | **无** 事件名 / 参数顺序变更 vs G23-03 合入后 head | ☐ |
| D4 | check-55-s13 **exit 0** | ☐ |
| D5 | 全 Foundry 绿（含 fuzz 若存在） | ☐ |
| D6 | Architecture / Projection Package 链到 manifest 路径 | ☐ |

---

## 6. Gate-2.4 交接物

Manifest 须足够让 Gate-2.4 执行：

- `DeployCountryPoolNetProfitStack.s.sol` dry-run 地址预测
- `registry/event-decoders/country_pool_net_profit.v1.yaml` 生成
- G24-P-03 · G24-P-04 checklist 勾选

---

## 7. 签字

| 方 | 确认 | 签字 | 日期 |
|----|------|------|------|
| 工程 | DoD D1～D6 · ABI Manifest | ☐ | |
| 财务 | 事件字段 ↔ mapping-matrix 对拍 | ☐ | |

**四卡全部 ☑ 后：** 方可启动 **Gate-2.4 Sepolia 前置**（仍 **禁止** 无 Owner 授权 broadcast）。
