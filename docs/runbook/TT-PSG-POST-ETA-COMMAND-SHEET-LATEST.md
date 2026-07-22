# PSG · Post-ETA Command Sheet（预备 · 对齐 FINAL RELEASE）

> **FINAL RELEASE ALIGNED（2026-07-22）**  
> 活体执行链 SSOT：[TT-PROJECT-A-FINAL-RELEASE-CHAIN-ALIGNMENT-LATEST](./TT-PROJECT-A-FINAL-RELEASE-CHAIN-ALIGNMENT-LATEST.md)  
> Pin `PSG-REL-20260720-WEB3-CAND-V2` @ tip `97289a71…` · FG-15-B **ELAPSED** · freeze **FROZEN**  
> **禁止** Reality W0–W7 · Production GO · 新铸 pin · 把 STAGING-ALIGN 当 ACTIVE  

**STATUS:** `ETA_ELAPSED_USE_ALIGNMENT_SSOT` ·（原 `ARMED_WAIT_ETA` 墙钟已过）  
**Pin:** `PSG-REL-20260720-WEB3-CAND-V2` · baseline `v311_fund_safety_candidate_v2`  
**Preflight already covered:** PCR-046 Identity **ALIGNED** · Runtime **LIVE_PASS** · Dry-check **DRY_PASS** — **不必重复**只读前置检查

---

## 真正变化点（不是下一个 PCR）

| 时刻 (UTC) | 事件 |
|------------|------|
| `2026-07-21T18:06:48Z` | `FG15_B_ELAPSED` |
| `2026-07-21T18:10:48Z` | Settlement Timelock ETA → 才可 finalize |

满窗后才会第一次出现 FG-01..15 **empirical PASS?**，再进 S7 Recalculate。

---

## 满窗前（仅此一条 · 低频）

```bash
bash scripts/dev/run-psg-evidence-consolidation-maintain-pipeline.sh
```

顺序：FG15B → Integrity → Catalog → PCR  
**禁止：** 新测试 · 改基线 · 提前 finalize / Recalculate

---

## 满窗后固定梯子（到点才跑 · 勿提前）

### 1 · Settlement finalize

```bash
export TRAVELTRUST_WEB3_CANDIDATE_V2_SEPOLIA_DEPLOY_OK=1
bash scripts/dev/run-web3-candidate-v2-settlement-finalize.sh
```

- **input:** `evidence/GO_fg15_observation_48h_candidate_v2/money-path/CANDIDATE-V2-SETTLEMENT-OPS-STANDBY-LATEST.json` · `.env.phase2-chain-deploy.local` · Owner OK  
- **output:** `evidence/GO_fg15_observation_48h_candidate_v2/money-path/finalize-*/`  
- **refuse_until:** `2026-07-21T18:10:48Z`

### 2 · Candidate Evidence Bridge（S7 前置 · 满窗后必做）

**发现：** `S7-READER-PATH-GAP`（PCR-050+ preflight）  
**状态：** `WAIT_FOR_FINAL_WINDOW` · **现在禁止改** S7 reader / PENDING 布局  

S7 默认读 `evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/*`（可能是 **旧 FCG**）。  
Candidate 活证据在 `evidence/PSG-L1..L4-*` + `GO_fg15_observation_48h_candidate_v2/`。

**满窗后、S7 前必须（只读影响分析已定优先序）：**

1. **推荐 OPTION_A：** Candidate Final Input **物化桥接** → PENDING 期望文件名（先 snapshot 旧 PENDING；**禁止**裸拷 POINTER pack）  
2. **OPTION_B（RISK）：** Owner 授权改 S7 Reader — 满窗前不选  

然后验证（均须 READY）：

```bash
python scripts/dev/check-psg-eta-execution-gate.py                # READY_TO_EXECUTE (ladder start)
python scripts/dev/run-psg-project-a-closure-preflight-pack2.py   # S7_INPUT_SOURCE_CHECK
python scripts/dev/check-psg-s7-candidate-baseline-gate.py        # else BLOCKED_WRONG_BASELINE
python scripts/dev/check-psg-s7-input-manifest-gate.py lock-after-bridge
python scripts/dev/check-psg-s7-input-manifest-gate.py verify-pre-s7
```

只读分析：`evidence/PSG-EVIDENCE-CONSOLIDATION/S7-BRIDGE-IMPACT-ANALYSIS-LATEST.json`  
机读登记：`evidence/PSG-EVIDENCE-CONSOLIDATION/S7-READER-BRIDGE-DEFERRED-LATEST.json`  
BEFORE 清单（等窗已记）：`S7-INPUT-MANIFEST-BEFORE-LATEST.json`

---

### 3 · FG Capture（01–15）

按 Verification Map 填各 `fg-cases/FG-NN/FINAL-CAPTURE-TEMPLATE-LATEST.json`（tx_hash / block / event / evidence）：

```text
evidence/PSG-EVIDENCE-CONSOLIDATION/FG-01-15-FINAL-VERIFICATION-MAP-LATEST.json
```

可选刷新索引：

```bash
python scripts/dev/gen-fg15b-case-index.py
```

### 4 · L5 Final Evidence

在 finalize 收据 + filled captures 上组装 L5 Final（只写 FG15B 树）。  
**禁止**无 Settlement execute 宣称 L5 PASS。

### 5 · PSG S7 Recalculate

```bash
bash scripts/dev/run-psg-completion-matrix-recalculate.sh
```

- **input:** Catalog · Residual · L5 Final · `FG15_B_ELAPSED`  
- **规则：** 只靠 Evidence 提分 · 不改 Freeze / 经济数字

### 6 · Formal Baseline

Owner Formal Baseline（W5 时间分隔 Sign-off）· **另于** Hard Gate / Wave / Production GO。

---

## 诚实边界

- 本文件 = 命令预备 · **≠** 已执行  
- Maintain / Preflight / Dry-check ≠ L5 PASS ≠ `psg_complete`  
- 下一次真正变化点 = **时间锁释放**，不是下一个 PCR

**Runbook SSOT:** [TT-PSG-L5-FINAL-RUNBOOK-LATEST.md](./TT-PSG-L5-FINAL-RUNBOOK-LATEST.md)
