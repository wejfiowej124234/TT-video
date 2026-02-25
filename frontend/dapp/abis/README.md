# DApp 使用的合约 ABI（与 contracts/abi 对齐）

本目录存放**前端调用合约时使用的 ABI JSON**，须与仓库 **contracts/abi/** 中的编译产物一致。

## 约定

- **来源**：从 **contracts/abi/** 复制或通过构建脚本同步；**不得手写 ABI**。
- **命名**：与 contracts/abi 一致（如 Escrow.json、Staking.json、Registry.json）。
- **版本**：发版前核对本目录 ABI 与当前部署的合约版本一致；合约升级后须更新并同步 contracts/abi。

## 当前状态

- 合约尚未实现，本目录暂无 ABI 文件。
- 实现时见 [docs/spec/14-合约-API-ABI-前后端对齐](../../../docs/spec/14-合约-API-ABI-前后端对齐.md) §1.2。
