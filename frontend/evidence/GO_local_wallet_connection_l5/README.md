# TravelTrust L5 Wallet Connection Center（① 本地）

**阶段：① 本地** — 企业级钱包**连接层**收口证据。  
**不是** ② staging GO · **不是** ③ Production GO · **不是** 钱包产品（创建/托管/法币入金）。

**全仓模块签收模板（标准样板）：** [TT-MODULE-RELEASE-LADDER-V1](../../../docs/runbook/TT-MODULE-RELEASE-LADDER-V1.md)  
Engineering → Automation → Real UAT → Staging → Production · 缺一 = **BLOCKED**（见 [SIGNOFF-LATEST](./SIGNOFF-LATEST.md)）。

## 定位（写死）

TravelTrust **只**负责：连接 · 识别 · 切链 · 发起签名请求。  
**不**创建钱包 · **不**托管私钥 · **不**保存助记词 · **不**代用户签名 · **不**提供导入钱包。

对外案：主流 EVM + 兼容 EIP-1193 / WalletConnect 的钱包（协议覆盖，非绝对全部钱包）。

## 架构（Web 与未来 App 共用内核）

```
UI (Web): WalletStatusMini → TravelTrustWalletSheet / WalletAccountMenu
                ↓
React: useWalletConnectionController
                ↓
Shared (platform-agnostic): lib/wallet/connection/*
   classifyConnectError · deriveWalletPhase · assertWalletCanWrite
   createTravelTrustWagmiConnectors · device (WC QR vs Deep Link)
                ↓
wagmi: injected (EIP-6963) · MetaMask · Coinbase · WalletConnect · Safe  
UI: `WalletBrandIcon` · 分品牌 `WALLET_INSTALL_URL` · 签收见 SIGNOFF-LATEST（满分须 Owner WC + 真机）
```

App 侧应复用 `lib/wallet/connection/*`（类型 / 相位 / 写守卫 / connector 工厂），UI 壳可替换，**不得**分叉托管模型。

## 机读绿集

```bash
bash scripts/dev/smoke-wallet-connection-l5-local.sh
```

## 文档

| 文件 | 用途 |
|------|------|
| [WALLET-CONNECTION-CENTER-L5.md](./WALLET-CONNECTION-CENTER-L5.md) | 产品 / 安全 / 状态矩阵 SSOT |
| [ENTERPRISE-L5-PRODUCTION-STANDARD.md](./ENTERPRISE-L5-PRODUCTION-STANDARD.md) | 企业级能力对照表 · Owner 闭环 |
| [MANUAL-UAT.md](./MANUAL-UAT.md) | Manual UAT 清单 |
| [SIGNOFF-LATEST.md](./SIGNOFF-LATEST.md) | 签收结果（当前可能 BLOCKED） |
| [REGRESSION.md](./REGRESSION.md) | Regression 口径 |

**诚实边界：** ① 绿 ≠ ② staging 全矩阵 GO ≠ ③ Production GO。WalletConnect 需 `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`。
