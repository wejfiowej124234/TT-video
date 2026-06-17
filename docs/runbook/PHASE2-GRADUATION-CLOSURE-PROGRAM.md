# Phase ② · 毕业闭环总程序（冻结基线 8dcd304a）

**阶段口径：** ① 本地 → **② 测试网** → ③ 公网/生产

**冻结 SHA：** `8dcd304afae1bafe5a4de738175e171256a9501e` · `TESTNET_STAGING_FREEZE: ACTIVE`  
**纪律：** 无 redeploy · 无 fly secrets · 无 migrations · 无功能扩面 — **仅**阻塞性 P0 + Owner 决策

**诚实边界：** 本程序 **≠** Wave 1/Soak/真人验收自动完成 **≠** `TT_TESTNET_PERFECT_VALIDATION_GO: GO` **≠** ③ Production GO

---

## 执行序（Owner · 写死）

| # | 闸 | 执行方 | 脚本 / 判据 |
|---|-----|--------|-------------|
| 0 | **TL#1 前** | Agent | **仅** `run-phase-b-daily-maintenance.sh` |
| 1 | **TL#1 · Wave 1** | **Owner 钱包** | `run-phase-b-post-timelock-wave1.sh` — Cert #7 execute+finalize · Cert #8 **queue only** · **写入 TL#2** |
| 2 | **TN-P1-009 · 全新 72h Soak** | Agent | Wave 1 后 · `P2FC_SOAK_SUPERSEDE=1` + `record-tn-p1-009-p2fc-soak-start-staging-evidence.sh` → `COMPLETED.json` |
| 3 | **TN-P1-010 · 复跑** | Agent | **Soak COMPLETED 后** · `record-tn-p1-010-indexer-reconcile-staging-evidence.sh` · 毕业闸：`release_gate=GO` + `freeze_git_sha=8dcd304a` + 证据 stamp **晚于** soak `completed_at`（历史报告 alone ≠ PASS） |
| 4 | **HAT-R1 真人钱包** | Owner | `run-hat-r1-sepolia-live-wallet.sh` |
| 5 | **Cert #10–#12** | Owner | Tabletop · DR · GORP · `complete-ttg-cert-step.sh` |
| 6 | **Phase ② Graduation** | Owner | `run-phase2-testnet-post-soak-graduation-closure.sh` → `TT_TESTNET_PERFECT_VALIDATION_GO` |

**本轮毕业路径不含 Wave 2 spend execute**（Cert #8 TL#2 链上 spend 另闸 · 不阻塞 Soak / TN-P1-010 / HAT-R1 / Cert #10–#12 / Graduation 序）。

**纪律：** 冻结 `8dcd304a` · 无 redeploy · Soak 须 **全新 job**（`P2FC_SOAK_SUPERSEDE=1`）· 旧僵死 job 不计。

---

## 一键状态 / 编排

```bash
export HTTPS_PROXY=http://127.0.0.1:15715

# 只读状态
bash scripts/dev/run-phase2-graduation-closure-program.sh --status

# 当前阶段（PRE_TL1 → 仅 maintenance）
bash scripts/dev/run-phase2-graduation-closure-program.sh --step maintenance

# TL#1 后 · Owner 钱包 Wave 1（含 Cert #8 queue → 写入 TL#2）
export HAT_R1_LIVE_WALLET_OK=1 HAT_R1_PHASE_B_PAUSED=0
bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"

# 全新 72h Soak
export P2FC_SOAK_SUPERSEDE=1
bash scripts/dev/record-tn-p1-009-p2fc-soak-start-staging-evidence.sh

# Soak COMPLETED 后 · 复跑 TN-P1-010
bash scripts/dev/run-phase2-graduation-closure-program.sh --step tn-p1-010

# 依次 · HAT-R1 → Cert #10–#12 → Graduation（Owner）
bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --phase a
bash scripts/dev/complete-ttg-cert-step.sh --cert 10 --stamp <stamp> --signer "Sebastian Ward"
# … Cert 11 · 12 …
bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh
```

---

## 分项 SSOT

| ID | Runbook / 证据 |
|----|----------------|
| TN-P1-009 | `record-tn-p1-009-p2fc-soak-start-staging-evidence.sh` · `evidence/P2FC_SOAK_72H_STAGING/` |
| TN-P1-010 | `record-tn-p1-010-indexer-reconcile-staging-evidence.sh` |
| Cert #7–#9 | [TTG-CERT-EXECUTION-SESSION-RUNBOOK](./TTG-CERT-EXECUTION-SESSION-RUNBOOK.md) |
| HAT-R1 | `run-hat-r1-sepolia-live-wallet.sh` · `evidence/GO_hat_r1_sepolia/` |
| 毕业闸 | [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD](./TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md) |

---

## Cert #10–#12（人工 · 不可机读代跑）

| Cert | 名称 | signoff |
|------|------|---------|
| 10 | Incident Tabletop | `INCIDENT-TABLETOP-SIGNOFF.json` |
| 11 | DR Drill | `DR-DRILL-SIGNOFF.json` |
| 12 | GORP Signoff | `GORP-SIGNOFF.json` |

```bash
bash scripts/dev/complete-ttg-cert-step.sh --cert N --stamp <stamp> --signer "Sebastian Ward"
```

末行目标：`TTG 12/12 Closure Report` · `TT_TESTNET_PERFECT_VALIDATION_GO: GO`
