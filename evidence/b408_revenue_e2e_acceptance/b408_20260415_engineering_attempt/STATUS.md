# B-408 封口试跑（2026-04-15 · 未闭合）

**执行方**：工程侧（Cursor / Git Bash）  
**命令**：`bash scripts/ops/b408-revenue-e2e-acceptance-closeout.sh`（计划 `B408_RECORD_DIR` 指向本目录上级批次路径）  

## 结果：**未封口**

**原因（已核实）**：

1. **仓库根目录 `.env`**（已 `source`，**不**在此文件重复任何密钥）：未设置 **`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`CHAIN_RPC_URL`** / **`B407_RPC_URL`**、**`FEE_ROUTER_ADDRESS`** / **`B407_FEE_ROUTER`**、**`B407_ESCROW_ADDRESS`**、**`B407_RELAYER_PK`**、**`B407_OWNER_PK`**；仅 **`DATABASE_URL`** 等部分变量已配置。  
2. **本机已监听 `http://127.0.0.1:8080`**：`POST /api/v1/internal/indexer-tick` 在无 `X-Internal-Api-Secret` 时返回 **403**，说明**运行中 API 进程**配置了非空 **`INTERNAL_API_SECRET`**，与当前 **`.env` 未提供该变量** 不一致；脚本无法在**不知道与进程一致**的 secret 的情况下完成 **B-405 / B-404**。  
3. 即便补齐 API 侧密钥，**仍须**目标链上 **已 Funded Escrow** 及 **cast** 可调 **`release`/`distribute`**，否则 **B-407** 链上步无法执行。  

## 正式封口所需（运维在目标环境 shell 内）

- 与**当前运行 API** 一致的 **`INTERNAL_API_SECRET`**、可用的 **`ADMIN_BEARER_TOKEN`**（须能访问 **`GET /api/v1/admin/observability/overview`**，通常为 admin 会话）。  
- **`B407_*`** 链变量与 **Funded Escrow**（**`platformFeeRecipient`** = FeeRouter）。  
- 设 **`B408_RECORD_DIR=evidence/b408_revenue_e2e_acceptance/b408_<UTC日期>_<env>`** 后执行 **`b408-revenue-e2e-acceptance-closeout.sh`**，成功后将 **`b408-acceptance-record.json`** 路径回填 **Runbook §5.1** 表。  
