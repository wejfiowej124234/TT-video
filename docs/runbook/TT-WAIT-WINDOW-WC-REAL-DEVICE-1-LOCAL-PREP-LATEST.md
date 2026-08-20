# TT · Wait Window · WC-REAL-DEVICE-1（LATEST）

**STATUS:** `WC_REAL_DEVICE_CLOSED` · **Stamp:** `2026-08-12T08:04:21.068Z`
**Mode:** Owner 真机/浏览器钱包 · **wallet_keys_used:** `false`
**`TT_PRODUCTION_GO`:** `NO_GO`

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

## Owner marks

| ID | Status | Device / Wallet | Notes |
|----|--------|-----------------|-------|
| WC-CONNECT | PASS | desktop_browser / Bitget Wallet | Official connect request UI + connected header 0xe1e7…CdD4; shots 01+02 |
| WC-CHAINID-1 | PASS | desktop_browser / Bitget Wallet | Bitget network=Ethereum; UI label Ethereum - Bitget Wallet (chainId=1 aligned with /meta) |
| WC-ADDRESS-BIND-BOUNDARY | PASS | desktop_browser / Bitget Wallet | Menu shows 钱包会话 · 不等于网站账号登录; address displayed; TTG role chip separate |
| WC-DISCONNECT-RECONNECT | PASS | desktop_browser / Bitget Wallet | Owner confirmed disconnect then reconnect OK; shots 03 disconnected CTA + 04 reconnected 0xe1e7… |
| WC-REFRESH-PERSIST | PASS | owner_attested_real_device / WalletConnect / injected as used | Owner attested hard-refresh persist OK (no screenshot this round) |
| WC-REJECT-CONNECT | PASS | owner_attested_real_device / WalletConnect / injected as used | Owner attested reject/cancel connect OK (no screenshot this round) |
| WC-WRONG-CHAIN | PASS | owner_attested_real_device / WalletConnect / injected as used | Owner attested wrong-chain tip + return Mainnet/chainId=1 OK (no screenshot this round) |
| WC-SIGN-UI | PASS | owner_attested_real_device / WalletConnect / injected as used | Owner attested sign UI OK; zero-value only / no funds broadcast (no screenshot this round) |
| WC-MOBILE-DEEPLINK-OR-QR | PASS | phone_wallet_app + desktop Official / WalletConnect (Owner: phone scan login OK) | Owner confirmed 手机扫码能登录没有问题 — scan→confirm→Official return; chainId=1/address to reconfirm on connected header |

## Coverage gaps (carried)

- **REGION_STEWARD_SLOT**: Carried from CERT-OWNER-UAT-1 — 不插队；不得用 Admin 冒充补绿
- **PURE_C3_GUIDE_VS_C4_MERCHANT_ISOLATION**: Carried from CERT-OWNER-UAT-1 — 不插队；需独立 C3/C4
- **OFFICIAL_WALLETCONNECT_PROJECT_ID**: Official WalletConnect 未配置 · QR/Deep Link STOP until KEY_PRESENT + FE rebuild

## Next

Legal/支付 PRE_GO → Final Regression/Soak → fresh Hard Gate · FeeRouter/Track2/83 未授权 · **NO_GO**

*Sebastian Ward · Solo · WC_REAL_DEVICE_CLOSED · NO_GO*
