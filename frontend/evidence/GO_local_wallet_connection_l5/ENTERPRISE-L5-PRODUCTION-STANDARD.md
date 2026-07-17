# Wallet Connection Center · 企业级 L5 生产标准对照（①）

**边界：** 只连接 · 不创建钱包 · 不托管私钥/助记词 · **≠** Production GO · Staging 晋级受 [Real Device Batch](../../../evidence/GO_module_release_ladder/REAL-DEVICE-BATCH-P1.md) 原子规则约束。

| # | 能力 | Engineering | Automation | Real Device | Staging |
|---|------|-------------|------------|-------------|---------|
| 1 | 只连接 / 无 custody UI | ✅ | ✅ 契约 | ☐ Owner | — |
| 2 | EIP-6963 / EIP-1193 扩展 | ✅ | ✅ | ☐ B1–B4 | — |
| 3 | 主流推荐品牌 + Logo | ✅ | ✅ | ☐ | — |
| 4 | 未安装 → 分品牌官方安装页 | ✅ | ✅ URL 单测 | ☐ A5 | — |
| 5 | 安装回站自动重检（reload） | ✅ `installRedetect` | ✅ vitest | ☐ A5 回站 | — |
| 6 | 已安装 → 直接 connect | ✅ | ✅ | ☐ B2 | — |
| 7 | WalletConnect 工厂 + metadata | ✅ | ✅（需 Project ID） | ☐ C0–C2 | ☐ |
| 8 | 桌面 QR / 手机 Deep Link | ✅ `device.ts` | ☐ | ☐ C1 / C2 | ☐ |
| 9 | 切链 · 切账户 · 断开 · 观察 | ✅ | ✅ 相位/守卫 | ☐ D/E/F | — |
| 10 | 异常态（拒连/锁定/过期/错链） | ✅ `classifyConnectError` | ✅ | ☐ | — |
| 11 | 本地绿集 smoke | — | ✅ `smoke-wallet-connection-l5-local.sh` | — | — |
| 12 | Staging 回归 | — | — | 前阶须 Batch PASS | ☐ |

## Ladder（诚实）

见 [SIGNOFF-LATEST.md](./SIGNOFF-LATEST.md) · 当前卡点 **Real Device（第3阶）** · 归属 **P1 Real Device Batch**。

**正式：** Real Device = **BLOCKED** · Staging = **WAITING**（见 SIGNOFF）。  
**两层：** Capability-Ready（扩展 + 诚实降级）≠ WalletConnect Activation（Project ID / QR / Deep Link）。  
**禁止**把「代码具备 / 已部署 Staging」写成 Real Device 或 Staging PASS。

## Capability-Ready（可先本地 ↔ Staging 对齐）

扩展发现 · 安装跳转 · redetect · 连接/切链/断开/观察 · 未配置 WC 时诚实降级文案。  
机读：`bash scripts/dev/smoke-wallet-connection-l5-local.sh`

## WalletConnect Activation（后置硬闸）

KEY_PRESENT → QR / Deep Link smoke → 真人手机 → 再进 P1 Real Device Batch。

## Real Device Exit Criteria（最终版 · FROZEN）

B1–B4 · C1 · C2 · A5 · D · E · F · WC Project ID → `TT_REAL_DEVICE_BATCH_P1: PASS` → Staging 第4阶指针。