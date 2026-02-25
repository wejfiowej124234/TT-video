# ABI 放置目录（合约编译产物单源）

本目录为**合约 ABI JSON 的单源存放位置**，与 [docs/spec/14-合约-API-ABI-前后端对齐](../../docs/spec/14-合约-API-ABI-前后端对齐.md) 一致。

## 约定

- **合约实现后**：将 Solidity 编译产出的 ABI JSON 文件放入本目录，例如：
  - `Escrow.json`（或 `EscrowFactory.json` + 实例 ABI）
  - `Staking.json`
  - `Registry.json`
  - 可选：`Reputation.json`
- **命名**：与合约名或 01/02/contracts README 中模块名一致，便于前端与后端引用。
- **前端**：frontend 使用的 ABI 须**来自本目录**（复制到 frontend/dapp/abis/ 或通过 monorepo 引用），不得手写，保证与部署合约版本一致。
- **后端**：若用 Rust 与链交互（alloy 等），ABI 或生成的 Rust 绑定须与本目录一致。

## 当前状态

- 合约尚未实现（见 [contracts/README](../README.md)）；本目录暂无 ABI 文件。
- 实现后请同步更新 [docs/spec/14-合约-API-ABI-前后端对齐](../../docs/spec/14-合约-API-ABI-前后端对齐.md) §1.1 中具体方法/事件名。
