# OA-01 · WalletConnect Activation（LATEST）

**STATUS:** **BLOCKED**  
**Machine:** `WC_PROJECT_ID: KEY_ABSENT`（见 `evidence/GO_phase2_staging_reality/OA-01/WC-PROJECT-ID-PROBE-LATEST.json`）

## Exit

`WC_PROJECT_ID: KEY_PRESENT` + 只读探针 PASS +（可选）`tt-web-staging` 重建验证 QR/Deep Link

## Owner 步骤（禁 Git 提交密钥）

1. Reown Cloud 创建 32-hex Project ID，绑定 `tt-web-staging.fly.dev`
2. `bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'`
3. `node scripts/dev/probe-walletconnect-project-id.cjs` → KEY_PRESENT
4. Owner 授权后重建 Staging Web
5. 验证 QR / Deep Link → 才解锁 OA-02

## Forbidden

- 绕过 OA-01 进入 OA-02 / OA-04
- 修改 PSG / Release Archive / Tag
- 提交 `.env*` / Project ID 进 Git
