# TT · Protocol v2 Testnet Deployment Plan

**Machine:** `TT_PROTOCOL_V2_TESTNET_DEPLOYMENT_PLAN`  
**Status:** **PLAN_ARMED_AWAITING_GOVERNANCE_RC_CLOSED** · `2026-07-19`  
**机读：** [`registry/psg-protocol-v2-testnet-deployment-plan.v1.yaml`](../../registry/psg-protocol-v2-testnet-deployment-plan.v1.yaml)  
**证据：** [`PROTOCOL-V2-TESTNET-DEPLOYMENT-PLAN-LATEST.json`](../../evidence/GO_pre_eta_production_prep/full-capability-gap-closure-20260719/PROTOCOL-V2-TESTNET-DEPLOYMENT-PLAN-LATEST.json)  
**清单详表：** [Gov Prep + v2 Redeploy](./TT-FCG-PAY-01-GOV-RC-CLOSURE-PREP-V2-REDEPLOY-LATEST.md) · [Preauth](./TT-FCG-PAY-01-GOV-RC-CLOSURE-PREAUTH-LATEST.md)

```text
下一阶段主叙事:  Protocol v2 Testnet Deployment Plan
已退役主叙事:  「升级旧合约」作为主路径
硬闸:            不得跳过 Governance RC CLOSE
本窗:            仍 PLAN / PREAUTH_ONLY · 不编码 · 不广播 · 不宣称 PASS/GO
```

---

## 0 · 为什么不能跳过 Governance RC

已改变的是**协议规则**（不是单纯换地址）：

| 表面 | 变更性质 |
|------|----------|
| **FeeRouter** | V3.1.1 Distributable 路由（LEGACY 直付 / 旧桶 ≠ SSOT） |
| **Settlement** | Escrow → **SettlementRouter** 入口 |
| **Distributable** | 含 **SETTLEMENT_READY** · 禁止跳态 |
| **Steward Revenue** | Distributable × 45% / 否则 100% PRP |

因此 G-RC CLOSE = **「此版本协议规则可进入实现」** 的治理确认，不是走过场。

跳过后果（禁止）：

```text
直接部署 → 发现规则不一致 → 再次返工
```

---

## 1 · 正确顺序（写死）

```text
G-RC CLOSE                    (S0 · G-RC-05)
      ↓
Protocol Implementation       (S1 · Money-Path / M-RC-00 后编码)
      ↓
New Testnet Deploy            (S2 · CLEAN · fcg_full_capability_v2_sepolia)
      ↓
Full Capability Validation    (S3 · TRE/REG · Happy Path · Re-Audit)
```

| 禁止 | |
|------|--|
| 部署先于 G-RC CLOSE | **FORBIDDEN** |
| 以「升级旧合约」为主路径 | **SUPERSEDED**（改 CLEAN Protocol v2） |
| 现在就 Step 3 / 广播 | **FORBIDDEN** |

---

## 2 · 与「不升级、重新部署」的关系

| 判断 | |
|------|--|
| 技术路径 | **CLEAN 新部署** 仍正确（适合现阶段） |
| 治理路径 | **必须先** G-RC CLOSE，再实现，再部署 |
| 旧基线 | Cutover 后 `v311_sepolia_clean_baseline` → **LEGACY_READ_ONLY** |
| 旧证 | **禁止**作 `MAINNET_COMMERCIAL_FULL` 证据 |

部署清单仍用 **DEP-V2-01…08**（Escrow · SettlementRouter · FeeRouter · Distributable · Registry · Indexer · FE/API · Evidence）。

---

## 3 · 当前阻塞

`Governance RC = FROZEN_WAITING_EXECUTE` → 本 Plan **已武装、未授权实施/部署**。

下一 Owner 动作：走完 G-RC-01…05 → CLOSE（附 PREAUTH）→ 再进入本 Plan 的 S1。
