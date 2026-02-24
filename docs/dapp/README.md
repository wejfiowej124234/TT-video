# DApp 文档入口（钱包 / 签名 / 兼容性门禁）

本目录用于 **DApp 模式**（钱包连接、EIP-712 签名、与后端 `/meta` 绑定）的文档导航。

为避免破坏既有引用，现阶段不移动既有文档文件（仍以 `docs/06-DApp架构总览.md` 为权威正文），这里只提供稳定入口与跳转。

## 主要文档

- DApp 架构总览（权威正文）：[../06-DApp架构总览.md](../06-DApp架构总览.md)
- 前端总览（页面/组件/分层）：[../05-前端总览.md](../05-前端总览.md)
- 后端与 API（/meta、签名验签入口）：[../04-后端与API.md](../04-后端与API.md)
- 合约与 ABI 对齐（实现时）：[../14-合约-API-ABI-前后端对齐.md](../14-合约-API-ABI-前后端对齐.md)
- 协议级 UI 设计宪法（DApp 页面/组件亦遵守）：[../13-协议级UI设计宪法.md](../13-协议级UI设计宪法.md)

## 架构目录（本目录补充）

- DApp 架构目录（中文命名）：[架构目录.md](架构目录.md)

## 代码落点（仓库结构）

- DApp 与钱包/链交互：`frontend/dapp/`、`frontend/components/Providers.tsx`（wagmi + viem + WalletConnect v2）
- 签名、tx 状态机、watchContractEvent：`frontend/dapp/`（见 [09 §2.7 DApp+3D 定稿方案](../09-技术架构总览-v1.0.md)）
- MetaGate（/meta 版本绑定）：frontend 启动时调用 `GET /meta`，与 05 §七点六 一致

文档索引与版本表见 [00-文档索引](../00-文档索引.md)。
