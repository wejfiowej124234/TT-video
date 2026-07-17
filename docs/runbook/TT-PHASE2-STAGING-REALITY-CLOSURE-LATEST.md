# TT · Phase② Staging Reality Closure（LATEST）

**Status:** `ACTIVE`  
**Machine:** [`registry/phase2-staging-reality-closure.v1.yaml`](../../registry/phase2-staging-reality-closure.v1.yaml)  
**Baseline:** Tag `v1.1.0-psg-go.20260717` · `TT_PRODUCTION_GO: GO`（**不重开**）  
**Evidence root:** `evidence/GO_phase2_staging_reality/`

---

## 0 · 一句话

独立批次收口 **② Staging Reality**。  
**禁止**整体 `git stash pop stash@{0}` · **禁止**改 Tag/Archive · **禁止**在 Phase② 未 CLOSED 前做 **OA-04** 生产密钥/正式部署。

---

## 1 · 顺序（写死）

```text
OA-01 WalletConnect Project ID + 只读探针
        │  KEY_PRESENT 后才解锁
        ▼
OA-02 P1 真人设备验收（四卡原子）
        │
        ▼
Ambient SLA · Guest/Public HOLD（增量）
        │
        ▼
OA-03 Timelock Execute（Owner 钱包签名）
        │
        ▼
TT_PHASE2_STAGING_REALITY: CLOSED
        │
        ▼
OA-04（另批 · 生产密钥 / 正式部署）
```

| 步 | 状态 | Exit |
|----|------|------|
| **OA-01** | **BLOCKED**（待 Owner Project ID） | `WC_PROJECT_ID: KEY_PRESENT` + probe PASS |
| **OA-02** | LOCKED_BY_OA01 | `TT_REAL_DEVICE_BATCH_P1: PASS` |
| Ambient / Guest | WAITING | 分项 Evidence PASS |
| **OA-03** | WAITING | Timelock tx Evidence |
| **OA-04** | FORBIDDEN | Phase② CLOSED 后另开 |

---

## 2 · OA-01（当前焦点）

1. Owner 在 https://cloud.reown.com 创建 Project ID（32-hex），绑定 Staging 域名 `tt-web-staging.fly.dev`  
2. 注入（**勿 commit 密钥**）：

```bash
bash scripts/dev/set-walletconnect-project-id.sh '<32-hex-project-id>'
node scripts/dev/probe-walletconnect-project-id.cjs
# 期望: WC_PROJECT_ID: KEY_PRESENT
```

3. Staging Web 重建（需 KEY_PRESENT 后 · Owner 授权）：

```bash
bash scripts/dev/deploy-tt-web-staging.sh
```

4. Evidence → `evidence/GO_phase2_staging_reality/OA-01/`

**诚实：** Capability-Ready ≠ WalletConnect 已可用；`KEY_ABSENT` 时 WC 诚实降级（仅 injected）。

---

## 3 · 与 PSG 的边界

| 保留 | 本批不做 |
|------|----------|
| Tag / Archive / `TT_PRODUCTION_GO: GO` | 扩 PSG SSOT |
| Solo Workflow + W5 | 整体恢复 stash@{0} |
| 干净工作区纪律 | 生产 Deploy / OA-04 |
