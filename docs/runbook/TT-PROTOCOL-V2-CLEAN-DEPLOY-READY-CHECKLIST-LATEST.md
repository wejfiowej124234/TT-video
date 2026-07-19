# TT · Protocol v2 Clean Deploy Ready Checklist（WAIT_WINDOW 准备）

**Machine:** `TT_PROTOCOL_V2_CLEAN_DEPLOY_READY_CHECKLIST`  
**Status:** **G_RC_CLOSED · CDR-19 IN_PROGRESS · CLEAN_DEPLOY_LOCKED** · `2026-07-19`  
**机读：** [`registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml`](../../registry/psg-protocol-v2-clean-deploy-ready-checklist.v1.yaml)  
**统一终局矩阵：** [TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST](./TT-PSG-PRODUCTION-COMPLETION-MATRIX-LATEST.md)  
**G-RC CLOSED：** [`G-RC-CLOSED-OWNER-DECLARATION-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/G-RC-CLOSED-OWNER-DECLARATION-LATEST.json)  
**Dirty Audit：** [`CDR-19-DIRTY-AUDIT-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CDR-19-DIRTY-AUDIT-LATEST.json)  
**CDR-19：** [`CDR-19-RELEASE-IDENTITY-CLOSURE-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/CDR-19-RELEASE-IDENTITY-CLOSURE-LATEST.json)

```text
G-RC CLOSED ✅ · CDR-19 Dirty Audit ✅ · 等 Owner Release Scope 确认
启发式: Release≈452 · Evidence≈110 · Temp≈3 · FCG相关≈131
Clean Deploy LOCKED · 未确认 Scope 前禁止 Commit/Pin/Deploy
```


---

## 0 · 环境对齐快照

| 面 | 观察 | 结论 |
|----|------|------|
| **Git Local** | `feature/g23-04-abi-event-freeze` @ `f8181b63…` · ahead **16** · dirty **545** | SHA 基线已记；广播前须 commit/sync |
| **Registry ACTIVE** | `v311_sepolia_clean_baseline` | **正确未翻转** |
| **计划 ACTIVE** | `fcg_full_capability_v2_sepolia` | Cutover 后旧基线 → **LEGACY_READ_ONLY** |
| **Contracts prep** | `ISettlementRouter` + `SettlementRouter` + `DeployFcgFullCapabilityV2Sepolia` | **源码已落 · 未部署** |
| **SM** | `SERVICE_FEE_SETTLEMENT_READY` + LEGACY_COMPAT `LOCKED→DISTRIBUTABLE` | Escrow 接线仍 post-G-RC |
| **Evidence** | `evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/` | pending pack 已建；广播产物仍 TBD |
| **G-RC** | ETA `2026-07-20T11:37:37Z` | WAIT_WINDOW · 未 CLOSED |

---

## 1 · Clean Deploy Ready Checklist（CDR）

| ID | 项 | Ready？ |
|----|-----|:------:|
| CDR-01 | G-RC-05 CLOSED | ❌ |
| CDR-02 | PREAUTH / Step2.5 / Ladder Lock 附卷 | ✅ |
| CDR-03 | `SettlementRouter.sol` 存在 | ✅ prep · 未部署 |
| CDR-04 | Escrow→SettlementRouter 接线 | ✅ ① forge L5-A · Sepolia wired factory/五层仍 OPEN · l5_pass=false |
| CDR-05 | FeeRouter V3.1.1 Distributable 可部署 | ◐ 源码有 · 接线待 |
| CDR-06 | Distributable + SETTLEMENT_READY 可观测 | ◐ 枚举有 · Escrow 未重绑 |
| CDR-07 | `fcg_full_capability_v2_sepolia` Deploy script | ✅ 广播硬闸 |
| CDR-08 | Registry cutover 方案 | ✅ |
| CDR-09 | Indexer 重绑方案 | ✅ |
| CDR-10 | FE/API env 重绑方案 | ✅ |
| CDR-11 | Evidence 根 `GO_phase2_fcg_full_capability_v2_sepolia` | ◐ pending 有 · broadcast 无 |
| CDR-12 | 禁广播 Money-Path 相关新合约（至 G-RC CLOSED） | ✅ 本窗强制 |
| CDR-13 | Local↔Git↔Staging SHA 对齐 | ◐ 基线已记 · dirty/ahead 未清 |
| CDR-14 | G-RC CLOSED 后立即最新 Clean Deploy · **不用旧基线** | ✅ 策略锁死 |
| CDR-15 | FG-Web3 Audit Matrix staged | ✅ |
| CDR-16 | FGCASE-01…15 Coverage Cases staged | ✅ · 未执行 |
| CDR-17 | Chain↔Indexer↔API↔DB↔UI verify harness | ✅ PREP_ONLY |
| CDR-18 | FG Evidence Schema + Threshold denom=15 对齐 | ✅ |
| CDR-19 | **Release Identity**（Production Certification 硬条件）· 等价链 SHA=Artifact=Bytecode=Evidence · 禁止提前清 dirty | ❌ 等 G-RC CLOSED |

**本清单 ≠ Deploy Ready PASS ≠ 授权广播 ≠ FG 0/15 变 PASS。**

### G-RC 解锁后立即跑

```bash
# 1) Clean Deploy（须 GOVERNANCE_RC_CLOSED=1 + 广播 OK 环境变量）
# 2) 一致性（live）
GOVERNANCE_RC_CLOSED=1 TT_FG_VERIFY_LIVE=1 TT_FG_VERIFY_API_BASE=https://... \
  python scripts/dev/verify-fg-web3-chain-indexer-api-db-ui-prep.py
# 3) 填 FGCASE 结果 → Measurement FG n/15 → 五柱 Completion
```

---

## 2 · 待执行包入口

```bash
# 刷新 pending pack + Git SHA 基线（不广播）
bash scripts/dev/run-fcg-v2-evidence-pipeline-prep.sh

# 本地 dry（禁止 --broadcast；且无 FCG_V2_WANT_BROADCAST=1）
cd contracts && forge script script/DeployFcgFullCapabilityV2Sepolia.s.sol \
  --rpc-url <sepolia_or_anvil> --private-key $PRIVATE_KEY
```

广播硬闸（**仅 G-RC CLOSED 后**）：`GOVERNANCE_RC_CLOSED=1` · `TRAVELTRUST_FCG_V2_BROADCAST_OK=1` · `FCG_V2_WANT_BROADCAST=1` · `chainid=11155111`

---

## 3 · 本窗禁止（写死）

| 禁止 |
|------|
| 广播 Settlement / Money-Path FeeRouter / Distributable **新**合约 |
| Escrow↔SettlementRouter 接线并上链 |
| `active_deploy_baseline` 切到 v2 |
| 宣称 Production GO |
| 用 `v311_sepolia_clean_baseline` 冒充后续 Full Capability 商业闭环 SSOT |

---

## 4 · G-RC CLOSED 后立即（写死）

```text
G-RC CLOSED
  → Escrow wire → SettlementRouter（按 Exit Criteria）
  → CLEAN deploy fcg_full_capability_v2_sepolia（最新候选 SHA）
  → ACTIVE 翻转 · 旧基线 LEGACY_READ_ONLY
  → Indexer + FE/API 重绑 + Evidence broadcast 产物
  → 仅新栈做 TRE/REG / Step3
```
