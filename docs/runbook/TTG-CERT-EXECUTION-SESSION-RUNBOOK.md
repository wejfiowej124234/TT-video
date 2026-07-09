# TTG Certification Execution Session Runbook

**Phase:** ② Sepolia · GovFreeze V2 Clean Baseline · **≠** ③ Production GO  
**Mode:** Certification-Only — Human · Operations · Disaster Recovery  
**SSOT:** [Final Closure Checklist §14](../spec/governance-token/TTG-GOVERNANCE-FINAL-CLOSURE-CHECKLIST.md) · [MTM 146 rows](../spec/governance-token/TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md)

---

## 0 · 诚实边界

| 动作 | 是否 = 完成 |
|------|-------------|
| `init-ttg-cert-execution-session.sh` | **否** — 仅建台账目录 |
| `run-govfreeze-v2-human-screen-acceptance-prep.sh` | **否** — 仅生成 A1–D4 清单 |
| Owner 录屏 + 截图 + signoff | **是** — 才可升 Tier |
| ② 机读 PASS / 四账 PASS | **否** — 禁止冒充 Human/Ops/DR |

**146 行总台账：** 全量跟踪；**Tier 升级** 仅按 §14 各 Cert 映射 ID，**禁止** Cert #1 一次性把 146 行标为 `HUMAN_DONE`。

**本地改动必跑（② · 与 ① FULL MASTER 分列）：** 动治理域 / Cert 脚本 / `governance-token` / HAT-R1 证据时，推送前跑 **`bash scripts/dev/run-ttg-governance-cert-post-change-gate.sh`**（机读 registry：**`registry/ttg-governance-cert-gates.v1.yaml`**）；**新 Cert #N** 落地后须写入 registry 并 **`python scripts/dev/validate-ttg-governance-cert-gates-registry.py`**。**≠** `run-phase1-convergence-post-change-gate.sh`（①）。

---

## 1 · 启动会话（一次性）

```bash
bash scripts/dev/init-ttg-cert-execution-session.sh
```

产出：

- `evidence/GO_ttg_cert/<stamp>/CERT-EXECUTION-LEDGER.v1.json` — **146 行**（含 cert_step / screenshot_slot）
- `evidence/GO_ttg_cert/<stamp>/human-uat/` — Cert #1 录屏/截图目录
- 链接最新 `GO_govfreeze_v2_human_screen_acceptance/<prep-stamp>/` 清单

**本地栈（②）：** API `http://127.0.0.1:8080` · FE `http://127.0.0.1:3012` · Sepolia 钱包

---

## 2 · Cert #1 · Human UAT（当前）

### 2.1 Owner 录屏（A1–D4 + 对照清单）

按 `human-uat/HUMAN-SCREEN-ACCEPTANCE-CHECKLIST.md` 或 prep-link 内清单：

| 段 | 路由/场景 | 录屏文件建议名 |
|----|-----------|----------------|
| A1–A6 | `/governance*` · `/market` · `/traveltrust` | `A1-governance-hub.mp4` … |
| B1–B4 | 多身份切换 | `B1-traveler.mp4` … |
| C1–C2 | Admin 只读/门闸 | `C1-admin-readonly.mp4` |
| D1–D4 | 45/55 · Treasury · Claim 边界 | `D1-cp-4555.mp4` |

保存至：`evidence/GO_ttg_cert/<stamp>/human-uat/recordings/`

### 2.2 146 行截图（台账）

对 **ledger 中 `cert_step=1`** 的行，保存截图至 ledger 指定 slot，例如：

`evidence/GO_ttg_cert/<stamp>/ledger-screenshots/CHK-FE-01.png`

对 **machine-only**（无 cert_step）行：在 ledger 备注 `MACHINE_TRACK` 或附 Phase A / 四账 JSON 路径，**不升 Tier**。

### 2.3 签核（升 Tier → HUMAN_DONE）

```bash
bash scripts/dev/complete-ttg-cert-step.sh \
  --cert 1 \
  --stamp <stamp> \
  --signer "Sebastian Ward"
```

**硬闸：** `recordings/` 至少 1 个文件 · 写入 `HUMAN-SCREEN-ACCEPTANCE-SIGNOFF.json` · 更新 **9 项** → `HUMAN_DONE`

---

## 3 · Cert #2～#12（顺序 · 不可跳）

| # | 名称 | Tier | 前置 |
|---|------|------|------|
| 2 | Multi Identity | HUMAN_DONE | Cert #1 ☑ |
| 3 | Admin | HUMAN_DONE | #2 ☑ |
| 4 | Safe | OPS_DONE | #3 ☑ |
| 5 | Finance | OPS_DONE | #4 ☑ |
| 6 | Phase B unpause | OPS_DONE | #5 ☑ · `HAT_R1_PHASE_B_PAUSED=0` · Timelock |
| 7 | Execute | OPS_DONE | #6 ☑ |
| 8 | Treasury Spend | OPS_DONE | #7 ☑ |
| 9 | Unstake | OPS_DONE | #8 ☑ |
| 10 | Incident Tabletop | DR_DONE | #9 ☑ |
| 11 | DR Drill | DR_DONE | #10 ☑ |
| 12 | GORP Signoff | OPS_DONE + Ent | #11 ☑ · `GORP-SIGNOFF.json` |

每步：证据写入 ledger 对应 `evidence_subdir` · 放置 `signoff_file` · 运行：

```bash
bash scripts/dev/complete-ttg-cert-step.sh --cert N --stamp <stamp> --signer "Sebastian Ward"
```

Phase B（#6～9）：`bash scripts/dev/run-hat-r1-phase-b-when-ready.sh`

### Phase B 三阶段（#7～#8 · ② 测试网）

**阶段口径：** ① 本地 **≠** ② Sepolia Cert 队列 **≠** ③ Production GO

| 阶段 | 只跑 | 说明 |
|------|------|------|
| **维护窗 · TL#1 前** | `run-phase-b-daily-maintenance.sh` | probe + post-change · 不触链 |
| **Wave 1 · TL#1 后**（一次性） | `run-phase-b-post-timelock-wave1.sh` | Cert **#7 闭环** → Cert **#8 queue** → **TL#2** |
| **维护窗 · TL#2 倒计时** | `run-phase-b-daily-maintenance.sh` | 同 TL#1 前 · 不 spend execute |

```bash
# 维护窗 — 每日唯一（TL#1 前 · Wave 1 后 · TL#2 倒计时）
bash scripts/dev/run-phase-b-daily-maintenance.sh

# Wave 1 — TL#1 到期后一次性
export HAT_R1_LIVE_WALLET_OK=1
export HAT_R1_PHASE_B_PAUSED=0
bash scripts/dev/run-phase-b-post-timelock-wave1.sh --signer "Sebastian Ward"

# Wave 1 完成后回到维护窗
bash scripts/dev/run-phase-b-daily-maintenance.sh
```

**当前轮次止于 TL#2 维护窗** — spend execute 须另开 Owner 决策 + `HAT_R1_ALLOW_SPEND_EXECUTE=1`。

---

## 4 · 机读键（签核后自动刷新）

`python scripts/dev/apply-ttg-cert-tier-upgrades.py` 更新：

- `TTG-GOVERNANCE-MASTER-TRACEABILITY-MATRIX.md`
- Final Closure Checklist 文首 Human/Ops/DR % · `CERT_QUEUE=n/12`

**Enterprise 100/100：** 12/12 Cert · Human 58/58 · Ops 34/34 · DR 20/20 · `GECP-SIGNOFF.json`
