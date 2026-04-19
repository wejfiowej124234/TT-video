# Runtime Chain SSOT · cast 只读接线校验 — 证据包

**脚本**：仓库根 `bash scripts/ops/runtime-chain-ssot-cast-verify.sh`  
**运行时刻（UTC）**：2026-04-16T11:05:57Z（目录名 `run_*`）  
**仓库 `git rev-parse --short HEAD`**：`f267483`（运行当时）

## 结论

- **`exit_code=0`**：**Governor / Timelock / GovernanceVotesToken** 在 **Sepolia RPC** 上的 **immutable 引用** 与本次运行所用环境变量 **一致**。
- **`CHAIN_ID`**：与 **`cast chain-id`** 对拍为 **11155111**（Sepolia）。

## 运行说明（与本机 `.env` 的关系）

- 目标环境 **`.env` 未设置 `TIMELOCK_ADDRESS`**。为使脚本可执行，在 **单次 shell 会话**内用只读调用  
  **`cast call $GOVERNOR_ADDRESS "timelock()(address)"`** 得到 Timelock 地址并 **`export TIMELOCK_ADDRESS=…`**，**未** 修改仓库内任何文件。
- **运维建议**：将上述 **`TIMELOCK_ADDRESS`** 写入 **`.env`**（与 **`GET /meta` → `chain.contracts`** 七键一致），以便后续 **无需链上预读** 即可重放本脚本。
- **`FEE_ROUTER_ADDRESS`**：未设置；脚本按设计 **WARN** 并 **跳过** **`feeRouter.owner()==Timelock`**。若需 **FeeRouter 接线** 一并纳入门禁，在 **`.env`** 中补齐 **`FEE_ROUTER_ADDRESS`** 后重跑（无 WARN 或完整检查）。

## 产物

- **`console.txt`**：脚本完整标准输出与退出码（**不含**私钥；请勿将含 **`PRIVATE_KEY`** 的 shell 录屏并入证据）。

## 与其它「四层闭环」的边界

- 本证据：**运行时接线自洽**（RPC 上 Governor↔Token↔Timelock 三角）。
- **不替代**：**B-431** Foundry 内存测试、**B-430** API reconcile、**B-417** queue/execute 链上执行包、以及 **Explorer** 对「是否为全网最新一次部署」的运维确认。
