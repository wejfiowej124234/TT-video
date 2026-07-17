# Wallet Connection Center · L5 企业级（①）

**文档从代码同步：** `frontend/lib/wallet/connection/*` · `components/trust/TravelTrustWalletSheet.tsx` · `WalletStatusMini.tsx` · `Providers.tsx`

## 安全边界（面板内长期展示）

- TravelTrust 不会要求助记词或私钥
- 所有交易由用户钱包确认并签名
- Web2 登录与钱包连接双轨；连接不会自动永久绑定账户
- 绑定钱包须另行签名确认
- 只读观察模式不能签名 / 写链
- 错链禁止写操作（`assertWalletCanWrite`）

## 连接分层

| 层 | 实现 |
|----|------|
| 浏览器扩展 | `injected` + EIP-6963；推荐 MetaMask / Rabby / OKX / **Bitget** / Coinbase / Trust |
| Logo | EIP-6963 `connector.icon` 优先 · `WalletBrandIcon` SVG 回退 |
| 安装跳转 | 未安装 → `WALLET_INSTALL_URL[brand]` 官方页；点击记 `tt_wallet_await_install`；回站 `visibility/focus` → **一次 reload** 重检 EIP-6963；已安装 → `connect` |
| WalletConnect | Project ID → QR（桌面）/ Deep Link（手机）；未配置仅提示 |
| Safe | `safe` connector；仅 Safe App 环境展示 |
| 观察模式 | `ViewOnlyAddress` · UI「观察中」· `canWrite=false` |

## 状态矩阵

| 状态 | UI |
|------|-----|
| 未连接 | 连接钱包 ▾ |
| Sheet 打开 | TravelTrustWalletSheet |
| 正在连接 | 正在等待钱包确认 |
| 用户拒绝 | 你取消了连接请求 |
| 钱包锁定 | 请先解锁钱包 |
| 无钱包 / unavailable | 安装钱包或使用 WalletConnect |
| 已连接正确网络 | ● 地址 ▾ |
| 已连接错误网络 | 网络不匹配 · 切换 |
| 切链拒绝 | 未切换网络… |
| 连接失效 | 连接已过期… |
| 只读 | 观察中 · 0x… |
| 多账户变化 | 账户已切换脉冲 |

## 明确不做

内置钱包 · 邮箱/社交钱包 · 私钥托管 · MPC · Passkey 智能钱包 · 充值/兑汇 · 多链资产总览 · 钱包恢复

## 环境

```bash
# 可选 · 未配置时 WC 行提示不可用，Injected 仍可用
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_CHAIN_ID=11155111   # 或 137 等目标链
```
