# Wallet Connection Center · Enterprise L5 Sign-off（①）

**日期：** 2026-07-14  
**目标：** 企业级 L5 生产标准签收（只连接 · 不托管 · 不创建钱包）  
**边界：** **②③ Gate 不变** · **非 Production GO** · **非 Staging 全矩阵 GO**  
**全仓模板地位：** 本模块 = [TT-MODULE-RELEASE-LADDER-V1](../../../docs/runbook/TT-MODULE-RELEASE-LADDER-V1.md) 标准样板（Guide / Provider / Order / Escrow / Governance / CMS / Admin 同五阶）

## Release Ladder（文首固定卡 · 全仓同长像）

```text
Wallet
Engineering      PASS
Automation       PASS
Real Device      BLOCKED
Staging          WAITING
Production       WAITING

Current Stage：Real Device（第3阶）
```

| Stage | Status | Exit Criteria（须满足才可 PASS） | Evidence | Gate |
|-------|--------|----------------------------------|----------|------|
| Engineering | PASS | 功能交付 · 契约/边界 · 单测/契约过 · 无未关 P0 | Logo · 安装分跳 · EIP-6963 · WC 工厂 · 账户/观察/错链 | ✓ |
| Automation | PASS | smoke exit 0 · 无 P0/P1 | `smoke-wallet-connection-l5-local.sh` · 31 tests · 2026-07-14 | ✓ |
| Real Device | BLOCKED | 真机 Manual UAT 全绿 · Owner 签收 | **缺** WC Project ID + B1–B4 + C1 + C2 | ✗ |
| Staging | WAITING | Staging 部署 + Regression 证据 PASS | 前阶未 PASS · 禁止部署作签收 | - |
| Production | WAITING | Entry Review + Go/No-Go + 上线（③） | 未进入 | - |

**模块签收：** **BLOCKED**（五阶未全 PASS）  
**驾驶舱：** [TT-MODULE-RELEASE-COCKPIT-LATEST](../../../docs/runbook/TT-MODULE-RELEASE-COCKPIT-LATEST.md)

## 自动化证据（本轮）

```text
bash scripts/dev/smoke-wallet-connection-l5-local.sh
→ TT_WALLET_L5_SMOKE: PASS
→ WalletStatusMini · WalletBrandIcon · walletConnectorCatalog ·
  deriveWalletPhase · walletConnectionCenter.contract · headerUtilityMenuUiFreeze
→ 31 passed
```

Presence 检查（不打印密钥）：

| 路径 | 状态 |
|------|------|
| `frontend/.env.local` · `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | **MISSING** |
| `deploy/fly/tt-web-staging/build.env.local` · 同上 | **MISSING** |

## 阻塞满分签收（必须 Owner / 本机真人）

Agent **不能**代替：登录 Reown、Chrome MetaMask 扩展确认框、手机钱包 Deep Link。

### Owner 顺序（唯一合法签收路径）

```bash
# C0 — Reown Cloud 建项目后（32-hex · 勿贴 git/聊天）
bash scripts/dev/set-walletconnect-project-id.sh '<YOUR_32_HEX_PROJECT_ID>'
# 重启本地 frontend（:3012）

# 然后在「带 MetaMask 的 Chrome」按 MANUAL-UAT.md 勾：
#   B1–B4  扩展连接 / 拒绝 / 多扩展
#   C1     桌面 WalletConnect QR
#   C2     手机 Deep Link 回站已连接
#   A5     未安装「安装」→ 各品牌官网（抽检）
#   D/E/F  账户菜单 · 切链 · 观察模式（若本轮未勾）

# 全部 ☐ → ✅ 后告诉 Agent「UAT 全绿」，再：
TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE=1 bash scripts/dev/deploy-tt-web-staging.sh
bash scripts/dev/smoke-wallet-connection-l5-local.sh
# 人工在 Staging 复勾 B/C 窄切片 → 更新本文件签收 = PASS
```

| # | 项 | 状态 | 谁 |
|---|-----|------|-----|
| C0 | Reown / WC Project ID | ❌ | Owner |
| B1–B4 | Chrome 扩展真连 | ❌ | Owner |
| C1 | 桌面 QR | ❌ | Owner |
| C2 | 手机 Deep Link | ❌ | Owner |
| Staging | 部署 + 复验 | ⏸ | UAT 全绿后 |

## 工程已交付（参考）

| # | 能力 | 状态 |
|---|------|------|
| 1 | 只连接 · 无 custody / mnemonic / embedded | ✅ |
| 2 | EIP-6963 multi-injected discovery | ✅ |
| 3 | Bitget + 分品牌 `WALLET_INSTALL_URL` | ✅ |
| 4 | `WalletBrandIcon`（6963 icon → SVG） | ✅ |
| 5 | 「安装」→ 品牌官网；已装 → connect；「当前」 | ✅ |
| 6 | WC 工厂 + metadata icons（**有 ID 时**） | ✅ 待 C0 |
| 7 | QR / Deep Link 文案分流 | ✅ |

## 「安装」跳转（验收抽检用）

| 品牌 | URL |
|------|-----|
| MetaMask | https://metamask.io/download/ |
| Rabby | https://rabby.io/ |
| OKX | https://www.okx.com/download |
| Bitget | https://web3.bitget.com/ww/wallet-download |
| Coinbase | https://www.coinbase.com/wallet/downloads |
| Trust | https://trustwallet.com/download |

## 边界（禁止假完成）

- 自动绿 **≠** 真机全绿 **≠** L5 满分签收  
- L5 满分签收 **≠** ② Staging 全矩阵 GO **≠** ③ Production GO  
- **禁止**在缺 C0/B/C 时把本文件改为 PASS  
