# TravelTrust 前端（Next.js + DApp + 3D）

- **技术栈（旅游项目前端）**：Next.js + React + TypeScript + wagmi + viem + WalletConnect v2 + R3F + drei + Framer Motion。**旅游项目 DApp**：Next.js / React / TS（见 [06-DApp架构总览](../docs/06-DApp架构总览.md)、[09-技术架构总览](../docs/09-技术架构总览-v1.0.md)）。
- **运行**：`pnpm install` 后 `pnpm dev`（或 `npm run dev`）。后端 API 基地址通过 `NEXT_PUBLIC_API_BASE_URL` 配置。
- **WalletConnect v2**：在 [cloud.walletconnect.com](https://cloud.walletconnect.com) 创建项目，将 Project ID 写入 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`（见 `.env.example`）；不设置则仅使用注入型钱包（如 MetaMask）。

## 目录

- `app/`：页面与路由（App Router）
- `components/`：通用组件与 DApp 用 Providers（Wagmi + React Query）
- `lib/`：API 客户端、auth、me、orders 等（与 04 对接）
- `dapp/`：钱包、EIP-712、txMachine、viem watchContractEvent 等（与 06 一致）
- 3D：R3F + drei 用于首页 Hero、资金流可视化、品牌展示（见 09 §2.5、§2.7）；Framer Motion 用于页面/组件动效。可选：3D 动画 `@react-spring/three` 或 GSAP、3D 性能监控 `r3f-perf`、WalletConnect UI `@web3modal/react`（见 09 §2.7）。
