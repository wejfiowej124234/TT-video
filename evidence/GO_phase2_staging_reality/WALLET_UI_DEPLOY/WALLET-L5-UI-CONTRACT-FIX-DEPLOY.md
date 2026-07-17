# Wallet L5 UI · Contract Correction Deploy（Staging）

**KIND:** `L5_UI_CONTRACT_FIX`（**不是**新功能部署）  
**STATUS:** `PASS`（deploy OK · locale/JS markers live）  
**Recorded UTC:** 2026-07-17T14:06:12Z  
**App:** https://tt-web-staging.fly.dev  
**Fly image:** `registry.fly.io/tt-web-staging:deployment-01KXR5WBYQFEXA28CPVMKX5HWJ`

## Scope（仅契约落地）

| Fix | Meaning |
|-----|---------|
| `brandKey` 回传 | RecommendedCell → WalletBrandIcon |
| `WalletBrandIcon` | 品牌 SVG / EIP-6963 icon 恢复 |
| 官方安装 URL | 未安装行 → `WALLET_INSTALL_URL` |
| 文案 | `WalletConnect 未配置`（KEY_ABSENT） |

## Machine verify

- `GET /` → 200
- Locale chunk contains: `WalletConnect 未配置` · `没有安装钱包？` · `查看安装帮助`
- Gates unchanged: OA-01 **BLOCKED** · OA-02 **LOCKED_BY_OA01**
- PSG / Tag / Release Archive **untouched**

## Explicit non-goals

- 不新增钱包能力 · 不伪造 WC 可用 · 不验 QR / Deep Link
