# PSG · Wallet Coverage Split（Extension ACTIVE · WC DEFERRED）

**Machine:** `TT_PSG_WALLET_COVERAGE_SPLIT`  
**Status:** **ACTIVE** · `2026-07-19`  
**机读：** [`registry/psg-wallet-coverage-split.v1.yaml`](../../registry/psg-wallet-coverage-split.v1.yaml)

```text
WalletConnect Project ID:     DEFERRED_EXPLICIT（非 Production Acceptance Blocker）
Extension / injected wallet:  当前 Web3 Wallet Capability 验证路径
Mobile QR / Deep Link:        发布后补
假 PASS 禁令:                 Extension PASS ≠ Security/Web3 100% ≠ GO
```

---

## 1 · 诚实拆分

| 能力 | 当前 Acceptance | 证据 |
|------|-----------------|------|
| **Extension Wallet**（EIP-6963 / injected / MetaMask 等） | **PASS_SLICE**（Capability-Ready） | `smoke-wallet-connection-l5-local` **PASS** · 28 tests · `vitest-extension-wallet` |
| **WalletConnect**（Project ID / QR / Deep Link） | **DEFERRED_EXPLICIT** | probe `KEY_ABSENT` · 产品诚实降级文案已存在 |
| **Security/Web3 Threshold** | **PARTIAL** | Extension PASS + WC Deferred + Timelock/48H Deferred · **≠ 100% PASS** |

产品已支持：WC 未配置时扩展钱包仍可连接（`wallet_wc_injected_still_ok`）· QR/Deep Link 后置。

---

## 2 · 与 Gate / Fix 的关系

| ID | 旧 | 新（Acceptance） |
|----|-----|------------------|
| `PFA-UI-WALLET-01` | Fix open · 阻塞全链 | **DEFERRED_EXPLICIT** · **不**挡 Production Acceptance Coverage |
| `PFA-UI-ROLE-02` | BLOCKED_BY_WC → OPEN_EXTENSION_PATH | **CLOSED_EXTENSION_PATH**（Track A）· WC 手机路径仍 Deferred |

全局 Gate 仍 `CONDITIONAL_GO` · **禁止**提前 GO。  
**Track A Final：** [TT-PSG-TRACK-A-FINAL-FREEZE-LATEST](./TT-PSG-TRACK-A-FINAL-FREEZE-LATEST.md) · **FROZEN** — Track B 不得回写。

---

## 3 · 当前 P0 执行序（更新）

1. Functional Domain（非 Web3 + 可验证切片）  
2. API Contract  
3. Data Consistency（CMS/Catalog/API/DB/UI）  
4. UI/UX P0  
5. Error Recovery  
6. Admin/Ops 首次切片  
7. RBAC（DEFER_DENOM 规则）  
8. **Extension Wallet Web3 Flow**  

**后置：** WC Project ID · Mobile/QR · 48H · Money-Path · Owner Sign-off  

**Staging 漂移审计（2026-07-22）：** [TT-PSG-STAGING-DISPLAY-WALLET-DRIFT-AUDIT-LATEST](./TT-PSG-STAGING-DISPLAY-WALLET-DRIFT-AUDIT-LATEST.md) — tip=`a9730cda` 仍含 **createPortal 弹窗**；① 下拉在未提交工作区 / 现行脏树部署包 · **须 commit 后才可重复部署不丢**。
