# TT-B407 · B-407 — 真实链 release / distribute 驱动的最小 Revenue 闭环（无 `mock-pay`）



**母表**：`B-407`（实现参考；母表/索引登记按仓库封口流程）  

**卡号**：`TT-B407-REAL-CHAIN-REVENUE-E2E-001`  

**前置**：[TT-B402](./TT-B402-MIN-REVENUE-E2E-DATA-BUSINESS-CLOSE-LOOP-001.md)、[TT-B405](./TT-B405-REAL-ORDER-DRIVEN-REVENUE-E2E-L2-001.md)、[TT-B404](./TT-B404-REVENUE-E2E-RUN-STATUS-L1-001.md)（**B-404** **`revenue-e2e-run-status`**）  

**对照**：[TT-B406](./TT-B406-REVENUE-E2E-BOOTSTRAP-ORDER-001.md)（**`mock-pay`** **链下** **替身** **路径** **）**  

**日期**：2026-04-15  



---



## 1. 目的



在 **不** **调用** **`POST …/mock-pay`** **、** **不** **依赖** **`P3_CHAIN_OFF=1`** **的** **前提下** **，** **完成** **最小** **真实** **链上** **资金流** **：**



1. **HTTP** **（** **与** **B-406** **同源** **骨架** **）** **：** **`seed`** **（** **可选** **）** **→** **登录** **→** **`GET …/guides`** **→** **`POST …/orders`** **→** **`/accept`** **→** **`POST …/set-escrow-address`** **绑定** **已** **存在** **的** **Escrow** **地址** **。**  

2. **链上** **（** **`scripts/ops/b407-exec-chain-release-distribute.sh`** **）** **：** **`Escrow.release()`** **→** **平台费** **进入** **`platformFeeRecipient`** **（** **须** **为** **FeeRouter** **）** **→** **`FeeRouter.distribute(token, amount)`** **（** **`owner`** **私钥** **）** **，** **产生** **`PlatformFeeRouted`** **等** **可** **索引** **事件** **。**  

3. **留证** **/** **验证** **（** **复用** **B-405** **/** **B-402** **/** **B-404** **）** **：** **导出** **`B405_ORDER_ID`** **→** **`b405-revenue-e2e-order-driven-runner.sh`** **（** **`indexer-tick`** **+** **`b402-min-revenue-e2e-reconcile-smoke.sh`** **）** **；** **stdout** **末行** **提示** **`GET …/internal/revenue-e2e-run-status?run_id=`** **。**  



---



## 2. 硬性前置



| 条件 | 说明 |

|------|------|

| **Escrow** | **`B407_ESCROW_ADDRESS`** **指向** **链上** **已为** **`Funded`** **的** **实例** **；** **创建** **时** **`platformFeeRecipient`** **须** **与** **API** **/** **indexer** **所** **配** **`FEE_ROUTER_ADDRESS`** **一致** **。** |

| **Foundry** | **`cast`** **可用** **（** **`release`** **/** **`distribute`** **发送** **）** **。** |

| **密钥** **/** **RPC** | **`B407_RELAYER_PK`** **（** **仅** **付** **`release`** **gas** **）** **；** **`B407_OWNER_PK`** **须** **为** **FeeRouter** **`owner`** **；** **`B407_RPC_URL`** **或** **`CHAIN_RPC_URL`** **/** **`RPC_URL`** **。** |

| **API** | **与** **B-402/B-405** **一致** **：** **`INTERNAL_API_SECRET`** **、** **`ADMIN_BEARER_TOKEN`** **、** **`jq`** **；** **`chain_off`** **+** **DB** **+** **indexer** **与** **目标** **链** **对齐** **。** |



**说明** **：** **本** **切片** **不** **包含** **`deposit`** **；** **充值** **/** **部署** **Escrow** **须** **在** **编排** **外** **完成** **（** **或** **自行** **扩展** **脚本** **）** **。**



---



## 3. 命令



```bash

export INTERNAL_API_SECRET=...

export ADMIN_BEARER_TOKEN=...

export B407_ESCROW_ADDRESS=0x...

export B407_FEE_ROUTER="${FEE_ROUTER_ADDRESS}"   # 或与 Escrow 创建参数一致

export B407_RELAYER_PK=0x...

export B407_OWNER_PK=0x...

export B407_RPC_URL="${CHAIN_RPC_URL}"           # 或 RPC_URL



bash scripts/ops/b407-revenue-e2e-real-chain-runner.sh

```



**可调** **：** **`B405_ROUNDS`** **、** **`B407_GUIDE_CITY`** **、** **`API_BASE_URL`** **、** **`B407_SKIP_SEED=1`** **。**



---

**封口** **与** **目标环境** **验收表** **：** **[TT-B408](./TT-B408-REVENUE-E2E-ACCEPTANCE-CLOSEOUT-001.md)** **（** **B-408** **）** **、** **`ops/RUNBOOK.md`** **§5.1** **。**

## 4. 互证



- **编排** **：** [`scripts/ops/b407-revenue-e2e-real-chain-runner.sh`](../../scripts/ops/b407-revenue-e2e-real-chain-runner.sh)  

- **链上** **步** **：** [`scripts/ops/b407-exec-chain-release-distribute.sh`](../../scripts/ops/b407-exec-chain-release-distribute.sh)  

- **L2** **：** [`scripts/ops/b405-revenue-e2e-order-driven-runner.sh`](../../scripts/ops/b405-revenue-e2e-order-driven-runner.sh)  

- **L1** **：** **`GET /api/v1/internal/revenue-e2e-run-status`** · [04 §3.4](../spec/04-后端与API.md)  

- **运维** **：** [`ops/RUNBOOK.md`](../../ops/RUNBOOK.md) **§2.55**  

- **证据** **锚点** **：** [`evidence/b407_revenue_e2e_runs/README.md`](../../evidence/b407_revenue_e2e_runs/README.md)  


