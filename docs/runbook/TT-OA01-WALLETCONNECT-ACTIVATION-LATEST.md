# OA-01 · WalletConnect Activation（LATEST）

**STATUS:** **BLOCKED**（仅 WalletConnect 激活）  
**Machine:** `WC_PROJECT_ID: KEY_ABSENT`  
**Companion:** Wallet L5 UI = **ENGINEERING_CLOSED**（见 `evidence/GO_phase2_staging_reality/WALLET_UI_DEPLOY/`）· 不再迭代 UI；本闸仅 WC Project ID / QR / Deep Link

## Gate split（写死）

```text
Wallet L5 UI              → ENGINEERING_CLOSED（Injected / Sheet 已收口 · 停迭代）
OA-01 WalletConnect       → BLOCKED until KEY_PRESENT（诚实降级「未配置」）
OA-02 Real Device QR/DL   → LOCKED_BY_OA01
```

`KEY_ABSENT` **不**阻塞钱包 UI 上线；只阻塞 WalletConnect QR / Deep Link 与 OA-02。

## Exit（本闸）

`WC_PROJECT_ID: KEY_PRESENT` + probe PASS + Staging rebuild + QR/Deep Link 验证

## Owner 步骤（禁 Git 提交密钥）

1. Reown Cloud 创建 32-hex Project ID，绑定 `tt-web-staging.fly.dev`
2. `bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'`
3. `node scripts/dev/probe-walletconnect-project-id.cjs` → KEY_PRESENT
4. 重建 Staging Web
5. 验证 QR / Deep Link → 解锁 OA-02

## Forbidden

- 用 KEY_ABSENT 否决已部署的 Injected / View-only UI
- 绕过 KEY_PRESENT 宣称 OA-02 PASS
- 修改 PSG / Release Archive / Tag
- 提交 `.env*` / Project ID 进 Git
