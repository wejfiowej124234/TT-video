# B-435 · 全栈资金测试网发布闭环 · 证据落盘

**母表**：`B-435`  
**Runbook**：[`docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md`](../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md)

---

## 用途

每完成 **Sepolia** 上 **一条** **可** **复核** **闭环** **（** **广播** **→** **地址** **/** **meta** **同源** **→** **关** **mock** **→** **真实** **扣款** **→** **indexer** **/** **reconcile** **/** **overview** **→** **runtime** **SSOT** **）** **，** **在** **本** **目录** **下** **新建** **`run_<UTC>/`** **（** **UTC** **时间戳** **，** **例** **`run_20260416T120000Z`** **）** **。** **仅** **当** **该** **Runbook** **§3.7** **条件** **满足** **后** **，** **才** **可** **将** **母表** **B-435** **更新** **为** **「** **已做** **」** **并** **在** **台账** **中** **引用** **该** **`run_<UTC>/`** **。** **最终** **封口** **（** **`tx_hashes.json`** **与** **`indexer_tick.json`** **/** **`reconcile.json`** **/** **`overview.json`** **同目录** **）** **示例** **：** **`run_20260417T003342Z/`** **（** **见** **内** **`README.md`** **）** **。**



**脚本** **/** **Runbook** **就绪** **但** **未** **广播** **或** **证据** **不全** **时** **：** **不得** **创建** **「** **封口** **」** **含义** **的** **`run_*`** **，** **也** **不得** **改** **母表** **。**



---

## `run_<UTC>/` 建议最小内容

**与** **Runbook** **§3.5** **目录** **树** **一致** **时** **可** **用** **下列** **命名** **（** **亦可** **与** **旧** **名** **`broadcast_console.txt`** **/** **`runtime_ssot.txt`** **等价** **）** **：**

```
run_<UTC>/
├── broadcast/
├── tx_hashes.json
├── console.txt
├── ssot.txt
├── reconcile.json
├── overview.json
└── README.md
```

| 文件 / 目录 | 说明 |
|------|------|
| `README.md` | **本轮** **UTC** **、** **操作** **摘要** **、** **Explorer** **根** **链接** **、** **与** **Runbook** **闸门** **对齐** **声明** **。** |
| `broadcast/` | **从** **`contracts/broadcast/DeployFundStackUnderTimelock.s.sol/<chainId>/`** **复制** **（** **Sepolia** **`chainId=11155111`** **）** **。** |
| `console.txt` | **`forge --broadcast`** **控制台** **输出** **（** **或** **沿用** **`broadcast_console.txt`** **）** **。** |
| `tx_hashes.json` | **`deploy`** **/** **`first_payment`** **/** **`reconcile_reference`** **等** **。** |
| `addresses.json` | **（** **可选** **）** **七** **键** **与** **`.env`** **/** **`GET /meta`** **一致** **。** |
| `meta_chain_contracts.json` | **`GET /meta`** **`chain.contracts`** **节选** **。** |
| `ssot.txt` | **runtime** **SSOT** **脚本** **完整** **输出** **（** **或** **`runtime_ssot.txt`** **）** **。** |
| `reconcile.json` **/** `overview.json` | **indexer-reconcile** **/** **observability** **overview** **响应** **节选** **。** |



---

## 环境变量核对清单（与 Runbook §3.2 一致）

**`.env`** **（** **或** **部署** **等价** **）** **须** **至少** **含** **：**



`FEE_ROUTER_ADDRESS` · `TREASURY_ADDRESS` · `REGION_VAULT_ADDRESS` · `GUIDE_STAKING_ADDRESS` · `STAKING_PROVIDER_ADDRESS` · `ESCROW_FACTORY_ADDRESS` · `REGISTRY_ADDRESS`



**并** **与** **`GET /meta`** **对拍** **。**



**关** **mock** **：** **`P3_CHAIN_OFF=0`** **或** **未** **设置** **。**



---

## 交叉引用



- **测试网五步清单（唯一入口）** **：** [`docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md`](../../docs/runbook/TT-TESTNET-FULLSTACK-DEPLOY-CLOSELOOP-CHECKLIST.md) **；** **新建** **`run_<UTC>/`** **：** **`bash scripts/ops/tt-testnet-fullstack-new-run-dir.sh`** **；** **收口** **观测** **JSON** **：** **`bash scripts/ops/tt-testnet-fullstack-seal.sh`**

- **B-434** **裁断** **：** [`evidence/timelock_truth_arbitration/README.md`](../timelock_truth_arbitration/README.md)  

- **Runtime** **SSOT** **清单** **：** [`evidence/GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md`](../GO_FINAL_20260416/RUNTIME_CHAIN_SSOT_CHECKLIST.md)

- **用户钱包** **→** **Escrow** **→** **FeeRouter** **`first_payment`** **升级** **：** [`TT-B435-USER-WALLET-ESCROW-FEEROUTER-PAYMENT-PATH-001.md`](../../docs/runbook/TT-B435-USER-WALLET-ESCROW-FEEROUTER-PAYMENT-PATH-001.md)（**与** **[TT-B407](../../docs/runbook/TT-B407-REAL-CHAIN-REVENUE-E2E-001.md)** **release/distribute** **编排** **互证** **）**

- **§3.8** **全栈** **观测** **封口** **（** **业务** **/** **前端** **/** **观测** **）** **+** **外部** **审计** **模拟** **：** [`TT-B435` §3.8](../../docs/runbook/TT-B435-FULLSTACK-FUND-TESTNET-RELEASE-CHAIN-001.md#tt-b435-sec-3-8-observability-seal) **、** [`TT-B435-EXTERNAL-AUDIT-SIMULATION-001.md`](../../docs/runbook/TT-B435-EXTERNAL-AUDIT-SIMULATION-001.md) **；** **金库** **支出** **并列** [`TT-TREASURY-SPEND-MINI-EVIDENCE-001.md`](../../docs/runbook/TT-TREASURY-SPEND-MINI-EVIDENCE-001.md) **。**


