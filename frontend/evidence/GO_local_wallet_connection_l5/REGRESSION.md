# Regression · L5 Wallet Connection Center（①）

## 自动回归（必跑）

```bash
bash scripts/dev/smoke-wallet-connection-l5-local.sh
```

覆盖：

- `WalletStatusMini` 行为（连接 Sheet · 账户菜单 · 观察模式 · Escape）
- `walletConnectorCatalog`
- `deriveWalletPhase` / `classifyConnectError` / `assertWalletCanWrite` / mobile UX
- `walletConnectionCenter.contract`（Providers 工厂 · 无 RainbowKit · 无托管文案）
- `headerUtilityMenuUiFreeze`（顶栏 utility 不回退 Console 白盒）

## 改动后必回归场景（人测子集）

任一以下路径变更后，至少重跑 Manual UAT：**A1–A5 · B2 · C1或C3 · D1+D5 · E1 · F1**。

- `frontend/lib/wallet/connection/**`
- `frontend/components/trust/Wallet*.tsx` / `TravelTrustWalletSheet.tsx`
- `frontend/components/Providers.tsx`
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` / `NEXT_PUBLIC_CHAIN_ID`

## 禁止假完成

- 单元测试绿 **≠** Staging 多钱包真机 GO
- WalletConnect QR 本地弹窗 **≠** 手机 Deep Link 已验（须 C2）
- ① 收口 **≠** ③ Production GO
