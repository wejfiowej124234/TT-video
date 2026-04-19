# TT-B408 · B-408 — 目标环境 Revenue E2E 可重复验收与封口



**母表**：`B-408`  

**卡号**：`TT-B408-REVENUE-E2E-ACCEPTANCE-CLOSEOUT-001`  

**前置**：[TT-B407](./TT-B407-REAL-CHAIN-REVENUE-E2E-001.md)（**B-407** **真实链** **runner**）、[TT-B404](./TT-B404-REVENUE-E2E-RUN-STATUS-L1-001.md)（**B-404**）  

**Runbook 落点**：[ops/RUNBOOK.md §5.1](../../ops/RUNBOOK.md)  

**日期**：2026-04-15  



---



## 1. 目的



将 **B-407** 从「脚本可跑」提升为「**目标环境可重复验收**」：**一次** **完整** **跑通** **后** **必须** **可** **核对** **：**



- **链上**：**`release`** **/** **`distribute`** **交易** **哈希** **（** **`b407-chain-tx.json`** **）**  

- **编排**：**B-405** **末轮** **`run_id`** **（** **`b405-run-id.txt`** **）** **与** **订单** **UUID**  

- **只读聚合**：**`GET /api/v1/internal/revenue-e2e-run-status`** **成功** **体** **（** **`b404-run-status.json`** **）**  

- **封口条**：**`b408-acceptance-record.json`** **（** **合并** **JSON** **）**  



运维将 **§5.1** **表** **与** **上述** **文件** **路径** **对齐** **后** **，** **视为** **该** **环境** **Revenue** **E2E** **封口** **基线** **。**



---



## 2. 命令



```bash

export INTERNAL_API_SECRET=...

export ADMIN_BEARER_TOKEN=...

export B407_ESCROW_ADDRESS=0x...

export B407_FEE_ROUTER="${FEE_ROUTER_ADDRESS}"

export B407_RELAYER_PK=0x...

export B407_OWNER_PK=0x...

export B407_RPC_URL="${CHAIN_RPC_URL}"



# 建议每批次单独目录，避免覆盖

export B408_RECORD_DIR=evidence/b408_revenue_e2e_acceptance/b408_YYYYMMDD_env_tag



bash scripts/ops/b408-revenue-e2e-acceptance-closeout.sh

```



**等价**：**`B408_RECORD_DIR=…`** **`bash scripts/ops/b407-revenue-e2e-real-chain-runner.sh`** **。**



---



## 3. 产物与退出码



| 文件 | 说明 |

|------|------|

| **`b407-chain-tx.json`** | **`release_tx_hash`** **、** **`distribute_tx_hash`** **、** **`escrow`** **/** **`fee_router`** **/** **`token`** **/** **`rpc_url`** |

| **`b404-run-status.json`** | **B-404** **200** **体** |

| **`b408-acceptance-record.json`** | **合并** **锚** **（** **含** **`git_rev`** **可选** **）** |

| **`b405-order-id.txt`** **、** **`b405-run-id.txt`** **、** **`api-base-url.txt`** | **便于** **shell** **/** **工单** **粘贴** |



**退出码**：**在** **B-407** **基础** **上** **增加** **：** **14** **=** **B-404** **非** **200** **；** **15** **=** **无法** **从** **manifest** **解析** **`run_id`** **。**



---



## 4. 互证



- **封口** **脚本**：[scripts/ops/b408-revenue-e2e-acceptance-closeout.sh](../../scripts/ops/b408-revenue-e2e-acceptance-closeout.sh)  

- **编排**：[scripts/ops/b407-revenue-e2e-real-chain-runner.sh](../../scripts/ops/b407-revenue-e2e-real-chain-runner.sh)  

- **链上**：[scripts/ops/b407-exec-chain-release-distribute.sh](../../scripts/ops/b407-exec-chain-release-distribute.sh)  



---



## 5. 封口登记（与 `ops/RUNBOOK.md` §5.1 同源）



**主表** **：** **[Runbook §5.1](../../ops/RUNBOOK.md#51-目标环境-revenue-e2e-可重复验收b-408)** **。**



**2026-04-15** **工程侧试跑** **（** **未闭合** **）** **：** [`evidence/b408_revenue_e2e_acceptance/b408_20260415_engineering_attempt/STATUS.md`](../../evidence/b408_revenue_e2e_acceptance/b408_20260415_engineering_attempt/STATUS.md) **。**


