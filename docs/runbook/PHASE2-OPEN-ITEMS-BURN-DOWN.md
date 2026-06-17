# Phase ② Open 项 Burn-down · 仅留时间闸 + 人工闸

**阶段口径：** ① 本地 → **② 测试网** → ③ 公网/生产

**扫描日：** 2026-06-17  
**机读键：** `TT_PHASE2_OPEN_BURN_DOWN: REMAINING=TIME+HUMAN+SOAK+WALLET`

**诚实边界：** Closing Gap **`PHASE2_GO_READY`** **≠** Perfect Validation **`GO`** **≠** TTG Enterprise **100/100** **≠** ③ Production GO。

---

## 1 · 已关闭（不依赖 Timelock / 真人钱包 / 72h Soak）

| ID | 说明 | 证据 |
|----|------|------|
| **G-0～G-4** | 启动闸 · G-1/G-2/G-4 机读绿 | [PHASE2-REPOSITORY-STATUS](./PHASE2-REPOSITORY-STATUS.md) · [`closing-gap/STATUS.txt`](../../evidence/GO_phase2_testnet_20260526/closing-gap/STATUS.txt) |
| **Closing Gap G1–G7** | 宽轨 GO Ready（G7=PREP_PASS） | [PHASE2-CLOSING-GAP](./PHASE2-CLOSING-GAP.md) |
| **社区 C1–C12** | ② 槽 12/12 PASS | [TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION](./TT-PHASE2-COMMUNITY-MATRIX-FINAL-ATTESTATION.md) |
| **TN-P1-001～008** | ADM-U02 · HAT · 商家 · 收购 · Stake · Escrow · PSP | [TESTNET-PERFECT-VALIDATION-REPORT](./TESTNET-PERFECT-VALIDATION-REPORT.md) |
| **TTG Cert #1–#6** | Human/Ops tier · active=#7 | [TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST](../spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) §14 |
| **D1–D10 漂移** | 治理文档机读对拍 | `evidence/GO_governance_doc_drift_cleanup/` |
| **Phase B 维护窗** | daily + Wave1/TL#2 脚本闸 | [TTG-CERT-EXECUTION-SESSION-RUNBOOK](./TTG-CERT-EXECUTION-SESSION-RUNBOOK.md) |
| **RB-12** | Sepolia RPC 502 重试 | `scripts/dev/lib/hat-r1-evidence-lib.sh` · `hat_r1_cast_rpc` |
| **DOC-SYNC** | START-CHECKLIST G-1/G-2/G-4 与 REPOSITORY-STATUS 对齐 | 本文 §4 |

**日常复验：**

```bash
bash scripts/dev/run-phase-b-daily-maintenance.sh
bash scripts/dev/run-phase2-open-items-closure-scan.sh
```

---

## 2 · 剩余 Open（仅四类闸）

### 2.1 时间闸 · TIME

| ID | 说明 | 解锁 |
|----|------|------|
| **CERT-7 / TL#1** | Execute · Cert #7 闭环 | `EXECUTE_EARLIEST_UNIX` 后 · Wave 1 |
| **CERT-8 / TL#2** | Treasury queue → spend | Wave 1 queue → TL#2 倒计时 → Owner 另决 Wave 2 |
| **CP-G-04** | Settlement `splitNetProfit` 执行 | 合约部署 + Timelock allowlist 后 |

### 2.2 72h Soak 闸 · SOAK

| ID | 说明 | 解锁 |
|----|------|------|
| **TN-P1-009 / G-06** | P2FC **72h** staging soak | `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json` |
| **G-03 / G-04** | Readiness **100** · `TT_TESTNET_PERFECT_VALIDATION_GO: GO` | TN-P1-009 + TN-P1-010 后 |

### 2.3 真人钱包闸 · WALLET

| ID | 说明 | 解锁 |
|----|------|------|
| **CERT-7–9** | Execute · Spend · Unstake 链上 tx | `HAT_R1_LIVE_WALLET_OK=1` · Wave 1/2 |
| **RB-02/06/07/10/11** | EIP-712 · stake claim · distribution · steward dual-track | Sepolia 签名 / 测试 ETH |
| **ONB-P2-005** | Stripe test refund ② 证据 | Dashboard test PI refund |

### 2.4 人工闸 · HUMAN

| ID | 说明 | 解锁 |
|----|------|------|
| **CERT-10–12** | Tabletop · DR drill · GORP/GECP | Owner 签字 · 录屏 · `complete-ttg-cert-step.sh` |
| **HC-77** | Human cert 矩阵 77 行 | Cert 队列 + UAT 录屏 |
| **ENT-146** | Enterprise Ent ☑ 全表 | §14 **12/12** |
| **G-09** | Testnet graduation Owner signoff | G-01～G-08 全 AND |
| **COM-②-7** | C9 视觉复签 | Founder visual review |
| **G24-P-11** | Legal LEG-XJ-05 | Legal signoff checklist |
| **R-01** | 外部安全审计 | ③ 前 · 非 ② 阻塞 Wave 1 |

### 2.5 运行时闸 · OPS（非 soak · 须 staging 长跑）

| ID | 说明 | 备注 |
|----|------|------|
| **SHA-SYNC** | local HEAD = staging `/meta.build.git_sha` | `run-phase2-testnet-full-sync-deploy.sh --full` · 须 commit + 解除 staging freeze |
| **TN-P1-010 / G-07** | Indexer deep reconcile | staging + `DATABASE_URL` · 可与 soak 并行 |
| **COM-②-4～6/8** | UGC 持久化 · drawer E2E · notifications · CDN video | staging 实施 · **非** Timelock |
| **D-4555-B** | CountryPoolSettlement 合约 | **开发轨** · 非 cert-only · 不冒充 ② GO |

> **纪律：** 上表 **运行时闸** 在 soak 窗口并行推进；**不**扩 governance 参数/Tokenomics；**不**跳 Wave 1 前触链。

---

## 3 · 执行序（② ACTIVE）

```
维护窗 daily ──► TL#1 ──► Wave 1 (#7+#8 queue) ──► TL#2 daily
     │                                              │
     └─ TN-P1-010 indexer（并行）                    └─ soak 72h（并行）
                                                      └─ CERT 10–12 human（并行）
```

---

## 4 · 文档对拍（DOC-SYNC · 已闭）

| 文档 | 旧态 | 现行 SSOT |
|------|------|-----------|
| [PHASE2-START-CHECKLIST](./PHASE2-START-CHECKLIST.md) G-1/G-2 | 待确认/待部署 | **机读绿** · REPOSITORY-STATUS |
| [PHASE2-ENTERPRISE-GAP-AUDIT](./PHASE2-ENTERPRISE-GAP-AUDIT.md) 文首 | NOT STARTED | **Closing Gap GO Ready** · 本表 §2 剩余项 |

---

## 5 · 扫描命令

```bash
bash scripts/dev/run-phase2-open-items-closure-scan.sh
# 末行 TT_PHASE2_OPEN_BURN_DOWN: REMAINING=TIME+HUMAN+SOAK+WALLET
```

**Wave 1（TL#1 后 · 一次性）：**

```bash
export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0
bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"
bash scripts/dev/probe-phase-b-timelock-countdown.sh   # MODE=TL2_COUNTDOWN
```
